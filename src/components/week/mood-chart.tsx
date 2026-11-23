"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { moodSummaryLabel, weekdayShort } from "@/components/week/format";
import { MOODS, type WeekDay } from "@/contracts/journal";

const chartConfig = {
  mood: { label: "Mood", color: "var(--chart-1)" },
} satisfies ChartConfig;

interface MoodChartProps {
  days: WeekDay[];
}

export function MoodChart({ days }: MoodChartProps) {
  const [showTable, setShowTable] = useState(false);
  const data = days.map((day) => ({
    day: weekdayShort(day.date),
    mood: day.mood === null ? null : MOODS.indexOf(day.mood),
  }));

  return (
    <div>
      <div role="img" aria-label={moodSummaryLabel(days)}>
        <ChartContainer config={chartConfig} className="aspect-[16/9] w-full">
          <LineChart
            data={data}
            accessibilityLayer={false}
            margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis
              type="number"
              domain={[0, 4]}
              ticks={[0, 1, 2, 3, 4]}
              interval={0}
              width={52}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => MOODS[value] ?? ""}
            />
            <Line
              dataKey="mood"
              type="monotone"
              stroke="var(--color-mood)"
              strokeWidth={2}
              connectNulls={false}
              dot={{ r: 5, fill: "var(--color-mood)" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
      <Button
        variant="link"
        className="mt-3 px-0"
        aria-expanded={showTable}
        aria-controls="mood-table"
        onClick={() => setShowTable((value) => !value)}
      >
        {showTable ? "Hide table" : "Show as table"}
      </Button>
      {showTable ? (
        <table
          id="mood-table"
          className="mt-2 w-full max-w-sm text-left text-sm"
        >
          <caption className="sr-only">Mood by day this week</caption>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">
                Day
              </th>
              <th scope="col" className="py-2 font-medium">
                Mood
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date} className="border-b border-border/60">
                <th scope="row" className="py-2 pr-4 font-normal">
                  {weekdayShort(day.date)}
                </th>
                <td className="py-2">{day.mood ?? "No entry"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
