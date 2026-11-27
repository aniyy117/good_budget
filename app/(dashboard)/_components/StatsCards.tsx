"use client";

import StatCard from "@/app/(dashboard)/_components/StatCard";
import { GetBalanceStatsResponseType } from "@/app/api/stats/balance/route";
import SkeletonWrapper from "@/components/common/SkeletonWrapper";
import { apiGet } from "@/lib/api";
import { DateToUTCDate, GetFormatterForCurrency } from "@/lib/helpers";
import type { UserCurrencySettings } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { LucideIcon, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";

interface Props {
  from: Date;
  to: Date;
  userSettings: UserCurrencySettings;
}

function StatsCards({ from, to, userSettings }: Props) {
  const statsQuery = useQuery<GetBalanceStatsResponseType>({
    queryKey: ["overview", "stats", from, to],
    queryFn: () =>
      apiGet<GetBalanceStatsResponseType>(
        `/api/stats/balance?from=${DateToUTCDate(from)}&to=${DateToUTCDate(to)}`
      ),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const income = statsQuery.data?.income || 0;
  const expense = statsQuery.data?.expense || 0;
  const balance = income - expense;

  const cards: {
    title: string;
    value: number;
    icon: LucideIcon;
    iconClassName: string;
  }[] = [
    {
      title: "Income",
      value: income,
      icon: TrendingUp,
      iconClassName: "text-emerald-500 bg-emerald-400/10",
    },
    {
      title: "Expense",
      value: expense,
      icon: TrendingDown,
      iconClassName: "text-red-500 bg-red-400/10",
    },
    {
      title: "Balance",
      value: balance,
      icon: Wallet,
      iconClassName: "text-violet-500 bg-violet-400/10",
    },
  ];

  return (
    <div className="relative flex w-full flex-wrap gap-2 md:flex-nowrap">
      {cards.map((card) => (
        <SkeletonWrapper key={card.title} isLoading={statsQuery.isFetching}>
          <StatCard
            formatter={formatter}
            value={card.value}
            title={card.title}
            icon={card.icon}
            iconClassName={card.iconClassName}
          />
        </SkeletonWrapper>
      ))}
    </div>
  );
}

export default StatsCards;
