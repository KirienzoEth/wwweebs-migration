import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    goerli: {
      url: process.env.GOERLI_URL || '',
      chainId: 5,
      accounts:
        process.env.MNEMONIC !== undefined ? [ethers.Wallet.fromMnemonic(process.env.MNEMONIC ?? '').privateKey] : [],
    },
    ethereum: {
      url: process.env.ETHEREUM_URL || '',
      chainId: 1,
      accounts:
        process.env.MNEMONIC !== undefined ? [ethers.Wallet.fromMnemonic(process.env.MNEMONIC ?? '').privateKey] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
