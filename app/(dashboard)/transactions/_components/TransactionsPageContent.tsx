"use client";

import TransactionTable from "@/app/(dashboard)/transactions/_components/TransactionTable";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useDateRangeFilter } from "@/hooks/use-date-range-filter";
import React from "react";

export default function TransactionsPageContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dateRange, dateRangePickerProps } = useDateRangeFilter();

  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          {children}
          <DateRangePicker {...dateRangePickerProps} />
        </div>
      </div>
      <div className="container">
        <TransactionTable from={dateRange.from} to={dateRange.to} />
      </div>
    </>
  );
}
