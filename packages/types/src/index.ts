export interface Artist {
  id: string;
  name: string;
  slug: string;
  type: 'Band' | 'Solo Artist' | 'DJ' | 'Event Producer' | 'Creative' | 'Other';
  description?: string;
  email?: string;
  hero_photo_url?: string;
  home_base?: string;
  genres: string[];
  tags: string[];
  username?: string;
  instagram_handle?: string;
  instagram_url?: string;
  facebook_url?: string;
  youtube_url?: string;
  bandcamp_url?: string;
  spotify_url?: string;
  soundcloud_url?: string;
  linktree_url?: string;
  website?: string;
  extra_links: { label: string; url: string }[];
  extra_data: Record<string, unknown>;
  notes?: string;
  is_active: boolean;
  visible_on_website: boolean;
}

export interface ArtistShow {
  id: string;
  artist_id: string;
  title: string;
  youtube_url?: string;
  show_date?: string;
  venue_name?: string;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  neighborhood?: string;
  av_setup?: string;
  partnership_level?: string;
  phone?: string;
  email?: string;
  capacity?: number;
  tags: string[];
  instagram_url?: string;
  instagram_username?: string;
  facebook_url?: string;
  facebook_username?: string;
  website?: string;
  hero_photo_url?: string;
  lat?: number;
  lng?: number;
  extra_links: { label: string; url: string }[];
  extra_data: Record<string, unknown>;
  notes?: string;
  is_active: boolean;
  visible_on_website: boolean;
}

export interface Collaborator {
  id: string;
  first_name: string;
  last_name?: string;
  role?: string;
  company?: string;
  instagram_handle?: string;
  instagram_url?: string;
  skills: string[];
  tags: string[];
  extra_links: { label: string; url: string }[];
  extra_data: Record<string, unknown>;
  notes?: string;
  visible_on_website: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  type?: string;
  description?: string;
  instagram_handle?: string;
  instagram_url?: string;
  facebook_url?: string;
  website?: string;
  tags: string[];
  extra_links: { label: string; url: string }[];
  extra_data: Record<string, unknown>;
  notes?: string;
  is_active: boolean;
  visible_on_website: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  eventDate: string;
  doorsTime?: string;
  venueId: string;
  venue?: Venue;
  performers: Array<{
    artistId: string;
    artist?: Artist;
    headline: boolean;
  }>;
  ticketUrl?: string;
  coverCharge?: number;
  description?: string;
  imageUrl?: string;
  eventType: 'Final Friday' | 'Instant Noodles' | 'Second Saturday' | 'Other';
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: 'draft' | 'scheduled' | 'published';
  publishedAt?: string;
  platform?: 'YouTube' | 'Instagram' | 'Facebook';
  bandName?: string;
  bandInstagram?: string;
  mediaLink?: string;
  hashtags?: string[];
}

export interface NewsletterSubscriber {
  email: string;
  name?: string;
  subscribedAt: string;
}
