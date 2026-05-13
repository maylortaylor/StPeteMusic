import { Sidebar } from '@/components/sidebar';
import { Navbar } from '@/components/navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <div className="w-64 overflow-y-auto">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto bg-muted p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
