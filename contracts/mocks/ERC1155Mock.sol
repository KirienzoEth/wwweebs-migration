// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ERC1155Mock is ERC1155 {
  constructor() ERC1155("") {}

  function mint(address _to, uint256 _tokenId, uint256 _amount) public {
    _mint(_to, _tokenId, _amount, "");
  }

  function mintBatch(address _to, uint256[] calldata _tokenIds, uint256[] calldata _amounts) public {
    _mintBatch(_to, _tokenIds, _amounts, "");
  }
}
