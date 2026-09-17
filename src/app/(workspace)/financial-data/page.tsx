"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/lib/finance-context";
import { formatMoney } from "@/lib/money";
import { Activity, ArrowRight, Landmark, Wallet } from "lucide-react";
import Link from "next/link";

const sections = [
  {
    href: "/accounts",
    title: "Accounts",
    action: "Manage accounts",
    icon: Landmark,
  },
  {
    href: "/income",
    title: "Income",
    action: "Log income",
    icon: Wallet,
  },
  {
    href: "/obligations",
    title: "Obligations",
    action: "Add obligations",
    icon: Activity,
  },
];

export default function FinancialDataPage() {
  const { profile } = useFinance();
  const accountTotal = profile.accounts.reduce((sum, account) => {
    return account.type === "credit" ? sum : sum + account.balance;
  }, 0);

  const details: Record<string, string> = {
    Accounts: `${profile.accounts.length} saved · ${formatMoney(accountTotal)} available`,
    Income: `${profile.incomeEvents.length} income ${profile.incomeEvents.length === 1 ? "entry" : "entries"}`,
    Obligations: `${profile.obligations.length} ${profile.obligations.length === 1 ? "obligation" : "obligations"}`,
  };

  return (
    <div className="grid gap-6">
      <h1 className="font-heading text-3xl tracking-tight">Financial data</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/45 group-hover:bg-accent/35">
                <CardHeader className="flex-row items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <p className="text-sm text-muted-foreground">{details[section.title]}</p>
                  <span className="flex items-center gap-2 text-sm font-medium text-primary">
                    {section.action} <ArrowRight className="size-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
