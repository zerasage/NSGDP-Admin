"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActivityDataPoint {
  date: string;
  views: number;
  downloads: number;
}

interface ActivityGraphProps {
  data7d: ActivityDataPoint[];
  data30d: ActivityDataPoint[];
  className?: string;
}

export function ActivityGraph({ data7d, data30d, className }: ActivityGraphProps) {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const data = range === "7d" ? data7d : data30d;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            Views
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-chart-4" aria-hidden="true" />
            Downloads
          </span>
        </div>

        <div className="inline-flex w-fit items-center rounded-lg border bg-muted/40 p-1">
          <Button
            type="button"
            size="xs"
            variant={range === "7d" ? "default" : "ghost"}
            onClick={() => setRange("7d")}
            aria-pressed={range === "7d"}
          >
            7D
          </Button>
          <Button
            type="button"
            size="xs"
            variant={range === "30d" ? "default" : "ghost"}
            onClick={() => setRange("30d")}
            aria-pressed={range === "30d"}
          >
            30D
          </Button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          No activity data available for this period
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="activityViewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="activityDownloadsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickMargin={8}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--muted-foreground)", marginBottom: 6 }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#activityViewsFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
                name="Views"
              />
              <Area
                type="monotone"
                dataKey="downloads"
                stroke="var(--chart-4)"
                strokeWidth={2.5}
                fill="url(#activityDownloadsFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
                name="Downloads"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
