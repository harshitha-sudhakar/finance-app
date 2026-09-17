"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/lib/finance-context";
import { formatMoney } from "@/lib/money";
import type { MappedNessieImport, NessieDomainStatus, NessieSnapshot } from "@/lib/types";
import { useState } from "react";

const domainCopy: Record<string, string> = {
  customer: "Who the sandbox customer is — name and address. This is the identity the other four domains hang off.",
  accounts: "Balances and product types (Checking, Savings, Credit Card). Starting runway comes from here.",
  bills: "Scheduled and recurring payees. Mapped into Runway obligations with inferred monthly recurrence.",
  deposits: "Paychecks and inbound transfers. Grouped by description to infer weekly / biweekly / monthly income.",
  purchases: "Merchant spend. Averaged into a daily spend estimate so the forecast is not only bills vs payroll.",
};

export default function PipelinePage() {
  const { importNessie, profile } = useFinance();
  const [snapshot, setSnapshot] = useState<NessieSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSnapshot() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/nessie/snapshot?customerId=${encodeURIComponent(profile.settings.nessieCustomerId || "")}`,
      );
      if (!response.ok) throw new Error("Could not reach the Nessie pipeline.");
      setSnapshot((await response.json()) as NessieSnapshot);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pipeline failed.");
    } finally {
      setLoading(false);
    }
  }

  async function applyImport() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/nessie/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: snapshot?.customerId }),
      });
      if (!response.ok) throw new Error("Import failed.");
      const payload = (await response.json()) as { mapped: MappedNessieImport; snapshot: NessieSnapshot };
      importNessie(payload.mapped);
      setSnapshot(payload.snapshot);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Nessie API</p>
          <h1 className="font-heading text-3xl tracking-tight">Five-domain banking pipeline</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Nessie is Capital One&apos;s hackathon sandbox — not a live bank login. It lets you create mock customers
            and then read the same resource graph Capital One uses internally: a customer owns accounts; accounts own
            bills, deposits, and purchases. Runway fans those five calls out, normalizes them, and feeds the forecast.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSnapshot} disabled={loading}>
            {loading ? "Fetching…" : "Fetch snapshot"}
          </Button>
          <Button onClick={applyImport} disabled={loading}>
            Apply to this customer
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {snapshot?.warning ? <p className="text-sm text-muted-foreground">{snapshot.warning}</p> : null}

      <div className="grid gap-4 md:grid-cols-5">
        {(
          [
            ["customer", snapshot?.domains.customer],
            ["accounts", snapshot?.domains.accounts],
            ["bills", snapshot?.domains.bills],
            ["deposits", snapshot?.domains.deposits],
            ["purchases", snapshot?.domains.purchases],
          ] as Array<[string, NessieDomainStatus | undefined]>
        ).map(([name, status]) => (
          <Card key={name} size="sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="capitalize">{name}</CardTitle>
                <Badge variant={status === "rejected" ? "destructive" : "outline"}>{status ?? "idle"}</Badge>
              </div>
              <CardDescription>{domainCopy[name]}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {snapshot ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>
                {snapshot.source === "nessie" ? "Live Nessie sandbox" : "Bundled fixture matching Nessie JSON"} ·{" "}
                {snapshot.customerId}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              {snapshot.customer ? (
                <p>
                  {snapshot.customer.firstName} {snapshot.customer.lastName}
                  <br />
                  <span className="text-muted-foreground">{snapshot.customer.address}</span>
                </p>
              ) : (
                <p className="text-muted-foreground">Customer domain returned empty.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Accounts / balances</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {snapshot.accounts.map((account) => (
                <div key={account.id} className="flex justify-between">
                  <span>
                    {account.nickname} · {account.type}
                  </span>
                  <span className="font-mono">{formatMoney(account.balance, true)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Bills</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {snapshot.bills.map((bill) => (
                <div key={bill.id} className="flex justify-between">
                  <span>{bill.nickname || bill.payee}</span>
                  <span className="font-mono">{formatMoney(bill.paymentAmount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Deposits</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {snapshot.deposits.map((deposit) => (
                <div key={deposit.id} className="flex justify-between">
                  <span>{deposit.description || deposit.type}</span>
                  <span className="font-mono">{formatMoney(deposit.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Purchases</CardTitle>
              <CardDescription>Used as a historical daily-spend prior, not as individual forecast events.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm md:grid-cols-2">
              {snapshot.purchases.map((purchase) => (
                <div key={purchase.id} className="flex justify-between">
                  <span>{purchase.description || "Purchase"}</span>
                  <span className="font-mono">{formatMoney(purchase.amount, true)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Fetch a snapshot to show the five domains side by side. Without a Nessie API key the pipeline still returns
            a realistic Capital One sandbox fixture so the demo never dies on credentials.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
