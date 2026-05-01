export interface Artist {
  id: string;
  name: string;
  slug: string;
  type: 'Band' | 'Solo Artist' | 'DJ' | 'SR. PRODUCER' | 'Creative' | 'Other';
  description?: string;
  email?: string;
  hero_photo_url?: string;
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
  is_active: boolean;
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
  is_active: boolean;
}

export interface Collaborator {
  id: string;
  first_name: string;
  last_name?: string;
  skills: string[];
  notes?: string;
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
