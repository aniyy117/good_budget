import { requireApiUserId } from "@/lib/auth";
import { GetFormatterForCurrency } from "@/lib/helpers";
import prisma from "@/lib/prisma";
import type { Transaction } from "@/lib/types";
import { OverviewQuerySchema } from "@/schema/overview";

export async function GET(request: Request) {
  const authResult = await requireApiUserId();
  if (authResult.error) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const queryParams = OverviewQuerySchema.safeParse({
    from,
    to,
  });

  if (!queryParams.success) {
    return Response.json({ error: "Invalid date range" }, { status: 400 });
  }

  const transactions = await getTransactionsHistory(
    authResult.userId,
    queryParams.data.from,
    queryParams.data.to
  );

  if (transactions === null) {
    return Response.json({ error: "User settings not found" }, { status: 404 });
  }

  return Response.json(transactions);
}

export type GetTransactionHistoryResponseType = NonNullable<
  Awaited<ReturnType<typeof getTransactionsHistory>>
>;

async function getTransactionsHistory(userId: string, from: Date, to: Date) {
  const userSettings = await prisma.userSettings.findUnique({
    where: {
      userId,
    },
  });
  if (!userSettings) {
    return null;
  }

  const baseCurrency = userSettings.currency;
  const baseFormatter = GetFormatterForCurrency(baseCurrency);

  const transactions: Transaction[] = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: from,
        lte: to,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return transactions.map((transaction: Transaction) => {
    const formattedAmount = GetFormatterForCurrency(
      transaction.currency
    ).format(transaction.amount);
    const showBaseEquivalent = transaction.currency !== baseCurrency;
    return {
      ...transaction,
      formattedAmount,
      ...(showBaseEquivalent && {
        formattedAmountInBase: baseFormatter.format(transaction.amountInBase),
      }),
    };
  });
}
