// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./DynFlowVault.sol";

contract DynFlowNFT is ERC721, ERC721URIStorage {
    using SafeMath for uint256;
    
    uint256 private _nextTokenId;
    address public vault;
    string private _baseTokenURI;
    
    event PositionMinted(uint256 indexed tokenId, address indexed owner, uint256 amount0, uint256 amount1);
    event PositionUpdated(uint256 indexed tokenId, uint256 apy, uint256 duration);
    
    constructor(address _vault, string memory _baseURI) ERC721("DynFlow NFT", "DFLOW") {
        vault = _vault;
        _baseTokenURI = _baseURI;
    }
    
    function setVault(address _vault) external {
        require(msg.sender == vault, "Not vault");
        vault = _vault;
    }
    
    function setBaseURI(string memory _baseURI) external {
        require(msg.sender == ownerOf(1), "Not owner");
        _baseTokenURI = _baseURI;
    }
    
    function mintPosition(address recipient, uint256 amount0, uint256 amount1, uint256 lowerTick, uint256 upperTick) 
        external returns (uint256 tokenId) 
    {
        require(vault != address(0), "Vault not set");
        require(amount0 > 0 && amount1 > 0, "Invalid amounts");
        
        tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);
        
        DynFlowVault(vault).createPosition(tokenId, amount0, amount1, lowerTick, upperTick);
        
        emit PositionMinted(tokenId, recipient, amount0, amount1);
        
        return tokenId;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        string memory baseURI = _baseTokenURI;
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, Strings.toString(tokenId))) : "";
    }
    
    function getCurrentTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
    
    function getPositionInfo(uint256 tokenId) external view returns (
        address owner,
        uint256 amount0,
        uint256 amount1,
        uint256 lowerTick,
        uint256 upperTick,
        uint256 liquidity,
        uint256 apy
    ) {
        owner = ownerOf(tokenId);
        return DynFlowVault(vault).getPositionInfo(tokenId);
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721URIStorage) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function supportsInterface(bytes4 interfaceId) 
        public view override(ERC721, ERC721URIStorage) returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}