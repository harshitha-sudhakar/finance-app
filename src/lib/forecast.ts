import { addDays, formatLongDate, parseISODate, startOfDay, toISODate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type {
  Account,
  ForecastDay,
  ForecastResult,
  HorizonDays,
  IncomeEvent,
  Obligation,
  Recurrence,
} from "@/lib/types";

function addRecurrence(date: Date, recurrence: Recurrence): Date {
  const next = new Date(date);
  if (recurrence === "weekly") next.setDate(next.getDate() + 7);
  else if (recurrence === "biweekly") next.setDate(next.getDate() + 14);
  else if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 100);
  return startOfDay(next);
}

function occurrences(
  startISO: string,
  recurrence: Recurrence,
  asOf: Date,
  horizonEnd: Date,
): Date[] {
  let cursor = startOfDay(parseISODate(startISO));
  let guard = 0;

  while (cursor < asOf && recurrence !== "none" && guard < 400) {
    cursor = addRecurrence(cursor, recurrence);
    guard += 1;
  }

  const dates: Date[] = [];
  while (cursor <= horizonEnd && guard < 800) {
    if (cursor >= asOf) dates.push(new Date(cursor));
    if (recurrence === "none") break;
    cursor = addRecurrence(cursor, recurrence);
    guard += 1;
  }
  return dates;
}

export function liquidCash(accounts: Account[]): number {
  return accounts
    .filter((account) => account.type !== "credit")
    .reduce((sum, account) => sum + account.balance, 0);
}

export function buildForecast(input: {
  accounts: Account[];
  incomeEvents: IncomeEvent[];
  obligations: Obligation[];
  horizonDays: HorizonDays;
  comfortBuffer: number;
  dailySpendEstimate?: number;
  asOf?: Date;
}): ForecastResult {
  const asOf = startOfDay(input.asOf ?? new Date());
  const horizonEnd = addDays(asOf, input.horizonDays - 1);
  const startingCash = liquidCash(input.accounts);
  const dailySpend = Math.max(0, input.dailySpendEstimate ?? 0);

  const inflowsByDate = new Map<string, { amount: number; certain: number; full: number; labels: string[] }>();
  const outflowsByDate = new Map<string, { amount: number; certain: number; full: number; labels: string[] }>();

  for (const event of input.incomeEvents) {
    for (const date of occurrences(event.date, event.recurrence, asOf, horizonEnd)) {
      const key = toISODate(date);
      const current = inflowsByDate.get(key) ?? { amount: 0, certain: 0, full: 0, labels: [] };
      const expected = event.amount * event.certainty;
      const certain = event.certainty >= 0.95 ? event.amount : 0;
      current.amount += expected;
      current.certain += certain;
      current.full += event.amount;
      current.labels.push(`${event.source} ${formatMoney(event.amount)}`);
      inflowsByDate.set(key, current);
    }
  }

  for (const bill of input.obligations) {
    for (const date of occurrences(bill.dueDate, bill.recurrence, asOf, horizonEnd)) {
      const key = toISODate(date);
      const current = outflowsByDate.get(key) ?? { amount: 0, certain: 0, full: 0, labels: [] };
      current.amount += bill.amount * bill.certainty;
      current.certain += bill.amount;
      current.full += bill.amount;
      current.labels.push(`${bill.name} ${formatMoney(bill.amount)}`);
      outflowsByDate.set(key, current);
    }
  }

  const days: ForecastDay[] = [];
  let expected = startingCash;
  let lower = startingCash;
  let upper = startingCash;
  let minExpected = startingCash;
  let minLower = startingCash;
  const shortfallDates: string[] = [];
  const bufferDates: string[] = [];

  for (let offset = 0; offset < input.horizonDays; offset += 1) {
    const date = addDays(asOf, offset);
    const key = toISODate(date);
    const inflow = inflowsByDate.get(key);
    const outflow = outflowsByDate.get(key);
    const expectedIn = inflow?.amount ?? 0;
    const expectedOut = (outflow?.amount ?? 0) + dailySpend;
    const lowerIn = inflow?.certain ?? 0;
    const lowerOut = (outflow?.certain ?? 0) + dailySpend;
    const upperIn = inflow?.full ?? 0;
    const upperOut = (outflow?.amount ?? 0) + dailySpend * 0.6;

    expected += expectedIn - expectedOut;
    lower += lowerIn - lowerOut;
    upper += upperIn - upperOut;
    minExpected = Math.min(minExpected, expected);
    minLower = Math.min(minLower, lower);

    const shortfall = lower < 0;
    const belowBuffer = expected < input.comfortBuffer;
    if (shortfall) shortfallDates.push(key);
    if (belowBuffer) bufferDates.push(key);

    const events = [...(inflow?.labels ?? []), ...(outflow?.labels ?? [])];
    if (dailySpend > 0) events.push(`Daily spend ${formatMoney(dailySpend)}`);

    days.push({
      date: key,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      expected,
      lower,
      upper,
      inflows: expectedIn,
      outflows: expectedOut,
      events,
      shortfall,
      belowBuffer,
    });
  }

  const firstShortfallDate = shortfallDates[0] ?? null;
  const endingExpected = days.at(-1)?.expected ?? startingCash;
  const endingLower = days.at(-1)?.lower ?? startingCash;

  let narrative = `Starting from ${formatMoney(startingCash)} of liquid cash, the expected balance in ${input.horizonDays} days is ${formatMoney(endingExpected)}.`;
  if (firstShortfallDate) {
    narrative += ` The lower-confidence path crosses below zero on ${formatLongDate(firstShortfallDate)} — a timing gap, not necessarily insolvency.`;
  } else if (bufferDates[0]) {
    narrative += ` No zero-balance shortfall, but expected cash dips below the ${formatMoney(input.comfortBuffer)} comfort buffer on ${formatLongDate(bufferDates[0])}.`;
  } else {
    narrative += " No projected shortfall during this period.";
  }

  return {
    horizonDays: input.horizonDays,
    startingCash,
    endingExpected,
    endingLower,
    minExpected,
    minLower,
    shortfallDates,
    firstShortfallDate,
    bufferDates,
    days,
    narrative,
  };
}

export function applyWhatIf(
  base: {
    accounts: Account[];
    incomeEvents: IncomeEvent[];
    obligations: Obligation[];
  },
  scenario: {
    extraIncome?: { source: string; amount: number; date: string };
    extraExpense?: { name: string; amount: number; date: string };
  },
) {
  return {
    accounts: base.accounts,
    incomeEvents: scenario.extraIncome
      ? [
          ...base.incomeEvents,
          {
            id: "whatif-income",
            source: scenario.extraIncome.source,
            amount: scenario.extraIncome.amount,
            date: scenario.extraIncome.date,
            recurrence: "none" as const,
            certainty: 1,
          },
        ]
      : base.incomeEvents,
    obligations: scenario.extraExpense
      ? [
          ...base.obligations,
          {
            id: "whatif-expense",
            name: scenario.extraExpense.name,
            amount: scenario.extraExpense.amount,
            dueDate: scenario.extraExpense.date,
            recurrence: "none" as const,
            certainty: 1,
          },
        ]
      : base.obligations,
  };
}
