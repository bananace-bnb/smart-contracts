import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();

  const signerAccount = signers[0];
  console.log(`Signer account : ${signerAccount.address}`);

  // We get the contract to deploy
  const tokenErc20 = await ethers.getContractFactory("ERC20TokenOB", {
    signer: signerAccount
  });

  // Constructor arguments
  const tokenName = "Bananace";
  const tokenSymbol = "NANA";
  const initialSupply = 696_969_696_969_696;
  const antiBot = "0x8EFDb3b642eb2a20607ffe0A56CFefF6a95Df002";

  // Deploy the contract
  const tokenErc20Contract = await tokenErc20.deploy(tokenName, tokenSymbol, initialSupply, antiBot);

  // Wait for the contract deployment transaction to complete and confirmations
  const deployTransaction = await tokenErc20Contract.deployTransaction.wait();
  console.log(`Transaction hash: ${deployTransaction.transactionHash}`);
  console.log(`Contract address: ${tokenErc20Contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
