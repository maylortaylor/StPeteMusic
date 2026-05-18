import { auth } from '@clerk/nextjs/server';
import { getDb, sql } from '@stpetemusic/db';

type TagType = 'artistGenre' | 'artistTag' | 'eventType' | 'venueTag';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { type, from, to } = (await request.json()) as {
      type: TagType;
      from: string;
      to: string | null;
    };

    if (!type || !from) {
      return Response.json({ error: 'Missing required fields: type, from' }, { status: 400 });
    }

    const db = getDb();
    let result: { rowCount: number | null };

    if (type === 'artistGenre') {
      if (to === null) {
        result = await db.execute(
          sql`UPDATE artists SET genres = array_remove(genres, ${from}) WHERE ${from} = ANY(genres)`,
        );
      } else {
        result = await db.execute(
          sql`UPDATE artists SET genres = array_replace(genres, ${from}, ${to}) WHERE ${from} = ANY(genres)`,
        );
      }
    } else if (type === 'artistTag') {
      if (to === null) {
        result = await db.execute(
          sql`UPDATE artists SET tags = array_remove(tags, ${from}) WHERE ${from} = ANY(tags)`,
        );
      } else {
        result = await db.execute(
          sql`UPDATE artists SET tags = array_replace(tags, ${from}, ${to}) WHERE ${from} = ANY(tags)`,
        );
      }
    } else if (type === 'eventType') {
      if (to === null) {
        result = await db.execute(
          sql`UPDATE events SET tag = NULL WHERE tag = ${from}`,
        );
      } else {
        result = await db.execute(
          sql`UPDATE events SET tag = ${to} WHERE tag = ${from}`,
        );
      }
    } else if (type === 'venueTag') {
      if (to === null) {
        result = await db.execute(
          sql`UPDATE venues SET tags = array_remove(tags, ${from}) WHERE ${from} = ANY(tags)`,
        );
      } else {
        result = await db.execute(
          sql`UPDATE venues SET tags = array_replace(tags, ${from}, ${to}) WHERE ${from} = ANY(tags)`,
        );
      }
    } else {
      return Response.json({ error: 'Invalid tag type' }, { status: 400 });
    }

    return Response.json({ updated: result.rowCount ?? 0 });
  } catch (error) {
    console.error('Failed to rename/delete tag:', error);
    return Response.json({ error: 'Failed to rename/delete tag' }, { status: 500 });
  }
}
