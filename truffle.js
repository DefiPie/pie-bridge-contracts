

module.exports = {
    compilers: {
        solc: {
            version: "0.7.6",    // Fetch exact version from solc-bin (default: truffle's version)
            settings: {          // See the solidity docs for advice about optimization and evmVersion
             optimizer: {
               enabled: false,
               runs: 200
             },
            }
        }
    },
  plugins: ['truffle-plugin-verify'],

  api_keys: {
    etherscan: 'QMHW3V25HGPE51UPBHDXHP8MJ2TP663IR6',
      bscscan: 'YTYHJVFBXJT82PZ6Z84BR6XAGIGNPRRVJH'
  },

  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    mainnet: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "1" // Match any network id
    },
    rinkeby: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "4" // Match any network id
    },
    bsc: {
      host: "127.0.0.1",
      port: 8575,
      network_id: "56", // Match any network id,
      confirmations: 5,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    bsctestnet: {
      host: "127.0.0.1",
      port: 8575,
      network_id: "97", // Match any network id,
      confirmations: 3,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  }
};
