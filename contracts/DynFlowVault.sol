// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/INonfungiblePositionManager.sol";

contract DynFlowVault is ERC721 {
    using Address for address;
    
    INonfungiblePositionManager public immutable positionManager;
    address public immutable WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public immutable USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    uint256 public nextTokenId = 1;
    mapping(uint256 => PositionInfo) public positions;
    
    struct PositionInfo {
        uint256 tokenId;
        uint160 sqrtPriceX96;
        int24 tick;
        uint128 liquidity;
        uint256 depositedAt;
        uint256 totalYield;
    }
    
    constructor() ERC721("DynFlow NFT", "DFLOW") {
        positionManager = INonfungiblePositionManager(0xC36442b4a4522E871399CD717aBDD847Ab11FE88);
    }
    
    function deposit(
        uint256 amount0,
        uint256 amount1,
        int24 tickLower,
        int24 tickUpper
    ) external returns (uint256 tokenId) {
        IERC20(WETH).approve(address(positionManager), amount0);
        IERC20(USDC).approve(address(positionManager), amount1);
        
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: WETH,
            token1: USDC,
            fee: 3000,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0,
            amount1Desired: amount1,
            amount0Min: 0,
            amount1Min: 0,
            deadline: block.timestamp
        });
        
        (tokenId, , , ) = positionManager.mint(params);
        positions[tokenId] = PositionInfo({
            tokenId: tokenId,
            sqrtPriceX96: 0,
            tick: 0,
            liquidity: 0,
            depositedAt: block.timestamp,
            totalYield: 0
        });
        _safeMint(msg.sender, tokenId);
        return tokenId;
    }
    
    function withdraw(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        PositionInfo storage pos = positions[tokenId];
        
        uint256 amount0;
        uint256 amount1;
        (amount0, amount1, , , , , ) = positionManager.positions(tokenId);
        
        positionManager.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: pos.liquidity,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            })
        );
        
        positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: msg.sender,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );
        
        positionManager.burn(tokenId);
        delete positions[tokenId];
        _burn(tokenId);
    }
    
    function getPositionInfo(uint256 tokenId) external view returns (PositionInfo memory) {
        return positions[tokenId];
    }
    
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}