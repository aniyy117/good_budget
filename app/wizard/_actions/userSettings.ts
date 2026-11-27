"use server";

import { requireActionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UpdateUserCurrencySchema } from "@/schema/userSettings";
import { revalidatePath } from "next/cache";

export async function UpdateUserCurrency(currency: string) {
  const parsedBody = UpdateUserCurrencySchema.safeParse({
    currency,
  });

  if (!parsedBody.success) {
    throw new Error("bad request");
  }

  const user = await requireActionUser();
  const nextCurrency = parsedBody.data.currency as string;

  // Upsert so first currency choice creates settings (onboarding) without a side-effecting GET.
  const userSettings = await prisma.userSettings.upsert({
    where: {
      userId: user.id,
    },
    update: {
      currency: nextCurrency,
    },
    create: {
      userId: user.id,
      currency: nextCurrency,
    },
  });

  revalidatePath("/");
  revalidatePath("/wizard");
  revalidatePath("/manage");

  return userSettings;
}
