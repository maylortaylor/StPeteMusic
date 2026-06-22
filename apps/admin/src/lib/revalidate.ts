// Busts the web app's cache for whatever this scope covers.
// No scope: the default branch on the web app's /api/revalidate already
// covers /events. 'tickets': also busts the eventbrite-events and
// featured-tickets tags backing /tickets' two cached data sources.
export async function revalidateWebApp(scope?: 'tickets'): Promise<void> {
  const webAppUrl = process.env.WEB_APP_URL;
  const revalidationSecret = process.env.REVALIDATION_SECRET;
  if (!webAppUrl || !revalidationSecret) {
    console.warn('Revalidation skipped: WEB_APP_URL or REVALIDATION_SECRET not set');
    return;
  }
  try {
    const res = await fetch(`${webAppUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${revalidationSecret}`,
      },
      body: JSON.stringify(scope ? { scope } : {}),
    });
    if (!res.ok) {
      console.warn('Revalidation non-ok:', res.status, await res.text());
    }
  } catch (err) {
    console.warn('Revalidation call failed (non-fatal):', err);
  }
}
