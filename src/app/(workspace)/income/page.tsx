"use client";

import { EmptyState } from "@/components/empty-state";
import { IncomeDialog } from "@/components/income-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLongDate } from "@/lib/dates";
import { useFinance } from "@/lib/finance-context";
import { certaintyLabel, formatMoney } from "@/lib/money";
import type { IncomeEvent } from "@/lib/types";
import { ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function IncomePage() {
  const { profile, deleteIncome } = useFinance();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<IncomeEvent | null>(null);

  return (
    <div className="grid gap-6">
      <Link href="/financial-data" className="flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to financial data
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">Income</h1>
        </div>
        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
        >
          Log income
        </Button>
      </div>

      {profile.incomeEvents.length === 0 ? (
        <EmptyState
          icon={<Wallet className="size-5 text-muted-foreground" />}
          title="No income logged"
          description="Add a paycheck, invoice, or transfer to include it in your forecast."
          actionLabel="Log income"
          onAction={() => {
            setSelected(null);
            setOpen(true);
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Next date</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead>Certainty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.incomeEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.source}
                      {event.nessieDepositId ? (
                        <Badge variant="outline" className="ml-2">
                          Sandbox
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatLongDate(event.date)}</TableCell>
                    <TableCell className="capitalize">{event.recurrence}</TableCell>
                    <TableCell>{certaintyLabel(event.certainty)}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(event.amount, true)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelected(event);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteIncome(event.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <IncomeDialog
        key={`${selected?.id ?? "new"}-${open ? "open" : "closed"}`}
        open={open}
        onOpenChange={setOpen}
        event={selected}
      />
    </div>
  );
}
