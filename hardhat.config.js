require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-docgen");

const { ALCHEMY_API_KEY, DEV_PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${DEV_PRIVATE_KEY}`],
      gasPrice: 2500000000,
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${DEV_PRIVATE_KEY}`],
      timeout: 60000,
      // gasPrice: 75000000000,
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${DEV_PRIVATE_KEY}`],
      timeout: 60000,
      gasPrice: 2500000000,
    },
    hardhat: {
      mining: {
        auto: true,
      },
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        blockNumber: 12772572,
      },
    },
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  mocha: {
    timeout: 100000,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
};
