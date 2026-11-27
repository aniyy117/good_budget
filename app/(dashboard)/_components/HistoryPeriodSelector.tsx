"use client";

import MonthSelector from "@/app/(dashboard)/_components/MonthSelector";
import YearSelector from "@/app/(dashboard)/_components/YearSelector";
import { GetHistoryPeriodsResponseType } from "@/app/api/history-periods/route";
import SkeletonWrapper from "@/components/common/SkeletonWrapper";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet } from "@/lib/api";
import type { Period, Timeframe } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

interface Props {
  period: Period;
  setPeriod: (period: Period) => void;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
}

function HistoryPeriodSelector({
  period,
  setPeriod,
  timeframe,
  setTimeframe,
}: Props) {
  const historyPeriods = useQuery<GetHistoryPeriodsResponseType>({
    queryKey: ["overview", "history", "periods"],
    queryFn: () =>
      apiGet<GetHistoryPeriodsResponseType>(`/api/history-periods`),
  });

  return (
    <div className="flex flex-wrap items-center gap-4">
      <SkeletonWrapper isLoading={historyPeriods.isFetching} fullWidth={false}>
        <Tabs
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as Timeframe)}
        >
          <TabsList>
            <TabsTrigger value="year">Year</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </SkeletonWrapper>
      <div className="flex flex-wrap items-center gap-2">
        <SkeletonWrapper
          isLoading={historyPeriods.isFetching}
          fullWidth={false}
        >
          <YearSelector
            period={period}
            setPeriod={setPeriod}
            years={historyPeriods.data || []}
          />
        </SkeletonWrapper>
        {timeframe === "month" && (
          <SkeletonWrapper
            isLoading={historyPeriods.isFetching}
            fullWidth={false}
          >
            <MonthSelector period={period} setPeriod={setPeriod} />
          </SkeletonWrapper>
        )}
      </div>
    </div>
  );
}

export default HistoryPeriodSelector;
