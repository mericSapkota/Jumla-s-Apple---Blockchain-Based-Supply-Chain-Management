require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      blockConfirmations: 5,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
    },
  },

  gasReporter: {
    enabled: false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },

  mocha: {
    timeout: 60000,
  },

  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
    },
    user: {
      default: 1,
    },
  },
};
