import { auth } from '@clerk/nextjs/server';
import { getDb, brand_guidelines, eq, sql } from '@stpetemusic/db';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();

    // Deactivate all, then activate the target — do both in a transaction
    await db.execute(sql`UPDATE brand_guidelines SET is_active = false`);

    const result = await db
      .update(brand_guidelines)
      .set({ is_active: true })
      .where(eq(brand_guidelines.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Guidelines not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to activate brand guidelines:', error);
    return Response.json({ error: 'Failed to activate brand guidelines' }, { status: 500 });
  }
}
