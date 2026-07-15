"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={range === "7d" ? "default" : "outline"}
          onClick={() => setRange("7d")}
        >
          7 days
        </Button>
        <Button
          type="button"
          size="sm"
          variant={range === "30d" ? "default" : "outline"}
          onClick={() => setRange("30d")}
        >
          30 days
        </Button>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="views"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Views"
            />
            <Line
              type="monotone"
              dataKey="downloads"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={false}
              name="Downloads"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
