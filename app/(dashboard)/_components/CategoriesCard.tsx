"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CategoryStatsRow, TransactionType } from "@/lib/types";

type CategoriesCardProps = {
  type: TransactionType;
  formatter: Intl.NumberFormat;
  data: CategoryStatsRow[];
};

export default function CategoriesCard({
  data,
  type,
  formatter,
}: CategoriesCardProps) {
  const filteredData = data.filter((row) => row.type === type);
  const total = filteredData.reduce(
    (acc, row) => acc + (row._sum?.amount || 0),
    0
  );

  const label = type === "income" ? "Incomes" : "Expenses";
  const emptyHint = type === "income" ? "incomes" : "expenses";
  const progressClass =
    type === "income" ? "bg-emerald-500" : "bg-red-500";

  return (
    <Card className="h-80 w-full col-span-6">
      <CardHeader>
        <CardTitle className="grid grid-flow-row justify-between gap-2 text-muted-foreground md:grid-flow-col">
          {label} by category
        </CardTitle>
      </CardHeader>

      <div className="flex items-center justify-between gap-2">
        {filteredData.length === 0 ? (
          <div className="flex h-60 w-full flex-col items-center justify-center">
            No data for the selected period
            <p className="text-sm text-muted-foreground">
              Try selecting a different period or try adding new {emptyHint}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-60 w-full px-4">
            <div className="flex w-full flex-col gap-4 p-4">
              {filteredData.map((item) => (
                <CategoryStatRow
                  key={item.category}
                  item={item}
                  total={total}
                  formatter={formatter}
                  indicatorClassName={progressClass}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}

function CategoryStatRow({
  item,
  total,
  formatter,
  indicatorClassName,
}: {
  item: CategoryStatsRow;
  total: number;
  formatter: Intl.NumberFormat;
  indicatorClassName: string;
}) {
  const amount = item._sum.amount || 0;
  const percentage = (amount * 100) / (total || amount);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center text-gray-400">
          {item.categoryIcon} {item.category}
          <span className="ml-2 text-xs text-muted-foreground">
            ({percentage.toFixed(2)}%)
          </span>
        </span>
        <span className="text-sm text-gray-400">
          {formatter.format(amount)}
        </span>
      </div>
      <Progress value={percentage} indicator={indicatorClassName} />
    </div>
  );
}
