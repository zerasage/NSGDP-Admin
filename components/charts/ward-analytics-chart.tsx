"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { AnalyticsDataSourceId } from "@/lib/constants/analytics-sources";
import { getAnalyticsSourceShare } from "@/lib/constants/analytics-sources";
import type { AnalyticsMetric } from "@/types";

interface WardDataPoint {
  ward: string;
  lga: string;
  cases: number;
  population: number;
  incidencePer1000: number;
}

// Seeded mock ward data
const MOCK_WARD_DATA: WardDataPoint[] = [
  { ward: "Tunga",        lga: "Bosso",   cases: 145, population: 12400, incidencePer1000: 11.7 },
  { ward: "Minna Central",lga: "Bosso",   cases: 198, population: 18200, incidencePer1000: 10.9 },
  { ward: "Kpakungu",     lga: "Bosso",   cases: 87,  population: 9800,  incidencePer1000: 8.9  },
  { ward: "Shango",       lga: "Chanchaga",cases:201, population: 14500, incidencePer1000: 13.9 },
  { ward: "Limawa",       lga: "Chanchaga",cases:112, population: 11000, incidencePer1000: 10.2 },
  { ward: "Gwari",        lga: "Chanchaga",cases:76,  population: 8200,  incidencePer1000: 9.3  },
  { ward: "Bida Central", lga: "Bida",    cases: 234, population: 21000, incidencePer1000: 11.1 },
  { ward: "Bida North",   lga: "Bida",    cases: 167, population: 15600, incidencePer1000: 10.7 },
  { ward: "Efako",        lga: "Bida",    cases: 89,  population: 9400,  incidencePer1000: 9.5  },
  { ward: "Lapai Central",lga: "Lapai",   cases: 312, population: 16800, incidencePer1000: 18.6 },
];

const HIGH_THRESHOLD = 15;

interface WardAnalyticsChartProps {
  lgaFilter?: string;
  metric?: "cases" | "incidencePer1000";
  dataSourceId?: AnalyticsDataSourceId;
  analyticsMetric?: AnalyticsMetric;
}

export function WardAnalyticsChart({
  lgaFilter,
  metric = "cases",
  dataSourceId = "all",
  analyticsMetric = "severe_malaria",
}: WardAnalyticsChartProps) {
  const share = getAnalyticsSourceShare(dataSourceId, analyticsMetric);

  const scaled = MOCK_WARD_DATA.map((row) => ({
    ...row,
    cases: Math.round(row.cases * share),
    population: Math.round(row.population * (dataSourceId === "all" ? 1 : share * 2)),
    incidencePer1000:
      Math.round(
        ((row.cases * share) / Math.max(row.population * (dataSourceId === "all" ? 1 : share * 2), 1)) *
          1000 *
          10
      ) / 10,
  }));

  const data = lgaFilter
    ? scaled.filter((d) => d.lga === lgaFilter)
    : scaled;

  const sorted = [...data].sort((a, b) => b[metric] - a[metric]);

  const label = metric === "cases" ? "Reported Cases" : "Incidence per 1,000";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis
          dataKey="ward"
          type="category"
          width={110}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(val) => {
            if (val === undefined || val === null) return ['', label];
            return [
              typeof val === 'number' ? val.toLocaleString() : String(val),
              label
            ];
          }}
          labelFormatter={(name) => {
            const d = sorted.find((x) => x.ward === name);
            return `${name} (${d?.lga ?? ""})`;
          }}
        />
        <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
          {sorted.map((entry) => (
            <Cell
              key={entry.ward}
              fill={
                metric === "incidencePer1000" && entry.incidencePer1000 > HIGH_THRESHOLD
                  ? "#dc2626"
                  : "#2563eb"
              }
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
