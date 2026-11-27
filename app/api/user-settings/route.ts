import { requireApiUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_request: Request) {
  const authResult = await requireApiUserId();
  if (authResult.error) {
    return authResult.error;
  }

  const userSettings = await prisma.userSettings.findUnique({
    where: {
      userId: authResult.userId,
    },
  });

  // Read-only: missing settings means onboarding is incomplete (WP5 / BUG-01).
  return Response.json(userSettings);
}
