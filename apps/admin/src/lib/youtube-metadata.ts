import Anthropic from '@anthropic-ai/sdk';
import type { CalendarEvent } from './google-calendar';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArtistLink = {
  name: string;
  instagram_url?: string | null;
  website?: string | null;
};

export type YoutubeConfigData = {
  footer_links: { label: string; url: string }[];
  channel_bio: string;
  contact_emails: string[];
  prompt_version: string;
};

export type MetadataInput = {
  videoId: string;
  existingTitle: string;
  existingDescription: string;
  publishedAt: Date;
  isLivestream: boolean;
  isShort: boolean;
  calendarEvent: CalendarEvent | null;
  confidence: 'confirmed' | 'guessed' | 'none';
  /** Artists linked to this event (from DB). */
  artists: ArtistLink[];
  /** Venue name from calendar event location or a default. */
  venueName: string;
  config: YoutubeConfigData;
};

export type MetadataProposal = {
  proposedTitle: string;
  proposedDescription: string;
  proposedTags: string[];
  promptVersion: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND_TAGS =
  'St Pete Music, StPeteMusic, Saint Petersburg Florida, St Petersburg FL, Tampa Bay Music, Florida Live Music, Suite E Studios, Live Music, Local Music';

const MAX_TITLE_LENGTH = 100;
const MAX_TAGS_CHARS = 500;
const SUITE_E_FULL = 'Suite E Studios';
const SUITE_E_SHORT = 'Suite E';

// ─── Title Builder ────────────────────────────────────────────────────────────

function formatDate(date: Date, short = false): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return short ? `${mm}.${dd}.${yyyy.slice(2)}` : `${mm}.${dd}.${yyyy}`;
}

function buildTitleAttempt(
  name: string,
  venue: string,
  date: string,
  hashtags: string[],
): string {
  const tags = hashtags.length > 0 ? ' ' + hashtags.map((t) => `#${t}`).join(' ') : '';
  return `${name} at ${venue} // ${date}${tags}`;
}

/**
 * Build the video title following the plan's truncation rules.
 * YouTube limit: 100 characters.
 */
export function buildTitle(input: {
  artists: ArtistLink[];
  eventName: string | null;
  venueName: string;
  publishedAt: Date;
  hashtags: string[];
}): string {
  const { artists, eventName, venueName, publishedAt, hashtags } = input;

  let name: string;
  if (eventName) {
    name = eventName;
  } else if (artists.length === 1) {
    name = artists[0].name;
  } else if (artists.length > 1) {
    name = artists.map((a) => a.name).join(', ');
  } else {
    name = 'Live Performance';
  }

  const fullDate = formatDate(publishedAt, false);
  const shortDate = formatDate(publishedAt, true);
  let venue = venueName;

  // Step 1: full date + hashtags
  let attempt = buildTitleAttempt(name, venue, fullDate, hashtags);
  if (attempt.length <= MAX_TITLE_LENGTH) return attempt;

  // Step 2: short date
  attempt = buildTitleAttempt(name, venue, shortDate, hashtags);
  if (attempt.length <= MAX_TITLE_LENGTH) return attempt;

  // Step 3: drop hashtags
  attempt = buildTitleAttempt(name, venue, shortDate, []);
  if (attempt.length <= MAX_TITLE_LENGTH) return attempt;

  // Step 4: drop trailing artists (multi-band — drop last, then second-to-last)
  if (artists.length > 2) {
    const reducedName = artists
      .slice(0, -1)
      .map((a) => a.name)
      .join(', ');
    attempt = buildTitleAttempt(reducedName, venue, shortDate, []);
    if (attempt.length <= MAX_TITLE_LENGTH) return attempt;
  }

  if (artists.length > 1) {
    attempt = buildTitleAttempt(artists[0].name, venue, shortDate, []);
    if (attempt.length <= MAX_TITLE_LENGTH) return attempt;
  }

  // Step 5: abbreviate venue
  if (venue === SUITE_E_FULL) {
    venue = SUITE_E_SHORT;
    attempt = buildTitleAttempt(name, venue, shortDate, []);
    if (attempt.length <= MAX_TITLE_LENGTH) return attempt;
    // Last resort: just name + date
    return `${name} // ${shortDate}`.slice(0, MAX_TITLE_LENGTH);
  }

  return attempt.slice(0, MAX_TITLE_LENGTH);
}

// ─── Description Builder ──────────────────────────────────────────────────────

type TimestampEntry = { time: string; band_name: string };

