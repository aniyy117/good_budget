"use client";

import HistoryTooltip from "@/app/(dashboard)/_components/HistoryTooltip";
import type { GetHistoryDataResponseType } from "@/app/api/history-data/route";
import type { Timeframe } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HistoryChartProps = {
  data: GetHistoryDataResponseType;
  timeframe: Timeframe;
  formatter: Intl.NumberFormat;
};

export default function HistoryChart({
  data,
  timeframe,
  formatter,
}: HistoryChartProps) {
  return (
    <ResponsiveContainer width={"100%"} height={300}>
      <BarChart height={300} data={data} barCategoryGap={5}>
        <defs>
          <linearGradient id="incomeBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset={"0"} stopColor="#10b981" stopOpacity={"1"} />
            <stop offset={"1"} stopColor="#10b981" stopOpacity={"0"} />
          </linearGradient>

          <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset={"0"} stopColor="#ef4444" stopOpacity={"1"} />
            <stop offset={"1"} stopColor="#ef4444" stopOpacity={"0"} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="5 5"
          strokeOpacity={"0.2"}
          vertical={false}
        />
        <XAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          padding={{ left: 5, right: 5 }}
          dataKey={(row) => {
            const { year, month, day } = row;
            const date = new Date(year, month, day || 1);
            if (timeframe === "year") {
              return date.toLocaleDateString("default", {
                month: "long",
              });
            }
            return date.toLocaleDateString("default", {
              day: "2-digit",
            });
          }}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Bar
          dataKey={"income"}
          label="Income"
          fill="url(#incomeBar)"
          radius={4}
          className="cursor-pointer"
        />
        <Bar
          dataKey={"expense"}
          label="Expense"
          fill="url(#expenseBar)"
          radius={4}
          className="cursor-pointer"
        />
        <Tooltip
          cursor={{ opacity: 0.1 }}
          content={({ active, payload }) => (
            <HistoryTooltip
              active={active}
              payload={
                payload as
                  | { payload: { expense: number; income: number } }[]
                  | undefined
              }
              formatter={formatter}
            />
          )}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
