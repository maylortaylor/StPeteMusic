/**
 * record-demo.mjs
 *
 * Records a smooth vertical (9:16) demo video of the website for social media.
 * Outputs: demo-recordings/demo-YYYY-MM-DDTHH-MM-SS.mp4 (1080x1920, H.264)
 *
 * Prerequisites (one-time):
 *   brew install ffmpeg
 *   npm install --save-dev playwright   (in apps/web)
 *   npx playwright install chromium     (in apps/web)
 *
 * Usage:
 *   npm run record-demo                  # 30fps, http://localhost:3000
 *   npm run record-demo:60fps            # 60fps (YouTube Shorts)
 *   DEMO_URL=https://staging.stpetemusic.live npm run record-demo
 */

import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.DEMO_URL ?? 'http://localhost:3000';
const OUTPUT_DIR = path.join(ROOT, 'demo-recordings');
const SEQUENCE = process.argv.find((a) => a.startsWith('--sequence='))?.split('=')[1] ?? 'full';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const SEQUENCE_SUFFIX = SEQUENCE !== 'full' ? `-${SEQUENCE}` : '';
const OUTPUT_FILE = path.join(OUTPUT_DIR, `demo${SEQUENCE_SUFFIX}-${TIMESTAMP}.mp4`);
const FPS = process.argv.includes('--60fps') ? 60 : 30;

// Exact 9:16 viewport: 405×720 (405/720 = 9/16 = 0.5625).
// Width stays under the 768px Tailwind breakpoint so mobile layout applies.
// FFmpeg does a clean 2.67× proportional upscale to 1080×1920 — no cropping,
// no padding, no nav cutoff.
const VIEWPORT = { width: 405, height: 720 };

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Smooth scroll to an absolute Y position using ease-in-out cubic easing.
 * Breaking the scroll into ~50 steps with a 24ms interval (1.5× the 16ms RAF
 * budget) keeps Framer Motion springs seeing a continuous velocity — critical
 * for making parallax and whileInView animations look smooth rather than jumping.
 */
async function smoothScrollTo(page, targetY, { durationMs = 1200, stepMs = 24 } = {}) {
  const startY = await page.evaluate(() => window.scrollY);
  const distance = targetY - startY;
  if (distance === 0) return;
  const steps = Math.max(1, Math.round(durationMs / stepMs));

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    // Ease-in-out cubic — matches Framer Motion's default animation feel
    const eased =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const newY = Math.round(startY + distance * eased);
    await page.evaluate((y) => window.scrollTo(0, y), newY);
    await page.waitForTimeout(stepMs);
  }
}

/**
 * Wait for Framer Motion springs to settle.
 * Floors are calibrated to known animation timings in each section.
 * We do NOT drain document.getAnimations() — the Hero has a repeat:Infinity
 * scroll-cue animation that would cause an infinite hang.
 */
async function waitForAnimations(page, minWaitMs = 800) {
  await page.waitForTimeout(minWaitMs);
}

/**
 * Get the absolute offsetTop of a DOM element by selector.
 * Returns null if the element doesn't exist yet (e.g. dynamic imports still loading).
 */
async function getElementTop(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    let top = 0;
    let node = el;
    while (node) {
      top += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return top;
  }, selector);
}

// ─── Demo sequence ────────────────────────────────────────────────────────────

