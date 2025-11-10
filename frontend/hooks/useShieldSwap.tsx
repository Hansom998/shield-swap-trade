"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

import { ShieldSwapABI } from "@/abi/ShieldSwapABI";
import { ShieldSwapAddresses } from "@/abi/ShieldSwapAddresses";

type OrderClear = {
  from: bigint;
  to: bigint;
};

type ShieldSwapInfo = {
  abi: typeof ShieldSwapABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getShieldSwapByChainId(chainId: number | undefined): ShieldSwapInfo {
  if (!chainId) {
    return { abi: ShieldSwapABI.abi };
  }

  const entry =
    ShieldSwapAddresses[chainId.toString() as keyof typeof ShieldSwapAddresses];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: ShieldSwapABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: ShieldSwapABI.abi,
  };
}

export const useShieldSwap = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [fromHandle, setFromHandle] = useState<string | undefined>(undefined);
  const [toHandle, setToHandle] = useState<string | undefined>(undefined);
  const [clearOrder, setClearOrder] = useState<OrderClear | undefined>(undefined);
  const clearOrderRef = useRef<OrderClear | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const shieldSwapRef = useRef<ShieldSwapInfo | undefined>(undefined);
  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isDecryptingRef = useRef<boolean>(isDecrypting);
  const isSubmittingRef = useRef<boolean>(isSubmitting);

  const isDecrypted =
    fromHandle &&
    toHandle &&
    clearOrder &&
    clearOrderRef.current &&
    clearOrder === clearOrderRef.current;

  const shieldSwap = useMemo(() => {
    const c = getShieldSwapByChainId(chainId);
    shieldSwapRef.current = c;
    if (!c.address) {
      setMessage(`ShieldSwap deployment not found for chainId=${chainId}.`);
    }
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!shieldSwap) return undefined;
    return Boolean(shieldSwap.address) && shieldSwap.address !== ethers.ZeroAddress;
  }, [shieldSwap]);

  const canGetOrder = useMemo(() => {
    return (
      !!shieldSwap.address &&
      (!!ethersSigner || !!ethersReadonlyProvider) &&
      !isRefreshing
    );
  }, [shieldSwap.address, ethersReadonlyProvider, ethersSigner, isRefreshing]);

  const refreshOrderHandles = useCallback(() => {
    if (isRefreshingRef.current) return;
    if (
      !shieldSwapRef.current ||
      !shieldSwapRef.current?.chainId ||
      !shieldSwapRef.current?.address ||
      !ethersReadonlyProvider
    ) {
      setFromHandle(undefined);
      setToHandle(undefined);
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    const thisChainId = shieldSwapRef.current.chainId;
    const thisAddress = shieldSwapRef.current.address;

    const runner: ethers.ContractRunner | undefined =
      ethersSigner ?? ethersReadonlyProvider;

    const contract = new ethers.Contract(
      thisAddress,
      shieldSwapRef.current.abi,
      runner
    );

    (contract.getMyOrder() as Promise<[string, string]>)
      .then((tuple: [string, string]) => {
        if (
          sameChain.current(thisChainId) &&
          thisAddress === shieldSwapRef.current?.address
        ) {
          setFromHandle(tuple[0]);
          setToHandle(tuple[1]);
        }
      })
      .catch((e: unknown) => {
        setMessage("ShieldSwap.getMyOrder() failed: " + e);
      })
      .finally(() => {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      });
  }, [ethersReadonlyProvider, ethersSigner, sameChain]);

  useEffect(() => {
    refreshOrderHandles();
  }, [refreshOrderHandles]);

  const canDecrypt = useMemo(() => {
    return (
      shieldSwap.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isDecrypting &&
      fromHandle &&
      toHandle &&
      fromHandle !== ethers.ZeroHash &&
      toHandle !== ethers.ZeroHash &&
      !(clearOrder && clearOrderRef.current === clearOrder)
    );
  }, [
    shieldSwap.address,
    instance,
    ethersSigner,
    isRefreshing,
    isDecrypting,
    fromHandle,
    toHandle,
    clearOrder,
  ]);

  const decryptOrderHandles = useCallback(() => {
    if (isRefreshingRef.current || isDecryptingRef.current) return;
    if (!shieldSwap.address || !instance || !ethersSigner) return;
    if (!fromHandle || !toHandle) return;

    const thisChainId = chainId;
    const thisAddress = shieldSwap.address;
    const thisFromHandle = fromHandle;
    const thisToHandle = toHandle;
    const thisSigner = ethersSigner;

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage("Start decrypting order...");

    const run = async () => {
      const isStale = () =>
        thisAddress !== shieldSwapRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisSigner);

      try {
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [thisAddress],
            thisSigner,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        const res = await instance.userDecrypt(
          [
            { handle: thisFromHandle, contractAddress: thisAddress },
            { handle: thisToHandle, contractAddress: thisAddress },
          ],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        if (isStale()) {
          setMessage("Ignore FHEVM decryption");
          return;
        }

        const clear: OrderClear = {
          from: res[thisFromHandle] as bigint,
          to: res[thisToHandle] as bigint,
        };
        setClearOrder(clear);
        clearOrderRef.current = clear;
        setMessage(`Order decrypted: from=${clear.from} to=${clear.to}`);
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
      }
    };

    run();
  }, [
    fhevmDecryptionSignatureStorage,
    ethersSigner,
    shieldSwap.address,
    instance,
    fromHandle,
    toHandle,
    chainId,
    sameChain,
    sameSigner,
  ]);

  const canSetOrder = useMemo(() => {
    return (
      shieldSwap.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isSubmitting
    );
  }, [shieldSwap.address, instance, ethersSigner, isRefreshing, isSubmitting]);

  const setOrder = useCallback(
    (from: number, to: number) => {
      if (isRefreshingRef.current || isSubmittingRef.current) return;
      if (!shieldSwap.address || !instance || !ethersSigner) return;
      if (!Number.isFinite(from) || !Number.isFinite(to)) return;
      if (from < 0 || to < 0) return;
      if (from > 0xffffffff || to > 0xffffffff) {
        setMessage("Values must fit in uint32");
        return;
      }

      const thisChainId = chainId;
      const thisAddress = shieldSwap.address;
      const thisSigner = ethersSigner;
      const contract = new ethers.Contract(
        thisAddress,
        shieldSwap.abi,
        thisSigner
      );

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setMessage("Encrypting and submitting order...");

      const run = async () => {
        await new Promise((r) => setTimeout(r, 100));

        const isStale = () =>
          thisAddress !== shieldSwapRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisSigner);

        try {
          const input = instance.createEncryptedInput(
            thisAddress,
            thisSigner.address
          );
          input.add32(from);
          input.add32(to);
          const enc = await input.encrypt();

          if (isStale()) {
            setMessage("Ignore setOrder");
            return;
          }

          const tx: ethers.TransactionResponse = await contract.setOrder(
            enc.handles[0],
            enc.handles[1],
            enc.inputProof
          );
          setMessage(`Waiting tx ${tx.hash}...`);
          await tx.wait();

          if (isStale()) {
            setMessage("Ignore setOrder");
            return;
          }

          setMessage("setOrder completed");
          refreshOrderHandles();
        } catch (e: unknown) {
          const s = String(e ?? "");
          if (s.includes("Failed to fetch") || s.includes('code": -32603')) {
            setMessage(
              "setOrder failed: Wallet RPC unreachable. Please switch Sepolia RPC."
            );
          } else {
            setMessage("setOrder failed: " + s);
          }
        } finally {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      };

      run();
    },
    [
      ethersSigner,
      shieldSwap.address,
      shieldSwap.abi,
      instance,
      chainId,
      refreshOrderHandles,
      sameChain,
      sameSigner,
    ]
  );

  return {
    contractAddress: shieldSwap.address,
    canGetOrder,
    refreshOrderHandles,
    canDecrypt,
    decryptOrderHandles,
    canSetOrder,
    setOrder,
    isDecrypted,
    message,
    clear: clearOrder,
    fromHandle,
    toHandle,
    isDecrypting,
    isRefreshing,
    isSubmitting,
    isDeployed,
  };
};
