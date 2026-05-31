import { getDb, artists, eq } from '@stpetemusic/db';
import { buildEnrichmentStatus } from '@/lib/artist-links';

interface CoverImageCandidate {
  url: string;
  source: string;
  platform: string;
}

export async function POST(request: Request) {
  try {
    const secret = process.env.N8N_WEBHOOK_SECRET;
    if (!secret) {
      console.error('N8N_WEBHOOK_SECRET is not configured');
      return new Response('Forbidden', { status: 403 });
    }
    const incomingSecret = request.headers.get('x-webhook-secret');
    if (incomingSecret !== secret) {
      return new Response('Forbidden', { status: 403 });
    }

    const body = await request.json() as {
      artistId?: string;
      scrapedRaw?: Record<string, string | null>;
      synthesizedNotes?: string | null;
      coverImageCandidates?: CoverImageCandidate[];
      hasError?: boolean;
    };

    const { artistId, scrapedRaw, synthesizedNotes, coverImageCandidates, hasError } = body;

    if (!artistId) {
      return Response.json({ error: 'artistId is required' }, { status: 400 });
    }

    const db = getDb();

    const existing = await db
      .select({ id: artists.id, extra_data: artists.extra_data })
      .from(artists)
      .where(eq(artists.id, artistId));

    if (existing.length === 0) {
      return Response.json({ error: 'Artist not found' }, { status: 404 });
    }

    const currentExtraData = (existing[0].extra_data ?? {}) as Record<string, unknown>;
    const status = buildEnrichmentStatus(hasError ?? false);

    await db
      .update(artists)
      .set({
        enrichment_status: status,
        extra_data: {
          ...currentExtraData,
          enrichment: {
            scrapedRaw: scrapedRaw ?? {},
            synthesizedNotes: synthesizedNotes ?? null,
            coverImageCandidates: coverImageCandidates ?? [],
          },
        },
      })
      .where(eq(artists.id, artistId));

    return Response.json({ received: true, status });
  } catch (error) {
    console.error('Failed to process standalone enrichment callback:', error);
    return Response.json({ error: 'Failed to process enrichment callback' }, { status: 500 });
  }
}
