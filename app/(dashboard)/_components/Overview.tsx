"use client";

import CategoriesStats from "@/app/(dashboard)/_components/CategoriesStats";
import StatsCards from "@/app/(dashboard)/_components/StatsCards";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useDateRangeFilter } from "@/hooks/use-date-range-filter";
import type { UserCurrencySettings } from "@/lib/types";
import React from "react";

function Overview({ userSettings }: { userSettings: UserCurrencySettings }) {
  const { dateRange, dateRangePickerProps } = useDateRangeFilter();

  return (
    <>
      <div className="container flex flex-wrap items-end justify-between gap-2 py-6">
        <h2 className="text-3xl font-bold">Overview</h2>
        <div className="flex items-center gap-3">
          <DateRangePicker {...dateRangePickerProps} />
        </div>
      </div>
      <div className="container flex w-full flex-col gap-2">
        <StatsCards
          userSettings={userSettings}
          from={dateRange.from}
          to={dateRange.to}
        />

        <CategoriesStats
          userSettings={userSettings}
          from={dateRange.from}
          to={dateRange.to}
        />
      </div>
    </>
  );
}

export default Overview;
