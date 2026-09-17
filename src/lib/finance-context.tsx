"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { buildForecast } from "@/lib/forecast";
import { emptyProfile } from "@/lib/seed";
import {
  addAccount,
  addIncome,
  addObligation,
  deleteAccount,
  deleteIncome,
  deleteObligation,
  getServerSnapshot,
  getSnapshot,
  replaceFromNessie,
  resetDemo,
  subscribe,
  updateSettings,
} from "@/lib/store";
import type { Account, ForecastResult, HorizonDays, IncomeEvent, Obligation, UserProfile } from "@/lib/types";

type FinanceContextValue = {
  profile: UserProfile;
  forecast: ForecastResult;
  addAccount: typeof addAccount;
  addIncome: typeof addIncome;
  addObligation: typeof addObligation;
  deleteAccount: typeof deleteAccount;
  deleteIncome: typeof deleteIncome;
  deleteObligation: typeof deleteObligation;
  updateSettings: typeof updateSettings;
  setHorizon: (horizon: HorizonDays) => void;
  importNessie: typeof replaceFromNessie;
  resetDemo: typeof resetDemo;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const db = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const profile = db.session ? db.profiles[db.session.uid] ?? emptyProfile() : emptyProfile();

  const value = useMemo<FinanceContextValue>(() => {
    const forecast = buildForecast({
      accounts: profile.accounts,
      incomeEvents: profile.incomeEvents,
      obligations: profile.obligations,
      horizonDays: profile.settings.horizonDays,
      comfortBuffer: profile.settings.comfortBuffer,
      dailySpendEstimate: profile.settings.dailySpendEstimate,
    });
    return {
      profile,
      forecast,
      addAccount,
      addIncome,
      addObligation,
      deleteAccount,
      deleteIncome,
      deleteObligation,
      updateSettings,
      setHorizon: (horizonDays) => updateSettings({ horizonDays }),
      importNessie: replaceFromNessie,
      resetDemo,
    };
  }, [profile]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance must be used within FinanceProvider");
  return value;
}

export type { Account, IncomeEvent, Obligation };
