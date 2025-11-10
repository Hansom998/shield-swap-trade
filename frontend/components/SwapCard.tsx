"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowDownUp, ChevronDown, Shield, Loader2 } from "lucide-react";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useShieldSwap } from "@/hooks/useShieldSwap";
import { useOperationLog } from "@/hooks/useOperationLog";

export function SwapCard() {
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDC");

  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const { instance: fhevmInstance } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const shieldSwap = useShieldSwap({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const { add: addLog } = useOperationLog();
  const lastMessageRef = useRef<string>("");

  // Mock exchange rate calculation
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const rate = fromToken === "ETH" ? 2500 : 0.0004;
      const result = (parseFloat(fromAmount) * rate).toFixed(2);
      setToAmount(result);
    } else {
      setToAmount("");
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);

    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handlePlaceOrder = () => {
    const from = parseInt(fromAmount || "0", 10);
    const to = parseInt(toAmount || "0", 10);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return;
    if (from <= 0 || to <= 0) return;
    addLog({
      type: "offer_create",
      title: "Submit Encrypted Order",
      details: `from=${from}, to=${to}`,
    });
    shieldSwap.setOrder(from, to);
  };

  // Mirror shieldSwap messages into operation log
  useEffect(() => {
    const m = shieldSwap.message || "";
    if (!m || m === lastMessageRef.current) return;
    lastMessageRef.current = m;

    if (m.startsWith("Order decrypted:")) {
      addLog({
        type: "decrypt",
        title: "Decryption Completed",
        details: m.replace("Order decrypted: ", ""),
      });
    } else if (m.startsWith("setOrder completed")) {
      addLog({
        type: "offer_create",
        title: "Order Submitted",
        details: `fromHandle=${shieldSwap.fromHandle}\ntoHandle=${shieldSwap.toHandle}`,
      });
    } else if (m.toLowerCase().includes("failed")) {
      addLog({ type: "error", title: "Operation Failed", details: m });
    } else if (m) {
      addLog({ type: "info", title: "Status Update", details: m });
    }
  }, [
    shieldSwap.message,
    shieldSwap.fromHandle,
    shieldSwap.toHandle,
    addLog,
  ]);

  return (
    <div className="glass-card glass-card-hover p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Swap Tokens</h2>
        <Shield className="h-5 w-5 text-primary animate-pulse-glow" />
      </div>

      {/* From Token */}
      <div className="glass-card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>From</span>
          <span>Balance: 0.00</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="border-0 bg-transparent text-2xl font-mono focus:outline-none focus:ring-0 flex-1 w-full"
          />
          <button className="glass-card px-3 py-2 h-auto flex items-center gap-2 hover:border-primary/40 transition-colors">
            <span className="font-semibold">{fromToken}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={handleSwapTokens}
          className="glass-card rounded-full h-10 w-10 flex items-center justify-center border-primary/30 hover:border-primary/60 transition-colors"
        >
          <ArrowDownUp className="h-4 w-4" />
        </button>
      </div>

      {/* To Token */}
      <div className="glass-card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>To</span>
          <span>Balance: 0.00</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="0.0"
            value={toAmount}
            onChange={(e) => setToAmount(e.target.value)}
            className="border-0 bg-transparent text-2xl font-mono focus:outline-none focus:ring-0 flex-1 w-full"
          />
          <button className="glass-card px-3 py-2 h-auto flex items-center gap-2 hover:border-primary/40 transition-colors">
            <span className="font-semibold">{toToken}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="glass-card p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Price Impact</p>
          <p className="text-sm font-mono text-primary">{"<0.01%"}</p>
        </div>
        <div className="glass-card p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Network Fee</p>
          <p className="text-sm font-mono">~$2.50</p>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={!isConnected || !shieldSwap.canSetOrder || shieldSwap.isSubmitting || !fromAmount}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg glow-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {shieldSwap.isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : !isConnected ? (
          "Connect Wallet"
        ) : (
          <>
            <Shield className="h-5 w-5" />
            Place Encrypted Order
          </>
        )}
      </button>

      {/* Decrypt Button */}
      {shieldSwap.canDecrypt && (
        <button
          onClick={shieldSwap.decryptOrderHandles}
          disabled={!shieldSwap.canDecrypt}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {shieldSwap.isDecrypted
            ? `Decrypted: from=${String(shieldSwap.clear?.from)} to=${String(shieldSwap.clear?.to)}`
            : "Decrypt Order"}
        </button>
      )}

      <p className="text-xs text-center text-muted-foreground">
        {shieldSwap.message || "Your order details are encrypted until matching completes"}
      </p>
    </div>
  );
}
