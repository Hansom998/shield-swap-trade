"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type OperationLogType =
  | "offer_create"
  | "decrypt"
  | "info"
  | "error";

export type OperationLogEntry = {
  id: string;
  timestamp: number; // epoch ms
  type: OperationLogType;
  title: string;
  details?: string;
};

type OperationLogContextType = {
  logs: OperationLogEntry[];
  add: (e: Omit<OperationLogEntry, "id" | "timestamp"> & { timestamp?: number }) => void;
  clear: () => void;
};

const OperationLogContext = createContext<OperationLogContextType | undefined>(
  undefined
);

export function OperationLogProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<OperationLogEntry[]>([]);

  const add = useCallback(
    (e: Omit<OperationLogEntry, "id" | "timestamp"> & { timestamp?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timestamp = e.timestamp ?? Date.now();
      setLogs((prev) => [{ id, timestamp, type: e.type, title: e.title, details: e.details }, ...prev].slice(0, 100));
    },
    []
  );

  const clear = useCallback(() => setLogs([]), []);

  const value = useMemo(() => ({ logs, add, clear }), [logs, add, clear]);

  return (
    <OperationLogContext.Provider value={value}>{children}</OperationLogContext.Provider>
  );
}

export function useOperationLog() {
  const ctx = useContext(OperationLogContext);
  if (!ctx) throw new Error("useOperationLog must be used within OperationLogProvider");
  return ctx;
}

