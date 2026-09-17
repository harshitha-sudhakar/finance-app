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
import { todayISO } from "@/lib/dates";
import type { IncomeEvent, Recurrence } from "@/lib/types";
import { useState } from "react";

function emptyForm() {
  return {
    source: "",
    amount: "",
    date: todayISO(),
    recurrence: "none" as Recurrence,
    certainty: "1",
  };
}

function formFrom(event?: IncomeEvent | null) {
  if (!event) return emptyForm();
  return {
    source: event.source,
    amount: String(event.amount),
    date: event.date,
    recurrence: event.recurrence,
    certainty: String(event.certainty),
  };
}

export function IncomeDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: IncomeEvent | null;
}) {
  const { addIncome } = useFinance();
  const [form, setForm] = useState(() => formFrom(event));
  const [error, setError] = useState("");

  function submit(eventForm: React.FormEvent) {
    eventForm.preventDefault();
    try {
      addIncome({
        id: event?.id,
        source: form.source,
        amount: Number(form.amount),
        date: form.date,
        recurrence: form.recurrence,
        certainty: Number(form.certainty),
        nessieDepositId: event?.nessieDepositId,
      });
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save income.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{event ? "Edit income" : "Log income"}</DialogTitle>
          </DialogHeader>
          <Field label="Source">
            <Input
              required
              value={form.source}
              placeholder="Northwind payroll"
              onChange={(change) => setForm((current) => ({ ...current, source: change.target.value }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount">
              <Input
                required
                inputMode="decimal"
                value={form.amount}
                placeholder="2900"
                onChange={(change) => setForm((current) => ({ ...current, amount: change.target.value }))}
              />
            </Field>
            <Field label="Next date">
              <Input
                required
                type="date"
                value={form.date}
                onChange={(change) => setForm((current) => ({ ...current, date: change.target.value }))}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Recurrence">
              <NativeSelect
                value={form.recurrence}
                onChange={(change) =>
                  setForm((current) => ({ ...current, recurrence: change.target.value as Recurrence }))
                }
              >
                <option value="none">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </NativeSelect>
            </Field>
            <Field label="Certainty">
              <NativeSelect
                value={form.certainty}
                onChange={(change) => setForm((current) => ({ ...current, certainty: change.target.value }))}
              >
                <option value="1">Certain — 100%</option>
                <option value="0.8">Likely — 80%</option>
                <option value="0.55">Uncertain — 55%</option>
              </NativeSelect>
            </Field>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{event ? "Save income" : "Log income"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
