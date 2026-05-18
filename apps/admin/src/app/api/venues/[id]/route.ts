import { auth } from '@clerk/nextjs/server';
import { getDb, venues, eq } from '@stpetemusic/db';

async function triggerRevalidation(slug: string, oldSlug?: string) {
  const webAppUrl = process.env.WEB_APP_URL;
  const secret = process.env.REVALIDATION_SECRET;
  if (!webAppUrl || !secret) return;
  try {
    await fetch(`${webAppUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({ slug, oldSlug }),
    });
  } catch (err) {
    console.error('Revalidation request failed:', err);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const result = await db
      .select()
      .from(venues)
      .where(eq(venues.id, id));

    if (result.length === 0) {
      return Response.json({ error: 'Venue not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to fetch venue:', error);
    return Response.json(
      { error: 'Failed to fetch venue' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const db = getDb();

    const current = await db.select({ slug: venues.slug }).from(venues).where(eq(venues.id, id));
    const oldSlug = current[0]?.slug ?? undefined;

    const result = await db
      .update(venues)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description,
        address: data.address,
        neighborhood: data.neighborhood,
        av_setup: data.av_setup,
        partnership_level: data.partnership_level,
        contact_name: data.contact_name,
        phone: data.phone,
        email: data.email,
        capacity: data.capacity,
        tags: data.tags ?? [],
        instagram_url: data.instagram_url,
        instagram_username: data.instagram_username,
        facebook_url: data.facebook_url,
        facebook_username: data.facebook_username,
        website: data.website,
        hero_photo_url: data.hero_photo_url,
        lat: data.lat != null ? String(data.lat) : undefined,
        lng: data.lng != null ? String(data.lng) : undefined,
        extra_links: data.extra_links ?? [],
        notes: data.notes,
        is_active: data.is_active,
        visible_on_website: data.visible_on_website,
        facebook_page_id: data.facebook_page_id,
        instagram_page_id: data.instagram_page_id,
        google_calendar_id: data.google_calendar_id,
        events_sources: data.events_sources ?? [],
      })
      .where(eq(venues.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Venue not found' }, { status: 404 });
    }

    await triggerRevalidation(result[0].slug, oldSlug);

    return Response.json(result[0]);
  } catch (error) {
    const pg = error as Record<string, unknown>;
    const detail = [
      pg.code,
      pg.message ?? String(error),
      pg.detail,
      pg.hint,
    ].filter(Boolean).join(' | ');
    console.error('Failed to update venue:', detail);
    return Response.json(
      { error: 'Failed to update venue', detail },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const db = getDb();

    const updateData: Record<string, unknown> = {};
    if ('is_active' in data) updateData.is_active = data.is_active;
    if ('visible_on_website' in data) updateData.visible_on_website = data.visible_on_website;

    const result = await db
      .update(venues)
      .set(updateData)
      .where(eq(venues.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Venue not found' }, { status: 404 });
    }

    await triggerRevalidation(result[0].slug);

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to update venue:', error);
    return Response.json(
      { error: 'Failed to update venue' },
      { status: 500 },
    );
  }
}
