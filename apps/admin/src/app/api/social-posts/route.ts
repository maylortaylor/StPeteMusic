import { auth } from '@clerk/nextjs/server';
import { getDb, social_posts, artists, eq, desc, and } from '@stpetemusic/db';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    const db = getDb();

    const conditions = [];
    if (platform) conditions.push(eq(social_posts.platform, platform));
    if (status) conditions.push(eq(social_posts.status, status));

    const results = await db
      .select({
        id: social_posts.id,
        platform: social_posts.platform,
        content_type: social_posts.content_type,
        status: social_posts.status,
        title: social_posts.title,
        caption: social_posts.caption,
        hashtags: social_posts.hashtags,
        scheduled_publish_at: social_posts.scheduled_publish_at,
        published_at: social_posts.published_at,
        approved_by: social_posts.approved_by,
        approval_notes: social_posts.approval_notes,
        approval_timestamp: social_posts.approval_timestamp,
        n8n_workflow_id: social_posts.n8n_workflow_id,
        platform_post_id: social_posts.platform_post_id,
        performance_stats: social_posts.performance_stats,
        created_at: social_posts.created_at,
        updated_at: social_posts.updated_at,
        artist_name: artists.name,
        artist_instagram_handle: artists.instagram_handle,
      })
      .from(social_posts)
      .leftJoin(artists, eq(social_posts.artist_id, artists.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(social_posts.created_at));

    return Response.json({ posts: results });
  } catch (error) {
    console.error('Failed to fetch social posts:', error);
    return Response.json({ error: 'Failed to fetch social posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const data = await request.json();
    const { platform, content_type, title, caption, hashtags, media_urls, scheduled_publish_at, artist_id, n8n_workflow_id } = data;

    if (!platform) {
      return Response.json({ error: 'platform is required' }, { status: 400 });
    }

    const db = getDb();
    const result = await db
      .insert(social_posts)
      .values({
        platform,
        content_type: content_type ?? 'post',
        status: 'draft',
        title: title ?? null,
        caption: caption ?? null,
        hashtags: hashtags ?? [],
        media_urls: media_urls ?? [],
        scheduled_publish_at: scheduled_publish_at ? new Date(scheduled_publish_at) : null,
        artist_id: artist_id ?? null,
        created_by: userId,
        n8n_workflow_id: n8n_workflow_id ?? null,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create social post:', error);
    return Response.json({ error: 'Failed to create social post' }, { status: 500 });
  }
}
