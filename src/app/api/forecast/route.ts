import { buildForecast } from "@/lib/forecast";
import { NextResponse } from "next/server";
import type { Account, HorizonDays, IncomeEvent, Obligation } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    accounts: Account[];
    incomeEvents: IncomeEvent[];
    obligations: Obligation[];
    horizonDays?: HorizonDays;
    comfortBuffer?: number;
    dailySpendEstimate?: number;
  };

  const forecast = buildForecast({
    accounts: body.accounts ?? [],
    incomeEvents: body.incomeEvents ?? [],
    obligations: body.obligations ?? [],
    horizonDays: body.horizonDays ?? 30,
    comfortBuffer: body.comfortBuffer ?? 250,
    dailySpendEstimate: body.dailySpendEstimate ?? 0,
  });

  return NextResponse.json(forecast);
}
