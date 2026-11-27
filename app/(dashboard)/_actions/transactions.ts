"use server";

import { requireActionUser } from "@/lib/auth";
import { computeAmountInBase, getFxRate } from "@/lib/fx";
import { toDecimal } from "@/lib/money";
import prisma from "@/lib/prisma";
import {
  CreateTransactionSchema,
  CreateTransactionSchemaType,
} from "@/schema/transaction";

export async function CreateTransaction(form: CreateTransactionSchemaType) {
  const parsedBody = CreateTransactionSchema.safeParse(form);
  if (!parsedBody.success) {
    throw new Error("bad request");
  }

  const user = await requireActionUser();

  const { amount, category, date, description, type, currency } =
    parsedBody.data;

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });
  if (!settings) {
    throw new Error("user settings not found");
  }

  // Scope category by user + name + type (prevents cross-type icon/name mixups).
  const categoryRow = await prisma.category.findFirst({
    where: {
      userId: user.id,
      name: category,
      type,
    },
  });

  if (!categoryRow) {
    throw new Error("category not found");
  }

  const fxRate = await getFxRate(currency, settings.currency, date);
  const amountInBase = computeAmountInBase(amount, fxRate);
  const fxRateAt = new Date();
  const amountDec = toDecimal(amount);
  const amountInBaseDec = toDecimal(amountInBase);
  const fxRateDec = toDecimal(fxRate);

  // NOTE: don't make confusion between $transaction ( prisma ) and prisma.transaction (table)

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount: amountDec,
        currency,
        amountInBase: amountInBaseDec,
        fxRate: fxRateDec,
        fxRateAt,
        date,
        description: description || "",
        type,
        category: categoryRow.name,
        categoryIcon: categoryRow.icon,
      },
    }),

    prisma.monthHistory.upsert({
      where: {
        day_month_year_userId: {
          userId: user.id,
          day: date.getUTCDate(),
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
        },
      },
      create: {
        userId: user.id,
        day: date.getUTCDate(),
        month: date.getUTCMonth(),
        year: date.getUTCFullYear(),
        expense: type === "expense" ? amountInBaseDec : toDecimal(0),
        income: type === "income" ? amountInBaseDec : toDecimal(0),
      },
      update: {
        expense: {
          increment: type === "expense" ? amountInBaseDec : toDecimal(0),
        },
        income: {
          increment: type === "income" ? amountInBaseDec : toDecimal(0),
        },
      },
    }),

    prisma.yearHistory.upsert({
      where: {
        month_year_userId: {
          userId: user.id,
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
        },
      },
      create: {
        userId: user.id,
        month: date.getUTCMonth(),
        year: date.getUTCFullYear(),
        expense: type === "expense" ? amountInBaseDec : toDecimal(0),
        income: type === "income" ? amountInBaseDec : toDecimal(0),
      },
      update: {
        expense: {
          increment: type === "expense" ? amountInBaseDec : toDecimal(0),
        },
        income: {
          increment: type === "income" ? amountInBaseDec : toDecimal(0),
        },
      },
    }),
  ]);
}
