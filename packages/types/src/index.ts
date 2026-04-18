export interface Artist {
  id: string;
  name: string;
  slug: string;
  genre?: string;
  instagram?: string;
  bio?: string;
  imageUrl?: string;
  type: 'band' | 'dj' | 'solo_artist' | 'visual_artist';
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string;
  neighborhood?: string;
  website?: string;
  instagram?: string;
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
