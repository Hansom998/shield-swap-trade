"use client";

import { TrendingUp, Activity, Shield } from "lucide-react";

export function StatsPanel() {
  const stats = [
    {
      label: "24h Volume",
      value: "$12.4M",
      change: "+15.3%",
      icon: TrendingUp,
      positive: true,
    },
    {
      label: "Active Orders",
      value: "2,847",
      change: "+234",
      icon: Activity,
      positive: true,
    },
    {
      label: "Protected Trades",
      value: "100%",
      change: "MEV Safe",
      icon: Shield,
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card glass-card-hover p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold font-mono">{stat.value}</p>
              <p
                className={`text-xs ${stat.positive ? "text-green-500" : "text-red-500"}`}
              >
                {stat.change}
              </p>
            </div>
            <div className="glass-card p-3 rounded-lg">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
