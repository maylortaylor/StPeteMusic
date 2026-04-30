'use client';

import { useEffect, useState } from 'react';

const API_URL = '/api/linktree';
const PROFILE_SLUG = 'stpetemusic';

interface LinkItem {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  position: number;
}

interface SocialLink {
  type: string;
  url: string;
}

interface Profile {
  profile: string;
  name: string;
  bio: string;
  avatarUrl: string;
  links: LinkItem[];
  socialLinks: SocialLink[];
}

export function LinkTreeSection() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data: Profile[]) => {
        const found = data.find((p) => p.profile === PROFILE_SLUG);
        if (found) setProfile(found);
      })
      .catch(() => {});
  }, []);

  if (!profile) {
    return (
      <section className="py-12 px-4 max-w-3xl mx-auto">
        <div className="h-5 w-2/5 bg-[var(--color-surface)] rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 bg-[var(--color-surface)] border border-[var(--color-border)] rounded"
            />
          ))}
        </div>
      </section>
    );
  }

  const sortedLinks = [...profile.links].sort((a, b) => a.position - b.position);

  return (
    <section className="py-12 px-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold">
        <a
          href={`https://linktr.ee/${profile.profile}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-brand-orange)] transition-colors"
        >
          Find Us Everywhere
        </a>
      </h2>
      <span className="section-underline" />

      <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 mb-4 p-0 list-none">
        {sortedLinks.map((link) => (
          <li key={link.id} role="listitem">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3.5 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] no-underline font-semibold text-sm transition-colors hover:border-[var(--color-brand-orange)] hover:bg-[var(--color-surface-raised)]"
            >
              {link.title}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="shrink-0 ml-2 opacity-50"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </li>
        ))}
      </ul>

      {profile.socialLinks.length > 0 && (
        <ul
          role="list"
          aria-label="Social media links"
          className="flex flex-wrap gap-4 mt-2 p-0 list-none"
        >
          {profile.socialLinks.map((social, i) => (
            <li key={i} role="listitem">
              <a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text-primary)] transition-colors"
              >
                {social.type.replace(/_/g, ' ')}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
