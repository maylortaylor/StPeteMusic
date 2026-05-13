import { auth } from '@clerk/nextjs/server';
import { getDb, venues } from '@stpetemusic/db';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const db = getDb();
    const result = await db
      .select()
      .from(venues)
      .orderBy(asc(venues.name))
      .limit(200);

    return Response.json({ venues: result });
  } catch (error) {
    console.error('Failed to fetch venues:', error);
    return Response.json(
      { error: 'Failed to fetch venues' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const db = getDb();

    const result = await db
      .insert(venues)
      .values({
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
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
        is_active: data.is_active ?? true,
        visible_on_website: data.visible_on_website ?? false,
        facebook_page_id: data.facebook_page_id,
        instagram_page_id: data.instagram_page_id,
        google_calendar_id: data.google_calendar_id,
        events_sources: data.events_sources ?? [],
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create venue:', error);
    return Response.json(
      { error: 'Failed to create venue' },
      { status: 500 },
    );
  }
}