async function runDemoSequence(page) {
  const VH = VIEWPORT.height; // 720px

  // ── 1. Land on homepage ──────────────────────────────────────────────────────
  console.log('  → Loading homepage...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Wait for the hero video element (background loop) to be present
  await page.waitForSelector('video', { timeout: 10000 }).catch(() => {
    console.warn('    No <video> found — continuing without it');
  });

  // Hero entry animations settle at: buttons (delay 0.65 + duration 0.9 = 1550ms),
  // scroll cue (delay 1.4 + duration 1 = 2400ms). Wait 2.5s to catch all of them.
  console.log('  → Waiting for hero entry animations (2.5s)...');
  await waitForAnimations(page, 2500);

  // Hold — viewer reads the logo and tagline
  await page.waitForTimeout(1500);

  // ── 2. Scroll through Hero parallax ─────────────────────────────────────────
  // Hero is height: 160vh = 1350px. Parallax travel = 60vh = ~506px (the distance
  // between "start start" and "end start" for a 160vh section at 844px viewport).
  // Content opacity fades at progress 0.45–0.8 (scrollY ~228–405px).
  // Two-pass scroll: first show partial parallax with content visible, then complete.
  console.log('  → Scrolling through hero parallax...');
  await smoothScrollTo(page, Math.round(VH * 0.27), { durationMs: 1000, stepMs: 24 });
  await page.waitForTimeout(400);
  await smoothScrollTo(page, Math.round(VH * 0.6), { durationMs: 1500, stepMs: 24 });
  await waitForAnimations(page, 500);

  // ── 3. StatsSection ─────────────────────────────────────────────────────────
  // Hero section ends at 160vh = 1350px. StatsSection starts immediately after.
  console.log('  → Scrolling to StatsSection...');
  await smoothScrollTo(page, Math.round(VH * 1.65), { durationMs: 1000, stepMs: 24 });
  await waitForAnimations(page, 700); // AnimateIn elements fly up (duration: 1s + max delay 0.65s)
  await page.waitForTimeout(800);

  // ── 4. PhotoStrip ───────────────────────────────────────────────────────────
  // PhotoStrip is dynamically imported (ssr: false) — wait for it to appear.
  console.log('  → Scrolling to PhotoStrip...');
  await page.waitForSelector('[class*="overflow-x"]', { timeout: 6000 }).catch(() => {});
  const photoStripTop = (await getElementTop(page, '[class*="overflow-x"]')) ?? Math.round(VH * 2.8);
  await smoothScrollTo(page, Math.max(0, photoStripTop - 80), { durationMs: 1200, stepMs: 24 });
  await waitForAnimations(page, 600);

  // Pan the horizontal strip to the right to show artist photos
  await page.evaluate(() => {
    const strip = document.querySelector('[class*="overflow-x"]');
    if (strip) strip.scrollBy({ left: 360, behavior: 'smooth' });
  });
  await page.waitForTimeout(1000);

  // ── 5. EventsTeaser ─────────────────────────────────────────────────────────
  // Relatively large section — scroll 1.2 viewport heights past current position.
  console.log('  → Scrolling to EventsTeaser...');
  const y1 = await page.evaluate(() => window.scrollY);
  await smoothScrollTo(page, y1 + Math.round(VH * 1.2), { durationMs: 1400, stepMs: 24 });
  await waitForAnimations(page, 800); // Card slide-in springs (stiffness: 50-60, damping: 20-22)
  await page.waitForTimeout(1200);

  // ── 6. VibesSection ─────────────────────────────────────────────────────────
  // Depth parallax grid — slow scroll to appreciate the layered depth offsets.
  console.log('  → Scrolling to VibesSection...');
  const y2 = await page.evaluate(() => window.scrollY);
  await smoothScrollTo(page, y2 + Math.round(VH * 1.4), { durationMs: 1600, stepMs: 24 });
  await waitForAnimations(page, 700);
  await page.waitForTimeout(800);

  // ── 7. Navigate to /events ──────────────────────────────────────────────────
  console.log('  → Navigating to /events...');
  await page.goto(`${BASE_URL}/events`, { waitUntil: 'networkidle' });
  await waitForAnimations(page, 600);
  await page.waitForTimeout(1200);

  // ── 8. Navigate to /discover ────────────────────────────────────────────────
  console.log('  → Navigating to /discover...');
  await page.goto(`${BASE_URL}/discover`, { waitUntil: 'networkidle' });
  await waitForAnimations(page, 600);
  await page.waitForTimeout(1000);

  // ── 9. Return to home ────────────────────────────────────────────────────────
  console.log('  → Returning to home...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForAnimations(page, 2000); // Hero entry animations fire again on re-mount
  await page.waitForTimeout(800);
}

// ─── Newsletter demo sequence ─────────────────────────────────────────────────

async function runNewsletterDemo(page) {
  // Intercept the subscribe API so the video shows the success state
  // without actually adding a fake email to the list.
  await page.route('**/api/newsletter/subscribe', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: "You're in!" }),
    });
  });

  // ── 1. Load page and measure newsletter position before scrolling ─────────────
  console.log('  → Loading homepage...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('video', { timeout: 10000 }).catch(() => {
    console.warn('    No <video> found — continuing');
  });

  // Measure newsletter section top NOW (before any scroll) so layout is fully settled.
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });
  const newsletterSectionTop = await page.evaluate(() => {
    const input = document.querySelector('input[type="email"]');
    if (!input) return null;
    let el = input.parentElement;
    while (el && el.tagName.toLowerCase() !== 'section') el = el.parentElement;
    if (!el) return null;
    let top = 0;
    let node = el;
    while (node) { top += node.offsetTop || 0; node = node.offsetParent; }
    return top;
  });

  // ── 2. Hero — brief hold so viewer reads logo + CTA buttons ──────────────────
  // Entry animations finish ~1550ms; wait a touch longer then move on quickly.
  await waitForAnimations(page, 1000);
  // await page.waitForTimeout(400);

  // ── 3. Single continuous scroll hero → newsletter (no intermediate stops) ─────
  // One smooth motion lets Framer Motion springs animate naturally as sections
  // enter the viewport — no pauses between sections.
  console.log('  → Continuous scroll to newsletter...');
  const targetY = Math.max(0, (newsletterSectionTop ?? 0) - 30);
  // await smoothScrollTo(page, targetY, { durationMs: 7500, stepMs: 24 });
  await smoothScrollTo(page, targetY, { durationMs: 7500, stepMs: 120 });

  // Wait for the newsletter AnimateIn elements to finish (delay 0.3 + duration 1s).
  await waitForAnimations(page, 1400);

  // ── 4. Type email ────────────────────────────────────────────────────────────
  console.log('  → Typing email...');
  await page.locator('input[type="email"]').click();
  await page.waitForTimeout(300);
  await page.locator('input[type="email"]').pressSequentially('please-be@excited.com', { delay: 65 });
  // await page.waitForTimeout(600);

  // ── 5. Click Subscribe — lock scroll to prevent layout-shift bump ────────────
  // When the form is replaced by the shorter success <p>, the page shrinks and
  // the browser would normally nudge scrollY upward.  We re-assert the same Y
  // immediately after the click so the camera doesn't jump.
  // console.log('  → Subscribing...');
  // const lockedY = await page.evaluate(() => window.scrollY);
  // await page.locator('button[type="submit"]').click();
  // await page.evaluate((y) => window.scrollTo(0, y), lockedY);
  await page.waitForTimeout(2000);

  console.log('  → Done.');
}

