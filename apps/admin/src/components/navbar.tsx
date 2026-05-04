'use client';

import { UserButton } from '@clerk/nextjs';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Admin</h2>
      </div>
      <div className="flex items-center gap-4">
        <UserButton />
      </div>
    </nav>
  );
}
