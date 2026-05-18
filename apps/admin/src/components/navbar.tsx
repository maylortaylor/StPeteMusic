'use client';

import { UserButton } from '@clerk/nextjs';
import { ThemeToggle } from './theme-toggle';
import { ToastHistoryPopover } from './toast-history-popover';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">Admin</h2>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <ToastHistoryPopover />
        <UserButton />
      </div>
    </nav>
  );
}
