import { StatsPanel } from "@/components/StatsPanel";
import { SwapCard } from "@/components/SwapCard";
import { OrdersPanel } from "@/components/OrdersPanel";
import { Shield, Lock, Eye } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary animate-pulse-glow" />
          <h1 className="text-4xl font-bold glow-text">Shield Swap</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Trade with complete privacy using fully homomorphic encryption. 
          Your orders remain encrypted until execution, protecting against MEV and front-running.
        </p>
      </div>

      {/* Stats Section */}
      <StatsPanel />

      {/* Main Trading Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Interface */}
        <div className="lg:col-span-2">
          <SwapCard />
        </div>

        {/* Orders Panel */}
        <div className="lg:col-span-1">
          <OrdersPanel />
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card glass-card-hover p-6 text-center space-y-3">
          <Lock className="h-8 w-8 text-primary mx-auto animate-float" />
          <h3 className="text-lg font-semibold">Encrypted Orders</h3>
          <p className="text-sm text-muted-foreground">
            All order details are encrypted using FHEVM technology
          </p>
        </div>
        
        <div className="glass-card glass-card-hover p-6 text-center space-y-3">
          <Shield className="h-8 w-8 text-primary mx-auto animate-float" style={{animationDelay: "0.5s"}}>
          </Shield>
          <h3 className="text-lg font-semibold">MEV Protection</h3>
          <p className="text-sm text-muted-foreground">
            Protected against front-running and sandwich attacks
          </p>
        </div>
        
        <div className="glass-card glass-card-hover p-6 text-center space-y-3">
          <Eye className="h-8 w-8 text-primary mx-auto animate-float" style={{animationDelay: "1s"}}>
          </Eye>
          <h3 className="text-lg font-semibold">Private Trading</h3>
          <p className="text-sm text-muted-foreground">
            Keep your trading strategy completely confidential
          </p>
        </div>
      </div>
    </div>
  );
}
