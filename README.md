# NFTX Protocol v2
> Forked and enhanced by Bigto Chan.  
> Forked from https://github.com/NFTX-project/nftx-protocol-v2

## Primary Contracts

- StakingTokenProvider
- NFTXLPStaking
- NFTXVaultUpgradeable
- NFTXFeeDistributor
- NFTXVaultFactory
- NFTXEligibilityManager
- Eligibility Modules

## Polygon Mumbai Contract
> Check `./addresses/1-deploy-mumbai.json` and `./addresses/2-bootstrap-mumbai.json`

Or you can deploy your own contract

### Deployment steps:

#### 1. Setup dev environments:

##### a. Install dependencies:
```shell
yarn install
```

##### b. Compile smart contracts (optional):
```shell
npx hardhat compile
```

##### c. Run test (optional):
```shell
npx hardhat test
```

d. Update your own `.env` file, an example file `.env.sample` is provided.

#### 2. Deploy the contracts
##### a. Update config  
Use any ERC20 smart contract to deploy your own WETH ERC20 token,  
then update the `wethAddress` in `./scripts/mumbai/config.js` file.  

##### b. Run the command to deploy:
```shell
npm run deploy:mumbai
```
You should see below messages print on your terminal:
![](./doc/1-deploy.png)

#### 3. Bootstrap the protocol
##### a. Update config
Update `NFTXVaultFactoryUpgradeableAddress` and `NFTXStakingZapAddress`

##### b. Run the bootstrap script
This script mints some dummy ERC721 tokens, and create liquidity
```shell
npm run bootstrap:mumbai
```
You should see below messages print on your terminal:
![](./doc/2-bootstrap.png)

## Mainnet Contract Addresses

### Protocol

- StakingTokenProvider: 0x5fAD0e4cc9925365b9B0bbEc9e0C3536c0B1a5C7
- Staking: 0x688c3E4658B5367da06fd629E41879beaB538E37
- Vault template: 0xe8B6820b74533c27786E4724a578Bfca28D97BD1
- FeeDistributor: 0x7AE9D7Ee8489cAD7aFc84111b8b185EE594Ae090
- VaultFactory: 0xBE86f647b167567525cCAAfcd6f881F1Ee558216
- EligibilityManager: 0x4086e98Cce041d286112d021612fD894cFed94D5
- ProxyController address: 0x4333d66Ec59762D1626Ec102d7700E64610437Df
