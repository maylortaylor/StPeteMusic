'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  LayoutDashboard,
  Mail,
  MapPin,
  Mic2,
  Star,
  Tag,
  Ticket,
  Users,
  Users2,
  Youtube,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard',       href: '/dashboard',                icon: LayoutDashboard },
  { label: 'Artists',         href: '/dashboard/artists',        icon: Users },
  { label: 'Featured',        href: '/dashboard/featured',       icon: Star },
  { label: 'Venues',          href: '/dashboard/venues',         icon: MapPin },
  { label: 'Events',          href: '/dashboard/events',         icon: CalendarDays, reviewQueue: true },
  { label: 'Tags',            href: '/dashboard/tags',           icon: Tag },
  { label: 'Persons',         href: '/dashboard/persons',        icon: Users2 },
  { label: 'Organizations',   href: '/dashboard/organizations',  icon: Building2 },
  { label: 'Content Calendar',href: '/dashboard/content-calendar', icon: Calendar },
  { label: 'Brand Voice',     href: '/dashboard/brand-voice',    icon: Mic2 },
  { label: 'Templates',       href: '/dashboard/templates',      icon: Zap },
  { label: 'YouTube',          href: '/dashboard/youtube',        icon: Youtube, reviewQueue: false },
  { label: 'Eventbrite',      href: '/dashboard/eventbrite',     icon: Ticket },
  { label: 'Newsletter',      href: '/dashboard/newsletter',     icon: Mail },
  { label: 'Playbook',        href: '/dashboard/playbook',       icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch('/api/events?review_status=pending')
      .then((r) => r.json())
      .then((d) => setPendingCount(d.events?.length ?? 0))
      .catch(() => {});
  }, []);

  return (
    <nav className="flex flex-col gap-2 border-r border-border bg-card px-4 py-6">
      <div className="mb-4 px-2">
        <h1 className="text-lg font-bold text-foreground">StPeteMusic</h1>
        <p className="text-sm text-muted-foreground">Admin Dashboard</p>
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.reviewQueue && pendingCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
                  {pendingCount}
                </span>
              )}
            </Link>
            {item.reviewQueue && (
              <Link
                href="/dashboard/events/review"
                className={cn(
                  'ml-8 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  pathname === '/dashboard/events/review'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                Review Queue
                {pendingCount > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
            {item.href === '/dashboard/youtube' && isActive && (
              <Link
                href="/dashboard/youtube/config"
                className={cn(
                  'ml-8 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  pathname === '/dashboard/youtube/config'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                Settings
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
