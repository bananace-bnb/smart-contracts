import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ERC20TokenOB", function() {
  // Constructor arguments
  const tokenName = "Dummy Token";
  const tokenSymbol = "DMY";
  const initialSupply = 5_000; // Initial supply for current chain

  let erc20: Contract;
  let antiBot: Contract;
  let erc20Factory: ContractFactory;
  let antiBotFactory: ContractFactory;
  let deployer: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;
  let otherAccounts: SignerWithAddress;

  beforeEach(async function() {
    [deployer, account1, account2, ...otherAccounts] = await ethers.getSigners();

    // We get the contract to deploy
    erc20Factory = await ethers.getContractFactory("ERC20TokenOB");
    antiBotFactory = await ethers.getContractFactory("BananaAntiBot");

    // Deploy the anti-bot
    antiBot = await antiBotFactory.deploy();

    // Wait contract deploy process for complete
    await antiBot.deployed();

    // Deploy the contract
    erc20 = await erc20Factory.deploy(tokenName, tokenSymbol, initialSupply, antiBot.address);

    // Wait contract deploy process for complete
    await erc20.deployed();
  });

  it("Basic ERC20 Parameters", async function() {
    await expect(await erc20.decimals(), "Token decimals").to.equal(18);
    await expect(await erc20.name(), "Token name").to.equal(tokenName);
    await expect(await erc20.symbol(), "Token symbol").to.equal(tokenSymbol);
  });

  it("Owner Balance / Total Supply / Update balances after transfers", async function() {
    const ownerBalance = await erc20.balanceOf(deployer.address);
    await expect(await erc20.totalSupply(), "Total supply").to.equal(ownerBalance);

    // Transfer to account1
    await erc20.transfer(account1.address, 300);

    // Balance checks
    const finalOwnerBalance = await erc20.balanceOf(deployer.address);
    await expect(finalOwnerBalance).to.equal(ownerBalance.sub(300));

    const acc1Balance = await erc20.balanceOf(account1.address);
    await expect(acc1Balance).to.equal(300);
  });

  it("Burn Functionality", async function() {
    const ownerBalance = await erc20.balanceOf(deployer.address);

    await erc20.burn(500);
    await expect(await erc20.balanceOf(deployer.address), "Burn").to.equal(ownerBalance.sub(500));
  });

  it("Should add single address to blacklist", async () => {
    // Add account1 to the blacklist
    await antiBot.addBlacklist(account1.address);
    expect(await antiBot.isBlacklisted(account1.address)).to.equal(true);
  });

  it("Should add multiple addresses to blacklist", async () => {
    // Add multiple addresses to the blacklist
    await antiBot.addMultipleBlacklist([account1.address, account2.address]);
    expect(await antiBot.isBlacklisted(account1.address)).to.equal(true);
    expect(await antiBot.isBlacklisted(account2.address)).to.equal(true);
  });

  it("Should remove single address from blacklist", async () => {
    // Add account1 to the blacklist and then remove it
    await antiBot.addBlacklist(account1.address);
    await antiBot.removeBlacklist(account1.address);
    expect(await antiBot.isBlacklisted(account1.address)).to.equal(false);
  });

  it("Should remove multiple addresses from blacklist", async () => {
    // Add multiple addresses to the blacklist and then remove them
    await antiBot.addMultipleBlacklist([account1.address, account2.address]);
    await antiBot.removeMultipleBlacklist([account1.address, account2.address]);
    expect(await antiBot.isBlacklisted(account1.address)).to.equal(false);
    expect(await antiBot.isBlacklisted(account2.address)).to.equal(false);
  });

  it("Should emit events when adding/removing addresses from blacklist", async () => {
    // Add and remove an address from the blacklist and verify events
    await expect(antiBot.addBlacklist(account1.address))
      .to.emit(antiBot, "AddBlacklist")
      .withArgs(account1.address);
    await expect(antiBot.removeBlacklist(account1.address))
      .to.emit(antiBot, "RemoveBlacklist")
      .withArgs(account1.address);
  });

  it("Should not allow blacklisted addresses to transfer tokens", async () => {
    // Add account1 to the blacklist and then try to transfer tokens
    await antiBot.addBlacklist(account1.address);
    await expect(erc20.connect(account1).transfer(account2.address, 100))
      .to.be.revertedWith("AntiBot: From address is defined as a BOT");
  });

  it("Should anti bot state changeable after ownership renounce", async () => {
    const antiBotState = await erc20.antiBotActive();
    await erc20.renounceOwnership();
    await erc20.setAntiBotState(false);
    await expect(await erc20.antiBotActive()).to.be.equal(!antiBotState);
  });
});