// ─── FFmpeg conversion ────────────────────────────────────────────────────────

async function convertToMp4(webmPath) {
  console.log('\nConverting WebM → MP4...');

  // Viewport is already 9:16 (405×720), so this is a clean 2.67× proportional
  // upscale to 1080×1920 — no cropping, no padding, full page visible.
  // -crf 18: near-lossless (social platforms re-encode uploads, so send high quality).
  // -pix_fmt yuv420p: required for Instagram, TikTok, and YouTube compatibility.
  // -movflags +faststart: moov atom at front for progressive streaming.
  const vf = 'scale=1080:1920:flags=lanczos';

  try {
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-i', webmPath,
        '-vf', vf,
        '-r', String(FPS),
        '-c:v', 'libx264',
        '-crf', '18',
        '-preset', 'slow',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-an',
        OUTPUT_FILE,
      ],
      { stdio: 'inherit' },
    );
  } catch (err) {
    console.error('FFmpeg conversion failed:', err.message);
    process.exit(1);
  }

  // Clean up temp webm directory
  try {
    rmSync(path.dirname(webmPath), { recursive: true, force: true });
  } catch {}

  console.log(`\nDone! → ${OUTPUT_FILE}`);
  console.log('Ready to upload to Instagram Reels, TikTok, or YouTube Shorts.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Pre-flight: verify FFmpeg is installed
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  } catch {
    console.error('FFmpeg not found. Install with: brew install ffmpeg');
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const tempVideoDir = path.join(OUTPUT_DIR, '_temp');
  mkdirSync(tempVideoDir, { recursive: true });

  console.log(`Recording from: ${BASE_URL}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`FPS: ${FPS}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: tempVideoDir,
      size: VIEWPORT,
    },
  });

  const page = await context.newPage();

  // Hide Next.js dev indicator ("N" badge at bottom-left)
  await page.addInitScript(() => {
    const s = document.createElement('style');
    s.textContent = 'nextjs-portal { display: none !important; }';
    document.head.appendChild(s);
  });

  const sequences = {
    full: runDemoSequence,
    newsletter: runNewsletterDemo,
  };
  const run = sequences[SEQUENCE] ?? sequences.full;
  if (!sequences[SEQUENCE]) console.warn(`Unknown sequence "${SEQUENCE}", falling back to "full".`);
  console.log(`Sequence: ${SEQUENCE}\n`);

  try {
    await run(page);
  } catch (err) {
    console.error('\nDemo sequence error:', err.message);
  }

  // Get video path BEFORE closing — Playwright finalizes the .webm file on page.close().
  const videoPath = await page.video()?.path();
  console.log('\nFinalizing recording...');
  await page.close();
  await context.close();
  await browser.close();

  // Resolve the webm path (fallback: find any .webm in tempVideoDir)
  let resolvedWebm = videoPath;
  if (!resolvedWebm || !existsSync(resolvedWebm)) {
    const files = readdirSync(tempVideoDir).filter((f) => f.endsWith('.webm'));
    if (files.length === 0) {
      console.error('No .webm file found — recording may have failed.');
      process.exit(1);
    }
    resolvedWebm = path.join(tempVideoDir, files[0]);
  }

  await convertToMp4(resolvedWebm);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
