"use client";

import { TrendingUp, Activity, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";

export function StatsPanel() {
  const [animatedValues, setAnimatedValues] = useState({
    volume: 0,
    orders: 0,
    users: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValues({
        volume: 12.4,
        orders: 2847,
        users: 1234,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      label: "24h Volume",
      value: `$${animatedValues.volume.toFixed(1)}M`,
      change: "+15.3%",
      icon: TrendingUp,
      positive: true,
    },
    {
      label: "Active Orders",
      value: animatedValues.orders.toLocaleString(),
      change: "+234",
      icon: Activity,
      positive: true,
    },
    {
      label: "Active Users",
      value: animatedValues.users.toLocaleString(),
      change: "+89",
      icon: Users,
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className="glass-card glass-card-hover p-6 animate-float"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold font-mono transition-all duration-1000">
                {stat.value}
              </p>
              <p
                className={`text-xs ${stat.positive ? "text-green-500" : "text-red-500"}`}
              >
                {stat.change}
              </p>
            </div>
            <div className="glass-card p-3 rounded-lg">
              <stat.icon className="h-5 w-5 text-primary animate-pulse-glow" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
