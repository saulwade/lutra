"use client";

import { useState } from "react";
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
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",   href: "/dashboard", icon: LayoutDashboard },
  { label: "Pacientes",   href: "/patients",  icon: Users },
  { label: "Planes",      href: "/plans",     icon: ClipboardList },
  { label: "Plan con IA", href: "/ai",        icon: Sparkles, highlight: true },
  { label: "Alimentos",   href: "/foods",     icon: Apple },
  { label: "Recetas",     href: "/recipes",   icon: ChefHat },
  { label: "Calculadora", href: "/calc",      icon: Calculator },
  { label: "Ajustes",     href: "/settings",  icon: Settings },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Hamburger trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-[hsl(var(--muted-foreground))] h-11 w-11"
        aria-label="Abrir menú"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex flex-col transition-transform duration-300 ease-in-out md:hidden",
          "pb-[env(safe-area-inset-bottom)]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-2.5">
            <img src="/lutra-logo.svg" alt="Lutra" className="w-9 h-9 rounded-xl shrink-0" />
            <span className="text-lg font-bold tracking-tight">Lutra</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5 px-3 py-3 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon, highlight }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors min-h-[48px]",
                  isActive
                    ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))] font-semibold"
                    : highlight
                    ? "text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-[hsl(var(--primary))]"
                      : highlight
                      ? "text-[hsl(var(--primary))]"
                      : "text-[hsl(var(--muted-foreground))]"
                  )}
                />
                {label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="px-5 py-4 border-t border-[hsl(var(--sidebar-border))] flex items-center gap-3">
          <UserButton />
          <span className="text-sm text-[hsl(var(--muted-foreground))] truncate">Mi cuenta</span>
        </div>
      </div>
    </>
  );
}
