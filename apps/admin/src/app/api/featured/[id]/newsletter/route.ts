import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@clerk/nextjs/server';
import { getDb, featured_artists, artists, ig_mentions, post_stats, eq, desc } from '@stpetemusic/db';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const db = getDb();

    const rows = await db
      .select({
        id: featured_artists.id,
        artist_id: featured_artists.artist_id,
        status: featured_artists.status,
        enrichment_notes: featured_artists.enrichment_notes,
        artist_name: artists.name,
        artist_type: artists.type,
        artist_home_base: artists.home_base,
        artist_genres: artists.genres,
        artist_tags: artists.tags,
      })
      .from(featured_artists)
      .leftJoin(artists, eq(featured_artists.artist_id, artists.id))
      .where(eq(featured_artists.id, id));

    if (rows.length === 0) {
      return Response.json({ error: 'Featured artist not found' }, { status: 404 });
    }

    const record = rows[0];

    if (!record.enrichment_notes) {
      return Response.json({ error: 'Enrichment notes must be approved first' }, { status: 400 });
    }

    const [mentionsResult, statsResult] = await Promise.all([
      db
        .select({ total_mentions: ig_mentions.total_mentions })
        .from(ig_mentions)
        .where(eq(ig_mentions.artist_id, record.artist_id!))
        .limit(1),
      db
        .select({
          platform: post_stats.platform,
          views: post_stats.views,
          likes: post_stats.likes,
          published_at: post_stats.published_at,
        })
        .from(post_stats)
        .where(eq(post_stats.artist_id, record.artist_id!))
        .orderBy(desc(post_stats.published_at))
        .limit(3),
    ]);

    const totalMentions = mentionsResult[0]?.total_mentions ?? 0;
    const recentStats = statsResult.map(
      (s) => `${s.platform}: ${s.views ?? 0} views, ${s.likes ?? 0} likes`,
    );

    const prompt = `You are writing the "Featured Bands" section of the StPeteMusic monthly newsletter.
StPeteMusic is a community music organization in St. Pete, FL supporting local artists. The brand voice is warm, enthusiastic, and community-focused with an orange/creative energy.

Write a short newsletter spotlight for this artist. Keep it to ~100-150 words. Include a call to follow/check them out.

ARTIST INFO:
Name: ${record.artist_name}
Type: ${record.artist_type}
Home Base: ${record.artist_home_base || 'St. Pete, FL'}
Genres: ${(record.artist_genres || []).join(', ') || 'Local music'}
Tags: ${(record.artist_tags || []).join(', ') || ''}

ENRICHMENT NOTES:
${record.enrichment_notes}

ENGAGEMENT DATA:
- Mentioned by @StPeteMusic: ${totalMentions} times
${recentStats.length > 0 ? `- Recent posts: ${recentStats.join(' | ')}` : ''}

Write only the spotlight text — no headers, no intro like "Here is...", just the spotlight copy.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const generated = response.content[0].type === 'text' ? response.content[0].text : '';

    await db
      .update(featured_artists)
      .set({ newsletter_blurb: generated, status: 'newsletter_generated' })
      .where(eq(featured_artists.id, id));

    return Response.json({ blurb: generated });
  } catch (error) {
    console.error('Failed to generate newsletter blurb:', error);
    return Response.json({ error: 'Failed to generate newsletter blurb' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { id } = await params;
    const { newsletterBlurb } = await request.json();

    if (!newsletterBlurb?.trim()) {
      return Response.json({ error: 'newsletterBlurb is required' }, { status: 400 });
    }

    const db = getDb();
    const result = await db
      .update(featured_artists)
      .set({
        newsletter_blurb: newsletterBlurb.trim(),
        status: 'newsletter_approved',
      })
      .where(eq(featured_artists.id, id))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: 'Featured artist not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Failed to approve newsletter blurb:', error);
    return Response.json({ error: 'Failed to approve newsletter blurb' }, { status: 500 });
  }
}
