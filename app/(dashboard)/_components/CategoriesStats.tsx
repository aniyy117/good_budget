"use client";

import CategoriesCard from "@/app/(dashboard)/_components/CategoriesCard";
import type { GetCategoriesStatsResponseType } from "@/app/api/stats/categories/route";
import SkeletonWrapper from "@/components/common/SkeletonWrapper";
import { apiGet } from "@/lib/api";
import { DateToUTCDate, GetFormatterForCurrency } from "@/lib/helpers";
import type { TransactionType, UserCurrencySettings } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface Props {
  userSettings: UserCurrencySettings;
  from: Date;
  to: Date;
}

const CATEGORY_TYPES: TransactionType[] = ["income", "expense"];

function CategoriesStats({ userSettings, from, to }: Props) {
  const statsQuery = useQuery<GetCategoriesStatsResponseType>({
    queryKey: ["overview", "stats", "categories", from, to],
    queryFn: () =>
      apiGet<GetCategoriesStatsResponseType>(
        `/api/stats/categories?from=${DateToUTCDate(from)}&to=${DateToUTCDate(
          to
        )}`
      ),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  return (
    <div className="flex w-full flex-wrap gap-2 md:flex-nowrap">
      {CATEGORY_TYPES.map((type) => (
        <SkeletonWrapper key={type} isLoading={statsQuery.isFetching}>
          <CategoriesCard
            formatter={formatter}
            type={type}
            data={statsQuery.data || []}
          />
        </SkeletonWrapper>
      ))}
    </div>
  );
}

export default CategoriesStats;
