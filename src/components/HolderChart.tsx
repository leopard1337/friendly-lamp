"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Snapshot = {
  timestamp: Date;
  holderCount: number;
  healthScore: number | null;
};

export function HolderChart({ data }: { data: Snapshot[] }) {
  const chartData = useMemo(() => {
    return [...data].reverse().map((s, i) => {
      const d = new Date(s.timestamp);
      return {
        key: `${d.getTime()}-${i}`,
        fullDate: d.toLocaleString(),
        displayLabel: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        holders: s.holderCount,
        health: s.healthScore ?? 0,
      };
    });
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-900/20 text-center ring-1 ring-zinc-800/30">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800/50 ring-1 ring-zinc-700/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-400">No data yet</p>
        <p className="mt-1 text-xs text-zinc-600">Use &quot;Refresh holders&quot; above to capture a snapshot</p>
      </div>
    );
  }

  const latest = chartData[chartData.length - 1];

  return (
    <div className="w-full rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4 ring-1 ring-zinc-800/40">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--chart-holders)]" />
            Holders
          </span>
          <span className="text-zinc-600">·</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--chart-health)]" />
            Health Score
          </span>
        </div>
        {latest && (
          <div className="rounded-xl bg-zinc-800/50 px-3 py-1.5 text-xs ring-1 ring-zinc-700/40 tabular-nums">
            <span className="text-zinc-400">Latest:</span>{" "}
            <span className="font-semibold text-[var(--chart-holders)]">{latest.holders.toLocaleString()}</span>
            <span className="mx-1.5 text-zinc-600">·</span>
            <span className="font-semibold text-[var(--chart-health)]">{latest.health}</span>
          </div>
        )}
      </div>
      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="holdersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-holders)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--chart-holders)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-health)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--chart-health)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" strokeOpacity={0.4} vertical={false} />
            <XAxis
              dataKey="key"
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => chartData.find((d) => d.key === val)?.displayLabel ?? String(val)}
            />
            <YAxis
              yAxisId="left"
              stroke="var(--text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              stroke="var(--chart-health)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "10px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                padding: "10px 14px",
              }}
              labelStyle={{ color: "var(--text-secondary)", fontSize: 12 }}
              itemSorter={(item) => (item.name === "Holders" ? 0 : 1)}
              formatter={(value, name) => [
                name === "Holders" ? (value ?? 0).toLocaleString() : (value ?? 0),
                name ?? "",
              ]}
              labelFormatter={(_, payload) => (Array.isArray(payload) && payload[0]?.payload?.fullDate) ?? ""}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="holders"
              stroke="var(--chart-holders)"
              strokeWidth={2.5}
              fill="url(#holdersGrad)"
              dot={{ fill: "var(--chart-holders)", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 4, fill: "var(--chart-holders)", stroke: "var(--bg-base)", strokeWidth: 2 }}
              name="Holders"
              isAnimationActive={true}
              animationDuration={300}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="health"
              stroke="var(--chart-health)"
              strokeWidth={2.5}
              fill="url(#healthGrad)"
              dot={{ fill: "var(--chart-health)", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 4, fill: "var(--chart-health)", stroke: "var(--bg-base)", strokeWidth: 2 }}
              name="Health Score"
              isAnimationActive={true}
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
