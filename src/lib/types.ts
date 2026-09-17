export type HorizonDays = 30 | 60 | 90;

export type Recurrence = "none" | "weekly" | "biweekly" | "monthly";

export type AccountType = "checking" | "savings" | "cash" | "credit";

export type AuthProvider = "demo" | "local" | "firebase";

export type SessionUser = {
  uid: string;
  email: string;
  displayName: string;
  provider: AuthProvider;
};

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  institution: string;
  nessieAccountId?: string;
};

export type IncomeEvent = {
  id: string;
  source: string;
  amount: number;
  date: string;
  recurrence: Recurrence;
  certainty: number;
  nessieDepositId?: string;
};

export type Obligation = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  recurrence: Recurrence;
  certainty: number;
  nessieBillId?: string;
};

export type UserSettings = {
  horizonDays: HorizonDays;
  comfortBuffer: number;
  nessieCustomerId?: string;
  lastNessieImportAt?: string;
  dailySpendEstimate: number;
};

export type UserProfile = {
  accounts: Account[];
  incomeEvents: IncomeEvent[];
  obligations: Obligation[];
  settings: UserSettings;
};

export type ForecastDay = {
  date: string;
  label: string;
  expected: number;
  lower: number;
  upper: number;
  inflows: number;
  outflows: number;
  events: string[];
  shortfall: boolean;
  belowBuffer: boolean;
};

export type ForecastResult = {
  horizonDays: HorizonDays;
  startingCash: number;
  endingExpected: number;
  endingLower: number;
  minExpected: number;
  minLower: number;
  shortfallDates: string[];
  firstShortfallDate: string | null;
  bufferDates: string[];
  days: ForecastDay[];
  narrative: string;
};

export type NessieDomainStatus = "fulfilled" | "rejected" | "empty" | "fixture";

export type NessieSnapshot = {
  source: "nessie" | "fixture";
  fetchedAt: string;
  warning?: string;
  customerId: string;
  domains: {
    customer: NessieDomainStatus;
    accounts: NessieDomainStatus;
    bills: NessieDomainStatus;
    deposits: NessieDomainStatus;
    purchases: NessieDomainStatus;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    address: string;
  } | null;
  accounts: Array<{
    id: string;
    type: string;
    nickname: string;
    balance: number;
    rewards: number;
    customerId: string;
  }>;
  bills: Array<{
    id: string;
    accountId: string;
    status: string;
    payee: string;
    nickname?: string;
    paymentDate: string;
    recurringDate?: number;
    paymentAmount: number;
  }>;
  deposits: Array<{
    id: string;
    accountId: string;
    type: string;
    transactionDate: string;
    status: string;
    amount: number;
    description?: string;
  }>;
  purchases: Array<{
    id: string;
    accountId: string;
    merchantId?: string;
    purchaseDate: string;
    amount: number;
    status: string;
    description?: string;
  }>;
};

export type MappedNessieImport = {
  accounts: Account[];
  incomeEvents: IncomeEvent[];
  obligations: Obligation[];
  dailySpendEstimate: number;
  nessieCustomerId: string;
};
