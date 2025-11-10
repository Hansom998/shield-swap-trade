import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { ShieldSwap } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("ShieldSwapSepolia", function () {
  let signers: Signers;
  let shieldSwapContract: ShieldSwap;
  let shieldSwapContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const ShieldSwapDeployment = await deployments.get("ShieldSwap");
      shieldSwapContractAddress = ShieldSwapDeployment.address;
      shieldSwapContract = await ethers.getContractAt("ShieldSwap", ShieldSwapDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should create and decrypt an encrypted order on Sepolia", async function () {
    steps = 8;
    this.timeout(4 * 60000); // 4 minutes timeout for Sepolia

    const fromAmount = 100;
    const toAmount = 2500;

    progress("Encrypting order values...");
    const encryptedInput = await fhevm
      .createEncryptedInput(shieldSwapContractAddress, signers.alice.address)
      .add32(fromAmount)
      .add32(toAmount)
      .encrypt();

    progress(
      `Calling setOrder() ShieldSwap=${shieldSwapContractAddress} signer=${signers.alice.address}...`
    );
    const tx = await shieldSwapContract
      .connect(signers.alice)
      .setOrder(encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof);
    await tx.wait();

    progress(`Calling ShieldSwap.getMyOrder()...`);
    const [encryptedFrom, encryptedTo] = await shieldSwapContract.getMyOrder();
    expect(encryptedFrom).to.not.eq(ethers.ZeroHash);
    expect(encryptedTo).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting fromAmount handle=${encryptedFrom}...`);
    const clearFrom = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedFrom,
      shieldSwapContractAddress,
      signers.alice
    );

    progress(`Decrypting toAmount handle=${encryptedTo}...`);
    const clearTo = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTo,
      shieldSwapContractAddress,
      signers.alice
    );

    progress(`Clear fromAmount=${clearFrom}`);
    progress(`Clear toAmount=${clearTo}`);

    expect(clearFrom).to.eq(fromAmount);
    expect(clearTo).to.eq(toAmount);
  });
});
