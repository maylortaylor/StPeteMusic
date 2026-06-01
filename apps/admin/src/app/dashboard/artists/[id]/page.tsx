import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { ArtistForm } from '@/components/artists/artist-form';

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Artist</h1>
          <p className="mt-1 text-muted-foreground">Update artist profile and visibility settings</p>
        </div>
        <Link
          href={`/dashboard/artists/${id}/enrich`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Sparkles size={15} />
          Enrich Artist
        </Link>
      </div>
      <ArtistForm artistId={id} />
    </div>
  );
}
