-- Migration 013: Seed 9 collaborating organizations
-- Source: /obsidian_vault/Contacts/Collaborators/ (non-individual entries)
-- These are NOT individuals — stored in the new organizations table, not persons.
-- visible_on_website defaults to false — no public org pages at launch.

INSERT INTO organizations (name, slug, type, instagram_handle, instagram_url, is_active, visible_on_website)
VALUES
  ('Daddy Kool Records',
    'daddy-kool-records',
    'record-store',
    '@daddykoolrecords',
    'https://www.instagram.com/daddykoolrecords',
    true, false),

  ('Groove Hive Market',
    'groove-hive-market',
    'market',
    '@groovehivemarket',
    'https://www.instagram.com/groovehivemarket',
    true, false),

  ('NPO Aura',
    'npo-aura',
    'nonprofit',
    '@npo.aura',
    'https://www.instagram.com/npo.aura',
    true, false),

  ('Queer Expressions St. Pete',
    'queer-expressions-st-pete',
    'org',
    '@queerexpressionstpete',
    'https://www.instagram.com/queerexpressionstpete',
    true, false),

  ('Saint Paint Arts',
    'saint-paint-arts',
    'arts-org',
    '@saintpaintarts',
    'https://www.instagram.com/saintpaintarts',
    true, false),

  ('Silvermore Photography',
    'silvermore-photography',
    'photographer',
    '@silvermorephotography',
    'https://www.instagram.com/silvermorephotography',
    true, false),

  ('Tangible Record Shop',
    'tangible-record-shop',
    'record-store',
    '@tangiblerecordshop',
    'https://www.instagram.com/tangiblerecordshop',
    true, false),

  ('WUSF Jazz',
    'wusf-jazz',
    'media',
    '@wusfjazz',
    'https://www.instagram.com/wusfjazz',
    true, false),

  ('WUSF Public Media',
    'wusf-public-media',
    'media',
    '@wusfpublicmedia',
    'https://www.instagram.com/wusfpublicmedia',
    true, false)

ON CONFLICT (slug) DO NOTHING;
