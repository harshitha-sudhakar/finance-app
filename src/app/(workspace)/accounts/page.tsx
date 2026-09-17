"use client";

import { AccountDialog } from "@/components/account-dialog";
import { EmptyState } from "@/components/empty-state";
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
import { useFinance } from "@/lib/finance-context";
import { formatMoney } from "@/lib/money";
import type { Account } from "@/lib/types";
import { ArrowLeft, Landmark } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AccountsPage() {
  const { profile, deleteAccount } = useFinance();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Account | null>(null);

  return (
    <div className="grid gap-6">
      <Link href="/financial-data" className="flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to financial data
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">Accounts</h1>
        </div>
        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
        >
          Add account
        </Button>
      </div>

      {profile.accounts.length === 0 ? (
        <EmptyState
          icon={<Landmark className="size-5 text-muted-foreground" />}
          title="No accounts yet"
          description="Add a checking, savings, or cash balance to start your forecast."
          actionLabel="Add account"
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
                  <TableHead>Type</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.name}
                      {account.nessieAccountId ? (
                        <Badge variant="outline" className="ml-2">
                          Sandbox
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="capitalize">{account.type}</TableCell>
                    <TableCell>{account.institution}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(account.balance, true)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelected(account);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteAccount(account.id)}>
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

      <AccountDialog
        key={`${selected?.id ?? "new"}-${open ? "open" : "closed"}`}
        open={open}
        onOpenChange={setOpen}
        account={selected}
      />
    </div>
  );
}
