import { pgTable, text, varchar, uuid, timestamp, boolean, integer, numeric, jsonb, customType, } from 'drizzle-orm/pg-core';
const bytea = customType({
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
    genres: jsonb('genres').$type().default([]),
    tags: jsonb('tags').$type().default([]),
    extra_links: jsonb('extra_links').$type().default([]),
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
    tags: jsonb('tags').$type().default([]),
    instagram_url: varchar('instagram_url', { length: 500 }),
    instagram_username: varchar('instagram_username', { length: 255 }),
    facebook_url: varchar('facebook_url', { length: 500 }),
    facebook_username: varchar('facebook_username', { length: 255 }),
    website: varchar('website', { length: 500 }),
    hero_photo_url: varchar('hero_photo_url', { length: 500 }),
    lat: numeric('lat', { precision: 10, scale: 8 }),
    lng: numeric('lng', { precision: 11, scale: 8 }),
    extra_links: jsonb('extra_links').$type().default([]),
    extra_data: jsonb('extra_data').default({}),
    notes: text('notes'),
    is_active: boolean('is_active').default(true),
    visible_on_website: boolean('visible_on_website').default(false),
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
    skills: jsonb('skills').$type().default([]),
    tags: jsonb('tags').$type().default([]),
    // ENCRYPTED — NEVER SELECT OR EDIT IN ADMIN
    email: bytea('email'),
    phone: bytea('phone'),
    extra_links: jsonb('extra_links').$type().default([]),
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
    tags: jsonb('tags').$type().default([]),
    extra_links: jsonb('extra_links').$type().default([]),
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
    tags: jsonb('tags').$type().default([]),
    is_active: boolean('is_active').default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date()),
});
