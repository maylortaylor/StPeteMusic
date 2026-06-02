import { auth } from '@clerk/nextjs/server';
import { getDb, artists, artist_links, eq, inArray } from '@stpetemusic/db';

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
  request: Request,
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
      .from(artists)
      .where(eq(artists.id, id));

    if (result.length === 0) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to fetch artist:', error);
    return Response.json(
      { error: 'Failed to fetch artist' },
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

    const current = await db.select({ slug: artists.slug }).from(artists).where(eq(artists.id, id));
    const oldSlug = current[0]?.slug ?? undefined;

    const result = await db
      .update(artists)
      .set({
        name: data.name,
        slug: data.slug,
        type: data.type,
        description: data.description,
        username: data.username,
        instagram_handle: data.instagram_handle,
        home_base: data.home_base,
        hero_photo_url: data.hero_photo_url,
        genres: data.genres,
        tags: data.tags,
        notes: data.notes,
        is_active: data.is_active,
        visible_on_website: data.visible_on_website,
      })
      .where(eq(artists.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Sync artist_links when the form submits a links array
    if (Array.isArray(data.links)) {
      type LinkInput = {
        id?: string;
        platform: string;
        url: string;
        label: string;
        display_order: number;
        is_featured: boolean;
      };
      const incoming = data.links as LinkInput[];
      const existingLinks = await db
        .select({ id: artist_links.id })
        .from(artist_links)
        .where(eq(artist_links.artist_id, id));

      const incomingIds = incoming.filter((l) => l.id).map((l) => l.id as string);
      const toDelete = existingLinks.map((l) => l.id).filter((linkId) => !incomingIds.includes(linkId));

      if (toDelete.length > 0) {
        await db.delete(artist_links).where(inArray(artist_links.id, toDelete));
      }

      for (const link of incoming) {
        if (link.id) {
          await db
            .update(artist_links)
            .set({ display_order: link.display_order, is_featured: link.is_featured, label: link.label, url: link.url })
            .where(eq(artist_links.id, link.id));
        } else {
          await db.insert(artist_links).values({
            artist_id: id,
            platform: link.platform,
            url: link.url,
            label: link.label,
            display_order: link.display_order,
            is_featured: link.is_featured,
            is_active: true,
          });
        }
      }
    }

    await triggerRevalidation(result[0].slug, oldSlug);

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to update artist:', error);
    return Response.json(
      { error: 'Failed to update artist' },
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

    const updateData: Record<string, any> = {};
    if ('is_active' in data) updateData.is_active = data.is_active;
    if ('visible_on_website' in data) updateData.visible_on_website = data.visible_on_website;

    const result = await db
      .update(artists)
      .set(updateData)
      .where(eq(artists.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }

    await triggerRevalidation(result[0].slug);

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to update artist:', error);
    return Response.json(
      { error: 'Failed to update artist' },
      { status: 500 },
    );
  }
}
