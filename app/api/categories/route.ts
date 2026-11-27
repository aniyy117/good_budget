import { requireApiUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: Request) {
  const authResult = requireApiUserId();
  if (authResult.error) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const paramType = searchParams.get("type");

  const validator = z.enum(["expense", "income"]).nullable();

  const queryParams = validator.safeParse(paramType);
  if (!queryParams.success) {
    return Response.json({ error: "Invalid type parameter" }, { status: 400 });
  }

  const type = queryParams.data;
  const categories = await prisma.category.findMany({
    where: {
      userId: authResult.userId,
      ...(type && { type }),
    },
    orderBy: {
      name: "asc",
    },
  });

  return Response.json(categories);
}
