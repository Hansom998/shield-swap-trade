"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Shield } from "lucide-react";

export function ConnectWalletTopRight() {
  return (
    <div className="flex items-center justify-end gap-3">
      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-primary animate-pulse-glow" />
        <span>Encrypted Swaps</span>
      </div>
      <ConnectButton
        label="Connect Wallet"
        accountStatus={{
          smallScreen: "avatar",
          largeScreen: "full",
        }}
        chainStatus={{
          smallScreen: "icon",
          largeScreen: "full",
        }}
        showBalance={{
          smallScreen: false,
          largeScreen: true,
        }}
      />
    </div>
  );
}
