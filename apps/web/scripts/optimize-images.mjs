/**
 * optimize-images.mjs
 *
 * Optimizes all content images in public/images/ in-place:
 *   - Re-compresses JPGs at 85% quality (progressive, in-place)
 *   - Creates .webp sibling for each JPG/PNG (same directory)
 *   - For images/hero/ only: creates <name>-og.webp at 1200×630 (for OG meta tags)
 *     Uses focal-points.json to center the crop on the main subject.
 *
 * Skips: brand/favicon/ (icon files with required dimensions), brand/*.png logos
 *
 * Run:
 *   npm run images:optimize --workspace=apps/web
 *   # Or re-run with --force to re-process existing outputs
 *
 * Pre-requisite:
 *   npm run detect-faces --workspace=apps/web   # populates src/config/focal-points.json
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, '..');
const PUBLIC     = path.join(ROOT, 'public');
const FOCAL_FILE = path.join(ROOT, 'src/config/focal-points.json');

const OG_WIDTH  = 1200;
const OG_HEIGHT = 630;
const QUALITY   = 85;
const FORCE     = process.argv.includes('--force');

// Directories to process (relative to PUBLIC)
const PROCESS_DIRS = [
  'images/vibes',
  'images/hero',
  'images/events',
];

// Directories/patterns to skip entirely
const SKIP_PATTERNS = [
  'images/brand/favicon',
];

// ─── Load focal points ────────────────────────────────────────────────────────

let focalPoints = {};
if (fs.existsSync(FOCAL_FILE)) {
  try {
    focalPoints = JSON.parse(fs.readFileSync(FOCAL_FILE, 'utf8'));
  } catch {
    console.warn('⚠  Could not parse focal-points.json — using center crop for all hero images');
  }
} else {
  console.warn('⚠  focal-points.json not found. Run `npm run detect-faces` first for smart hero crops.');
  console.warn('   Continuing with center crop fallback.');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFocalPoint(relPath) {
  const key = '/' + relPath.replace(/\\/g, '/');
  const fp = focalPoints[key];
  return fp ? { x: fp.x, y: fp.y } : { x: 50, y: 35 };
}

/**
 * Compute sharp extract region for a smart crop to targetW×targetH,
 * centered on the focal point (x%, y%) of the source image.
 */
function smartCropRegion(srcWidth, srcHeight, targetW, targetH, focalX, focalY) {
  const srcAspect = srcWidth / srcHeight;
  const tgtAspect = targetW / targetH;

  let cropW, cropH;
  if (srcAspect > tgtAspect) {
    // Source is wider — crop width
    cropH = srcHeight;
    cropW = Math.round(srcHeight * tgtAspect);
  } else {
    // Source is taller — crop height
    cropW = srcWidth;
    cropH = Math.round(srcWidth / tgtAspect);
  }

  // Center of interest in pixels
  const focusPxX = Math.round((focalX / 100) * srcWidth);
  const focusPxY = Math.round((focalY / 100) * srcHeight);

  // Offset to center the crop on the focal point, clamped to image bounds
  let left = Math.round(focusPxX - cropW / 2);
  let top  = Math.round(focusPxY - cropH / 2);
  left = Math.max(0, Math.min(left, srcWidth  - cropW));
  top  = Math.max(0, Math.min(top,  srcHeight - cropH));

  return { left, top, width: cropW, height: cropH };
}

async function processImage(absPath, relFromPublic) {
  const ext      = path.extname(absPath).toLowerCase();
  const baseName = path.basename(absPath, ext);
  const dir      = path.dirname(absPath);
  const webpPath = path.join(dir, baseName + '.webp');
  const isHero   = relFromPublic.startsWith('images/hero/');

  const isJpg = ext === '.jpg' || ext === '.jpeg';
  const isPng = ext === '.png';
  if (!isJpg && !isPng) return; // skip non-image files

  const fp = getFocalPoint(relFromPublic);

  // 1. Re-compress original JPG in-place (skip PNGs — logos in vibes dirs are rare)
  if (isJpg) {
    const tmpPath = absPath + '.tmp';
    await sharp(absPath)
      .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
      .withMetadata({ copyright: '© St. Pete Music / StPeteMusic.live' })
      .toFile(tmpPath);
    fs.renameSync(tmpPath, absPath);
    process.stdout.write(' jpg✓');
  }

  // 2. Create .webp sibling (skip if exists and not --force)
  if (FORCE || !fs.existsSync(webpPath)) {
    await sharp(absPath)
      .webp({ quality: QUALITY })
      .withMetadata({ copyright: '© St. Pete Music / StPeteMusic.live' })
      .toFile(webpPath);
    process.stdout.write(' webp✓');
  } else {
    process.stdout.write(' webp⏭');
  }

  // 3. Hero images: create OG crop at 1200×630
  if (isHero) {
    const ogPath = path.join(dir, baseName + '-og.webp');
    if (FORCE || !fs.existsSync(ogPath)) {
      const meta = await sharp(absPath).metadata();
      const region = smartCropRegion(meta.width, meta.height, OG_WIDTH, OG_HEIGHT, fp.x, fp.y);
      await sharp(absPath)
        .extract(region)
        .resize(OG_WIDTH, OG_HEIGHT)
        .webp({ quality: QUALITY })
        .withMetadata({ copyright: '© St. Pete Music / StPeteMusic.live' })
        .toFile(ogPath);
      process.stdout.write(` og✓(${fp.x}%,${fp.y}%)`);
    } else {
      process.stdout.write(' og⏭');
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const dir of PROCESS_DIRS) {
    const absDir = path.join(PUBLIC, dir);
    if (!fs.existsSync(absDir)) {
      console.log(`\n  ⚠  Directory not found, skipping: ${dir}`);
      continue;
    }

    const files = fs.readdirSync(absDir)
      .filter(f => /\.(jpe?g|png)$/i.test(f))
      .sort();

    if (files.length === 0) continue;

    console.log(`\n📁 ${dir}/`);

    for (const file of files) {
      const absPath      = path.join(absDir, file);
      const relFromPub   = path.relative(PUBLIC, absPath).replace(/\\/g, '/');

      // Check skip patterns
      if (SKIP_PATTERNS.some(pat => relFromPub.startsWith(pat))) {
        console.log(`  ⏭  ${file} (skipped)`);
        skipped++;
        continue;
      }

      process.stdout.write(`  🖼  ${file} ...`);
      try {
        await processImage(absPath, relFromPub);
        console.log();
        processed++;
      } catch (err) {
        console.log(` ❌ ${err.message}`);
        errors++;
      }
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Done. Processed: ${processed}  Skipped: ${skipped}  Errors: ${errors}`);
  if (!FORCE) {
    console.log('   Tip: pass --force to re-process existing .webp outputs');
  }
  console.log('\nNext step: update layout.tsx ogImage to use /images/hero/hero-1-og.webp');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
