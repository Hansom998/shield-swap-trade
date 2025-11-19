import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ConnectWalletTopRight } from "@/components/ConnectWalletTopRight";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Shield Swap - Private Encrypted Trading",
  description: "Trade with complete privacy using fully homomorphic encryption. Protected against MEV attacks and front-running.",
  keywords: ["DeFi", "Privacy", "Encryption", "FHEVM", "MEV Protection", "Private Trading"],
  authors: [{ name: "Shield Swap Team" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen">
        <Providers>
          <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="glass-card p-2">
                    <Shield className="h-8 w-8 text-primary animate-pulse-glow" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold glow-text">Shield Swap</h1>
                    <p className="text-xs text-muted-foreground">Private. Encrypted. Protected.</p>
                  </div>
                </div>
                <ConnectWalletTopRight />
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
