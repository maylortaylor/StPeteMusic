import { ArtistForm } from '@/components/artists/artist-form';

export default function NewArtistPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Artist</h1>
        <p className="mt-1 text-gray-600">Add a new artist to the StPeteMusic community</p>
      </div>
      <ArtistForm />
    </div>
  );
}
