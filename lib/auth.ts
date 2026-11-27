import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export type UnauthorizedJson = {
  error: "Unauthorized";
};

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/**
 * For App Router Route Handlers: return 401 JSON when there is no session.
 * Do not redirect API clients to HTML sign-in pages.
 */
export function requireApiUserId():
  | { userId: string; error?: undefined }
  | { userId?: undefined; error: NextResponse<UnauthorizedJson> } {
  const { userId } = auth();
  if (!userId) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { userId };
}

/**
 * For App Router pages/layouts (Clerk 5.0.x).
 * Prefer redirect-to-sign-in over auth().protect(), which returns 404 for
 * unauthenticated document requests in this SDK version.
 */
export function requirePageAuth(): void {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }
}

/**
 * For Server Actions: resolve the Clerk user or throw (mutation-friendly).
 * Never trust a client-supplied user id.
 */
export async function requireActionUser(): Promise<ClerkUser> {
  const user = await currentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
