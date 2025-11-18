import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the ShieldSwap contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the ShieldSwap contract
 *
 *   npx hardhat --network localhost task:shield-address
 *   npx hardhat --network localhost task:set-order --from 100 --to 2500
 *   npx hardhat --network localhost task:decrypt-order
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the ShieldSwap contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the ShieldSwap contract
 *
 *   npx hardhat --network sepolia task:shield-address
 *   npx hardhat --network sepolia task:set-order --from 100 --to 2500
 *   npx hardhat --network sepolia task:decrypt-order
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:shield-address
 *   - npx hardhat --network sepolia task:shield-address
 */
task("task:shield-address", "Prints the ShieldSwap address").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;

    const shieldSwap = await deployments.get("ShieldSwap");

    console.log("ShieldSwap address is " + shieldSwap.address);
  }
);

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-order
 *   - npx hardhat --network sepolia task:decrypt-order
 */
task("task:decrypt-order", "Decrypts the caller's current swap order")
  .addOptionalParam("address", "Optionally specify the ShieldSwap contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const ShieldSwapDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("ShieldSwap");
    console.log(`ShieldSwap: ${ShieldSwapDeployment.address}`);

    const signers = await ethers.getSigners();

    const shieldSwapContract = await ethers.getContractAt(
      "ShieldSwap",
      ShieldSwapDeployment.address
    );

    const [encryptedFrom, encryptedTo] = await shieldSwapContract.getMyOrder();

    if (encryptedFrom === ethers.ZeroHash || encryptedTo === ethers.ZeroHash) {
      console.log(`No order found for ${signers[0].address}`);
      console.log(`Encrypted fromAmount: ${encryptedFrom}`);
      console.log(`Encrypted toAmount: ${encryptedTo}`);
      return;
    }

    const clearFrom = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedFrom,
      ShieldSwapDeployment.address,
      signers[0]
    );

    const clearTo = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTo,
      ShieldSwapDeployment.address,
      signers[0]
    );

    console.log(`Encrypted fromAmount: ${encryptedFrom}`);
    console.log(`Encrypted toAmount: ${encryptedTo}`);
    console.log(`Clear fromAmount: ${clearFrom}`);
    console.log(`Clear toAmount: ${clearTo}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:set-order --from 100 --to 2500
 *   - npx hardhat --network sepolia task:set-order --from 100 --to 2500
 */
task("task:set-order", "Creates an encrypted swap order")
  .addOptionalParam("address", "Optionally specify the ShieldSwap contract address")
  .addParam("from", "The from amount (what you pay)")
  .addParam("to", "The to amount (what you receive)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const fromAmount = parseInt(taskArguments.from);
    const toAmount = parseInt(taskArguments.to);

    if (!Number.isInteger(fromAmount) || !Number.isInteger(toAmount)) {
      throw new Error(`Arguments --from and --to must be integers`);
    }

    if (fromAmount < 0 || toAmount < 0) {
      throw new Error(`Arguments --from and --to must be non-negative`);
    }

    await fhevm.initializeCLIApi();

    const ShieldSwapDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("ShieldSwap");
    console.log(`ShieldSwap: ${ShieldSwapDeployment.address}`);

    const signers = await ethers.getSigners();

    const shieldSwapContract = await ethers.getContractAt(
      "ShieldSwap",
      ShieldSwapDeployment.address
    );

    // Encrypt both values
    const encryptedInput = await fhevm
      .createEncryptedInput(ShieldSwapDeployment.address, signers[0].address)
      .add32(fromAmount)
      .add32(toAmount)
      .encrypt();

    console.log(`Submitting encrypted order: from=${fromAmount}, to=${toAmount}`);

    const tx = await shieldSwapContract
      .connect(signers[0])
      .setOrder(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.inputProof
      );
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const [newEncryptedFrom, newEncryptedTo] =
      await shieldSwapContract.getMyOrder();
    console.log("Encrypted fromAmount after setOrder:", newEncryptedFrom);
    console.log("Encrypted toAmount after setOrder:", newEncryptedTo);

    console.log(
      `ShieldSwap setOrder(from=${fromAmount}, to=${toAmount}) succeeded!`
    );
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:check-order
 *   - npx hardhat --network sepolia task:check-order
 */
task("task:check-order", "Check if the caller has an active order")
  .addOptionalParam("address", "Optionally specify the ShieldSwap contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const ShieldSwapDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("ShieldSwap");
    console.log(`ShieldSwap: ${ShieldSwapDeployment.address}`);

    const signers = await ethers.getSigners();

    const shieldSwapContract = await ethers.getContractAt(
      "ShieldSwap",
      ShieldSwapDeployment.address
    );

    const hasOrder = await shieldSwapContract.hasOrder();
    const timestamp = await shieldSwapContract.getMyOrderTimestamp();

    console.log(`Address: ${signers[0].address}`);
    console.log(`Has active order: ${hasOrder}`);
    
    if (hasOrder && timestamp > 0) {
      const orderDate = new Date(Number(timestamp) * 1000);
      console.log(`Order created at: ${orderDate.toISOString()}`);
    }
  });
