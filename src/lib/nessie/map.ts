import { daysFromNow } from "@/lib/dates";
import { createId } from "@/lib/ids";
import type {
  Account,
  AccountType,
  IncomeEvent,
  MappedNessieImport,
  NessieSnapshot,
  Obligation,
  Recurrence,
} from "@/lib/types";

function mapAccountType(type: string): AccountType {
  const normalized = type.toLowerCase();
  if (normalized.includes("saving")) return "savings";
  if (normalized.includes("credit")) return "credit";
  if (normalized.includes("cash") || normalized.includes("money")) return "cash";
  return "checking";
}

function inferRecurrence(label: string, recurringDate?: number, status?: string): Recurrence {
  if (status === "recurring" || typeof recurringDate === "number") return "monthly";
  if (/payroll|salary|paycheck/i.test(label)) return "biweekly";
  if (/weekly/i.test(label)) return "weekly";
  return "none";
}

function nextOccurrenceFromDayOfMonth(day: number | undefined, fallbackISO: string): string {
  if (!day) return fallbackISO || daysFromNow(7);
  const today = new Date();
  const candidate = new Date(today.getFullYear(), today.getMonth(), day);
  candidate.setHours(0, 0, 0, 0);
  if (candidate < today) candidate.setMonth(candidate.getMonth() + 1);
  const year = candidate.getFullYear();
  const month = String(candidate.getMonth() + 1).padStart(2, "0");
  const date = String(candidate.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export function mapNessieSnapshot(snapshot: NessieSnapshot): MappedNessieImport {
  const accounts: Account[] = snapshot.accounts.map((account) => ({
    id: createId("acct"),
    name: account.nickname || account.type,
    type: mapAccountType(account.type),
    balance: account.balance,
    institution: "Capital One (Nessie)",
    nessieAccountId: account.id,
  }));

  const obligations: Obligation[] = snapshot.bills.map((bill) => ({
    id: createId("obl"),
    name: bill.nickname || bill.payee,
    amount: bill.paymentAmount,
    dueDate: nextOccurrenceFromDayOfMonth(bill.recurringDate, bill.paymentDate),
    recurrence: inferRecurrence(bill.payee, bill.recurringDate, bill.status),
    certainty: 1,
    nessieBillId: bill.id,
  }));

  const depositsByDescription = new Map<string, typeof snapshot.deposits>();
  for (const deposit of snapshot.deposits) {
    const key = (deposit.description || deposit.type).toUpperCase();
    const list = depositsByDescription.get(key) ?? [];
    list.push(deposit);
    depositsByDescription.set(key, list);
  }

  const incomeEvents: IncomeEvent[] = [];
  for (const [label, deposits] of depositsByDescription) {
    const newest = [...deposits].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))[0];
    if (!newest) continue;
    const dates = deposits
      .map((item) => new Date(item.transactionDate).getTime())
      .sort((a, b) => a - b);
    let recurrence: Recurrence = "none";
    if (dates.length >= 2) {
      const gapDays = Math.round((dates[dates.length - 1]! - dates[dates.length - 2]!) / 86_400_000);
      if (gapDays >= 12 && gapDays <= 16) recurrence = "biweekly";
      else if (gapDays >= 6 && gapDays <= 8) recurrence = "weekly";
      else if (gapDays >= 27 && gapDays <= 33) recurrence = "monthly";
    }
    incomeEvents.push({
      id: createId("inc"),
      source: newest.description || label,
      amount: newest.amount,
      date: recurrence === "none" ? newest.transactionDate.slice(0, 10) : daysFromNow(16),
      recurrence,
      certainty: /payroll|salary/i.test(label) ? 1 : 0.7,
      nessieDepositId: newest.id,
    });
  }

  const purchaseTotal = snapshot.purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const uniqueDays = new Set(snapshot.purchases.map((purchase) => purchase.purchaseDate.slice(0, 10)));
  const dailySpendEstimate =
    uniqueDays.size > 0 ? Math.round((purchaseTotal / uniqueDays.size) * 100) / 100 : 0;

  return {
    accounts,
    incomeEvents,
    obligations,
    dailySpendEstimate,
    nessieCustomerId: snapshot.customerId,
  };
}
