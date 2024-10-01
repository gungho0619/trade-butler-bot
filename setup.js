module.exports = {
    INFURA_ID: '', // Get an infura API key from: https://infura.io/ - Use just project ID and not full links for API keys
    ALCHEMY_ID: '', // (Optional) Get an alchemy API key from: https://dashboard.alchemyapi.io/
    ETHERSCAN_ID: '', // Get an etherscan API key from: https://etherscan.io/myapikey
    POCKET_ID: '', // (Optional) Get a pokt ID from them direct: https://pokt.network/
    customHttpProvider: '', // use quiknode or your own geth node by putting in full URL - this over-rides infura/alchemy above
    API_QUORUM: 1, // The number of backends that must agree or an error will be thrown
    NETWORK: 'ropsten', // mainnet or ropsten
    minimumEthToKeep: 0.1, // always make sure you keep this amount of eth and fail tx if it would go below set amount
    defaultGasGwei: 65, // used if gas cannot be estimated to selected speed from etherscan
    gasSpeed: 'fast', // slow, normal, fast
    gasMaximum: 500000, // 500,000 max gas - contracts only use actual gas needed, this just makes sure they have enough
    deadlineMinutes: 20, // 20 minute default to wait for a tx before failure
    gasAdd: 2, // add 2 gwei to all tx
    etherscanGasLink: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=',
    spendApproveAmount: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', // approve max spending
    showTokenDetailTable: true, // show a table for each token (buy and sell)
    compactTokenDetailTable: true, // make token tables compact (eliminating grid between rows)
    showSummaryTable: true, // show 2 summary table for buy & sell tokens combined
    clearConsoleOnScan: false
};