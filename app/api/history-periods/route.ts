import { requireApiUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { YearRow } from "@/lib/types";

export async function GET(_request: Request) {
  const authResult = await requireApiUserId();
  if (authResult.error) {
    return authResult.error;
  }

  const periods = await getHistoryPeriods(authResult.userId);
  return Response.json(periods);
}

export type GetHistoryPeriodsResponseType = Awaited<
  ReturnType<typeof getHistoryPeriods>
>;

async function getHistoryPeriods(userId: string) {
  const currentYear = new Date().getFullYear();

  const result: YearRow[] = await prisma.monthHistory.findMany({
    where: {
      userId,
    },
    select: {
      year: true,
    },
    distinct: ["year"],
    orderBy: [
      {
        year: "asc",
      },
    ],
  });

  const years = result.map((el: YearRow) => el.year);
  // Always include the current year, and fill gaps from earliest data → now
  // so the History dropdown stays usable even with no txs this year.
  const minYear = years.length > 0 ? Math.min(...years, currentYear) : currentYear;
  const maxYear = years.length > 0 ? Math.max(...years, currentYear) : currentYear;

  return Array.from(
    { length: maxYear - minYear + 1 },
    (_, index) => minYear + index
  );
}
