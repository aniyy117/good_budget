"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTH_OPTIONS } from "@/lib/constants";
import type { Period } from "@/lib/types";

type MonthSelectorProps = {
  period: Period;
  setPeriod: (period: Period) => void;
};

export default function MonthSelector({
  period,
  setPeriod,
}: MonthSelectorProps) {
  return (
    <Select
      value={period.month.toString()}
      onValueChange={(value) => {
        setPeriod({ ...period, month: Number(value) });
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MONTH_OPTIONS.map(({ value, label }) => (
          <SelectItem key={value} value={String(value)}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
