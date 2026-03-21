import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/toaster";
import { AuthGuard } from "@/components/providers/auth-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AuthGuard>{children}</AuthGuard>
        </main>
      </div>

      <Toaster />
    </div>
  );
}
