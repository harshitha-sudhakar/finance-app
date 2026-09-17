"use client";

import { ForecastChart } from "@/components/forecast-chart";
import { HorizonSwitch } from "@/components/horizon-switch";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFinance } from "@/lib/finance-context";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ArrowRight, CircleAlert, CircleCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function budgetCategory(name: string) {
  const value = name.toLowerCase();
  if (/rent|mortgage|home|apartment/.test(value)) return "Housing";
  if (/electric|water|utility|utilities|internet|phone|gas/.test(value)) return "Utilities";
  if (/car|auto|metro|transit|bus|train|transport|parking/.test(value)) return "Transportation";
  if (/loan|debt|credit/.test(value)) return "Debt payments";
  if (/insurance|medical|health|prescription/.test(value)) return "Health & insurance";
  return "Other bills";
}

function recurrenceMultiplier(recurrence: string, horizonDays: number) {
  if (recurrence === "weekly") return Math.ceil(horizonDays / 7);
  if (recurrence === "biweekly") return Math.ceil(horizonDays / 14);
  if (recurrence === "monthly") return Math.ceil(horizonDays / 30);
  return 1;
}

export default function DashboardPage() {
  const { profile, forecast, updateSettings } = useFinance();
  const [monthlyMisc, setMonthlyMisc] = useState(String(Math.round(profile.settings.dailySpendEstimate * 30)));

  const expectedIncome = forecast.days.reduce((sum, day) => sum + day.inflows, 0);
  const upcomingExpenses = forecast.days.reduce((sum, day) => sum + day.outflows, 0);
  const amountNeeded = Math.max(0, -forecast.minExpected);

  const categories = new Map<string, number>();
  for (const item of profile.obligations) {
    const amount = item.amount * item.certainty * recurrenceMultiplier(item.recurrence, forecast.horizonDays);
    const category = budgetCategory(item.name);
    categories.set(category, (categories.get(category) ?? 0) + amount);
  }
  const miscellaneous = profile.settings.dailySpendEstimate * forecast.horizonDays;
  const budget = [...categories.entries(), ["Miscellaneous", miscellaneous] as [string, number]].filter(
    ([, amount]) => amount > 0,
  );
  const budgetTotal = budget.reduce((sum, [, amount]) => sum + amount, 0);

  const isShort = amountNeeded > 0;

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl tracking-tight">Your next {forecast.horizonDays} days</h1>
        </div>
        <HorizonSwitch />
      </div>

      <Card className={cn("overflow-hidden", isShort ? "border-destructive/30" : "border-primary/25")}>
        <CardContent className="grid gap-8 p-6 lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
          <div className="flex flex-col justify-between gap-7">
            <div>
              <div className={cn("mb-4 flex size-10 items-center justify-center rounded-full", isShort ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                {isShort ? <CircleAlert className="size-5" /> : <CircleCheck className="size-5" />}
              </div>
              <p className="text-sm font-medium text-muted-foreground">Forecast status</p>
              <p className="mt-2 font-heading text-3xl leading-tight">
                {isShort ? `${formatMoney(amountNeeded)} needed to stay above $0` : "No projected shortfall"}
              </p>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                {isShort
                  ? "This combines your available balance, expected income, recurring bills, and miscellaneous spending."
                  : "Your expected income covers your listed bills and spending across this forecast window."}
              </p>
            </div>
            <Link href="/sandbox" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
              Test a change <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="min-w-0 border-t pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl">Projected balance</h2>
              <Link href="/forecast" className="text-sm font-medium text-primary hover:underline">Details</Link>
            </div>
            <ForecastChart forecast={forecast} />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <h2 className="font-heading text-2xl">Money at a glance</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="Current balance" value={formatMoney(forecast.startingCash)} />
          <Stat label="Expected income" value={formatMoney(expectedIncome)} />
          <Stat label="Upcoming expenses" value={formatMoney(upcomingExpenses)} />
        </div>
      </section>

      <Card className="max-w-4xl">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle>Planned spending for the next {forecast.horizonDays} days</CardTitle>
          <div className="text-right">
            <p className="font-mono text-sm font-medium">{formatMoney(budgetTotal)}</p>
            <p className="text-xs text-muted-foreground">Estimated total</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {budget.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add obligations to generate a budget.</p>
          ) : (
            budget.map(([category, amount]) => {
              const percent = budgetTotal > 0 ? Math.round((amount / budgetTotal) * 100) : 0;
              return (
                <div key={category} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>{category}</span>
                    <span className="font-mono">{formatMoney(amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })
          )}
          <label className="grid gap-2 border-t pt-4 text-sm sm:grid-cols-[1fr_140px] sm:items-center">
            <span>Miscellaneous per month</span>
            <Input
              inputMode="decimal"
              value={monthlyMisc}
              onChange={(event) => setMonthlyMisc(event.target.value)}
              onBlur={() => {
                const amount = Number(monthlyMisc);
                if (Number.isFinite(amount) && amount >= 0) updateSettings({ dailySpendEstimate: amount / 30 });
                else setMonthlyMisc(String(Math.round(profile.settings.dailySpendEstimate * 30)));
              }}
            />
          </label>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-2xl">Financial data</h2>
          <Link href="/pipeline" className="text-sm font-medium text-primary hover:underline">View data pipeline</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Accounts" href="/accounts" action="Manage accounts">
          {profile.accounts.slice(0, 4).map((account) => (
            <Row key={account.id} label={account.name} amount={account.balance} />
          ))}
          {profile.accounts.length === 0 ? <Empty>No accounts yet.</Empty> : null}
        </SummaryCard>
        <SummaryCard title="Income" href="/income" action="Manage income">
          {profile.incomeEvents.slice(0, 4).map((event) => (
            <Row key={event.id} label={event.source} amount={event.amount} />
          ))}
          {profile.incomeEvents.length === 0 ? <Empty>No income yet.</Empty> : null}
        </SummaryCard>
        <SummaryCard title="Obligations" href="/obligations" action="Manage obligations">
          {profile.obligations.slice(0, 4).map((item) => (
            <Row key={item.id} label={item.name} amount={item.amount} />
          ))}
          {profile.obligations.length === 0 ? <Empty>No obligations yet.</Empty> : null}
        </SummaryCard>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card/70">
      <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent className="font-heading text-3xl">{value}</CardContent>
    </Card>
  );
}

function SummaryCard({ title, href, action, children }: { title: string; href: string; action: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-2">
        {children}
        <Link href={href} className={cn(buttonVariants({ variant: "outline" }), "mt-2")}>{action} <ArrowRight className="size-4" /></Link>
      </CardContent>
    </Card>
  );
}

function Row({ label, amount }: { label: string; amount: number }) {
  return <div className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{label}</span><span className="font-mono">{formatMoney(amount, true)}</span></div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
