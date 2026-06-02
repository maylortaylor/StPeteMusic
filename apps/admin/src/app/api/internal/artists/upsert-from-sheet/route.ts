import {
  and,
  artist_links,
  artists,
  eq,
  getDb,
  ilike,
  logError,
  sql,
} from '@stpetemusic/db';

interface UpsertFromSheetBody {
  bandName: string;
  instagramHandle: string;
  artistType?: string;
  email?: string;
  description?: string;
  homeBase?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  bandcampUrl?: string;
  soundcloudUrl?: string;
  linktreeUrl?: string;
  bandsintownUrl?: string;
  websiteUrl?: string;
  customLinkLabel?: string;
  customLinkUrl?: string;
  sheetRowIndex?: number;
}

type PlatformLink = { platform: string; url: string; label: string };

export async function POST(request: Request) {
  // Step 1 — Auth
  const secret = request.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Step 2 — Parse + validate
  let body: UpsertFromSheetBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { bandName, instagramHandle } = body;
  if (!bandName?.trim() || !instagramHandle?.trim()) {
    return Response.json(
      { success: false, error: 'bandName and instagramHandle are required' },
      { status: 400 },
    );
  }

  const db = getDb();

  // Step 3 — Fuzzy match artist
  // Normalize handle: strip leading '@', lowercase
  const normalizedHandle = instagramHandle.replace(/^@/, '').toLowerCase();

  // Priority 1: instagram_handle (normalize on DB side too)
  let matchedRows = await db
    .select()
    .from(artists)
    .where(
      sql`LOWER(REPLACE(COALESCE(${artists.instagram_handle}, ''), '@', '')) = ${normalizedHandle}`,
    )
    .limit(2);

  let matchedOn: 'instagram' | 'name' = 'instagram';

  // Priority 2: band name ILIKE
  if (matchedRows.length === 0) {
    matchedRows = await db
      .select()
      .from(artists)
      .where(ilike(artists.name, `%${bandName.trim()}%`))
      .limit(2);
    matchedOn = 'name';
  }

  if (matchedRows.length === 0) {
    return Response.json({
      success: false,
      matchedOn: 'unmatched',
      reason: `No artist found matching handle "${instagramHandle}" or name "${bandName}"`,
    });
  }

  // Warn if multiple name matches — take first, don't silently pick wrong artist
  if (matchedRows.length > 1) {
    logError({
      app: 'admin',
      level: 'warn',
      path: '/api/internal/artists/upsert-from-sheet',
      message: `Multiple artists matched name "${bandName}" — using first result`,
      metadata: {
        bandName,
        instagramHandle,
        matchedIds: matchedRows.map((a) => a.id),
        sheetRowIndex: body.sheetRowIndex,
      },
    });
  }

  const matched = matchedRows[0];

  // Step 4 — Upsert non-URL fields on artists (skip empty values — never overwrite with null)
  const artistUpdates: {
    instagram_handle?: string;
    email?: string;
    description?: string;
    home_base?: string;
  } = {};

  const cleanHandle = instagramHandle.replace(/^@/, '');
  if (cleanHandle) artistUpdates.instagram_handle = cleanHandle;
  if (body.email?.trim()) artistUpdates.email = body.email.trim();
  if (body.description?.trim()) artistUpdates.description = body.description.trim();
  if (body.homeBase?.trim()) artistUpdates.home_base = body.homeBase.trim();

  if (Object.keys(artistUpdates).length > 0) {
    await db.update(artists).set(artistUpdates).where(eq(artists.id, matched.id));
  }

  // Step 5 — Upsert artist_links for all non-empty platform URLs
  const platformLinks: PlatformLink[] = [];

  if (body.instagramUrl?.trim())
    platformLinks.push({ platform: 'instagram', url: body.instagramUrl.trim(), label: 'Instagram' });
  if (body.facebookUrl?.trim())
    platformLinks.push({ platform: 'facebook', url: body.facebookUrl.trim(), label: 'Facebook' });
  if (body.youtubeUrl?.trim())
    platformLinks.push({ platform: 'youtube', url: body.youtubeUrl.trim(), label: 'YouTube' });
  if (body.spotifyUrl?.trim())
    platformLinks.push({ platform: 'spotify', url: body.spotifyUrl.trim(), label: 'Spotify' });
  if (body.bandcampUrl?.trim())
    platformLinks.push({ platform: 'bandcamp', url: body.bandcampUrl.trim(), label: 'Bandcamp' });
  if (body.soundcloudUrl?.trim())
    platformLinks.push({ platform: 'soundcloud', url: body.soundcloudUrl.trim(), label: 'SoundCloud' });
  if (body.linktreeUrl?.trim())
    platformLinks.push({ platform: 'linktree', url: body.linktreeUrl.trim(), label: 'Linktree' });
  if (body.bandsintownUrl?.trim())
    platformLinks.push({ platform: 'bandsintown', url: body.bandsintownUrl.trim(), label: 'Bandsintown' });
  if (body.websiteUrl?.trim())
    platformLinks.push({ platform: 'website', url: body.websiteUrl.trim(), label: 'Website' });
  if (body.customLinkUrl?.trim()) {
    platformLinks.push({
      platform: 'custom',
      url: body.customLinkUrl.trim(),
      label: body.customLinkLabel?.trim() || 'Custom Link',
    });
  }

  for (const link of platformLinks) {
    const [existing] = await db
      .select({ id: artist_links.id })
      .from(artist_links)
      .where(
        and(
          eq(artist_links.artist_id, matched.id),
          eq(artist_links.platform, link.platform),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(artist_links)
        .set({
          url: link.url,
          ...(link.platform === 'custom' ? { label: link.label } : {}),
        })
        .where(eq(artist_links.id, existing.id));
    } else {
      const [{ maxOrder }] = await db
        .select({
          maxOrder: sql<number>`COALESCE(MAX(${artist_links.display_order}), -1)`,
        })
        .from(artist_links)
        .where(eq(artist_links.artist_id, matched.id));

      await db.insert(artist_links).values({
        artist_id: matched.id,
        platform: link.platform,
        url: link.url,
        label: link.label,
        // pg driver may return the aggregate as a string — Number() ensures integer math
        display_order: Number(maxOrder) + 1,
        is_active: true,
        is_featured: false,
      });
    }
  }

  // Step 6 — Bust ISR cache (fire-and-forget — don't fail the sync if revalidation errors)
  if (matched.slug) {
    const webUrl = process.env.WEB_APP_URL ?? 'https://www.stpetemusic.live';
    fetch(`${webUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.REVALIDATION_SECRET ?? ''}`,
      },
      body: JSON.stringify({ slug: matched.slug }),
    }).catch((err: unknown) =>
      console.error('[upsert-from-sheet] revalidate failed:', err),
    );
  }

  return Response.json({ success: true, artistId: matched.id, matchedOn });
}
