import { requireApiUserId } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import prisma from "@/lib/prisma";
import type { CategoryStatsRow } from "@/lib/types";
import { OverviewQuerySchema } from "@/schema/overview";

export type { CategoryStatsRow };

export async function GET(request: Request) {
  const authResult = await requireApiUserId();
  if (authResult.error) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const queryParams = OverviewQuerySchema.safeParse({ from, to });
  if (!queryParams.success) {
    return Response.json({ error: "Invalid date range" }, { status: 400 });
  }

  const stats = await getCategoriesStats(
    authResult.userId,
    queryParams.data.from,
    queryParams.data.to
  );
  return Response.json(stats);
}

export type GetCategoriesStatsResponseType = Awaited<
  ReturnType<typeof getCategoriesStats>
>;

async function getCategoriesStats(
  userId: string,
  from: Date,
  to: Date
): Promise<CategoryStatsRow[]> {
  const stats = await prisma.transaction.groupBy({
    by: ["type", "category", "categoryIcon"] as const,
    where: {
      userId,
      date: {
        gte: from,
        lte: to,
      },
    },
    _sum: {
      amountInBase: true,
    },
    orderBy: {
      _sum: {
        amountInBase: "desc",
      },
    },
  });

  return stats.map((row) => ({
    type: row.type,
    category: row.category,
    categoryIcon: row.categoryIcon,
    _sum: {
      amount: toNumber(row._sum.amountInBase),
    },
  }));
}
