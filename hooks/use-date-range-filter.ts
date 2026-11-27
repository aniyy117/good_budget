"use client";

import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { differenceInDays, startOfMonth } from "date-fns";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export type DateRangeValue = { from: Date; to: Date };

export function useDateRangeFilter(
  initial?: DateRangeValue
): {
  dateRange: DateRangeValue;
  dateRangePickerProps: {
    initialDateFrom: Date;
    initialDateTo: Date;
    showCompare: false;
    onUpdate: (values: {
      range: { from?: Date; to?: Date };
      rangeCompare?: { from?: Date; to?: Date };
    }) => void;
  };
} {
  const [dateRange, setDateRange] = useState<DateRangeValue>(
    initial ?? {
      from: startOfMonth(new Date()),
      to: new Date(),
    }
  );

  const onUpdate = useCallback(
    (values: {
      range: { from?: Date; to?: Date };
      rangeCompare?: { from?: Date; to?: Date };
    }) => {
      const { from, to } = values.range;
      if (!from || !to) return;
      if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
        toast.error(
          `The selected date range is too big. Max allowed range is ${MAX_DATE_RANGE_DAYS} days!`
        );
        return;
      }
      setDateRange({ from, to });
    },
    []
  );

  return {
    dateRange,
    dateRangePickerProps: {
      initialDateFrom: dateRange.from,
      initialDateTo: dateRange.to,
      showCompare: false,
      onUpdate,
    },
  };
}
