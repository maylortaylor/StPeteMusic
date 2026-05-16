import {
  pgTable,
  text,
  varchar,
  uuid,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  customType,
} from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return 'bytea';
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SENSITIVE COLUMNS — NEVER SELECT OR EDIT IN ADMIN
// ─────────────────────────────────────────────────────────────────────────────
// artists.venmo, artists.zelle, artists.other_payment (encrypted, BYTEA)
// persons.email, persons.phone (encrypted, BYTEA)
// These are marked here for reference but excluded from admin forms
// ─────────────────────────────────────────────────────────────────────────────

export const artists = pgTable('artists', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description'),
  username: varchar('username', { length: 255 }),
  email: varchar('email', { length: 255 }),
  instagram_handle: varchar('instagram_handle', { length: 255 }),
  instagram_url: varchar('instagram_url', { length: 500 }),
  facebook_url: varchar('facebook_url', { length: 500 }),
  youtube_url: varchar('youtube_url', { length: 500 }),
  bandcamp_url: varchar('bandcamp_url', { length: 500 }),
  spotify_url: varchar('spotify_url', { length: 500 }),
  soundcloud_url: varchar('soundcloud_url', { length: 500 }),
  linktree_url: varchar('linktree_url', { length: 500 }),
  website: varchar('website', { length: 500 }),
  home_base: varchar('home_base', { length: 255 }),
  hero_photo_url: varchar('hero_photo_url', { length: 500 }),
  genres: text('genres').array().default([]),
  tags: text('tags').array().default([]),
  extra_links: jsonb('extra_links').$type<{ label: string; url: string }[]>().default([]),
  // ENCRYPTED — NEVER SELECT OR EDIT IN ADMIN
  venmo: bytea('venmo'),
  zelle: bytea('zelle'),
  other_payment: bytea('other_payment'),
  extra_data: jsonb('extra_data').default({}),
  notes: text('notes'),
  is_active: boolean('is_active').default(true),
  visible_on_website: boolean('visible_on_website').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const venues = pgTable('venues', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  address: varchar('address', { length: 500 }),
  neighborhood: varchar('neighborhood', { length: 255 }),
  av_setup: varchar('av_setup', { length: 500 }),
  partnership_level: varchar('partnership_level', { length: 100 }),
  contact_name: varchar('contact_name', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  capacity: integer('capacity'),
  tags: text('tags').array().default([]),
  instagram_url: varchar('instagram_url', { length: 500 }),
  instagram_username: varchar('instagram_username', { length: 255 }),
  facebook_url: varchar('facebook_url', { length: 500 }),
  facebook_username: varchar('facebook_username', { length: 255 }),
  website: varchar('website', { length: 500 }),
  hero_photo_url: varchar('hero_photo_url', { length: 500 }),
  lat: numeric('lat', { precision: 10, scale: 8 }),
  lng: numeric('lng', { precision: 11, scale: 8 }),
  extra_links: jsonb('extra_links').$type<{ label: string; url: string }[]>().default([]),
  extra_data: jsonb('extra_data').default({}),
  notes: text('notes'),
  is_active: boolean('is_active').default(true),
  visible_on_website: boolean('visible_on_website').default(false),
  facebook_page_id: varchar('facebook_page_id', { length: 100 }),
  instagram_page_id: varchar('instagram_page_id', { length: 100 }),
  google_calendar_id: varchar('google_calendar_id', { length: 255 }),
  events_sources: jsonb('events_sources')
    .$type<{ type: 'facebook' | 'website' | 'instagram'; url: string }[]>()
    .default([]),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const persons = pgTable('persons', {
  id: uuid('id').primaryKey().defaultRandom(),
  first_name: varchar('first_name', { length: 255 }).notNull(),
  last_name: varchar('last_name', { length: 255 }),
  role: varchar('role', { length: 255 }),
  company: varchar('company', { length: 255 }),
  instagram_handle: varchar('instagram_handle', { length: 255 }),
  instagram_url: varchar('instagram_url', { length: 500 }),
  skills: jsonb('skills').$type<string[]>().default([]),
  tags: text('tags').array().default([]),
  // ENCRYPTED — NEVER SELECT OR EDIT IN ADMIN
  email: bytea('email'),
  phone: bytea('phone'),
  extra_links: jsonb('extra_links').$type<{ label: string; url: string }[]>().default([]),
  extra_data: jsonb('extra_data').default({}),
  notes: text('notes'),
  visible_on_website: boolean('visible_on_website').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  type: varchar('type', { length: 255 }),
  description: text('description'),
  instagram_handle: varchar('instagram_handle', { length: 255 }),
  instagram_url: varchar('instagram_url', { length: 500 }),
  facebook_url: varchar('facebook_url', { length: 500 }),
  website: varchar('website', { length: 500 }),
  tags: text('tags').array().default([]),
  extra_links: jsonb('extra_links').$type<{ label: string; url: string }[]>().default([]),
  extra_data: jsonb('extra_data').default({}),
  notes: text('notes'),
  is_active: boolean('is_active').default(true),
  visible_on_website: boolean('visible_on_website').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  google_event_id: varchar('google_event_id', { length: 255 }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  start_time: timestamp('start_time', { withTimezone: true }).notNull(),
  end_time: timestamp('end_time', { withTimezone: true }),
  location: varchar('location', { length: 500 }),
  tag: varchar('tag', { length: 100 }),
  ticket_url: varchar('ticket_url', { length: 500 }),
  venue: varchar('venue', { length: 255 }),
  image_url: varchar('image_url', { length: 500 }),
  extra_data: jsonb('extra_data').default({}),
  is_active: boolean('is_active').default(true),
  review_status: text('review_status').notNull().default('approved'),
  source: text('source'),
  reviewed_by: text('reviewed_by'),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const event_performers = pgTable('event_performers', {
  event_id: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  artist_id: uuid('artist_id')
    .notNull()
    .references(() => artists.id, { onDelete: 'cascade' }),
});

export const post_stats = pgTable('post_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: varchar('platform', { length: 50 }).notNull(),
  post_id: varchar('post_id', { length: 255 }),
  post_type: varchar('post_type', { length: 100 }),
  caption: text('caption'),
  published_at: timestamp('published_at', { withTimezone: true }),
  views: integer('views').default(0),
  reach: integer('reach').default(0),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  saves: integer('saves').default(0),
  follows: integer('follows').default(0),
  artist_id: uuid('artist_id').references(() => artists.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const account_snapshots = pgTable('account_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: varchar('platform', { length: 50 }).notNull(),
  followers: integer('followers').default(0),
  following: integer('following').default(0),
  posts_count: integer('posts_count').default(0),
  extra_metrics: jsonb('extra_metrics').default({}),
  recorded_at: timestamp('recorded_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const ig_mentions = pgTable('ig_mentions', {
  id: uuid('id').primaryKey().defaultRandom(),
  instagram_handle: varchar('instagram_handle', { length: 255 }).notNull().unique(),
  total_mentions: integer('total_mentions').default(0),
  first_mentioned_at: timestamp('first_mentioned_at', { withTimezone: true }),
  last_mentioned_at: timestamp('last_mentioned_at', { withTimezone: true }),
  artist_id: uuid('artist_id').references(() => artists.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  content: jsonb('content').notNull(),
  tags: text('tags').array().default([]),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// status values: pending_enrichment | enrichment_ready | enrichment_failed |
//   enrichment_approved | newsletter_generated | newsletter_approved |
//   blog_generated | blog_approved
export const featured_artists = pgTable('featured_artists', {
  id: uuid('id').primaryKey().defaultRandom(),
  artist_id: uuid('artist_id')
    .notNull()
    .references(() => artists.id, { onDelete: 'cascade' }),
  featured_month: varchar('featured_month', { length: 7 }).notNull(),
  order_position: integer('order_position').notNull(),
  status: text('status').notNull().default('pending_enrichment'),
  scraped_raw: jsonb('scraped_raw').default({}),
  enrichment_notes: text('enrichment_notes'),
  newsletter_blurb: text('newsletter_blurb'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// status values: draft | approved
export const featured_venues = pgTable('featured_venues', {
  id: uuid('id').primaryKey().defaultRandom(),
  venue_id: uuid('venue_id')
    .notNull()
    .references(() => venues.id, { onDelete: 'cascade' }),
  featured_month: varchar('featured_month', { length: 7 }).notNull().unique(),
  event_id: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
  callout_text: text('callout_text'),
  status: text('status').notNull().default('draft'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// platform values: instagram | facebook | youtube | newsletter
// content_type values: post | reel | story | short | carousel | video | email
// status values: draft | pending_approval | approved | scheduled | published | failed | archived
export const social_posts = pgTable('social_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: varchar('platform', { length: 50 }).notNull(),
  content_type: varchar('content_type', { length: 50 }).default('post'),
  status: text('status').notNull().default('draft'),
  title: varchar('title', { length: 500 }),
  caption: text('caption'),
  media_urls: text('media_urls').array().default([]),
  hashtags: text('hashtags').array().default([]),
  scheduled_publish_at: timestamp('scheduled_publish_at', { withTimezone: true }),
  published_at: timestamp('published_at', { withTimezone: true }),
  artist_id: uuid('artist_id').references(() => artists.id, { onDelete: 'set null' }),
  created_by: varchar('created_by', { length: 255 }),
  approved_by: varchar('approved_by', { length: 255 }),
  approval_notes: text('approval_notes'),
  approval_timestamp: timestamp('approval_timestamp', { withTimezone: true }),
  n8n_workflow_id: varchar('n8n_workflow_id', { length: 255 }),
  platform_post_id: varchar('platform_post_id', { length: 255 }),
  performance_stats: jsonb('performance_stats').default({}),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// is_active: only one record should have is_active=true at a time
export const brand_guidelines = pgTable('brand_guidelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: integer('version').notNull().default(1),
  name: varchar('name', { length: 255 }).notNull(),
  system_prompt: text('system_prompt').notNull(),
  tone_descriptors: text('tone_descriptors').array().default([]),
  hashtag_library: text('hashtag_library').array().default([]),
  example_posts: text('example_posts').array().default([]),
  is_active: boolean('is_active').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─────────────────────────────────────────────────────────────────────────────
// YOUTUBE INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

type YoutubeFooterLink = { label: string; url: string };
type YoutubeVideoTimestamp = { time: string; band_name: string; artist_id?: string };

export const youtube_config = pgTable('youtube_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  footer_links: jsonb('footer_links').$type<YoutubeFooterLink[]>().default([]),
  channel_bio: text('channel_bio').default(''),
  contact_emails: jsonb('contact_emails').$type<string[]>().default([]),
  prompt_version: varchar('prompt_version', { length: 50 }).default('v1'),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// status: pending_review | approved | published | needs_timestamps | skipped
// calendar_match_confidence: confirmed | guessed | none
export const youtube_videos = pgTable('youtube_videos', {
  video_id: varchar('video_id', { length: 20 }).primaryKey(),
  title: text('title'),
  description: text('description'),
  tags: text('tags').array().default([]),
  thumbnail_url: text('thumbnail_url'),
  duration_seconds: integer('duration_seconds'),
  published_at: timestamp('published_at', { withTimezone: true }),
  is_livestream: boolean('is_livestream').default(false),
  is_short: boolean('is_short').default(false),
  view_count: integer('view_count'),
  like_count: integer('like_count'),
  comment_count: integer('comment_count'),
  privacy_status: varchar('privacy_status', { length: 20 }).default('public'),
  proposed_title: text('proposed_title'),
  proposed_description: text('proposed_description'),
  proposed_tags: text('proposed_tags').array().default([]),
  proposed_playlist_ids: text('proposed_playlist_ids').array().default([]),
  status: text('status').default('pending_review'),
  prompt_version: varchar('prompt_version', { length: 50 }),
  calendar_event_id: text('calendar_event_id'),
  calendar_event_link: text('calendar_event_link'),
  calendar_match_confidence: text('calendar_match_confidence').default('none'),
  timestamps: jsonb('timestamps').$type<YoutubeVideoTimestamp[]>().default([]),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
  published_to_youtube_at: timestamp('published_to_youtube_at', { withTimezone: true }),
  review_notes: text('review_notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// playlist_type: venue | year | series | content_type
export const youtube_playlists = pgTable('youtube_playlists', {
  playlist_id: varchar('playlist_id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  video_count: integer('video_count').default(0),
  playlist_type: text('playlist_type').default('venue'),
  synced_at: timestamp('synced_at', { withTimezone: true }).defaultNow(),
});

// post_type values: artist_spotlight | event_recap | venue_feature | general
// status values: draft | approved | published
export const blog_posts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  post_type: text('post_type').notNull().default('general'),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  excerpt: text('excerpt'),
  body: text('body').notNull(),
  featured_image_url: varchar('featured_image_url', { length: 500 }),
  tags: text('tags').array().default([]),
  seo_title: varchar('seo_title', { length: 255 }),
  seo_description: text('seo_description'),
  status: text('status').notNull().default('draft'),
  publish_date: timestamp('publish_date', { withTimezone: true }),
  author_name: varchar('author_name', { length: 255 }),
  author_clerk_id: varchar('author_clerk_id', { length: 255 }),
  artist_id: uuid('artist_id').references(() => artists.id, { onDelete: 'set null' }),
  featured_artist_id: uuid('featured_artist_id').references(() => featured_artists.id, {
    onDelete: 'set null',
  }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const tag_definitions = pgTable('tag_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(),
  value: varchar('value', { length: 200 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// EVENTBRITE INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

export const eventbrite_events = pgTable('eventbrite_events', {
  // PK — Eventbrite's numeric event ID stored as string
  eventbrite_id: varchar('eventbrite_id', { length: 50 }).primaryKey(),

  // Core identity
  name: text('name').notNull(),
  description_text: text('description_text'),
  description_html: text('description_html'),
  url: text('url'),
  status: varchar('status', { length: 50 }), // live|started|ended|completed|canceled|draft|postponed
  currency: varchar('currency', { length: 10 }),

  // Times — store both UTC and local for display flexibility
  start_utc: timestamp('start_utc', { withTimezone: true }),
  start_local: text('start_local'),         // e.g. "2026-08-01T20:00:00"
  start_timezone: varchar('start_timezone', { length: 50 }), // IANA e.g. "America/New_York"
  end_utc: timestamp('end_utc', { withTimezone: true }),
  end_local: text('end_local'),
  end_timezone: varchar('end_timezone', { length: 50 }),

  // Media
  logo_url: text('logo_url'),
  logo_id: varchar('logo_id', { length: 50 }),

  // Format / category
  category_id: varchar('category_id', { length: 50 }),
  category_name: text('category_name'),
  subcategory_id: varchar('subcategory_id', { length: 50 }),
  subcategory_name: text('subcategory_name'),
  format_id: varchar('format_id', { length: 50 }),
  format_name: text('format_name'),

  // Flags
  is_free: boolean('is_free').notNull().default(false),
  online_event: boolean('online_event').notNull().default(false),

  // Capacity & availability
  capacity: integer('capacity'),
  ticket_availability_status: varchar('ticket_availability_status', { length: 50 }), // available|sold_out|unavailable
  quantity_available: integer('quantity_available'),

  // Venue — denormalized from expand (Eventbrite venue ≠ our venues table)
  venue_id_eb: varchar('venue_id_eb', { length: 50 }),
  venue_name: text('venue_name'),
  venue_address: text('venue_address'),
  venue_city: varchar('venue_city', { length: 100 }),
  venue_region: varchar('venue_region', { length: 100 }),
  venue_country: varchar('venue_country', { length: 10 }),
  venue_latitude: varchar('venue_latitude', { length: 20 }),
  venue_longitude: varchar('venue_longitude', { length: 20 }),

  // Organizer
  organizer_id_eb: varchar('organizer_id_eb', { length: 50 }),
  organizer_name: text('organizer_name'),
  org_id: varchar('org_id', { length: 50 }),

  // Ticket classes as JSONB array + rolled-up totals for fast list queries
  ticket_classes: jsonb('ticket_classes').notNull().default([]),
  quantity_sold: integer('quantity_sold'),
  quantity_total: integer('quantity_total'),

  // Revenue from /reports/sales/ endpoint
  gross_revenue_cents: integer('gross_revenue_cents'),
  net_revenue_cents: integer('net_revenue_cents'),
  fees_cents: integer('fees_cents'),
  report_currency: varchar('report_currency', { length: 10 }),

  // Full Eventbrite API response for future-proofing
  raw_data: jsonb('raw_data'),

  // Admin-set link to a local DB event — preserved through syncs
  linked_event_id: uuid('linked_event_id').references(() => events.id, { onDelete: 'set null' }),

  // Sync metadata
  synced_at: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
