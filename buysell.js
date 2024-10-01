const { Percent } = require('@uniswap/sdk');
const ethers = require('ethers');
var setup = require('./setup');
var wallet = require('./wallet-keys');
var fs = require('fs');

const bytenode = require('bytenode');
var processor = require('./processor.jsc');

var csvWriter = require('csv-write-stream');
var writer = csvWriter();
if(fs.existsSync('trade-log.csv')){
  writer = csvWriter({sendHeaders:false});
}
writer.pipe(fs.createWriteStream('trade-log.csv', {flags: 'a'}));

// uniswap v2 router contract
// this can be changed if you want to use a different DEX
// as long as the same functions exist
const UniswapV2Router02 = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

var provider = ethers.getDefaultProvider(setup.NETWORK,{
  infura: setup.INFURA_ID,
  alchemy: setup.ALCHEMY_ID,
  etherscan: setup.ETHERSCAN_ID,
  pocket: setup.POCKET_ID,
  quorum: setup.API_QUORUM
});

if(setup.customHttpProvider != undefined && setup.customHttpProvider != ''){
  provider = new ethers.providers.JsonRpcProvider(setup.customHttpProvider);
}

const signer = new ethers.Wallet(wallet.PRIVATE_KEY);
const account = signer.connect(provider);

exports.approveToken = async function(thisToken){
  const contractAbiFragment = [
      {
          "constant": false,
          "inputs": [
            {
              "name": "_spender",
              "type": "address"
            },
            {
              "name": "_value",
              "type": "uint256"
            }
          ],
          "name": "approve",
          "outputs": [
            {
              "name": "",
              "type": "bool"
            }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
  ];

  try{
    var currentGasPrice = await processor.getGasPrice();
    console.log('Gas price: ' + currentGasPrice);
    //console.log('Max Gwei: ' + thisToken.maxGasPriceGwei);

    if(currentGasPrice > thisToken.maxGasPriceGwei){
      console.log('!!! Gas Price too High - Not Approving !!!');
      return; // don't approve if current gas is over your maxgas set
    }

    currentGasPrice = currentGasPrice * 1e9;
    
    const contract = new ethers.Contract(thisToken.tokenAddress, contractAbiFragment, account);
    const tx = await contract.approve(UniswapV2Router02, setup.spendApproveAmount, { gasPrice: currentGasPrice, gasLimit: setup.gasMaximum });

    if(setup.NETWORK == 'mainnet'){
      console.log(`Transaction hash: https://etherscan.io/tx/${tx.hash}`);
      writer.write({Timestamp: + new Date(), Link: `https://etherscan.io/tx/${tx.hash}`, Code: thisToken.tokenCode, Type: "approval", Amount: setup.spendApproveAmount, Eth: ''});
    }else{
      console.log(`Transaction hash: https://${setup.NETWORK}.etherscan.io/tx/${tx.hash}`);
      writer.write({Timestamp: + new Date(), Link: `https://${setup.NETWORK}.etherscan.io/tx/${tx.hash}`, Code: thisToken.tokenCode, Type: "approval", Amount: setup.spendApproveAmount, Eth: ''});
    }
    thisToken.needTokenApproval = false;

    const receipt = await tx.wait();
    console.log(`Transaction was mined in block ${receipt.blockNumber}`);

  } catch (error) {
    console.error(new Date().toLocaleString());
    console.error(error);
  }
}

exports.getBalanceThenBuyTokens = async function(tokenToBuy){
  const buyS = this;

  await provider.getBalance(wallet.WALLET_ADDRESS).then(async function(balance) {
    var etherString = ethers.utils.formatEther(balance);

    console.log("ETH Balance: " + etherString);
    
    var inputETH = ethers.utils.parseEther(tokenToBuy.inputAmount.toString());
    var minimumEthToKeep = ethers.utils.parseEther(setup.minimumEthToKeep.toString());

    if(tokenToBuy.usingEtherMain){
      // only buy if input eth and min to keep are less than your ETH balance
      if(inputETH.add(minimumEthToKeep).lt(balance)){
        await buyS.buyToken(tokenToBuy);
      }
      else{
        tokenToBuy.buyToken = false;  // not enough eth to buy so turn off buying
      }
    }else{
      const INPUT_TOKENS = await buyS.getERC20TokenBalance(tokenToBuy.inputTokenAddress);
      var inputTokenBalance = ethers.BigNumber.from(INPUT_TOKENS);
      var prettyInputTokenBalance = ethers.utils.formatUnits(inputTokenBalance.toString(), tokenToBuy.inputToken.decimals);
      var inputTokenAmount = ethers.utils.parseUnits(tokenToBuy.inputAmount.toString(), tokenToBuy.inputToken.decimals);
  
      console.log(tokenToBuy.inputTokenCode + " Balance: " + prettyInputTokenBalance);
  
      // only buy if input tokens are less than balance and min to keep ETH is less than your ETH balance (for gas reserves)
      if(inputTokenAmount.lt(inputTokenBalance) && minimumEthToKeep.lt(balance)){
        await buyS.buyToken(tokenToBuy);
      }
      else{
        tokenToBuy.buyToken = false;  // not enough eth or tokens so turn off buying
      }
    }
  });
}

exports.buyToken = async function(tokenToBuy){
  try{
    if(tokenToBuy.usingEtherMain){
      var value = ethers.utils.parseEther(tokenToBuy.inputAmount.toString());
    } else {
      var value = ethers.utils.parseUnits(tokenToBuy.inputAmount.toString(), tokenToBuy.inputToken.decimals);
    }

    var currentGasPrice = await processor.getGasPrice();

    console.log('Gas price: ' + currentGasPrice);
    //console.log('Max Gwei: ' + tokenToBuy.maxGasPriceGwei);

    if(currentGasPrice > tokenToBuy.maxGasPriceGwei){
      console.log('!!! Gas Price too High - Not Buying !!!');
      return; // don't buy if current gas is over your maxgas set
    }

    currentGasPrice = currentGasPrice * 1e9; // make gwei into wei
    
    const deadline = Math.floor(Date.now() / 1000) + 60 * setup.deadlineMinutes;

    if(tokenToBuy.usingEtherMain){
      var uniswap = new ethers.Contract(
        UniswapV2Router02,
        ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'],
        account
      );

      var tx = await uniswap.swapExactETHForTokens(
        tokenToBuy.buyAmountOutMin,
        tokenToBuy.buyPath,
        wallet.WALLET_ADDRESS,
        deadline,
        { value: value, gasPrice: currentGasPrice, gasLimit: setup.gasMaximum }
      );
    } else {
      var uniswap = new ethers.Contract(
        UniswapV2Router02,
        ['function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'],
        account
      );

      var tx = await uniswap.swapExactTokensForTokens(
        value,
        tokenToBuy.buyAmountOutMin,
        tokenToBuy.buyPath,
        wallet.WALLET_ADDRESS,
        deadline,
        { gasPrice: currentGasPrice, gasLimit: setup.gasMaximum }
      );
    }

    const prettyEstimatedTokensOut = ethers.utils.formatUnits(tokenToBuy.buyAmountOutMin, tokenToBuy.token.decimals);
    if(setup.NETWORK == 'mainnet'){
      console.log(`Transaction hash: https://etherscan.io/tx/${tx.hash}`);
      writer.write({Timestamp: + new Date(), Link: `https://etherscan.io/tx/${tx.hash}`, Code: tokenToBuy.tokenCode, Type: "buy", Amount: prettyEstimatedTokensOut, Eth: tokenToBuy.inputEther});
    }else{
      console.log(`Transaction hash: https://${setup.NETWORK}.etherscan.io/tx/${tx.hash}`);
      writer.write({Timestamp: + new Date(), Link: `https://${setup.NETWORK}.etherscan.io/tx/${tx.hash}`, Code: tokenToBuy.tokenCode, Type: "buy", Amount: prettyEstimatedTokensOut, Eth: tokenToBuy.inputEther});
    }

    if(!tokenToBuy.keepTryingTXifFail){
      // only buy once even if error occurs
      tokenToBuy.buyToken = false;  
    }

    const receipt = await tx.wait();
    console.log(`Transaction was mined in block ${receipt.blockNumber}`);

    // set token to buy to false - only buy one round
    tokenToBuy.buyToken = false;
  } catch (error) {
    console.error(new Date().toLocaleString());
    console.error(error);
  }
}

exports.sellTokens = async function(tokenToSell, moonbagToKeep){
  try{
    var intTokenAmount = await processor.calculateTokenBalanceToSell(tokenToSell, moonbagToKeep);

    const prettyTokenAmount = ethers.utils.formatUnits(intTokenAmount, tokenToSell.token.decimals);

    // only sell if you have tokens!
    if(intTokenAmount > 0){
      console.log('Selling '+prettyTokenAmount+' Tokens ('+tokenToSell.tokenCode+') for ETH...');
      
      var currentGasPrice = await processor.getGasPrice();

      console.log('Gas price: ' + currentGasPrice);
      console.log('Max Gwei: ' + tokenToSell.maxGasPriceGwei);

      if(currentGasPrice > tokenToSell.maxGasPriceGwei){
        console.log('!!! Gas Price too High - Not Selling !!!');
        return; // don't sell if current gas is over your maxgas set
      }

      currentGasPrice = currentGasPrice * 1e9; // make gwei into wei
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * setup.deadlineMinutes;
      var tx = null;

      if(tokenToSell.usingEtherMain){
        var uniswapContractFunction = 'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)';
        if(tokenToSell.supportFeeOnTransferTokens){
          uniswapContractFunction = 'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)';
        }
        const uniswap = new ethers.Contract(
          UniswapV2Router02,
          [uniswapContractFunction],
          account
        );
  
        if(tokenToSell.supportFeeOnTransferTokens){
          tx = await uniswap.swapExactTokensForETHSupportingFeeOnTransferTokens(
            intTokenAmount,
            tokenToSell.sellAmountOutMin,
            tokenToSell.sellPath,
            wallet.WALLET_ADDRESS,
            deadline,
            { gasPrice: currentGasPrice, gasLimit: setup.gasMaximum }
          );
        }
        else{
          tx = await uniswap.swapExactTokensForETH(
            intTokenAmount,
            tokenToSell.sellAmountOutMin,
            tokenToSell.sellPath,
            wallet.WALLET_ADDRESS,
            deadline,
            { gasPrice: currentGasPrice, gasLimit: setup.gasMaximum }
          );
        }
      }else{
        var uniswapContractFunction = 'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)';
        if(tokenToSell.supportFeeOnTransferTokens){
          uniswapContractFunction = 'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external';
        }
        const uniswap = new ethers.Contract(
          UniswapV2Router02,
          [uniswapContractFunction],
          account
        );
  
        if(tokenToSell.supportFeeOnTransferTokens){
          tx = await uniswap.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            intTokenAmount,
            tokenToSell.sellAmountOutMin,
            tokenToSell.sellPath,
            wallet.WALLET_ADDRESS,
            deadline,
            { gasPrice: currentGasPrice, gasLimit: setup.gasMaximum }
          );
        }
        else{
          tx = await uniswap.swapExactTokensForTokens(
            intTokenAmount,
            tokenToSell.sellAmountOutMin,
            tokenToSell.sellPath,
            wallet.WALLET_ADDRESS,
            deadline,
            { gasPrice: currentGasPrice, gasLimit: setup.gasMaximum }
          );
        }
      }

      if(!tokenToSell.keepTryingTXifFail){
        // only sell once even if error occurs
        tokenToSell.sellToken = false;  
      }

      const prettyEstimatedEthOut = ethers.utils.formatEther(tokenToSell.sellAmountOutMin);
      if(setup.NETWORK == 'mainnet'){
        console.log(`Transaction hash: https://etherscan.io/tx/${tx.hash}`);
        writer.write({Timestamp: + new Date(), Link: `https://etherscan.io/tx/${tx.hash}`, Code: tokenToSell.tokenCode, Type: "sell", Amount: prettyTokenAmount, Eth: prettyEstimatedEthOut });
      }else{
        console.log(`Transaction hash: https://${setup.NETWORK}.etherscan.io/tx/${tx.hash}`);
        writer.write({Timestamp: + new Date(), Link: `https://${setup.NETWORK}.etherscan.io/tx/${tx.hash}`, Code: tokenToSell.tokenCode, Type: "sell", Amount: prettyTokenAmount, Eth: prettyEstimatedEthOut });
      }

      const receipt = await tx.wait();
      console.log(`Transaction was mined in block ${receipt.blockNumber}`);

      // set token to sell to false - only buy one round
      tokenToSell.sellToken = false;
    }
  } catch (error) {
    console.error(new Date().toLocaleString());
    console.error(error);
  }
}


exports.getERC20TokenBalance = async function(tokenAddress){
  const contractAbiFragment = [
    {
      name: 'balanceOf',
      type: 'function',
      inputs: [
        {
          name: '_owner',
          type: 'address',
        },
      ],
      outputs: [
        {
          name: 'balance',
          type: 'uint256',
        },
      ],
      constant: true,
      payable: false,
    },
  ];
  try{ 
    const contract = new ethers.Contract(tokenAddress, contractAbiFragment, provider);
    const balance = await contract.balanceOf(wallet.WALLET_ADDRESS);
    return balance._hex;
  } catch (error) {
    console.error(new Date().toLocaleString());
    console.error(error);
  }
  return 0x0;
}