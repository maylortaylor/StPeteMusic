import { auth } from '@clerk/nextjs/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { logError } from '@stpetemusic/db';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bucket = process.env.ASSETS_BUCKET;
    const cdnUrl = process.env.ASSETS_CDN_URL;
    if (!bucket || !cdnUrl) {
      return Response.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const artistId = formData.get('artistId') as string | null;

    if (!file || !artistId) {
      return Response.json({ error: 'file and artistId are required' }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return Response.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return Response.json({ error: 'File size must be 15 MB or less' }, { status: 400 });
    }

    const key = `artists/${artistId}/${randomUUID()}.${ext}`;
    const s3 = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_KEY_ID!,
        secretAccessKey: process.env.S3_KEY_SECRET!,
      },
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return Response.json({ url: `${cdnUrl}/${key}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? (err.stack ?? '') : '';
    console.error('Artist image upload failed:', err);
    try {
      await logError({
        app: 'admin',
        path: '/api/upload/artist-image',
        method: 'POST',
        message,
        stack,
        status_code: 500,
      });
    } catch (logErr) {
      console.error('logError failed:', logErr);
    }
    return Response.json({ error: 'Upload failed', details: message }, { status: 500 });
  }
}
