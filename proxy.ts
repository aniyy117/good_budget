import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Public routes (Clerk v6 / Next 15 — middleware.ts).
 * Page routes: redirect unauthenticated users to sign-in.
 * API routes: left for Route Handlers to return 401 JSON (no HTML redirect).
 */
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }

  if (isApiRoute(req)) {
    return;
  }

  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
