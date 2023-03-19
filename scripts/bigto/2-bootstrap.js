'use strict'

const fs = require('fs')
const keccak256 = require('keccak256')
const { ethers, upgrades } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const config = require("./config")

const NFTXVaultFactoryUpgradeableAddress = config.NFTXVaultFactoryUpgradeableAddress
const NFTXStakingZapAddress = config.NFTXStakingZapAddress

const deployedContractMap = {}

async function main() {
  console.log(">>>>> Bootstrap start <<<<<")
  const [deployer] = await ethers.getSigners();

  const myAddress = await deployer.getAddress();
  const network = ethers.getDefaultProvider.networks

  console.log("Deploying account:", myAddress);
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  // console.log(">>>>> (Optional) Swap some WETH")
  // const depositMethodId = `0x${keccak256("deposit()").toString("hex").substring(0,8)}`
  // const swapTx = await deployer.sendTransaction({
  //   from: myAddress,
  //   to: config.wethAddress,
  //   value: parseEther(`${config.swapAmount}`),
  //   data: depositMethodId
  // })
  // await swapTx.wait()

  console.log(">>>>> 0. Deploy a ERC721 token")
  const Erc721 = await ethers.getContractFactory("ERC721");
  const nft = await Erc721.deploy(config.NFTName, config.NFTSymbol);
  await nft.deployed();
  console.log(`${config.NFTName} NFT: ${nft.address}`);
  deployedContractMap[config.NFTName] = nft.address

  const numMints = 15;
  console.log(`Start minting ${numMints} NFTs...`)
  for (let tokenId = 0; tokenId < numMints; tokenId++) {
    const mintTx = await nft.publicMint(myAddress, tokenId, { gasLimit: 100000 });
    if ((tokenId + 1) % 5 === 0) {
      console.log(`Minted ${tokenId + 1} tokens...`)
    }
    if (tokenId === numMints - 1) {
      await mintTx.wait()
    }
  }
  console.log(`-- finished minting ${numMints} ${config.NFTName}`);

  console.log(">>>>> 1. Create a vault")
  const vaultFactory = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      NFTXVaultFactoryUpgradeableAddress
  );

  const createVaultTx = await vaultFactory.createVault(config.NFTName, `${config.NFTSymbol}`, nft.address, false, true);
  await createVaultTx.wait()
  console.log("-- created vault");

  const numVaults = await vaultFactory.numVaults();
  const vaultId = numVaults.sub(1);
  const vaultAddr = await vaultFactory.vault(vaultId);
  console.log("Vault address:", vaultAddr);
  deployedContractMap["Vault"] = vaultAddr

  const vault = await ethers.getContractAt(
      "NFTXVaultUpgradeable", vaultAddr
  );
  await vault.finalizeVault();
  console.log("-- finalized vault");

  console.log(">>>>> 2. Approve")
  const stakingZap = await ethers.getContractAt(
      "NFTXStakingZap",
      NFTXStakingZapAddress
  );
  const setApprovalTx = await nft.setApprovalForAll(stakingZap.address, true);
  await setApprovalTx.wait()
  console.log("-- [Set Approval For All] approved NFTs to stakingzap");

  console.log(">>>>> 3. Add liquidity pool")
  const provideInventoryTx = await stakingZap.provideInventory721(vaultId, [10, 11], { gasLimit: 1000000 });
  await provideInventoryTx.wait()
  console.log("-- [Provide Inventory721] inventory staked NFTs");

  const addLiquidityTx = await stakingZap.addLiquidity721ETH(vaultId, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 10000000000, {
    value: parseEther("0.00000005"),
    gasLimit: "1000000",
  });
  await addLiquidityTx.wait()
  console.log("-- [Add Liquidity721] liquidity staked NFTs");

  console.log(">>>>> Bootstrap finished <<<<<")
  const deployedContractAddressesFilePath = `./addresses/2-bootstrap-${network.name}.json`
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
