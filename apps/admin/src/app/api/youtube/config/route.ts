import { auth } from '@clerk/nextjs/server';
import { getDb, youtube_config } from '@stpetemusic/db';

export async function GET(_request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const db = getDb();
    const rows = await db.select().from(youtube_config).limit(1);

    if (rows.length === 0) {
      return Response.json({
        footer_links: [
          { label: 'St Pete Music', url: 'https://StPeteMusic.live' },
          { label: 'St Pete Music Instagram', url: 'https://www.instagram.com/stpetemusic/' },
          { label: 'St Pete Music Facebook', url: 'https://www.facebook.com/stpeteflmusic/' },
          { label: 'Suite E Studios', url: 'https://SuiteEStudios.com/' },
        ],
        channel_bio:
          'StPete Music is a youtube channel, website, and community that is dedicated to showing off the best musicians, artists, bands, and performers in the Greater Tampa Bay and St Petersburg, FL area. Our website has links to all the bands and venues you see.',
        contact_emails: ['TheBurgMusic@gmail.com', 'Suite.E.StPete@gmail.com'],
        prompt_version: 'v1',
      });
    }

    return Response.json(rows[0]);
  } catch (error) {
    console.error('Failed to fetch YouTube config:', error);
    return Response.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const body = await request.json() as {
      footer_links?: { label: string; url: string }[];
      channel_bio?: string;
      contact_emails?: string[];
      prompt_version?: string;
    };

    const db = getDb();
    const existing = await db.select({ id: youtube_config.id }).from(youtube_config).limit(1);

    const data = {
      footer_links: body.footer_links,
      channel_bio: body.channel_bio,
      contact_emails: body.contact_emails,
      prompt_version: body.prompt_version,
      updated_at: new Date(),
    };

    // Remove undefined fields
    for (const key of Object.keys(data) as (keyof typeof data)[]) {
      if (data[key] === undefined) delete data[key];
    }

    if (existing.length === 0) {
      const [row] = await db.insert(youtube_config).values(data).returning();
      return Response.json(row);
    }

    const [row] = await db
      .update(youtube_config)
      .set(data)
      .returning();

    return Response.json(row);
  } catch (error) {
    console.error('Failed to update YouTube config:', error);
    return Response.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
