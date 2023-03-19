'use strict'

const fs = require("fs")
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

const config = require("./config")

const notZeroAddr = config.notZeroAddr;
let sushiRouterAddr = config.sushiRouterAddr;
let sushiFactoryAddr = config.sushiFactoryAddr;
let wethAddress = config.wethAddress;

const deployedContractMap = {}

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying account:", await deployer.getAddress());
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  const stakingTokenProviderContractName = "StakingTokenProvider"
  const StakingProvider = await ethers.getContractFactory(stakingTokenProviderContractName);
  const provider = await upgrades.deployProxy(StakingProvider, [sushiFactoryAddr, wethAddress, "x"], {
    initializer: "__StakingTokenProvider_init",
  });
  await provider.deployed();
  console.log(`${stakingTokenProviderContractName}: ${provider.address}`);
  deployedContractMap[stakingTokenProviderContractName] = provider.address;

  const NFTXLPStakingContractName = "NFTXLPStaking"
  const LPStaking = await ethers.getContractFactory(NFTXLPStakingContractName);
  const lpStaking = await upgrades.deployProxy(LPStaking, [provider.address], {
    initializer: "__NFTXLPStaking__init",
    unsafeAllow: "delegatecall",
  });
  await lpStaking.deployed();
  console.log(`${NFTXLPStakingContractName}(LPStaking): ${lpStaking.address}`);
  deployedContractMap[NFTXLPStakingContractName] = lpStaking.address;

  const NFTXVaultUpgradeableContractName = "NFTXVaultUpgradeable"
  const VaultTemplate = await ethers.getContractFactory(NFTXVaultUpgradeableContractName);
  const vaultTemplate = await VaultTemplate.deploy();
  await vaultTemplate.deployed();
  console.log(`${NFTXVaultUpgradeableContractName} (Vault template): ${vaultTemplate.address}`);
  deployedContractMap[NFTXVaultUpgradeableContractName] = vaultTemplate.address

  const NFTXSimpleFeeDistributorContractName = "NFTXSimpleFeeDistributor"
  const FeeDistributor = await ethers.getContractFactory(NFTXSimpleFeeDistributorContractName);
  const feeDistrib = await upgrades.deployProxy(FeeDistributor, [lpStaking.address, notZeroAddr], {
    initializer: "__SimpleFeeDistributor__init__",
    unsafeAllow: "delegatecall",
  });
  await feeDistrib.deployed();
  console.log(`${NFTXSimpleFeeDistributorContractName}(FeeDistributor):`, feeDistrib.address);
  deployedContractMap[NFTXSimpleFeeDistributorContractName] = feeDistrib.address

  const NFTXVaultFactoryUpgradeableContractName = "NFTXVaultFactoryUpgradeable"
  const VaultFactory = await ethers.getContractFactory(NFTXVaultFactoryUpgradeableContractName);
  const vaultFactory = await upgrades.deployProxy(VaultFactory, [vaultTemplate.address, feeDistrib.address], {
    initializer: "__NFTXVaultFactory_init",
    unsafeAllow: "delegatecall",
  });
  await vaultFactory.deployed();
  console.log(`${NFTXVaultFactoryUpgradeableContractName}(VaultFactory): ${vaultFactory.address}`);
  deployedContractMap[NFTXVaultFactoryUpgradeableContractName] = vaultFactory.address

  await feeDistrib.setNFTXVaultFactory(vaultFactory.address);
  console.log("-- set VaultFactory on FeeDistributor");
  await lpStaking.setNFTXVaultFactory(vaultFactory.address);
  console.log("-- set VaultFactory on LPStaking");

  const NFTXEligibilityManagerContractName = "NFTXEligibilityManager"
  const Elig = await ethers.getContractFactory(NFTXEligibilityManagerContractName);
  const eligManager = await upgrades.deployProxy(Elig, [], {
    initializer: "__NFTXEligibilityManager_init",
  });
  await eligManager.deployed();
  console.log(`${NFTXEligibilityManagerContractName}: ${eligManager.address}`);
  deployedContractMap[NFTXEligibilityManagerContractName] = eligManager.address

  await vaultFactory.setEligibilityManager(eligManager.address);
  console.log("-- set eligibilitymanager");

  const NFTXListEligibilityContractName = "NFTXListEligibility"
  const ListElig = await ethers.getContractFactory(NFTXListEligibilityContractName);
  const listElig = await ListElig.deploy();
  await listElig.deployed();
  console.log(`${NFTXListEligibilityContractName}: ${listElig.address}`)
  deployedContractMap[NFTXListEligibilityContractName] = listElig.address
  console.log("-- list eligbility deployed");
  await eligManager.addModule(listElig.address);
  console.log("-- list eligibilty added");

  const NFTXRangeEligibilityContractName = "NFTXRangeEligibility"
  const RangeElig = await ethers.getContractFactory(NFTXRangeEligibilityContractName);
  const rangeElig = await RangeElig.deploy();
  await rangeElig.deployed();
  console.log(`${NFTXRangeEligibilityContractName}: ${rangeElig.address}`)
  deployedContractMap[NFTXRangeEligibilityContractName] = rangeElig.address
  await eligManager.addModule(rangeElig.address);
  console.log("-- range eligbility deployed");
  console.log("-- range eligibilty added");

  const NFTXInventoryStakingContractName = "NFTXInventoryStaking"
  const InventoryStaking = await ethers.getContractFactory(NFTXInventoryStakingContractName);
  const inventoryStaking = await upgrades.deployProxy(InventoryStaking, [vaultFactory.address], {
    initializer: "__NFTXInventoryStaking_init",
    unsafeAllow: "delegatecall",
  });
  await inventoryStaking.deployed();
  console.log(`${NFTXInventoryStakingContractName}: ${inventoryStaking.address}`);
  deployedContractMap[NFTXInventoryStakingContractName] = inventoryStaking.address

  await feeDistrib.setInventoryStakingAddress(inventoryStaking.address);
  console.log("-- updated inventory staking address");

  await feeDistrib.addReceiver("200000000000000000", inventoryStaking.address, true);
  console.log("-- added fee receiver 1 address");

  /* feeDistrib.addReceiver("800000000000000000", <lpStaking>, true) is part of setup */

  const NFTXStakingZapContractName = "NFTXStakingZap"
  const StakingZap = await ethers.getContractFactory(NFTXStakingZapContractName);
  const stakingZap = await StakingZap.deploy(vaultFactory.address, sushiRouterAddr);
  await stakingZap.deployed();
  console.log(`${NFTXStakingZapContractName}: ${stakingZap.address}`);
  deployedContractMap[NFTXStakingZapContractName] = stakingZap.address

  await stakingZap.setLPLockTime(600);
  console.log("-- set lp lock time");

  await stakingZap.setInventoryLockTime(800);
  console.log("-- set inventory lock time");

  await inventoryStaking.setInventoryLockTimeErc20(800);
  console.log("-- set inventory lock time erc20");

  await stakingZap.assignStakingContracts();
  console.log("-- assigned staking contracts");

  await vaultFactory.setFeeExclusion(stakingZap.address, true);
  console.log("-- set fee exclusion");

  await vaultFactory.setZapContract(stakingZap.address);
  console.log("-- set zap contract");

  const NFTXMarketplaceZapContractName = "NFTXMarketplaceZap"
  const MarketplaceZap = await ethers.getContractFactory(NFTXMarketplaceZapContractName);
  const marketplaceZap = await MarketplaceZap.deploy(vaultFactory.address, sushiRouterAddr);
  await marketplaceZap.deployed();
  console.log(`${NFTXMarketplaceZapContractName}: ${marketplaceZap.address}`);
  deployedContractMap[NFTXMarketplaceZapContractName] = marketplaceZap.address

  const TimelockExcludeListContractName = "TimelockExcludeList"
  const TimelockExcludeList = await ethers.getContractFactory(TimelockExcludeListContractName);
  const timelockExcludeList = await TimelockExcludeList.deploy();
  await timelockExcludeList.deployed();
  console.log(`${TimelockExcludeListContractName}: ${timelockExcludeList.address}`);
  deployedContractMap[TimelockExcludeListContractName] = timelockExcludeList.address

  await stakingZap.setTimelockExcludeList(timelockExcludeList.address);
  console.log("-- set timelockexcludelist on stakingzap");
  await inventoryStaking.setTimelockExcludeList(timelockExcludeList.address);
  console.log("-- set timelockexcludelist on inventorystaking");

  const MultiProxyControllerContractName = "MultiProxyController"
  const ProxyController = await ethers.getContractFactory(MultiProxyControllerContractName);
  const proxyController = await ProxyController.deploy(
    [
      "NFTX Factory",
      "Fee Distributor",
      "LP Staking",
      "StakingTokenProvider",
      "Eligibility Manager",
      "Inventory Staking",
    ],
    [
      vaultFactory.address,
      feeDistrib.address,
      lpStaking.address,
      provider.address,
      eligManager.address,
      inventoryStaking.address,
    ]
  );
  await proxyController.deployed();
  console.log(`${MultiProxyControllerContractName}: ${proxyController.address}`);
  deployedContractMap[MultiProxyControllerContractName] = proxyController.address

  await upgrades.admin.changeProxyAdmin(vaultFactory.address, proxyController.address);
  console.log("-- updated proxy admin on vaultfactory");
  await upgrades.admin.changeProxyAdmin(feeDistrib.address, proxyController.address);
  console.log("-- updated proxy admin on feedistrib");
  await upgrades.admin.changeProxyAdmin(lpStaking.address, proxyController.address);
  console.log("-- updated proxy admin on lpstaking");
  await upgrades.admin.changeProxyAdmin(provider.address, proxyController.address);
  console.log("-- updated proxy admin on provider");
  await upgrades.admin.changeProxyAdmin(eligManager.address, proxyController.address);
  console.log("-- updated proxy admin on eligmanager");
  await upgrades.admin.changeProxyAdmin(inventoryStaking.address, proxyController.address);
  console.log("-- updated proxy admin on inventorystaking");

  const NFTXUnstakingInventoryZapContractName = "NFTXUnstakingInventoryZap"
  const UnstakingZap = await ethers.getContractFactory(NFTXUnstakingInventoryZapContractName);
  const unstakingZap = await UnstakingZap.deploy();
  await unstakingZap.deployed();
  console.log(`${NFTXUnstakingInventoryZapContractName}: ${unstakingZap.address}`, unstakingZap.address);
  deployedContractMap[NFTXUnstakingInventoryZapContractName] = unstakingZap.address

  await unstakingZap.setVaultFactory(vaultFactory.address);
  console.log("-- set vault factory on unstakingzap");
  await unstakingZap.setInventoryStaking(inventoryStaking.address);
  console.log("-- set inventory staking on unstakingzap");

  const deployedContractAddressesFilePath = `./addresses/1-deploy-${config.deployChain}.json`
  fs.writeFileSync(
      deployedContractAddressesFilePath,
      JSON.stringify(deployedContractMap, null, 2)
  )
  console.log(`Saved deployed contract addresses in ${deployedContractAddressesFilePath}`)
}

main()
  .then(() => {
    console.log("\nDeployment completed successfully ✓");
    process.exit(0);
  })
  .catch((error) => {
    console.log("\nDeployment failed ✗");
    console.error(error);
    process.exit(1);
  });
