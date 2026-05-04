'use client';

import Link from 'next/link';
import { pushEvent } from '@/lib/analytics';

interface SocialLink {
  label: string;
  url: string;
}

interface Props {
  artistName: string;
  instagramUrl?: string;
  socialLinks: SocialLink[];
  extraLinks: SocialLink[];
  email?: string;
}

export function ArtistDetailSidebar({ artistName, instagramUrl, socialLinks, extraLinks, email }: Props) {
  function trackSocial(label: string, url: string) {
    pushEvent('artist_social_click', {
      artist_name: artistName,
      link_label: label,
      link_url: url,
    });
  }

  return (
    <div className="bg-white border border-border p-8 sticky top-24">

      {/* Primary CTA */}
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackSocial('Instagram', instagramUrl)}
          className="block w-full text-center text-white font-inter font-bold text-sm uppercase tracking-widest px-8 py-4 bg-black hover:opacity-85 transition-opacity mb-8"
        >
          Follow on Instagram
        </a>
      )}

      {/* Social + extra links */}
      {(socialLinks.length > 0 || extraLinks.length > 0) && (
        <div className="flex flex-col gap-3">
          {[...socialLinks, ...extraLinks].map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackSocial(link.label, link.url)}
              className="font-inter text-base text-text-secondary hover:text-black transition-colors flex items-center justify-between group"
            >
              <span>{link.label}</span>
              <span className="text-text-muted group-hover:text-black transition-colors">→</span>
            </a>
          ))}
        </div>
      )}

      {/* Email */}
      {email && (
        <div className="mt-6 pt-6 border-t border-border">
          <p className="font-inter text-xs uppercase tracking-[0.3em] text-text-muted mb-1">Contact</p>
          <a
            href={`mailto:${email}`}
            className="font-inter text-sm text-text-secondary hover:text-black transition-colors break-all"
          >
            {email}
          </a>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-border">
        <Link
          href="/discover"
          className="font-inter text-sm text-text-muted hover:text-black transition-colors uppercase tracking-widest"
        >
          ← All Artists
        </Link>
      </div>
    </div>
  );
}
