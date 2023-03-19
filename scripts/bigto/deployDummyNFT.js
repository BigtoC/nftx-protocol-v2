'use strict'

const { ethers } = require('hardhat')

const config = require("./config")

async function main() {
    const [deployer] = await ethers.getSigners();

    const myAddress = await deployer.getAddress();
    console.log("Start deploying...")

    const Erc721 = await ethers.getContractFactory("ERC721");
    const nft = await Erc721.deploy(config.NFTName, config.NFTSymbol);
    console.log("Waiting deploy...")
    await nft.deployed();
    console.log("CryptoSloths NFT:", nft.address);

    const numMints = 15;
    for (let tokenId = 0; tokenId < numMints; tokenId++) {
        const mintTx = await nft.publicMint(myAddress, tokenId, { gasLimit: 100000 });
        console.log("next..");
        if (tokenId === numMints - 1) {
            mintTx.wait()
        }
    }
    console.log("-- minted " + numMints + " CryptoSloths");
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
