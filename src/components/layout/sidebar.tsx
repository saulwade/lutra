"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Apple,
  ChefHat,
  Calculator,
  Settings,
  Sparkles,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",    href: "/dashboard", icon: LayoutDashboard },
  { label: "Pacientes",    href: "/patients",  icon: Users },
  { label: "Planes",       href: "/plans",     icon: ClipboardList },
  { label: "Plan con IA",  href: "/ai",        icon: Sparkles, highlight: true },
  { label: "Alimentos",    href: "/foods",     icon: Apple },
  { label: "Recetas",      href: "/recipes",   icon: ChefHat },
  { label: "Calculadora",  href: "/calc",      icon: Calculator },
  { label: "Ajustes",      href: "/settings",  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] shrink-0">

      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--warm-cream))] flex items-center justify-center shrink-0 ring-1 ring-[hsl(var(--border))]">
          <img src="/lutra-logo.svg" alt="Lutra" className="w-6 h-6" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-[hsl(var(--foreground))]">Lutra</span>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Nutrición clínica</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        {navItems.map(({ label, href, icon: Icon, highlight }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[hsl(var(--warm-cream))] text-[hsl(var(--terracotta))] font-semibold"
                  : highlight
                    ? "text-[hsl(var(--primary))] hover:bg-[hsl(var(--sidebar-accent))]"
                    : "text-[hsl(20,10%,40%)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[hsl(var(--terracotta))] rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-[hsl(var(--terracotta))]"
                    : highlight ? "text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted-foreground))]"
                )}
              />
              {label}
              {highlight && !isActive && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-[hsl(var(--primary))] text-white px-1.5 py-0.5 rounded-full">
                  IA
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="px-4 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-xs font-medium text-[hsl(var(--foreground))]">Mi cuenta</span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Ver perfil</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
