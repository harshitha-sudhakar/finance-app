import { daysFromNow } from "@/lib/dates";
import { createId } from "@/lib/ids";
import type { SessionUser, UserProfile } from "@/lib/types";

export const DEMO_USER: SessionUser = {
  uid: "demo-taylor",
  email: "taylor@runway.demo",
  displayName: "Taylor Brooks",
  provider: "demo",
};

export function emptySettings(): UserProfile["settings"] {
  return {
    horizonDays: 30,
    comfortBuffer: 250,
    dailySpendEstimate: 0,
  };
}

export function emptyProfile(): UserProfile {
  return {
    accounts: [],
    incomeEvents: [],
    obligations: [],
    settings: emptySettings(),
  };
}

export function demoProfile(): UserProfile {
  return {
    accounts: [
      {
        id: createId("acct"),
        name: "Everyday Checking",
        type: "checking",
        balance: 1140,
        institution: "Capital One",
      },
      {
        id: createId("acct"),
        name: "Emergency Savings",
        type: "savings",
        balance: 380,
        institution: "Capital One",
      },
    ],
    incomeEvents: [
      {
        id: createId("inc"),
        source: "Northwind payroll",
        amount: 2900,
        date: daysFromNow(16),
        recurrence: "biweekly",
        certainty: 1,
      },
      {
        id: createId("inc"),
        source: "Freelance invoice — Studio Birch",
        amount: 1100,
        date: daysFromNow(24),
        recurrence: "none",
        certainty: 0.55,
      },
    ],
    obligations: [
      {
        id: createId("obl"),
        name: "Metro pass",
        amount: 127,
        dueDate: daysFromNow(2),
        recurrence: "monthly",
        certainty: 1,
      },
      {
        id: createId("obl"),
        name: "Rent — Oak Court",
        amount: 1675,
        dueDate: daysFromNow(5),
        recurrence: "monthly",
        certainty: 1,
      },
      {
        id: createId("obl"),
        name: "Utilities",
        amount: 142,
        dueDate: daysFromNow(9),
        recurrence: "monthly",
        certainty: 1,
      },
      {
        id: createId("obl"),
        name: "Phone",
        amount: 78,
        dueDate: daysFromNow(12),
        recurrence: "monthly",
        certainty: 1,
      },
      {
        id: createId("obl"),
        name: "Student loan",
        amount: 265,
        dueDate: daysFromNow(20),
        recurrence: "monthly",
        certainty: 1,
      },
    ],
    settings: {
      horizonDays: 30,
      comfortBuffer: 250,
      dailySpendEstimate: 18,
      nessieCustomerId: "fixture-customer-taylor",
    },
  };
}
