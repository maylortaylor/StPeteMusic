import { ArtistForm } from '@/components/artists/artist-form';

export default function EditArtistPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Artist</h1>
        <p className="mt-1 text-gray-600">Update artist profile and visibility settings</p>
      </div>
      <ArtistForm artistId={params.id} />
    </div>
  );
}
