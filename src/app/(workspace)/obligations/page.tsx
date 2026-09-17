"use client";

import { EmptyState } from "@/components/empty-state";
import { ObligationDialog } from "@/components/obligation-dialog";
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
import type { Obligation } from "@/lib/types";
import { Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ObligationsPage() {
  const { profile, deleteObligation } = useFinance();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Obligation | null>(null);
  return (
    <div className="grid gap-6">
      <Link href="/financial-data" className="flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to financial data
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">Obligations</h1>
        </div>
        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
        >
          Add obligation
        </Button>
      </div>

      {profile.obligations.length === 0 ? (
        <EmptyState
          icon={<Activity className="size-5 text-muted-foreground" />}
          title="No obligations yet"
          description="Add rent, loans, utilities, or other bills to include them in your forecast."
          actionLabel="Add obligation"
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
                  <TableHead>Name</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead>Certainty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.obligations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name}
                      {item.nessieBillId ? (
                        <Badge variant="outline" className="ml-2">
                          Sandbox
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatLongDate(item.dueDate)}</TableCell>
                    <TableCell className="capitalize">{item.recurrence}</TableCell>
                    <TableCell>{certaintyLabel(item.certainty)}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(item.amount, true)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelected(item);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteObligation(item.id)}>
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

      <ObligationDialog
        key={`${selected?.id ?? "new"}-${open ? "open" : "closed"}`}
        open={open}
        onOpenChange={setOpen}
        obligation={selected}
      />
    </div>
  );
}
