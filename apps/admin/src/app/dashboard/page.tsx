export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome to the StPeteMusic admin dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Active Artists</p>
          <p className="mt-2 text-2xl font-bold text-foreground">—</p>
          <p className="text-xs text-muted-foreground">Phase 2</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Active Venues</p>
          <p className="mt-2 text-2xl font-bold text-foreground">—</p>
          <p className="text-xs text-muted-foreground">Phase 2</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
          <p className="mt-2 text-2xl font-bold text-foreground">—</p>
          <p className="text-xs text-muted-foreground">Phase 2</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Instagram Followers</p>
          <p className="mt-2 text-2xl font-bold text-foreground">—</p>
          <p className="text-xs text-muted-foreground">Phase 2</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Getting Started</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>• Navigate to <strong>Artists</strong> to manage artist profiles</li>
          <li>• Use <strong>Venues</strong> to add performance locations</li>
          <li>• Organize content with <strong>Templates</strong></li>
          <li>• More features coming in Phase 2</li>
        </ul>
      </div>
    </div>
  );
}
