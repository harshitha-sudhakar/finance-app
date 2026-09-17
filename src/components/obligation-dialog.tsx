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
import { todayISO } from "@/lib/dates";
import { useFinance } from "@/lib/finance-context";
import type { Obligation, Recurrence } from "@/lib/types";
import { useState } from "react";

function emptyForm() {
  return {
    name: "",
    amount: "",
    dueDate: todayISO(),
    recurrence: "monthly" as Recurrence,
    certainty: "1",
  };
}

function formFrom(obligation?: Obligation | null) {
  if (!obligation) return emptyForm();
  return {
    name: obligation.name,
    amount: String(obligation.amount),
    dueDate: obligation.dueDate,
    recurrence: obligation.recurrence,
    certainty: String(obligation.certainty),
  };
}

export function ObligationDialog({
  open,
  onOpenChange,
  obligation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligation?: Obligation | null;
}) {
  const { addObligation } = useFinance();
  const [form, setForm] = useState(() => formFrom(obligation));
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      addObligation({
        id: obligation?.id,
        name: form.name,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        recurrence: form.recurrence,
        certainty: Number(form.certainty),
        nessieBillId: obligation?.nessieBillId,
      });
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save obligation.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{obligation ? "Edit obligation" : "Add obligation"}</DialogTitle>
          </DialogHeader>
          <Field label="Name">
            <Input
              required
              value={form.name}
              placeholder="Rent — Oak Court"
              onChange={(change) => setForm((current) => ({ ...current, name: change.target.value }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount">
              <Input
                required
                inputMode="decimal"
                value={form.amount}
                placeholder="1675"
                onChange={(change) => setForm((current) => ({ ...current, amount: change.target.value }))}
              />
            </Field>
            <Field label="Due date">
              <Input
                required
                type="date"
                value={form.dueDate}
                onChange={(change) => setForm((current) => ({ ...current, dueDate: change.target.value }))}
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
            <Button type="submit">{obligation ? "Save obligation" : "Add obligation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
