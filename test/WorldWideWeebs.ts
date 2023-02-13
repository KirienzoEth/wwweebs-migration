import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('WorldWideWeebs', function () {
  async function deployFixtures() {
    const [owner, ...otherAccounts] = await ethers.getSigners();

    const ERC1155Mock = await ethers.getContractFactory('ERC1155Mock');
    const legacyContract = await ERC1155Mock.deploy();

    const WorldWideWeebs = await ethers.getContractFactory('WorldWideWeebs');
    const worldWideWeebs = await WorldWideWeebs.deploy(legacyContract.address);
    await worldWideWeebs.unpause();

    await legacyContract.setApprovalForAll(worldWideWeebs.address, true);
    await legacyContract.connect(otherAccounts[0]).setApprovalForAll(worldWideWeebs.address, true);

    return { worldWideWeebs, legacyContract, owner, otherAccounts };
  }

  describe('addMigrationIds', function () {
    it('can only be called by the owner', async function () {
      const { worldWideWeebs, otherAccounts } = await loadFixture(deployFixtures);

      await expect(worldWideWeebs.connect(otherAccounts[0]).addMigrationIds([0], [1])).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });
    it('can add new IDs to legacy ids', async function () {
      const { worldWideWeebs } = await loadFixture(deployFixtures);
      const legacyIds = [0, 1];
      const newIds = [1, 2];

      await worldWideWeebs.addMigrationIds(legacyIds, newIds);
      for (let i = 0; i < legacyIds.length; i++) {
        const legacyId = legacyIds[i];
        const newId = newIds[i];

        const correspondingId = await worldWideWeebs.legacyToNewId(legacyId);
        expect(correspondingId).to.equal(newId);
      }
    });
    it('will revert the legacy ID and new ID arrays have a different length', async function () {
      const { worldWideWeebs } = await loadFixture(deployFixtures);

      await expect(worldWideWeebs.addMigrationIds([0], [1, 2])).to.be.revertedWith(
        'WorldWideWeebs: arrays length must be equal'
      );
    });
    it('will revert if one of the new ID is 0', async function () {
      const { worldWideWeebs } = await loadFixture(deployFixtures);

      await expect(worldWideWeebs.addMigrationIds([0, 1, 2], [1, 2, 0])).to.be.revertedWith(
        'WorldWideWeebs: New ID cannot be 0'
      );
    });
    it('will revert if one of the legacy IDs is already used', async function () {
      const { worldWideWeebs, legacyContract, owner } = await loadFixture(deployFixtures);

      await legacyContract.mint(owner.address, 0, 1);
      await worldWideWeebs.addMigrationIds([0], [1]);
      await worldWideWeebs.claim(0);

      await expect(worldWideWeebs.addMigrationIds([0, 1], [2, 3])).to.be.revertedWith(
        'WorldWideWeebs: Provided legacy ID has already been used'
      );
    });
    it('will revert if one of the new IDs is already used', async function () {
      const { worldWideWeebs, legacyContract, owner } = await loadFixture(deployFixtures);

      await legacyContract.mint(owner.address, 0, 1);
      await worldWideWeebs.addMigrationIds([0], [1]);
      await worldWideWeebs.claim(0);

      await expect(worldWideWeebs.addMigrationIds([1], [1])).to.be.revertedWith(
        'WorldWideWeebs: Provided new ID has already been minted'
      );
    });
  });

  describe('claim', function () {
    it('burn legacy token and mint new token to caller address', async function () {
      const { worldWideWeebs, legacyContract, otherAccounts } = await loadFixture(deployFixtures);

      await legacyContract.mint(otherAccounts[0].address, 0, 1);

      await worldWideWeebs.addMigrationIds([0], [1]);
      await worldWideWeebs.connect(otherAccounts[0]).claim(0);

      const ownerOfNewToken = await worldWideWeebs.ownerOf(1);
      expect(ownerOfNewToken).to.equal(otherAccounts[0].address);
    });
    it('revert if paused', async function () {
      const { worldWideWeebs, legacyContract, owner } = await loadFixture(deployFixtures);

      await legacyContract.mint(owner.address, 0, 1);
      await worldWideWeebs.addMigrationIds([0], [1]);

      // Pause contract to make claim revert
      await worldWideWeebs.pause();

      await expect(worldWideWeebs.claim(0)).to.be.revertedWith('Pausable: paused');
    });
    it('revert if legacy ID has already been used', async function () {
      const { worldWideWeebs, legacyContract, owner } = await loadFixture(deployFixtures);

      await legacyContract.mint(owner.address, 0, 1);

      await worldWideWeebs.addMigrationIds([0], [1]);
      await worldWideWeebs.claim(0);

      await expect(worldWideWeebs.claim(0)).to.be.revertedWith(
        'WorldWideWeebs: Provided legacy ID has already been used'
      );
    });
    it('revert if no new ID has been set for legacy ID', async function () {
      const { worldWideWeebs, legacyContract, owner } = await loadFixture(deployFixtures);

      await legacyContract.mint(owner.address, 0, 1);

      await expect(worldWideWeebs.claim(0)).to.be.revertedWith('WorldWideWeebs: New ID not set for this legacy ID');
    });
    it('revert if caller is not legacyt token owner', async function () {
      const { worldWideWeebs, legacyContract, otherAccounts } = await loadFixture(deployFixtures);

      await legacyContract.mint(otherAccounts[0].address, 0, 1);
      await worldWideWeebs.addMigrationIds([0], [1]);

      await expect(worldWideWeebs.claim(0)).to.be.revertedWith('WorldWideWeebs: Only token owner can claim');
    });
  });
});
