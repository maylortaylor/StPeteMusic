import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@clerk/nextjs/server';
import {
  getDb,
  featured_artists,
  artists,
  blog_posts,
  ig_mentions,
  post_stats,
  eq,
  desc,
} from '@stpetemusic/db';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function triggerRevalidation(path: string) {
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
      body: JSON.stringify({ slug: path }),
    });
  } catch (err) {
    console.error('Revalidation request failed:', err);
  }
}

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
        artist_instagram_url: artists.instagram_url,
        artist_facebook_url: artists.facebook_url,
        artist_bandcamp_url: artists.bandcamp_url,
        artist_spotify_url: artists.spotify_url,
        artist_website: artists.website,
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

    const socialLinks = [
      record.artist_instagram_url && `Instagram: ${record.artist_instagram_url}`,
      record.artist_facebook_url && `Facebook: ${record.artist_facebook_url}`,
      record.artist_bandcamp_url && `Bandcamp: ${record.artist_bandcamp_url}`,
      record.artist_spotify_url && `Spotify: ${record.artist_spotify_url}`,
      record.artist_website && `Website: ${record.artist_website}`,
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `You are writing a blog post for the StPeteMusic website spotlighting a local artist.
StPeteMusic is a community music organization in St. Pete, FL. The tone is warm, enthusiastic, and community-focused.

Write a blog post spotlight for this artist. Target 400-600 words. Structure: intro hook → history/background → music style/sound → why to check them out → call to action with links.

Do not include markdown headers (no ## headings). Write flowing paragraphs. End with a "Find [Artist Name]:" section listing their social links.

ARTIST INFO:
Name: ${record.artist_name}
Type: ${record.artist_type}
Home Base: ${record.artist_home_base || 'St. Pete, FL'}
Genres: ${(record.artist_genres || []).join(', ') || 'Local music'}

ENRICHMENT NOTES:
${record.enrichment_notes}

SOCIAL LINKS:
${socialLinks || 'None provided'}

ENGAGEMENT DATA:
- Featured/mentioned by @StPeteMusic: ${totalMentions} times
${recentStats.length > 0 ? `- Recent posts: ${recentStats.join(' | ')}` : ''}

Write only the blog post body — no title, no "Here is...", just the article text starting with the first paragraph.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const generated = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    const suggestedTitle = `Spotlight: ${record.artist_name}`;

    await db
      .update(featured_artists)
      .set({ status: 'blog_generated' })
      .where(eq(featured_artists.id, id));

    return Response.json({ title: suggestedTitle, body: generated });
  } catch (error) {
    console.error('Failed to generate blog post:', error);
    return Response.json({ error: 'Failed to generate blog post' }, { status: 500 });
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
    const { title, excerpt, body, featuredImageUrl, publishDate, tags } = await request.json();

    if (!title?.trim() || !body?.trim()) {
      return Response.json({ error: 'title and body are required' }, { status: 400 });
    }

    const db = getDb();

    const featuredRows = await db
      .select({
        id: featured_artists.id,
        artist_id: featured_artists.artist_id,
        artist_name: artists.name,
      })
      .from(featured_artists)
      .leftJoin(artists, eq(featured_artists.artist_id, artists.id))
      .where(eq(featured_artists.id, id));

    if (featuredRows.length === 0) {
      return Response.json({ error: 'Featured artist not found' }, { status: 404 });
    }

    const record = featuredRows[0];
    const slug = generateSlug(title.trim());
    const values = {
      post_type: 'artist_spotlight' as const,
      title: title.trim(),
      slug,
      excerpt: excerpt?.trim() || null,
      body: body.trim(),
      featured_image_url: featuredImageUrl || null,
      tags: tags || [],
      status: 'approved' as const,
      publish_date: publishDate ? new Date(publishDate) : null,
      artist_id: record.artist_id,
      featured_artist_id: id,
    };

    const existing = await db
      .select({ id: blog_posts.id })
      .from(blog_posts)
      .where(eq(blog_posts.featured_artist_id, id));

    const blogResult = existing.length > 0
      ? await db.update(blog_posts).set(values).where(eq(blog_posts.featured_artist_id, id)).returning()
      : await db.insert(blog_posts).values(values).returning();

    await db
      .update(featured_artists)
      .set({ status: 'blog_approved' })
      .where(eq(featured_artists.id, id));

    await triggerRevalidation(`/blog/${slug}`);

    return Response.json(blogResult[0], { status: 201 });
  } catch (error) {
    const pg = error as Record<string, unknown>;
    if (pg.code === '23505') {
      return Response.json({ error: 'A blog post with this title/slug already exists' }, { status: 409 });
    }
    console.error('Failed to approve blog post:', error);
    return Response.json({ error: 'Failed to approve blog post' }, { status: 500 });
  }
}
