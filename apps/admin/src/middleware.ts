import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Deny-by-default: protect everything except the sign-in page and internal service-to-service routes.
// Never use an allow-list approach for an admin app — a new page added
// outside the pattern would be silently public.
// /api/internal/* is protected by X-Deploy-Secret instead of Clerk session tokens.
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/api/internal/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|api/health|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api(?!/health)|trpc)(.*)',
  ],
};
