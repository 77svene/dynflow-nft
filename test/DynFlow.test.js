const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DynFlow", function () {
  let dynFlowNFT;
  let dynFlowVault;
  let owner, user1, user2;
  let weth, usdc;
  let positionManager;
  let router;

  const POOL_FEE = 3000;
  const MIN_TICK = -887272;
  const MAX_TICK = 887272;
  const LIQUIDITY_AMOUNT = ethers.parseEther("10");
  const DEPOSIT_AMOUNT = ethers.parseEther("5");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock tokens
    const WETH9 = await ethers.getContractFactory("WETH9");
    weth = await WETH9.deploy();
    await weth.waitForDeployment();

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    usdc = await TestERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();
    await usdc.mint(owner.address, ethers.parseUnits("1000000", 6));
    await usdc.mint(user1.address, ethers.parseUnits("1000000", 6));

    // Deploy Uniswap V3 contracts
    const NonfungiblePositionManager = await ethers.getContractFactory(
      "NonfungiblePositionManager"
    );
    positionManager = await NonfungiblePositionManager.deploy(
      "Uniswap V3 Positions NFT",
      "UNI-V3-POS",
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
    );
    await positionManager.waitForDeployment();

    const SwapRouter = await ethers.getContractFactory("SwapRouter");
    router = await SwapRouter.deploy(positionManager.target);
    await router.waitForDeployment();

    // Deploy DynFlow contracts
    const DynFlowVault = await ethers.getContractFactory("DynFlowVault");
    dynFlowVault = await DynFlowVault.deploy(
      positionManager.target,
      router.target
    );
    await dynFlowVault.waitForDeployment();

    const DynFlowNFT = await ethers.getContractFactory("DynFlowNFT");
    dynFlowNFT = await DynFlowNFT.deploy(dynFlowVault.target);
    await dynFlowNFT.waitForDeployment();

    // Approve vault to spend tokens
    await usdc.connect(owner).approve(dynFlowVault.target, ethers.MaxUint256);
    await weth.connect(owner).approve(dynFlowVault.target, ethers.MaxUint256);
  });

  describe("Deposit", function () {
    it("should mint NFT with liquidity position", async function () {
      const token0 = usdc.target;
      const token1 = weth.target;

      // Create pool if needed
      try {
        await positionManager
          .connect(owner)
          .createAndInitializePoolIfNecessary(
            [token0, token1],
            POOL_FEE,
            ethers.parseUnits("1", 18)
          );
      } catch (e) {
        // Pool might already exist
      }

      const depositAmount = ethers.parseEther("1");
      await usdc.connect(owner).approve(dynFlowVault.target, depositAmount);
      await weth.connect(owner).approve(dynFlowVault.target, depositAmount);

      const tx = await dynFlowVault
        .connect(owner)
        .deposit(
          token0,
          token1,
          POOL_FEE,
          MIN_TICK,
          MAX_TICK,
          LIQUIDITY_AMOUNT,
          depositAmount,
          depositAmount,
          0
        );

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "NFTMinted");
      const tokenId = event.args.tokenId;

      expect(await dynFlowNFT.ownerOf(tokenId)).to.equal(owner.address);
      expect(await dynFlowNFT.tokenIdCounter()).to.equal(1);
    });

    it("should revert if insufficient liquidity", async function () {
      const token0 = usdc.target;
      const token1 = weth.target;

      try {
        await positionManager
          .connect(owner)
          .createAndInitializePoolIfNecessary(
            [token0, token1],
            POOL_FEE,
            ethers.parseUnits("1", 18)
          );
      } catch (e) {}

      const depositAmount = ethers.parseEther("1");
      await usdc.connect(owner).approve(dynFlowVault.target, depositAmount);
      await weth.connect(owner).approve(dynFlowVault.target, depositAmount);

      await expect(
        dynFlowVault
          .connect(owner)
          .deposit(
            token0,
            token1,
            POOL_FEE,
            MIN_TICK,
            MAX_TICK,
            0,
            depositAmount,
            depositAmount,
            0
          )
      ).to.be.revertedWith("Insufficient liquidity");
    });

    it("should emit NFTMinted event", async function () {
      const token0 = usdc.target;
      const token1 = weth.target;

      try {
        await positionManager
          .connect(owner)
          .createAndInitializePoolIfNecessary(
            [token0, token1],
            POOL_FEE,
            ethers.parseUnits("1", 18)
          );
      } catch (e) {}

      const depositAmount = ethers.parseEther("1");
      await usdc.connect(owner).approve(dynFlowVault.target, depositAmount);
      await weth.connect(owner).approve(dynFlowVault.target, depositAmount);

      await expect(
        dynFlowVault
          .connect(owner)
          .deposit(
            token0,
            token1,
            POOL_FEE,
            MIN_TICK,
            MAX_TICK,
            LIQUIDITY_AMOUNT,
            depositAmount,
            depositAmount,
            0
          )
      )
        .to.emit(dynFlowVault, "NFTMinted")
        .withArgs(1, owner.address);
    });
  });

  describe("Withdraw", function () {
    let tokenId;

    beforeEach(async function () {
      const token0 = usdc.target;
      const token1 = weth.target;

      try {
        await positionManager
          .connect(owner)
          .createAndInitializePoolIfNecessary(
            [token0, token1],
            POOL_FEE,
            ethers.parseUnits("1", 18)
          );
      } catch (e) {}

      const depositAmount = ethers.parseEther("1");
      await usdc.connect(owner).approve(dynFlowVault.target, depositAmount);
      await weth.connect(owner).approve(dynFlowVault.target, depositAmount);

      const tx = await dynFlowVault
        .connect(owner)
        .deposit(
          token0,
          token1,
          POOL_FEE,
          MIN_TICK,
          MAX_TICK,
          LIQUIDITY_AMOUNT,
          depositAmount,
          depositAmount,
          0
        );

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "NFTMinted");
      tokenId = event.args.tokenId;
    });

    it("should withdraw liquidity and transfer funds", async function () {
      const balanceBefore = await usdc.balanceOf(owner.address);
      const wethBalanceBefore = await weth.balanceOf(owner.address);

      const tx = await dynFlowVault
        .connect(owner)
        .withdraw(tokenId, 0);

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "LiquidityWithdrawn");

      expect(event.args.tokenId).to.equal(tokenId);
      expect(event.args.amount0).to.be.greaterThan(0);
      expect(event.args.amount1).to.be.greaterThan(0);

      const balanceAfter = await usdc.balanceOf(owner.address);
      const wethBalanceAfter = await weth.balanceOf(owner.address);

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
      expect(wethBalanceAfter).to.be.greaterThan(wethBalanceBefore);
    });

    it("should revert if token does not exist", async function () {
      await expect(
        dynFlowVault.connect(owner).withdraw(999, 0)
      ).to.be.revertedWith("Token does not exist");
    });

    it("should revert if caller is not owner", async function () {
      await expect(
        dynFlowVault.connect(user1).withdraw(tokenId, 0)
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("Metadata Updates", function () {
    let tokenId;

    beforeEach(async function () {
      const token0 = usdc.target;
      const token1 = weth.target;

      try {
        await positionManager
          .connect(owner)
          .createAndInitializePoolIfNecessary(
            [token0, token1],
            POOL_FEE,
            ethers.parseUnits("1", 18)
          );
      } catch (e) {}

      const depositAmount = ethers.parseEther("1");
      await usdc.connect(owner).approve(dynFlowVault.target, depositAmount);
      await weth.connect(owner).approve(dynFlowVault.target, depositAmount);

      const tx = await dynFlowVault
        .connect(owner)
        .deposit(
          token0,
          token1,
          POOL_FEE,
          MIN_TICK,
          MAX_TICK,
          LIQUIDITY_AMOUNT,
          depositAmount,
          depositAmount,
          0
        );

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "NFTMinted");
      tokenId = event.args.tokenId;
    });

    it("should update metadata with performance data", async function () {
      const metadata = await dynFlowNFT.tokenURI(tokenId);
      expect(metadata).to.include("DynFlow");
      expect(metadata).to.include("APY");
      expect(metadata).to.include("Duration");
    });

    it("should track position duration", async function () {
      const positionInfo = await dynFlowVault.getPositionInfo(tokenId);
      expect(positionInfo.duration).to.be.greaterThan(0);
    });

    it("should update metadata after time passes", async function () {
      const initialMetadata = await dynFlowNFT.tokenURI(tokenId);

      // Simulate time passing by calling updateMetadata
      await dynFlowVault.updateMetadata(tokenId);

      const updatedMetadata = await dynFlowNFT.tokenURI(tokenId);
      expect(updatedMetadata).to.not.equal(initialMetadata);
    });
  });

  describe("Position Management", function () {
    it("should track multiple positions", async function () {
      const token0 = usdc.target;
      const token1 = weth.target;

      try {
        await positionManager
          .connect(owner)
          .createAndInitializePoolIfNecessary(
            [token0, token1],
            POOL_FEE,
            ethers.parseUnits("1", 18)
          );
      } catch (e) {}

      const depositAmount = ethers.parseEther("1");
      await usdc.connect(owner).approve(dynFlowVault.target, depositAmount);
      await weth.connect(owner).approve(dynFlowVault.target, depositAmount);

      await dynFlowVault
        .connect(owner)
        .deposit(
          token0,
          token1,
          POOL_FEE,
          MIN_TICK,
          MAX_TICK,
          LIQUIDITY_AMOUNT,
          depositAmount,
          depositAmount,
          0
        );

      await dynFlowVault
        .connect(owner)
        .deposit(
          token0,
          token1,
          POOL_FEE,
          MIN_TICK,
          MAX_TICK,
          LIQUIDITY_AMOUNT,
          depositAmount,
          depositAmount,
          0
        );

      expect(await dynFlowNFT.tokenIdCounter()).to.equal(3);
    });

    it("should get position info for valid token", async function () {
      const token0 = usdc.target;
      const token1 = weth.target;

      try {
        await positionManager
          .connect(owner)
          .createAndInitializePoolIfNecessary(
            [token0, token1],
            POOL_FEE,
            ethers.parseUnits("1", 18)
          );
      } catch (e) {}

      const depositAmount = ethers.parseEther("1");
      await usdc.connect(owner).approve(dynFlowVault.target, depositAmount);
      await weth.connect(owner).approve(dynFlowVault.target, depositAmount);

      const tx = await dynFlowVault
        .connect(owner)
        .deposit(
          token0,
          token1,
          POOL_FEE,
          MIN_TICK,
          MAX_TICK,
          LIQUIDITY_AMOUNT,
          depositAmount,
          depositAmount,
          0
        );

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "NFTMinted");
      const tokenId = event.args.tokenId;

      const positionInfo = await dynFlowVault.getPositionInfo(tokenId);
      expect(positionInfo.positionId).to.be.greaterThan(0);
      expect(positionInfo.liquidity).to.equal(LIQUIDITY_AMOUNT);
    });
  });

  describe("Access Control", function () {
    it("should only allow owner to withdraw", async function () {
      const token0 = usdc.target;
      const token1 = weth.target;

      try {
        await positionManager
          .connect(owner)
          .createAndInitializePoolIfNecessary(
            [token0, token1],
            POOL_FEE,
            ethers.parseUnits("1", 18)
          );
      } catch (e) {}

      const depositAmount = ethers.parseEther("1");
      await usdc.connect(owner).approve(dynFlowVault.target, depositAmount);
      await weth.connect(owner).approve(dynFlowVault.target, depositAmount);

      const tx = await dynFlowVault
        .connect(owner)
        .deposit(
          token0,
          token1,
          POOL_FEE,
          MIN_TICK,
          MAX_TICK,
          LIQUIDITY_AMOUNT,
          depositAmount,
          depositAmount,
          0
        );

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "NFTMinted");
      const tokenId = event.args.tokenId;

      await expect(
        dynFlowVault.connect(user1).withdraw(tokenId, 0)
      ).to.be.revertedWith("Not owner");
    });

    it("should only allow owner to update metadata", async function () {
      const token0 = usdc.target;
      const token1 = weth.target;

      try {
        await positionManager
          .connect(owner)
          .createAndInitializePoolIfNecessary(
            [token0, token1],
            POOL_FEE,
            ethers.parseUnits("1", 18)
          );
      } catch (e) {}

      const depositAmount = ethers.parseEther("1");
      await usdc.connect(owner).approve(dynFlowVault.target, depositAmount);
      await weth.connect(owner).approve(dynFlowVault.target, depositAmount);

      const tx = await dynFlowVault
        .connect(owner)
        .deposit(
          token0,
          token1,
          POOL_FEE,
          MIN_TICK,
          MAX_TICK,
          LIQUIDITY_AMOUNT,
          depositAmount,
          depositAmount,
          0
        );

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "NFTMinted");
      const tokenId = event.args.tokenId;

      await expect(
        dynFlowVault.connect(user1).updateMetadata(tokenId)
      ).to.be.revertedWith("Not owner");
    });
  });
});