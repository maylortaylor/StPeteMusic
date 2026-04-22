/**
 * detect-faces.mjs
 *
 * Uses Claude Vision (claude-haiku-4-5 — fast, cheap) to find the best focal point
 * in each image so components can set object-position correctly on any crop/aspect ratio.
 *
 * Run:  ANTHROPIC_API_KEY=sk-... npm run detect-faces
 *
 * Output: src/config/focal-points.json
 *
 * Re-run whenever you add new images to public/images/.
 * Existing entries are preserved so you only re-analyze changed images.
 * Pass --force to re-analyze everything.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'src/config/focal-points.json');

// Only process images in these directories (brand logos don't need face detection)
const IMAGE_DIRS = [
  'images/vibes',
  'images/hero',
  'images/events',
];

const FORCE = process.argv.includes('--force');

// ─── Claude Vision call ───────────────────────────────────────────────────────

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function detectFocalPoint(absPath) {
  const buffer = fs.readFileSync(absPath);
  const base64 = buffer.toString('base64');
  const ext = path.extname(absPath).slice(1).toLowerCase();
  const mediaType = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 64,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: [
              'Analyze this photo. Find the single best focal point that should remain visible',
              'when the image is cropped to any aspect ratio (portrait, landscape, square).',
              'Prioritize: faces > groups of people > main subjects > center of action.',
              'Return ONLY valid JSON, nothing else: {"x":<0-100>,"y":<0-100>}',
              'where x=0 is left edge, x=100 is right edge, y=0 is top, y=100 is bottom.',
            ].join(' '),
          },
        ],
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';

  // Parse — be robust against Claude adding minor whitespace/punctuation
  const match = text.match(/\{[^}]+\}/);
  if (!match) {
    console.warn(`    ⚠ Could not parse response: "${text}" — using center`);
    return { x: 50, y: 35 };
  }

  try {
    const parsed = JSON.parse(match[0]);
    const x = Math.max(0, Math.min(100, Math.round(Number(parsed.x))));
    const y = Math.max(0, Math.min(100, Math.round(Number(parsed.y))));
    return { x, y };
  } catch {
    console.warn(`    ⚠ JSON parse error on: "${match[0]}" — using center`);
    return { x: 50, y: 35 };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY is not set.');
    console.error('   Run: ANTHROPIC_API_KEY=sk-... npm run detect-faces');
    process.exit(1);
  }

  // Load existing results so we can skip unchanged images
  let existing = {};
  if (fs.existsSync(OUT) && !FORCE) {
    try {
      existing = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    } catch {
      // ignore corrupt file, start fresh
    }
  }

  const results = { ...existing };
  let analyzed = 0;
  let skipped = 0;

  for (const dir of IMAGE_DIRS) {
    const absDir = path.join(PUBLIC, dir);
    if (!fs.existsSync(absDir)) continue;

    const files = fs
      .readdirSync(absDir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();

    for (const file of files) {
      const absPath = path.join(absDir, file);
      const relPath = '/' + path.relative(PUBLIC, absPath).replace(/\\/g, '/');

      if (results[relPath] && !FORCE) {
        console.log(`  ⏭  ${relPath} (cached)`);
        skipped++;
        continue;
      }

      process.stdout.write(`  🔍 ${relPath} ... `);

      try {
        const focal = await detectFocalPoint(absPath);
        results[relPath] = {
          x: focal.x,
          y: focal.y,
          objectPosition: `${focal.x}% ${focal.y}%`,
        };
        console.log(`${focal.x}% ${focal.y}%`);
        analyzed++;

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.error(`FAILED: ${err.message}`);
        results[relPath] = { x: 50, y: 35, objectPosition: '50% 35%' };
      }
    }
  }

  // Write sorted JSON for clean diffs
  const sorted = Object.fromEntries(Object.entries(results).sort(([a], [b]) => a.localeCompare(b)));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 2) + '\n');

  console.log('');
  console.log(`✅ Done. Analyzed: ${analyzed}, Skipped (cached): ${skipped}`);
  console.log(`   Written to: src/config/focal-points.json`);
  if (FORCE) {
    console.log('   (--force was set, all images re-analyzed)');
  } else {
    console.log('   Tip: pass --force to re-analyze all images');
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
