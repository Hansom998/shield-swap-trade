import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { ShieldSwap, ShieldSwap__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("ShieldSwap")) as ShieldSwap__factory;
  const shieldSwapContract = (await factory.deploy()) as ShieldSwap;
  const shieldSwapContractAddress = await shieldSwapContract.getAddress();

  return { shieldSwapContract, shieldSwapContractAddress };
}

describe("ShieldSwap", function () {
  let signers: Signers;
  let shieldSwapContract: ShieldSwap;
  let shieldSwapContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ shieldSwapContract, shieldSwapContractAddress } = await deployFixture());
  });

  it("order should be uninitialized after deployment", async function () {
    const [encryptedFrom, encryptedTo] = await shieldSwapContract.connect(signers.alice).getMyOrder();
    // Expect initial values to be bytes32(0) after deployment
    expect(encryptedFrom).to.eq(ethers.ZeroHash);
    expect(encryptedTo).to.eq(ethers.ZeroHash);
  });

  it("should create and decrypt an encrypted order", async function () {
    const fromAmount = 100;
    const toAmount = 2500;

    // Encrypt values
    const encryptedInput = await fhevm
      .createEncryptedInput(shieldSwapContractAddress, signers.alice.address)
      .add32(fromAmount)
      .add32(toAmount)
      .encrypt();

    // Submit encrypted order
    const tx = await shieldSwapContract
      .connect(signers.alice)
      .setOrder(encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof);
    await tx.wait();

    // Get encrypted handles
    const [encryptedFrom, encryptedTo] = await shieldSwapContract.connect(signers.alice).getMyOrder();
    expect(encryptedFrom).to.not.eq(ethers.ZeroHash);
    expect(encryptedTo).to.not.eq(ethers.ZeroHash);

    // Decrypt and verify
    const clearFrom = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedFrom,
      shieldSwapContractAddress,
      signers.alice
    );

    const clearTo = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTo,
      shieldSwapContractAddress,
      signers.alice
    );

    expect(clearFrom).to.eq(fromAmount);
    expect(clearTo).to.eq(toAmount);
  });

  it("should update existing order with new values", async function () {
    // Create first order
    const firstEncrypted = await fhevm
      .createEncryptedInput(shieldSwapContractAddress, signers.alice.address)
      .add32(50)
      .add32(1000)
      .encrypt();

    await shieldSwapContract
      .connect(signers.alice)
      .setOrder(firstEncrypted.handles[0], firstEncrypted.handles[1], firstEncrypted.inputProof);

    // Update with new order
    const newFromAmount = 200;
    const newToAmount = 5000;
    const secondEncrypted = await fhevm
      .createEncryptedInput(shieldSwapContractAddress, signers.alice.address)
      .add32(newFromAmount)
      .add32(newToAmount)
      .encrypt();

    await shieldSwapContract
      .connect(signers.alice)
      .setOrder(secondEncrypted.handles[0], secondEncrypted.handles[1], secondEncrypted.inputProof);

    // Verify updated values
    const [encryptedFrom, encryptedTo] = await shieldSwapContract.connect(signers.alice).getMyOrder();

    const clearFrom = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedFrom,
      shieldSwapContractAddress,
      signers.alice
    );

    const clearTo = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTo,
      shieldSwapContractAddress,
      signers.alice
    );

    expect(clearFrom).to.eq(newFromAmount);
    expect(clearTo).to.eq(newToAmount);
  });

  it("different users should have separate orders", async function () {
    // Alice creates an order
    const aliceEncrypted = await fhevm
      .createEncryptedInput(shieldSwapContractAddress, signers.alice.address)
      .add32(100)
      .add32(2500)
      .encrypt();

    await shieldSwapContract
      .connect(signers.alice)
      .setOrder(aliceEncrypted.handles[0], aliceEncrypted.handles[1], aliceEncrypted.inputProof);

    // Bob creates a different order
    const bobEncrypted = await fhevm
      .createEncryptedInput(shieldSwapContractAddress, signers.bob.address)
      .add32(500)
      .add32(12500)
      .encrypt();

    await shieldSwapContract
      .connect(signers.bob)
      .setOrder(bobEncrypted.handles[0], bobEncrypted.handles[1], bobEncrypted.inputProof);

    // Verify Alice's order
    const [aliceFrom, aliceTo] = await shieldSwapContract.connect(signers.alice).getMyOrder();
    const aliceClearFrom = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      aliceFrom,
      shieldSwapContractAddress,
      signers.alice
    );
    expect(aliceClearFrom).to.eq(100);

    // Verify Bob's order
    const [bobFrom, bobTo] = await shieldSwapContract.connect(signers.bob).getMyOrder();
    const bobClearFrom = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      bobFrom,
      shieldSwapContractAddress,
      signers.bob
    );
    expect(bobClearFrom).to.eq(500);
  });

  it("should check if user has an active order", async function () {
    // Initially, Alice should not have an order
    expect(await shieldSwapContract.connect(signers.alice).hasOrder()).to.be.false;

    // Create an order for Alice
    const fromAmount = 200;
    const toAmount = 5000;
    const encryptedFromAmount = await fhevm.userEncryptEuint(
      FhevmType.euint32,
      fromAmount,
      shieldSwapContractAddress,
      signers.alice
    );
    const encryptedToAmount = await fhevm.userEncryptEuint(
      FhevmType.euint32,
      toAmount,
      shieldSwapContractAddress,
      signers.alice
    );

    await shieldSwapContract
      .connect(signers.alice)
      .setOrder(encryptedFromAmount.handles[0], encryptedToAmount.handles[0], encryptedFromAmount.inputProof);

    // Now Alice should have an order
    expect(await shieldSwapContract.connect(signers.alice).hasOrder()).to.be.true;
  });

  it("should revert with invalid proof", async function () {
    const fromAmount = 100;
    const toAmount = 2500;
    const encryptedFromAmount = await fhevm.userEncryptEuint(
      FhevmType.euint32,
      fromAmount,
      shieldSwapContractAddress,
      signers.alice
    );
    const encryptedToAmount = await fhevm.userEncryptEuint(
      FhevmType.euint32,
      toAmount,
      shieldSwapContractAddress,
      signers.alice
    );

    // Try to set order with empty proof
    await expect(
      shieldSwapContract
        .connect(signers.alice)
        .setOrder(encryptedFromAmount.handles[0], encryptedToAmount.handles[0], "0x")
    ).to.be.revertedWith("Invalid proof");
  });
});
