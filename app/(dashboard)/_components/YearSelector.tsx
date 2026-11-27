"use client";

import type { GetHistoryPeriodsResponseType } from "@/app/api/history-periods/route";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Period } from "@/lib/types";

type YearSelectorProps = {
  period: Period;
  setPeriod: (period: Period) => void;
  years: GetHistoryPeriodsResponseType;
};

export default function YearSelector({
  period,
  setPeriod,
  years,
}: YearSelectorProps) {
  return (
    <Select
      value={period.year.toString()}
      onValueChange={(value) => {
        setPeriod({ ...period, year: Number(value) });
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
