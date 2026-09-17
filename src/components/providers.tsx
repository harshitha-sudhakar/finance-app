"use client";

import { AuthProvider } from "@/lib/auth-context";
import { FinanceProvider } from "@/lib/finance-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FinanceProvider>{children}</FinanceProvider>
    </AuthProvider>
  );
}
