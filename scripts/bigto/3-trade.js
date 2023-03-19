'use strict'

const { ethers } = require('hardhat')
const { utils } = ethers

const config = require("./config")

async function main() {
    const [signer] = await ethers.getSigners();

    console.log("Signer account:", await signer.getAddress());
    console.log("Signer account balance:", (await signer.getBalance()).toString(), "\n");

    const myAddress = await signer.getAddress();

    const swapContract = await ethers.getContractAt(
        "IUniswapV2Router01",
        config.sushiRouterAddr
    );

    const deadline = new Date().setHours(new Date().getMinutes() + 30)

    console.log(`>>> Start trading: ETH -> ${config.NFTSymbol}`)

    const amountsOut = await swapContract.getAmountsOut(1, [config.wethAddress, config.nftSwappableAddress])
    const buyPrice = amountsOut[0] / amountsOut[1]
    console.log(`- I need to pay at least ${buyPrice} WETH to buy 1 ${config.NFTSymbol} (not including fees)`)
    const submitBuyPrice = (buyPrice * 1.2).toFixed(6)

    // swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline)
    const buyNftTx = await swapContract.swapETHForExactTokens(
        utils.parseEther("1"), [config.wethAddress, config.nftSwappableAddress], myAddress, deadline,
        {
            value: utils.parseEther(`${submitBuyPrice}`),
            gasLimit: 300000,
        }
    )
    console.log(`- Submitted transaction with set price ${submitBuyPrice}, now waiting for 1 confirmation...`)
    const confirmedBuyTx = await buyNftTx.wait()
    console.log(`- Transaction confirmed: ${confirmedBuyTx.transactionHash}`)
}

main()
    .then(() => {
        console.log("\nTrade completed successfully ✓");
        process.exit(0);
    })
    .catch((error) => {
        console.log("\nTrade failed ✗");
        console.error(error);
        process.exit(1);
    });
