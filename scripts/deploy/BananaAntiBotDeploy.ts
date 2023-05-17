import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();

  const signerAccount = signers[0];
  console.log(`Signer account : ${signerAccount.address}`);

  // We get the contract to deploy
  const factory = await ethers.getContractFactory("BananaAntiBot", {
    signer: signerAccount
  });

  // Deploy the contract
  const contract = await factory.deploy();

  console.log(`Anti-Bot contract deployed to address : ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
