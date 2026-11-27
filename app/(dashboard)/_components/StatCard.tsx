"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useCallback } from "react";
import CountUp from "react-countup";

const ICON_CLASS = "h-12 w-12 items-center rounded-lg p-2";

type StatCardProps = {
  formatter: Intl.NumberFormat;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  value: number;
};

export default function StatCard({
  formatter,
  value,
  title,
  icon: Icon,
  iconClassName,
}: StatCardProps) {
  const formatFn = useCallback(
    (amount: number) => formatter.format(amount),
    [formatter]
  );

  return (
    <Card className="flex h-24 w-full items-center gap-2 p-4">
      <Icon className={cn(ICON_CLASS, iconClassName)} />
      <div className="flex flex-col items-start gap-0">
        <p className="text-muted-foreground">{title}</p>
        <CountUp
          preserveValue
          redraw={false}
          end={value}
          decimals={2}
          formattingFn={formatFn}
          className="text-2xl"
        />
      </div>
    </Card>
  );
}
