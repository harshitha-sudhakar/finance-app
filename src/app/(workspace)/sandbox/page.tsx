"use client";

import { Field } from "@/components/field";
import { ForecastChart } from "@/components/forecast-chart";
import { HorizonSwitch } from "@/components/horizon-switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { todayISO } from "@/lib/dates";
import { applyWhatIf, buildForecast } from "@/lib/forecast";
import { useFinance } from "@/lib/finance-context";
import { formatMoney } from "@/lib/money";
import { useMemo, useState } from "react";

export default function SandboxPage() {
  const { profile, forecast } = useFinance();
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayISO());
  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(todayISO());
  const [useExpense, setUseExpense] = useState(false);
  const [useIncome, setUseIncome] = useState(false);

  const scenario = useMemo(() => {
    const next = applyWhatIf(
      {
        accounts: profile.accounts,
        incomeEvents: profile.incomeEvents,
        obligations: profile.obligations,
      },
      {
        extraExpense: useExpense
          ? { name: expenseName || "What-if expense", amount: Number(expenseAmount) || 0, date: expenseDate }
          : undefined,
        extraIncome: useIncome
          ? { source: incomeName || "What-if income", amount: Number(incomeAmount) || 0, date: incomeDate }
          : undefined,
      },
    );
    return buildForecast({
      ...next,
      horizonDays: profile.settings.horizonDays,
      comfortBuffer: profile.settings.comfortBuffer,
      dailySpendEstimate: profile.settings.dailySpendEstimate,
    });
  }, [
    expenseAmount,
    expenseDate,
    expenseName,
    incomeAmount,
    incomeDate,
    incomeName,
    profile,
    useExpense,
    useIncome,
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">Experiment</h1>
        </div>
        <HorizonSwitch />
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Changes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={useExpense} onChange={(event) => setUseExpense(event.target.checked)} />
              Extra expense
            </label>
            {useExpense ? (
              <>
                <Field label="Name">
                  <Input value={expenseName} onChange={(event) => setExpenseName(event.target.value)} />
                </Field>
                <Field label="Amount">
                  <Input value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} />
                </Field>
                <Field label="Date">
                  <Input type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} />
                </Field>
              </>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={useIncome} onChange={(event) => setUseIncome(event.target.checked)} />
              Extra income
            </label>
            {useIncome ? (
              <>
                <Field label="Source">
                  <Input value={incomeName} onChange={(event) => setIncomeName(event.target.value)} />
                </Field>
                <Field label="Amount">
                  <Input value={incomeAmount} onChange={(event) => setIncomeAmount(event.target.value)} />
                </Field>
                <Field label="Date">
                  <Input type="date" value={incomeDate} onChange={(event) => setIncomeDate(event.target.value)} />
                </Field>
              </>
            ) : null}
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardDescription>Current ending balance</CardDescription>
                <CardTitle>{formatMoney(forecast.endingExpected)}</CardTitle>
              </CardHeader>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardDescription>Ending balance with changes</CardDescription>
                <CardTitle>{formatMoney(scenario.endingExpected)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Balance over time</CardTitle>
            </CardHeader>
            <CardContent>
              <ForecastChart forecast={scenario} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
