/**************************************************************************
/****************************** !DISCLAIMER! ******************************
/**************************************************************************
 * USE AT YOUR OWN RISK, THIS PROJECT IS STILL IN BETA. WE HAVE           *
 * EXTENSIVELY TESTED IT, HOWEVER WE SUGGEST YOU FIRST TEST IT USING THE  *
 * ROPSTEN TEST NETWORK TO GET COMFORTABLE WITH IT'S USE. AND USE A       *
 * SEPARATE WALLET FROM YOUR MAIN WALLET!                                 *
 *                                                                        * 
 * YOUR TRADES ARE YOUR OWN! THIS IS NOT A FRONT RUNNING BOT, YOU STILL   *
 * MUST SELECT GOOD TRADES AND GOOD LIMITS!                               *
 *                                                                        *
 *                                                                        *
/**************************************************************************/
/***************************** SETUP VARS *********************************/
/**************************************************************************/
const SCAN_DELAY_RATE_MS = 10000; // pause 10 seconds between every scan

const tokens = [
  {
    active: false, // turn strategy on/off
    tokenCode: 'TBB', // for display only
    tokenAddress: '0x4a7adcb083fe5e3d6b58edc3d260e2e61668e7a2',
    inputTokenCode: 'ETH', // for display only
    //inputTokenAddress: '', // optional to trade to/from ERC token - '' or comment out // to not use
    inputAmount: 1.0, // how much input token you want to use to buy this token
    //onlySellXDecimalPlaces: 3, // trunacate tokens to sell down to 3 decimal places
    buyLimitPrice: 0.33, // buy at this price or under - INPUT/OUTPUT rate - set to 0 to not buy
    sellLimitPrice: 0.66, // sell at this price or over - INPUT/OUTPUT rate - set to 0 to not sell
    stopLossPrice: 0, // sell all tokens at this price ignoring trailingSellPct and moonbag to prevent capital loss - set to 0 to disable
    trailingSellPct: 1, // set to > 0 to allow selling only if price drops from max recorded down by X pct
    trailingBuyPct: 1, // set to > 0 to allow buying only if price increases from min recorded up by X pct
    moonbagToKeep: 25, // % - sell all tokens except X percent when sell-limit is reached
    neverSellXTokens: 8, // overrides all other commands such as stoploss and moonbag, make sure to always keep this number of tokens, for TBB license as example
    maxGasPriceGwei: 200, // gwei - if etherscan calculates over this amount will not post tx
    slippageTolerance: 50, // in bips - 50 bips = 0.50% - 1 bip = 0.01% - 100 bips = 1.00%
    maxPriceImpact: 15, // Percentage - max % price impact you're willing to accept or a tx will not be posted - 4 TBB feature - keep in mind price impact is PI+LP fees on uniswap UI
    averageXScans: 5, // this will average the last X scans together for a price that is less prone to errors in uniswap fluctuation output
    dontBuySellUntilFullScans: true, // wait until all averageXScans are complete to enable buy or sell
    supportFeeOnTransferTokens: false, // uses contract that allow burn or other fees when selling
    keepTryingTXifFail: false, // if buy or sell fails for any reason, should bot keep trying? safest to keep this false until you know for sure
    needTokenApproval: false // set to true to first approve token with uniswap router - only needs to be done once
  },
  {
    active: false, // turn strategy on/off
    tokenCode: 'AAVE', // for display only
    tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    midRouteTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // route trades through this address - USDC
    inputTokenCode: 'ETH', // for display only
    inputAmount: 1.0, // how much input token you want to use to buy this token
    buyLimitPrice: 0.5, // buy at this price or under - INPUT/OUTPUT rate - set to 0 to not buy
    sellLimitPrice: 1.6, // sell at this price or over - INPUT/OUTPUT rate - set to 0 to not sell
    stopLossPrice: 0.65, // sell all tokens at this price ignoring trailingSellPct and moonbag to prevent capital loss - set to 0 to disable
    trailingSellPct: 1, // set to > 0 to allow selling only if price drops from max recorded down by X pct
    trailingBuyPct: 1, // set to > 0 to allow buying only if price increases from min recorded up by X pct
    moonbagToKeep: 10, // % - sell all tokens except X percent when sell-limit is reached
    neverSellXTokens: 0, // overrides all other commands such as stoploss and moonbag, make sure to always keep this number of tokens, for TBB license as example
    maxGasPriceGwei: 200, // gwei - if etherscan calculates over this amount will not post tx
    slippageTolerance: 50, // in bips - 50 bips = 0.50% - 1 bip = 0.01% - 100 bips = 1.00%
    maxPriceImpact: 5, // Percentage - max % price impact you're willing to accept or a tx will not be posted - 4 TBB feature - keep in mind price impact is PI+LP fees on uniswap UI
    averageXScans: 5, // this will average the last X scans together for a price that is less prone to errors in uniswap fluctuation output
    dontBuySellUntilFullScans: true, // wait until all averageXScans are complete to enable buy or sell
    supportFeeOnTransferTokens: false, // uses contract that allow burn or other fees when selling
    keepTryingTXifFail: false, // if buy or sell fails for any reason, should bot keep trying? safest to keep this false until you know for sure
    needTokenApproval: false // set to true to first approve token with uniswap router - only needs to be done once
  },
  {
    active: false,
    tokenCode: 'YAX',
    tokenAddress: '0xb1dc9124c395c1e97773ab855d66e879f053a289',
    inputTokenCode: 'ETH', // for display only
    inputAmount: 1.0, // how much input token you want to use to buy this token
    buyLimitPrice: 0.012, // buy at this price or under - INPUT/OUTPUT rate - set to 0 to not buy
    sellLimitPrice: 0.025, // sell at this price or over - INPUT/OUTPUT rate - set to 0 to not sell
    stopLossPrice: 0.15, // sell all tokens at this price ignoring trailingSellPct and moonbag to prevent capital loss - set to 0 to disable
    trailingSellPct: 1, // 1% - set to > 0 to allow selling only if price drops from max recorded down by X pct
    trailingBuyPct: 1, // 1% - set to > 0 to allow buying only if price increases from min recorded up by X pct
    moonbagToKeep: 50, // % - sell all tokens except X percent when sell-limit is reached
    neverSellXTokens: 0, // overrides all other commands such as stoploss and moonbag, make sure to always keep this number of tokens, for TBB license as example
    maxGasPriceGwei: 200, // gwei - if etherscan calculates over this amount will not post tx
    slippageTolerance: 50, // in bips - 50 bips = 0.50% - 1 bip = 0.01% - 100 bips = 1.00%
    maxPriceImpact: 15, // Percentage - max % price impact you're willing to accept or a tx will not be posted - 4 TBB feature - keep in mind price impact is PI+LP fees on uniswap UI
    averageXScans: 5, // this will average the last X scans together for a price that is less prone to errors in uniswap fluctuation output
    dontBuySellUntilFullScans: true, // wait until all averageXScans are complete to enable buy or sell
    supportFeeOnTransferTokens: false, // uses contract that allow burn or other fees when selling
    keepTryingTXifFail: false, // if buy or sell fails for any reason, should bot keep trying? safest to keep this false until you know for sure
    needTokenApproval: false // set to true to first approve token with uniswap router - only needs to be done once
  },
  {
    active: true,
    tokenCode: 'DAI',
    tokenAddress: '0xad6d458402f60fd3bd25163575031acdce07538d', //ropsten DAI
    midRouteTokenAddress: '0xDb0040451F373949A4Be60dcd7b6B8D6E42658B6', // ropsten BAT - route through here
    inputTokenCode: 'ETH', // for display only
    inputAmount: 0.15, // how much input token you want to use to buy this token
    buyLimitPrice: 0.014, // buy at this price or under - INPUT/OUTPUT rate - set to 0 to not buy
    sellLimitPrice: 0, // sell at this price or over - EINPUT/OUTPUT rate - set to 0 to not sell
    stopLossPrice: 0, // sell all tokens at this price ignoring trailingSellPct and moonbag to prevent capital loss - set to 0 to disable
    trailingSellPct: 1, // 1% - set to > 0 to allow selling only if price drops from max recorded down by X pct
    trailingBuyPct: 1, // 1% - set to > 0 to allow buying only if price increases from min recorded up by X pct
    moonbagToKeep: 10, // % - sell all tokens except X percent when sell-limit is reached
    neverSellXTokens: 10, // overrides all other commands such as stoploss and moonbag, make sure to always keep this number of tokens, for TBB license as example
    maxGasPriceGwei: 200, // gwei - if etherscan calculates over this amount will not post tx
    slippageTolerance: 50, // in bips - 50 bips = 0.50% - 1 bip = 0.01% - 100 bips = 1.00%
    maxPriceImpact: 15, // Percentage - max % price impact you're willing to accept or a tx will not be posted - 4 TBB feature - keep in mind price impact is PI+LP fees on uniswap UI
    averageXScans: 5, // this will average the last X scans together for a price that is less prone to errors in uniswap fluctuation output
    dontBuySellUntilFullScans: true, // wait until all averageXScans are complete to enable buy or sell
    supportFeeOnTransferTokens: false, // uses contract that allow burn or other fees when selling
    keepTryingTXifFail: false, // if buy or sell fails for any reason, should bot keep trying? safest to keep this false until you know for sure
    needTokenApproval: false // set to true to first approve token with uniswap router - only needs to be done once
  },
  {
    active: true,
    tokenCode: 'BAT', // for display only
    tokenAddress: '0xDb0040451F373949A4Be60dcd7b6B8D6E42658B6', //ropsten BAT
    midRouteTokenAddress: '0xc778417e063141139fce010982780140aa0cd5ab', // ropsten WETH - route through here
    inputTokenCode: 'DAI', // for display only
    inputTokenAddress: '0xad6d458402f60fd3bd25163575031acdce07538d', // ropsten DAI
    inputAmount: 25, // how much input token you want to use to buy this token
    buyLimitPrice: 0.000001, // buy at this price or under - INPUT/OUTPUT rate - set to 0 to not buy
    sellLimitPrice: 0.001, // sell at this price or over - INPUT/OUTPUT rate - set to 0 to not sell
    stopLossPrice: 0, // sell all tokens at this price ignoring trailingSellPct and moonbag to prevent capital loss - set to 0 to disable
    trailingSellPct: 1, // % - set to > 0 to allow selling only if price drops from max recorded down by X pct
    trailingBuyPct: 1, // % - set to > 0 to allow buying only if price increases from min recorded up by X pct
    moonbagToKeep: 0, // % - sell all tokens except X percent when sell-limit is reached
    neverSellXTokens: 0, // overrides all other commands such as stoploss and moonbag, make sure to always keep this number of tokens, for TBB license as example
    maxGasPriceGwei: 200, // gwei - if etherscan calculates over this amount will not post tx
    slippageTolerance: 50, // in bips - 50 bips = 0.50% - 1 bip = 0.01% - 100 bips = 1.00%
    maxPriceImpact: 45, // Percentage - max % price impact you're willing to accept or a tx will not be posted - 4 TBB feature - keep in mind price impact is PI+LP fees on uniswap UI
    averageXScans: 5, // this will average the last X scans together for a price that is less prone to errors in uniswap fluctuation output
    dontBuySellUntilFullScans: true, // wait until all averageXScans are complete to enable buy or sell
    supportFeeOnTransferTokens: false, // uses contract that allow burn or other fees when selling
    keepTryingTXifFail: false, // if buy or sell fails for any reason, should bot keep trying? safest to keep this false until you know for sure
    needTokenApproval: false // set to true to first approve token with uniswap router - only needs to be done once
  }
];
/*******************************************/
/**************** END SETUP ****************/
/*******************************************/

const bytenode = require('bytenode');
var processor = require('./processor.jsc');
var setup = require('./setup');
let tokensToScan = true;

async function scanPrices() {
  tokensToScan = false;

  tokensToScan = await processor.checkAllTokens(tokens);

  if(setup.clearConsoleOnScan == undefined || !setup.clearConsoleOnScan){
    console.log("<==========================================>");
  }

  if(tokensToScan) {
    setTimeout(function(){
      scanPrices();
    }, SCAN_DELAY_RATE_MS);
  } else{
    console.log('!!!!FINISHED - No more to scan!!!!');
  }
}

scanPrices();