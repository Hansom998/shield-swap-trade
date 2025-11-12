"use client";

import { Shield, Lock } from "lucide-react";
import { useOperationLog } from "@/hooks/useOperationLog";

interface Order {
  id: string;
  status: "pending" | "matched" | "completed";
  timestamp: string;
  type: string;
}

export function OrdersPanel() {
  const { logs } = useOperationLog();

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-500";
      case "matched":
        return "text-primary";
      case "completed":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  // Convert logs to orders for display
  const orders: Order[] = logs
    .filter((log) => log.type === "offer_create" || log.type === "decrypt")
    .slice(0, 5)
    .map((log) => ({
      id: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
      status:
        log.type === "decrypt"
          ? "completed"
          : log.title.includes("Submitted")
            ? "matched"
            : "pending",
      timestamp: new Date(log.timestamp).toLocaleTimeString(),
      type: log.type,
    }));

  return (
    <div className="glass-card glass-card-hover p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Encrypted Orders</h2>
        <Lock className="h-5 w-5 text-primary" />
      </div>

      <div className="space-y-3">
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <div
              key={index}
              className="glass-card p-4 space-y-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary animate-pulse-glow" />
                  <span className="font-mono text-sm">{order.id}</span>
                </div>
                <span
                  className={`text-xs font-semibold uppercase ${getStatusColor(order.status)}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Order details encrypted</span>
                <span>{order.timestamp}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No encrypted orders yet</p>
            <p className="text-xs mt-1">
              Your orders will appear here once placed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
