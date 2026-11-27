"use server";

import { requireActionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DeleteTransactionIdSchema } from "@/schema/transaction";

export async function DeleteTransaction(id: string) {
  const parsedId = DeleteTransactionIdSchema.safeParse(id);
  if (!parsedId.success) {
    throw new Error("bad request");
  }

  const user = await requireActionUser();

  const transaction = await prisma.transaction.findUnique({
    where: {
      userId: user.id,
      id: parsedId.data,
    },
  });

  if (!transaction) {
    throw new Error("bad request");
  }

  await prisma.$transaction([
    prisma.transaction.delete({
      where: {
        id: parsedId.data,
        userId: user.id,
      },
    }),
    prisma.monthHistory.update({
      where: {
        day_month_year_userId: {
          userId: user.id,
          day: transaction.date.getUTCDate(),
          month: transaction.date.getUTCMonth(),
          year: transaction.date.getUTCFullYear(),
        },
      },
      data: {
        ...(transaction.type === "expense" && {
          expense: {
            decrement: transaction.amountInBase,
          },
        }),
        ...(transaction.type === "income" && {
          income: {
            decrement: transaction.amountInBase,
          },
        }),
      },
    }),
    prisma.yearHistory.update({
      where: {
        month_year_userId: {
          userId: user.id,
          month: transaction.date.getUTCMonth(),
          year: transaction.date.getUTCFullYear(),
        },
      },
      data: {
        ...(transaction.type === "expense" && {
          expense: {
            decrement: transaction.amountInBase,
          },
        }),
        ...(transaction.type === "income" && {
          income: {
            decrement: transaction.amountInBase,
          },
        }),
      },
    }),
  ]);
}
