import { auth } from '@clerk/nextjs/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bucket = process.env.AWS_ASSETS_BUCKET;
  const cdnUrl = process.env.ASSETS_CDN_URL;
  if (!bucket || !cdnUrl) {
    return Response.json({ error: 'Storage not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const artistId = formData.get('artistId') as string | null;

    if (!file || !artistId) {
      return Response.json({ error: 'file and artistId are required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return Response.json({ error: 'File size must be 15 MB or less' }, { status: 400 });
    }

    // Resize to max 1920px wide, convert to WebP quality 85, strip EXIF
    const processed = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 85 })
      .withMetadata({}) // strip EXIF by not carrying it over
      .toBuffer();

    const key = `artists/${artistId}/${randomUUID()}.webp`;
    const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: processed,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return Response.json({ url: `${cdnUrl}/${key}` });
  } catch (err) {
    console.error('Artist image upload failed:', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
