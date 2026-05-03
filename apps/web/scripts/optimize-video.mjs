#!/usr/bin/env node
/**
 * optimize-video.mjs
 * Transcode any video to a web-optimized MP4 suitable for autoplay hero backgrounds.
 *
 * Usage:
 *   node scripts/optimize-video.mjs <input> [output]
 *
 * If output is omitted, defaults to public/videos/hero.mp4 (relative to scripts/).
 *
 * FFmpeg settings chosen for web hero backgrounds:
 *   - libx264 / CRF 23 / slow preset — universal browser support, good quality/size
 *   - yuv420p — required for Safari and mobile autoplay
 *   - +faststart — moov atom at front so video streams before full download
 *   - -an — strip audio (hero video is always muted; saves 10–20%)
 *   - scale filter — force dimensions divisible by 2 (H.264 requirement)
 */

import { spawnSync, execSync } from 'node:child_process';
import { statSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Validate ffmpeg is available ──────────────────────────────────────────────
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
} catch {
  console.error('Error: ffmpeg is not installed or not on PATH.');
  console.error('  macOS:  brew install ffmpeg');
  console.error('  Ubuntu: sudo apt install ffmpeg');
  process.exit(1);
}

// ── Resolve paths ─────────────────────────────────────────────────────────────
const inputArg = process.argv[2];
const outputArg = process.argv[3];

if (!inputArg) {
  console.error('Usage: node scripts/optimize-video.mjs <input> [output]');
  process.exit(1);
}

const inputPath = resolve(process.cwd(), inputArg);
const outputPath = outputArg
  ? resolve(process.cwd(), outputArg)
  : resolve(__dirname, '../public/videos/hero.mp4');

if (!existsSync(inputPath)) {
  console.error(`Error: input file not found: ${inputPath}`);
  process.exit(1);
}

const inputSize = (statSync(inputPath).size / 1_048_576).toFixed(1);
console.log(`Input:  ${inputPath} (${inputSize} MB)`);
console.log(`Output: ${outputPath}`);
console.log('Running ffmpeg…\n');

// ── Run ffmpeg ────────────────────────────────────────────────────────────────
const result = spawnSync(
  'ffmpeg',
  [
    '-i', inputPath,
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'slow',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',                                              // strip audio
    '-vf', "scale='trunc(iw/2)*2:trunc(ih/2)*2'",     // divisible-by-2 guard
    '-y',                                              // overwrite without prompt
    outputPath,
  ],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  console.error(`\nffmpeg exited with code ${result.status}`);
  process.exit(result.status ?? 1);
}

// ── Print results ─────────────────────────────────────────────────────────────
const outputSize = (statSync(outputPath).size / 1_048_576).toFixed(1);
const savings = (((statSync(inputPath).size - statSync(outputPath).size) / statSync(inputPath).size) * 100).toFixed(0);

console.log(`\nDone.`);
console.log(`  Before: ${inputSize} MB`);
console.log(`  After:  ${outputSize} MB  (${savings}% smaller)`);
