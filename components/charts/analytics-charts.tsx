"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UploadsChartProps {
  data: Array<{ month: string; uploads: number }>;
}

export function UploadsOverTimeChart({ data }: UploadsChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="uploads"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            name="Uploads"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DownloadsChartProps {
  data: Array<{ name: string; downloads: number }>;
}

export function DownloadsByDatasetChart({ data }: DownloadsChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={75} />
          <Tooltip />
          <Bar dataKey="downloads" fill="hsl(var(--primary))" name="Downloads" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface UsersChartProps {
  data: Array<{ month: string; users: number }>;
}

export function NewUsersOverTimeChart({ data }: UsersChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="users"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            name="New Users"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
