'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Users2,
  Building2,
  Zap,
  Mail,
  Star,
  Calendar,
  CalendarDays,
  Mic2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Artists',
    href: '/dashboard/artists',
    icon: Users,
  },
  {
    label: 'Featured',
    href: '/dashboard/featured',
    icon: Star,
  },
  {
    label: 'Venues',
    href: '/dashboard/venues',
    icon: MapPin,
  },
  {
    label: 'Events',
    href: '/dashboard/events',
    icon: CalendarDays,
  },
  {
    label: 'Persons',
    href: '/dashboard/persons',
    icon: Users2,
  },
  {
    label: 'Organizations',
    href: '/dashboard/organizations',
    icon: Building2,
  },
  {
    label: 'Content Calendar',
    href: '/dashboard/content-calendar',
    icon: Calendar,
  },
  {
    label: 'Brand Voice',
    href: '/dashboard/brand-voice',
    icon: Mic2,
  },
  {
    label: 'Templates',
    href: '/dashboard/templates',
    icon: Zap,
  },
  {
    label: 'Newsletter',
    href: '/dashboard/newsletter',
    icon: Mail,
  },
];

export function Sidebar() {
  const pathname = usePathname();

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
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
