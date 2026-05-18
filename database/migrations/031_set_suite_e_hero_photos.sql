-- Set hero_photo_url for artists whose photos are now served from /images/suite-e/
-- Only updates rows where hero_photo_url is currently NULL to avoid overwriting manual edits.

UPDATE artists SET hero_photo_url = '/images/suite-e/viorica_01.jpg'
  WHERE slug = 'viorica' AND hero_photo_url IS NULL;

UPDATE artists SET hero_photo_url = '/images/suite-e/dionysus_01.jpg'
  WHERE slug = 'dionysus' AND hero_photo_url IS NULL;

UPDATE artists SET hero_photo_url = '/images/suite-e/katara_harp01.JPG'
  WHERE slug = 'katara' AND hero_photo_url IS NULL;

UPDATE artists SET hero_photo_url = '/images/suite-e/minim_01.jpg'
  WHERE slug = 'minim' AND hero_photo_url IS NULL;

UPDATE artists SET hero_photo_url = '/images/suite-e/mouth_council.jpg'
  WHERE slug = 'mouth-council' AND hero_photo_url IS NULL;

UPDATE artists SET hero_photo_url = '/images/suite-e/movie_props_01.jpg'
  WHERE slug = 'movie-props' AND hero_photo_url IS NULL;

UPDATE artists SET hero_photo_url = '/images/suite-e/band_light the wire.jpg'
  WHERE slug = 'light-the-wire' AND hero_photo_url IS NULL;

UPDATE artists SET hero_photo_url = '/images/suite-e/chriss_01.jpg'
  WHERE slug = 'clockworkxband' AND hero_photo_url IS NULL;
