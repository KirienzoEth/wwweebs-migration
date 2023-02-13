import hre, { ethers } from 'hardhat';

async function main() {
  // ETH mainnet contract address
  let openSeaAddress;
  if (hre.network.config.chainId == 1) {
    openSeaAddress = '0x495f947276749ce646f68ac8c248420045cb7b5e';
  } else if (hre.network.config.chainId == 5) {
    openSeaAddress = '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c';
  } else {
    throw new Error('Unknown chain ID');
  }

  const WorldWideWeebs = await ethers.getContractFactory('WorldWideWeebs');
  const worldWideWeebs = await WorldWideWeebs.deploy(openSeaAddress);

  console.log(`WorldWideWeebs contract has been deployed to ${worldWideWeebs.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
