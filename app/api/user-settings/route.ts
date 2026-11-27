import { requireApiUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET(_request: Request) {
  const authResult = requireApiUserId();
  if (authResult.error) {
    return authResult.error;
  }

  let userSettings = await prisma.userSettings.findUnique({
    where: {
      userId: authResult.userId,
    },
  });

  // Existing product behavior (create-on-GET) preserved; tracked as BUG-01 for WP5.
  if (!userSettings) {
    userSettings = await prisma.userSettings.create({
      data: {
        userId: authResult.userId,
        currency: "INR",
      },
    });
  }

  revalidatePath("/");
  return Response.json(userSettings);
}
