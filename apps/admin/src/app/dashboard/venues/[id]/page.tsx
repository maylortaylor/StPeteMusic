import { VenueForm } from '@/components/venues/venue-form';

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Edit Venue</h1>
        <p className="mt-1 text-muted-foreground">Update venue details and visibility settings</p>
      </div>
      <VenueForm venueId={id} />
    </div>
  );
}
