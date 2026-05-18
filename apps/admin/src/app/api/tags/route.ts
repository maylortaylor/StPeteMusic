import { auth } from '@clerk/nextjs/server';
import { getDb, sql } from '@stpetemusic/db';

type TagEntry = { value: string; count: number };

function mergeWithDefinitions(inUse: TagEntry[], defined: TagEntry[]): TagEntry[] {
  const map = new Map<string, number>();
  for (const { value, count } of inUse) map.set(value, count);
  for (const { value } of defined) {
    if (!map.has(value)) map.set(value, 0);
  }
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export async function GET(_request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const db = getDb();

    const [artistGenres, artistTags, eventTypes, venueTags, definitions] = await Promise.all([
      db.execute(sql`
        SELECT UNNEST(genres) AS value, COUNT(*)::int AS count
        FROM artists WHERE genres IS NOT NULL
        GROUP BY 1 ORDER BY 2 DESC, 1 ASC
      `),
      db.execute(sql`
        SELECT UNNEST(tags) AS value, COUNT(*)::int AS count
        FROM artists WHERE tags IS NOT NULL
        GROUP BY 1 ORDER BY 2 DESC, 1 ASC
      `),
      db.execute(sql`
        SELECT tag AS value, COUNT(*)::int AS count
        FROM events WHERE tag IS NOT NULL AND tag <> ''
        GROUP BY 1 ORDER BY 2 DESC, 1 ASC
      `),
      db.execute(sql`
        SELECT UNNEST(tags) AS value, COUNT(*)::int AS count
        FROM venues WHERE tags IS NOT NULL
        GROUP BY 1 ORDER BY 2 DESC, 1 ASC
      `),
      db.execute(sql`
        SELECT type, value FROM tag_definitions ORDER BY value ASC
      `),
    ]);

    const defsByType: Record<string, TagEntry[]> = {};
    for (const row of definitions.rows as { type: string; value: string }[]) {
      (defsByType[row.type] ??= []).push({ value: row.value, count: 0 });
    }

    return Response.json({
      artistGenres: mergeWithDefinitions(artistGenres.rows as TagEntry[], defsByType['artistGenre'] ?? []),
      artistTags:   mergeWithDefinitions(artistTags.rows as TagEntry[],   defsByType['artistTag'] ?? []),
      eventTypes:   mergeWithDefinitions(eventTypes.rows as TagEntry[],   defsByType['eventType'] ?? []),
      venueTags:    mergeWithDefinitions(venueTags.rows as TagEntry[],    defsByType['venueTag'] ?? []),
    });
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return Response.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
