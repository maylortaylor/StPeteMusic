import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Deny-by-default: protect everything except the sign-in page.
// Never use an allow-list approach for an admin app — a new page added
// outside the pattern would be silently public.
const isPublicRoute = createRouteMatcher(['/sign-in(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|api/health|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api(?!/health)|trpc)(.*)',
  ],
};
