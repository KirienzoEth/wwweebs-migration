// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @author Kirienzo
contract WorldWideWeebs is ERC721, Pausable, Ownable {
  /// @notice As ERC1155 NFTs are not unique, we have to keep track of which one has been used
  /// @notice Also, OpenSea contract is not verified so no way to know if more tokens wit the same ID can be minted
  mapping(uint256 => bool) public isLegacyIdUsed;
  /// @notice Which token ID you will get with your new ID
  mapping(uint256 => uint256) public legacyToNewId;

  string private baseURI;
  /// @notice OpenSea shared storefront contract
  IERC1155 internal openSeaContract;

  constructor(address _openSeaContract) ERC721("WorldWideWeebs", "WWW") {
    _pause();
    openSeaContract = IERC1155(_openSeaContract);
  }

  ///////////////////////////////////////////////////////////////////////
  /////////////////////////// Claim functions ///////////////////////////
  ///////////////////////////////////////////////////////////////////////

  /// @notice Add pairings between the legacy token IDs and new token IDs
  /// @notice One of the new token ID can't be 0 for check purposes
  function addMigrationIds(uint256[] calldata _legacyIds, uint256[] calldata _newIds) public onlyOwner {
    // Each legacy ID should correspond to a new ID
    require(_legacyIds.length == _newIds.length, "WorldWideWeebs: arrays length must be equal");

    for (uint256 _i = 0; _i < _legacyIds.length; _i++) {
      uint256 _legacyId = _legacyIds[_i];
      uint256 _newId = _newIds[_i];

      // Check for already use IDs
      require(_newId != 0, "WorldWideWeebs: New ID cannot be 0");
      require(!isLegacyIdUsed[_legacyId], "WorldWideWeebs: Provided legacy ID has already been used");
      require(!_exists(_newId), "WorldWideWeebs: Provided new ID has already been minted");

      legacyToNewId[_legacyId] = _newId;
    }
  }

  /// @notice Burn the legacy token to mint the new token.
  /// @notice This contract should be approved to transfer your OpenSea NFTs before use.
  function claim(uint256 _legacyId) public whenNotPaused {
    require(!isLegacyIdUsed[_legacyId], "WorldWideWeebs: Provided legacy ID has already been used");
    require(legacyToNewId[_legacyId] != 0, "WorldWideWeebs: New ID not set for this legacy ID");
    require(openSeaContract.balanceOf(msg.sender, _legacyId) == 1, "WorldWideWeebs: Only token owner can claim");

    // Set legacy token ID as used
    isLegacyIdUsed[_legacyId] = true;
    // Burn legacy token
    openSeaContract.safeTransferFrom(msg.sender, 0x000000000000000000000000000000000000dEaD, _legacyId, 1, "");
    // Mint new token to msg.sender
    _safeMint(msg.sender, legacyToNewId[_legacyId]);
  }

  ///////////////////////////////////////////////////////////////////////
  /////////////////////////// Utils functions ///////////////////////////
  ///////////////////////////////////////////////////////////////////////

  function pause() external onlyOwner {
    _pause();
  }

  function unpause() external onlyOwner {
    _unpause();
  }

  /// @dev See {ERC721-_baseURI}.
  function _baseURI() internal view override returns (string memory) {
    return baseURI;
  }

  /// @notice Set a new base URI to update tokens metadata
  function setBaseURI(string calldata _newBaseURI) external onlyOwner {
    baseURI = _newBaseURI;
  }
}
