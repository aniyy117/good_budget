import { requireApiUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { BalanceGroupRow } from "@/lib/types";
import { OverviewQuerySchema } from "@/schema/overview";

export async function GET(request: Request) {
  const authResult = requireApiUserId();
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

  const stats = await getBalanceStats(
    authResult.userId,
    queryParams.data.from,
    queryParams.data.to
  );

  return Response.json(stats);
}

export type GetBalanceStatsResponseType = Awaited<
  ReturnType<typeof getBalanceStats>
>;

async function getBalanceStats(userId: string, from: Date, to: Date) {
  const totals = await prisma.transaction.groupBy({
    by: ["type"] as const,
    where: {
      userId,
      date: {
        gte: from,
        lte: to,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return {
    expense:
      totals.find((t: BalanceGroupRow) => t.type === "expense")?._sum.amount ||
      0,
    income:
      totals.find((t: BalanceGroupRow) => t.type === "income")?._sum.amount ||
      0,
  };
}
