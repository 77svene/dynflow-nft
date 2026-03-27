// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IDynFlowVault {
    function getPositionInfo(uint256 tokenId) external view returns (uint256, uint256, uint256, uint256);
    function vaultOwner(uint256 tokenId) external view returns (address);
}

contract DynFlowNFT is ERC721, ERC721URIStorage, Ownable {
    IDynFlowVault public vault;
    uint256 private _nextTokenId;
    string public baseTokenURI;
    address public immutable UNISWAP_ROUTER = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;

    event PositionMinted(uint256 indexed tokenId, address indexed owner, uint256 poolId);
    event MetadataUpdated(uint256 indexed tokenId, uint256 apy, uint256 duration);

    constructor(string memory _name, string memory _symbol, string memory _baseURI)
        ERC721(_name, _symbol)
        Ownable(msg.sender)
    {
        baseTokenURI = _baseURI;
    }

    function setVault(address _vaultAddress) external onlyOwner {
        require(address(vault) == address(0), "Vault already set");
        vault = IDynFlowVault(_vaultAddress);
    }

    function mintPosition(address recipient, uint256 poolId) external returns (uint256) {
        require(address(vault) != address(0), "Vault not initialized");
        uint256 tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);
        emit PositionMinted(tokenId, recipient, poolId);
        return tokenId;
    }

    function updateMetadata(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner or approved");
        (uint256 apy, uint256 duration, uint256 yieldEarned, uint256 totalValue) = vault.getPositionInfo(tokenId);
        string memory metadata = _buildMetadata(apy, duration, yieldEarned, totalValue);
        _setTokenURI(tokenId, metadata);
        emit MetadataUpdated(tokenId, apy, duration);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        string memory base = baseTokenURI;
        string memory extension = ".json";
        if (bytes(base).length == 0) {
            base = "ipfs://";
        }
        return string(abi.encodePacked(base, Strings.toString(tokenId), extension));
    }

    function _buildMetadata(uint256 apy, uint256 duration, uint256 yieldEarned, uint256 totalValue) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '{"name":"DynFlow Position #',
            Strings.toString(_nextTokenId),
            '","description":"Dynamic Liquidity NFT with ',
            Strings.toString(apy),
            '% APY for ',
            Strings.toString(duration),
            ' days","attributes":[{"trait_type":"APY","value":',
            Strings.toString(apy),
            '},{"trait_type":"Duration","value":',
            Strings.toString(duration),
            '},{"trait_type":"Yield Earned","value":',
            Strings.toString(yieldEarned),
            '},{"trait_type":"Total Value","value":',
            Strings.toString(totalValue),
            '}],"external_url":"https://dynflow.io/position/',
            Strings.toString(_nextTokenId),
            '"}'
        ));
    }

    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}