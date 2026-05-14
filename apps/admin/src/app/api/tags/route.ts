import { auth } from '@clerk/nextjs/server';
import { getDb, sql } from '@stpetemusic/db';

export async function GET(_request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const db = getDb();

    const [artistGenres, artistTags, eventTypes, venueTags] = await Promise.all([
      db.execute(sql`
        SELECT UNNEST(genres) AS value, COUNT(*)::int AS count
        FROM artists
        WHERE genres IS NOT NULL
        GROUP BY 1
        ORDER BY 2 DESC, 1 ASC
      `),
      db.execute(sql`
        SELECT UNNEST(tags) AS value, COUNT(*)::int AS count
        FROM artists
        WHERE tags IS NOT NULL
        GROUP BY 1
        ORDER BY 2 DESC, 1 ASC
      `),
      db.execute(sql`
        SELECT tag AS value, COUNT(*)::int AS count
        FROM events
        WHERE tag IS NOT NULL AND tag <> ''
        GROUP BY 1
        ORDER BY 2 DESC, 1 ASC
      `),
      db.execute(sql`
        SELECT UNNEST(tags) AS value, COUNT(*)::int AS count
        FROM venues
        WHERE tags IS NOT NULL
        GROUP BY 1
        ORDER BY 2 DESC, 1 ASC
      `),
    ]);

    return Response.json({
      artistGenres: artistGenres.rows,
      artistTags: artistTags.rows,
      eventTypes: eventTypes.rows,
      venueTags: venueTags.rows,
    });
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return Response.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
