'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Artist {
  id: string;
  name: string;
  type: string;
  username?: string;
  is_active: boolean;
  visible_on_website: boolean;
  created_at: string;
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArtists() {
      try {
        const response = await fetch('/api/artists');
        if (!response.ok) throw new Error('Failed to fetch artists');
        const data = await response.json();
        setArtists(data.artists || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchArtists();
  }, []);

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/artists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentValue }),
      });

      if (!response.ok) throw new Error('Failed to update artist');

      setArtists(artists.map(a => a.id === id ? { ...a, is_active: !currentValue } : a));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Artists</h1>
          <p className="mt-1 text-gray-600">Manage artist profiles and visibility</p>
        </div>
        <Link
          href="/dashboard/artists/new"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          New Artist
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Public</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {artists.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No artists yet
                </td>
              </tr>
            ) : (
              artists.map((artist) => (
                <tr key={artist.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{artist.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{artist.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{artist.username || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleToggleActive(artist.id, artist.is_active)}
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        artist.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {artist.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        artist.visible_on_website
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {artist.visible_on_website ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/dashboard/artists/${artist.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
