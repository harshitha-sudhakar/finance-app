"use client";

import { Field, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFinance } from "@/lib/finance-context";
import type { Account, AccountType } from "@/lib/types";
import { useState } from "react";

const empty = {
  name: "",
  type: "checking" as AccountType,
  balance: "",
  institution: "",
};

function formFrom(account?: Account | null) {
  if (!account) return empty;
  return {
    name: account.name,
    type: account.type,
    balance: String(account.balance),
    institution: account.institution,
  };
}

export function AccountDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
}) {
  const { addAccount } = useFinance();
  const [form, setForm] = useState(() => formFrom(account));
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const balance = Number(form.balance);
      addAccount({
        id: account?.id,
        name: form.name,
        type: form.type,
        balance,
        institution: form.institution || "Manual",
        nessieAccountId: account?.nessieAccountId,
      });
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save account.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{account ? "Edit account" : "Add account"}</DialogTitle>
          </DialogHeader>
          <Field label="Account name">
            <Input
              required
              value={form.name}
              placeholder="Everyday Checking"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <NativeSelect
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value as AccountType }))
                }
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit card</option>
              </NativeSelect>
            </Field>
            <Field label="Balance">
              <Input
                required
                inputMode="decimal"
                value={form.balance}
                placeholder="1140"
                onChange={(event) => setForm((current) => ({ ...current, balance: event.target.value }))}
              />
            </Field>
          </div>
          <Field label="Institution" hint="Optional">
            <Input
              value={form.institution}
              placeholder="Capital One"
              onChange={(event) =>
                setForm((current) => ({ ...current, institution: event.target.value }))
              }
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{account ? "Save account" : "Add account"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
