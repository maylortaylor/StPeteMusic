-- Migration 004: Backfill slugs for all 34 artists from seed.sql
-- Run: psql $DATABASE_URL -f database/migrations/004_seed_artist_slugs.sql

UPDATE artists SET slug = 'the-pleasantries'   WHERE name = 'The Pleasantries'        AND slug IS NULL;
UPDATE artists SET slug = 'dandy-lush'          WHERE name = 'Dandy Lush'              AND slug IS NULL;
UPDATE artists SET slug = 'harlow-gold'         WHERE name = 'Harlow Gold'             AND slug IS NULL;
UPDATE artists SET slug = 'moonshow'            WHERE name = 'MoonShow'                AND slug IS NULL;
UPDATE artists SET slug = 'sedque'              WHERE name = 'Sedque'                  AND slug IS NULL;
UPDATE artists SET slug = 'willie-jones'        WHERE name = 'Willie Jones'            AND slug IS NULL;
UPDATE artists SET slug = 'brother-bear'        WHERE name = 'Brother Bear'            AND slug IS NULL;
UPDATE artists SET slug = 'khoury-affinity'     WHERE name = 'Khoury Affinity'         AND slug IS NULL;
UPDATE artists SET slug = 'accentrik'           WHERE name = 'Accentrik'               AND slug IS NULL;
UPDATE artists SET slug = 'nico-the-alchemist'  WHERE name = 'Nico the Alchemist'      AND slug IS NULL;
UPDATE artists SET slug = 'slamchops'           WHERE name = 'SlamChops'               AND slug IS NULL;
UPDATE artists SET slug = 'wyatt-norton'        WHERE name = 'Wyatt Norton'            AND slug IS NULL;
UPDATE artists SET slug = 'allen-fereti'        WHERE name = 'Allen Fereti'            AND slug IS NULL;
UPDATE artists SET slug = 'kieth-penu'          WHERE name = 'Kieth Penu'              AND slug IS NULL;
UPDATE artists SET slug = 'physical-plant'      WHERE name = 'Physical Plant'          AND slug IS NULL;
UPDATE artists SET slug = 'seems'               WHERE name = 'Seems'                   AND slug IS NULL;
UPDATE artists SET slug = 'little-giver-band'   WHERE name = 'Little Giver Band'       AND slug IS NULL;
UPDATE artists SET slug = 'liam-bauman'         WHERE name = 'Liam Bauman'             AND slug IS NULL;
UPDATE artists SET slug = 'callaghan-keane'     WHERE name = 'Callaghan Keane'         AND slug IS NULL;
UPDATE artists SET slug = 'brian-busto'         WHERE name = 'Brian Busto'             AND slug IS NULL;
UPDATE artists SET slug = 'bryan-edward'        WHERE name = 'Bryan Edward'            AND slug IS NULL;
UPDATE artists SET slug = 'prophessor-j-events' WHERE name = 'Prophessor J Events'     AND slug IS NULL;
UPDATE artists SET slug = 'clockworkxband'      WHERE name = 'Chriss (Clockworkxband)' AND slug IS NULL;
UPDATE artists SET slug = 'dylan-dames'         WHERE name = 'Dylan Dames'             AND slug IS NULL;
UPDATE artists SET slug = 'johee-mason'         WHERE name = 'JoheeMason'              AND slug IS NULL;
UPDATE artists SET slug = 'mel-with-a-period'   WHERE name = 'Mel With A Period'       AND slug IS NULL;
UPDATE artists SET slug = 'movie-props'         WHERE name = 'Movie Props'             AND slug IS NULL;
UPDATE artists SET slug = 'then-theres-me'      WHERE name = 'Then There''s Me'        AND slug IS NULL;
UPDATE artists SET slug = 'beach-terror'        WHERE name = 'Beach Terror'            AND slug IS NULL;
UPDATE artists SET slug = 'viorica'             WHERE name = 'Viorica'                 AND slug IS NULL;
UPDATE artists SET slug = 'aliqua'              WHERE name = 'Aliqua'                  AND slug IS NULL;
UPDATE artists SET slug = 'spanish-bombs'       WHERE name = 'Spanish Bombs'           AND slug IS NULL;
UPDATE artists SET slug = 'house-of-i'          WHERE name = 'House of I'              AND slug IS NULL;
UPDATE artists SET slug = 'the-tilt'            WHERE name = 'The Tilt'                AND slug IS NULL;
