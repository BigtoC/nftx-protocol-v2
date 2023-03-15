'use strict'

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const config = require("./config")
const fs = require('fs')

const NFTXVaultFactoryUpgradeableAddress = config.NFTXVaultFactoryUpgradeableAddress
const NFTXStakingZapAddress = config.NFTXStakingZapAddress

const deployedContractMap = {}

async function main() {
  const [deployer] = await ethers.getSigners();

  const myAddress = await deployer.getAddress();

  console.log("Deploying account:", myAddress);
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  const vaultFactory = await ethers.getContractAt(
    "NFTXVaultFactoryUpgradeable",
      NFTXVaultFactoryUpgradeableAddress
  );
  const stakingZap = await ethers.getContractAt(
      "NFTXStakingZap",
      NFTXStakingZapAddress
  );

  const Erc721 = await ethers.getContractFactory("ERC721");
  const nft = await Erc721.deploy("CryptoSloths", "CS");
  await nft.deployed();
  console.log("CryptoSloths NFT:", nft.address);
  deployedContractMap["CryptoSloths NFT"] = nft.address

  const numMints = 10;
  for (let tokenId = 0; tokenId < numMints; tokenId++) {
    const mintTx = await nft.publicMint(myAddress, tokenId, { gasLimit: 100000 });
    console.log("next..");
    if (tokenId === numMints - 1) {
      mintTx.wait()
    }
  }
  console.log("-- minted " + numMints + " CryptoSloths");

  const createVaultTx = await vaultFactory.createVault("CryptoSloths", "SLOTH", nft.address, false, true);
  createVaultTx.wait()
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

  const setApprovalTx = await nft.setApprovalForAll(stakingZap.address, true);
  setApprovalTx.wait()
  console.log("-- [Set Approval For All] approved NFTs to stakingzap");

  const provideInventoryTx = await stakingZap.provideInventory721(vaultId, [0, 1], { gasLimit: "1000000" });
  provideInventoryTx.wait()
  console.log("-- [Provide Inventory721] inventory staked NFTs");

  const addLiquidityTx = await stakingZap.addLiquidity721ETH(vaultId, [2, 3, 4, 5, 6, 7], 0, {
    value: parseEther("0.18"),
    gasLimit: "1000000",
  });
  addLiquidityTx.wait()
  console.log("-- [Add Liquidity721] liquidity staked NFTs");

  const deployedContractAddressesFilePath = "./addresses/2-bootstrap-mumbai.json"
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
