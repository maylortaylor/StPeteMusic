import { VenueForm } from '@/components/venues/venue-form';

export default function NewVenuePage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Venue</h1>
        <p className="mt-1 text-gray-600">Add a new performance venue</p>
      </div>
      <VenueForm />
    </div>
  );
}
