"use client";

import { Button } from "@/components/ui/button";
import { useFinance } from "@/lib/finance-context";
import type { HorizonDays } from "@/lib/types";
import { cn } from "@/lib/utils";

const options: HorizonDays[] = [30, 60, 90];

export function HorizonSwitch() {
  const { profile, setHorizon } = useFinance();
  return (
    <div className="inline-flex rounded-lg border bg-muted p-0.5">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setHorizon(option)}
          className={cn(
            "rounded-md px-3",
            profile.settings.horizonDays === option && "bg-background text-foreground shadow-sm",
          )}
        >
          {option}d
        </Button>
      ))}
    </div>
  );
}