function buildDescription(input: {
  proposedTitle: string;
  venueName: string;
  isShort: boolean;
  timestamps: TimestampEntry[];
  artists: ArtistLink[];
  config: YoutubeConfigData;
}): string {
  const { proposedTitle, venueName, isShort, timestamps, artists, config } = input;
  const isSuiteE = venueName.toLowerCase().includes('suite e');

  const lines: string[] = [];

  // Title repeated
  lines.push(proposedTitle);
  lines.push('');

  // Produced by block (omit for Shorts unless it's a Suite E recording)
  if (!isShort || isSuiteE) {
    if (isSuiteE) {
      lines.push('Produced by: Rob Morey @Suite.E.Studios // St Petersburg, FL // Multimedia Production Studio');
      lines.push('Assisted by: Matt "Maylor" Taylor @Suite.E.Studios');
    } else {
      lines.push('Produced by: Matt "Maylor" Taylor');
    }
    lines.push('');
  }

  // Timestamps block
  if (!isShort && timestamps.length > 0) {
    for (const ts of timestamps) {
      lines.push(`${ts.time} - ${ts.band_name}`);
    }
    lines.push('');
  }

  // "Things you should check out" links
  lines.push('Things you should check out:');
  lines.push('-- St Pete Music || https://StPeteMusic.live');

  for (const artist of artists) {
    if (artist.instagram_url) {
      lines.push(`-- ${artist.name} || ${artist.instagram_url}`);
    } else if (artist.website) {
      lines.push(`-- ${artist.name} || ${artist.website}`);
    }
  }

  // Footer links from config (skip any we already built manually above)
  const manualUrls = new Set([
    'https://StPeteMusic.live',
    'https://www.instagram.com/stpetemusic/',
    'https://www.facebook.com/stpeteflmusic/',
    'https://SuiteEStudios.com/',
  ]);
  for (const link of config.footer_links) {
    if (!manualUrls.has(link.url)) {
      lines.push(`-- ${link.label} || ${link.url}`);
    }
  }

  lines.push('-- St Pete Music Instagram || https://www.instagram.com/stpetemusic/');
  lines.push('-- St Pete Music Facebook || https://www.facebook.com/stpeteflmusic/');
  lines.push('-- Suite E Studios || https://SuiteEStudios.com/');
  lines.push('');

  // Channel bio
  lines.push(config.channel_bio);
  lines.push('');

  // Emails
  lines.push('// EMAIL //');
  for (const email of config.contact_emails) {
    lines.push(email);
    if (config.contact_emails.indexOf(email) < config.contact_emails.length - 1) {
      lines.push('or');
    }
  }

  return lines.join('\n');
}

// ─── Tag Generator (Claude) ───────────────────────────────────────────────────

async function generateSeoTags(input: {
  title: string;
  artists: ArtistLink[];
  eventName: string | null;
  venueName: string;
  isLivestream: boolean;
  isShort: boolean;
}): Promise<string[]> {
  const client = new Anthropic();

  const remainingBudget = MAX_TAGS_CHARS - BRAND_TAGS.length - 2; // -2 for ", "

  const prompt = `Generate YouTube SEO tags for a music video. Fill as close to ${remainingBudget} characters as possible (comma-separated, no # symbols — YouTube tags field, not hashtags).

Video: "${input.title}"
Artists: ${input.artists.map((a) => a.name).join(', ') || 'unknown'}
Event: ${input.eventName ?? 'n/a'}
Venue: ${input.venueName}
Type: ${input.isLivestream ? 'livestream' : input.isShort ? 'short clip' : 'video'}

These brand tags are ALREADY included (do NOT repeat them): ${BRAND_TAGS}

Priority order: exact artist name → artist name variations → genre/style terms → location terms → event type terms.
Return ONLY a comma-separated list of tags, nothing else.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const additionalTags = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // Combine brand tags + generated, respect 500-char budget
  const allTags = [
    ...BRAND_TAGS.split(',').map((t) => t.trim()),
    ...additionalTags,
  ];

  const selected: string[] = [];
  let charCount = 0;
  for (const tag of allTags) {
    const cost = tag.length + (selected.length > 0 ? 2 : 0); // +2 for ", "
    if (charCount + cost > MAX_TAGS_CHARS) break;
    selected.push(tag);
    charCount += cost;
  }

  return selected;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a full metadata proposal for a single video.
 * Combines deterministic template logic (title + description) with Claude (SEO tags).
 */
export async function generateProposal(input: MetadataInput): Promise<MetadataProposal> {
  const {
    existingTitle,
    existingDescription,
    publishedAt,
    isLivestream,
    isShort,
    calendarEvent,
    confidence,
    artists,
    venueName,
    config,
  } = input;

  // Determine event name for multi-band titles
  const eventName =
    calendarEvent && confidence !== 'none'
      ? (calendarEvent.title.toLowerCase().includes('final friday') ? calendarEvent.title : null)
      : null;

  // Extract timestamps from existing description if present (e.g. "0:00 - BandName" lines)
  const existingTimestamps: { time: string; band_name: string }[] = [];
  const tsRegex = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = tsRegex.exec(existingDescription)) !== null) {
    existingTimestamps.push({ time: m[1], band_name: m[2].trim() });
  }

  // Fallback: use existing title when there's no calendar match
  const nameForTitle =
    confidence === 'none' ? existingTitle : undefined;

  const effectiveArtists =
    artists.length > 0
      ? artists
      : nameForTitle
        ? [{ name: nameForTitle }]
        : [];

  const proposedTitle = buildTitle({
    artists: effectiveArtists,
    eventName,
    venueName: venueName || SUITE_E_FULL,
    publishedAt,
    hashtags: [],
  });

  const proposedDescription = buildDescription({
    proposedTitle,
    venueName: venueName || SUITE_E_FULL,
    isShort,
    timestamps: existingTimestamps,
    artists,
    config,
  });

  const proposedTags = await generateSeoTags({
    title: proposedTitle,
    artists: effectiveArtists,
    eventName,
    venueName: venueName || SUITE_E_FULL,
    isLivestream,
    isShort,
  });

  return {
    proposedTitle,
    proposedDescription,
    proposedTags,
    promptVersion: config.prompt_version,
  };
}

// ─── Pinned Comment Builder ───────────────────────────────────────────────────

/**
 * Build the text for the post-publish pinned comment.
 * If timestamps exist: show setlist. Otherwise: show band names + links.
 */
export function buildPinnedComment(input: {
  timestamps: TimestampEntry[];
  artists: ArtistLink[];
}): string {
  const { timestamps, artists } = input;

  if (timestamps.length > 0) {
    const setlist = timestamps.map((ts) => `${ts.band_name} ${ts.time}`).join(' / ');
    return `📌 Setlist: ${setlist}`;
  }

  const lines: string[] = [];
  for (const artist of artists) {
    const link = artist.instagram_url ?? artist.website;
    lines.push(link ? `${artist.name} — ${link}` : artist.name);
  }

  return lines.length > 0 ? lines.join('\n') : '';
}
