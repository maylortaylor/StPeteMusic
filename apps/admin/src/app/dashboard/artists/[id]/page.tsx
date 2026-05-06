import { ArtistForm } from '@/components/artists/artist-form';

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Artist</h1>
        <p className="mt-1 text-gray-600">Update artist profile and visibility settings</p>
      </div>
      <ArtistForm artistId={id} />
    </div>
  );
}
