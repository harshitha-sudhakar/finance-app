"use client";

import { ForecastChart } from "@/components/forecast-chart";
import { HorizonSwitch } from "@/components/horizon-switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLongDate } from "@/lib/dates";
import { useFinance } from "@/lib/finance-context";
import { formatMoney } from "@/lib/money";

export default function ForecastPage() {
  const { forecast, profile, updateSettings } = useFinance();

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">Projection</h1>
        </div>
        <HorizonSwitch />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Lowest projected balance</CardDescription>
            <CardTitle className="font-heading text-2xl">{formatMoney(forecast.minExpected)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Ending balance</CardDescription>
            <CardTitle className="font-heading text-2xl">{formatMoney(forecast.endingExpected)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
          <CardDescription>Preferred leftover</CardDescription>
            <CardTitle className="font-heading text-2xl">{formatMoney(profile.settings.comfortBuffer)}</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Leftover goal
              <input
                type="range"
                min={0}
                max={1000}
                step={50}
                value={profile.settings.comfortBuffer}
                onChange={(event) => updateSettings({ comfortBuffer: Number(event.target.value) })}
              />
            </label>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ForecastChart forecast={forecast} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shortfall dates</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {forecast.shortfallDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No zero-balance shortfall during this period.</p>
          ) : (
            forecast.shortfallDates.slice(0, 12).map((date) => (
              <Badge key={date} variant="destructive">
                {formatLongDate(date)}
              </Badge>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
