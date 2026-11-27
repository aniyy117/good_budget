"use server";

import { requireActionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UpdateUserCurrencySchema } from "@/schema/userSettings";

export async function UpdateUserCurrency(currency: string) {
  const parsedBody = UpdateUserCurrencySchema.safeParse({
    currency,
  });

  if (!parsedBody.success) {
    throw new Error("bad request");
  }

  const user = await requireActionUser();

  const userSettings = await prisma.userSettings.update({
    where: {
      userId: user.id,
    },
    data: {
      currency: parsedBody.data.currency as string,
    },
  });

  return userSettings;
}
