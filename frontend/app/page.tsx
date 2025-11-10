import { StatsPanel } from "@/components/StatsPanel";
import { SwapCard } from "@/components/SwapCard";
import { OrdersPanel } from "@/components/OrdersPanel";

export default function Home() {
  return (
    <div className="space-y-8">
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

      {/* Info Banner */}
      <div className="glass-card glass-card-hover p-6 text-center space-y-2">
        <h3 className="text-lg font-semibold glow-text">Protected Trading</h3>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          All orders are encrypted until matching completes. Your trading strategy stays private,
          preventing MEV attacks and copy trading.
        </p>
      </div>
    </div>
  );
}
