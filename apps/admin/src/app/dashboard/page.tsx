export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to the StPeteMusic admin dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-600">Active Artists</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-500">Phase 2</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-600">Active Venues</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-500">Phase 2</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-500">Phase 2</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-600">Instagram Followers</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-500">Phase 2</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Getting Started</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li>• Navigate to <strong>Artists</strong> to manage artist profiles</li>
          <li>• Use <strong>Venues</strong> to add performance locations</li>
          <li>• Organize content with <strong>Templates</strong></li>
          <li>• More features coming in Phase 2</li>
        </ul>
      </div>
    </div>
  );
}
