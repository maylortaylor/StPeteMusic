import { readFileSync } from 'fs';
import { join } from 'path';

export function readPublicImage(imagePath: string): string {
  const fullPath = join(process.cwd(), 'public', imagePath);
  const buffer = readFileSync(fullPath);
  const ext = imagePath.split('.').pop()?.toLowerCase() ?? 'png';
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mime};base64,${buffer.toString('base64')}`;
}
