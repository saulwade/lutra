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
        {/* overflow-y-auto aquí, el padding va en el div interno
            para que iOS Safari respete el padding-right al hacer scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 py-4 md:px-6 md:py-6 pb-8 min-h-full">
            <AuthGuard>{children}</AuthGuard>
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}
