-- Migrate existing artist URL columns into the artist_links table.
-- Each platform is only inserted if the artist does not already have a row
-- for that platform (guards against re-running on artists already enriched).

-- instagram
INSERT INTO artist_links (id, artist_id, platform, url, label, display_order, is_active, is_featured)
SELECT
  gen_random_uuid(),
  a.id,
  'instagram',
  a.instagram_url,
  'Instagram',
  (SELECT COALESCE(MAX(al.display_order), -1) + 1 FROM artist_links al WHERE al.artist_id = a.id),
  true,
  false
FROM artists a
WHERE a.instagram_url IS NOT NULL
  AND a.instagram_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM artist_links al WHERE al.artist_id = a.id AND al.platform = 'instagram'
  );

-- facebook
INSERT INTO artist_links (id, artist_id, platform, url, label, display_order, is_active, is_featured)
SELECT
  gen_random_uuid(),
  a.id,
  'facebook',
  a.facebook_url,
  'Facebook',
  (SELECT COALESCE(MAX(al.display_order), -1) + 1 FROM artist_links al WHERE al.artist_id = a.id),
  true,
  false
FROM artists a
WHERE a.facebook_url IS NOT NULL
  AND a.facebook_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM artist_links al WHERE al.artist_id = a.id AND al.platform = 'facebook'
  );

-- youtube
INSERT INTO artist_links (id, artist_id, platform, url, label, display_order, is_active, is_featured)
SELECT
  gen_random_uuid(),
  a.id,
  'youtube',
  a.youtube_url,
  'YouTube',
  (SELECT COALESCE(MAX(al.display_order), -1) + 1 FROM artist_links al WHERE al.artist_id = a.id),
  true,
  false
FROM artists a
WHERE a.youtube_url IS NOT NULL
  AND a.youtube_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM artist_links al WHERE al.artist_id = a.id AND al.platform = 'youtube'
  );

-- website
INSERT INTO artist_links (id, artist_id, platform, url, label, display_order, is_active, is_featured)
SELECT
  gen_random_uuid(),
  a.id,
  'website',
  a.website,
  'Website',
  (SELECT COALESCE(MAX(al.display_order), -1) + 1 FROM artist_links al WHERE al.artist_id = a.id),
  true,
  false
FROM artists a
WHERE a.website IS NOT NULL
  AND a.website != ''
  AND NOT EXISTS (
    SELECT 1 FROM artist_links al WHERE al.artist_id = a.id AND al.platform = 'website'
  );

-- linktree
INSERT INTO artist_links (id, artist_id, platform, url, label, display_order, is_active, is_featured)
SELECT
  gen_random_uuid(),
  a.id,
  'linktree',
  a.linktree_url,
  'Linktree',
  (SELECT COALESCE(MAX(al.display_order), -1) + 1 FROM artist_links al WHERE al.artist_id = a.id),
  true,
  false
FROM artists a
WHERE a.linktree_url IS NOT NULL
  AND a.linktree_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM artist_links al WHERE al.artist_id = a.id AND al.platform = 'linktree'
  );

-- bandcamp
INSERT INTO artist_links (id, artist_id, platform, url, label, display_order, is_active, is_featured)
SELECT
  gen_random_uuid(),
  a.id,
  'bandcamp',
  a.bandcamp_url,
  'Bandcamp',
  (SELECT COALESCE(MAX(al.display_order), -1) + 1 FROM artist_links al WHERE al.artist_id = a.id),
  true,
  false
FROM artists a
WHERE a.bandcamp_url IS NOT NULL
  AND a.bandcamp_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM artist_links al WHERE al.artist_id = a.id AND al.platform = 'bandcamp'
  );

-- spotify
INSERT INTO artist_links (id, artist_id, platform, url, label, display_order, is_active, is_featured)
SELECT
  gen_random_uuid(),
  a.id,
  'spotify',
  a.spotify_url,
  'Spotify',
  (SELECT COALESCE(MAX(al.display_order), -1) + 1 FROM artist_links al WHERE al.artist_id = a.id),
  true,
  false
FROM artists a
WHERE a.spotify_url IS NOT NULL
  AND a.spotify_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM artist_links al WHERE al.artist_id = a.id AND al.platform = 'spotify'
  );

-- soundcloud
INSERT INTO artist_links (id, artist_id, platform, url, label, display_order, is_active, is_featured)
SELECT
  gen_random_uuid(),
  a.id,
  'soundcloud',
  a.soundcloud_url,
  'SoundCloud',
  (SELECT COALESCE(MAX(al.display_order), -1) + 1 FROM artist_links al WHERE al.artist_id = a.id),
  true,
  false
FROM artists a
WHERE a.soundcloud_url IS NOT NULL
  AND a.soundcloud_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM artist_links al WHERE al.artist_id = a.id AND al.platform = 'soundcloud'
  );
