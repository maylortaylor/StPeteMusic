import { auth } from '@clerk/nextjs/server';
import { getDb, sql } from '@stpetemusic/db';
import { z } from 'zod';

const schema = z.object({
  type: z.enum(['artistGenre', 'artistTag', 'eventType', 'venueTag']),
  value: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { type, value } = parsed.data;
    const db = getDb();

    const existing = await db.execute(sql`
      SELECT id FROM tag_definitions WHERE type = ${type} AND value = ${value}
    `);

    if (existing.rows.length > 0) {
      return Response.json({ exists: true });
    }

    await db.execute(sql`
      INSERT INTO tag_definitions (type, value) VALUES (${type}, ${value})
    `);

    return Response.json({ created: true });
  } catch (error) {
    console.error('Failed to define tag:', error);
    return Response.json({ error: 'Failed to define tag' }, { status: 500 });
  }
}
