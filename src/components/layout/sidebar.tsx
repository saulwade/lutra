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
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Pacientes",
    href: "/patients",
    icon: Users,
  },
  {
    label: "Planes",
    href: "/plans",
    icon: ClipboardList,
  },
  {
    label: "Plan con IA",
    href: "/ai",
    icon: Sparkles,
    highlight: true,
  },
  {
    label: "Alimentos",
    href: "/foods",
    icon: Apple,
  },
  {
    label: "Recetas",
    href: "/recipes",
    icon: ChefHat,
  },
  {
    label: "Calculadora",
    href: "/calc",
    icon: Calculator,
  },
  {
    label: "Ajustes",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
        <img src="/lutra-logo.svg" alt="Lutra" className="w-10 h-10 rounded-xl shrink-0" />
        <span className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight">
          Lutra
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map(({ label, href, icon: Icon, highlight }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[hsl(81,10%,92%)] text-[hsl(var(--primary))]"
                  : highlight
                    ? "text-[hsl(var(--primary))] hover:bg-[hsl(81,10%,95%)]"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--primary))]"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive || highlight
                    ? "text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted-foreground))]"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="px-5 py-4 border-t border-[hsl(var(--sidebar-border))] flex items-center gap-3">
        <UserButton />
        <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
          Mi cuenta
        </span>
      </div>
    </aside>
  );
}
