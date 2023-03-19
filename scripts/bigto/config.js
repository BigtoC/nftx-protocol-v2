'use strict'

const config = module.exports = {}

config.deployChain = "goerli"

const deployedContracts = require(`../../addresses/1-deploy-${config.deployChain}.json`)

/*
 * Below 3 addresses are the same across different network
 */
config.notZeroAddr = "0x000000000000000000000000000000000000dead"
config.sushiRouterAddr = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
config.sushiFactoryAddr = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4"

/*
 * If you are using Polygon Mumbai,
 * you are using Wrapped MATIC: 0x5b67676a984807a212b1c59ebfc9b3568a474f0a
 */
config.wethAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"

config.NFTXStakingZapAddress = deployedContracts["NFTXStakingZap"]
config.NFTXVaultFactoryUpgradeableAddress = deployedContracts["NFTXVaultFactoryUpgradeable"]

/*
 * Change the below config values
 */
config.swapAmount = 0.2
config.NFTSymbol = "LTN"
config.NFTName = "LendTestNft"
config.nftSwappableAddress = "0x6881F54C21449706c894708061E8775F7C735385"
