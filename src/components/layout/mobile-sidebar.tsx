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
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pacientes", href: "/patients", icon: Users },
  { label: "Planes", href: "/plans", icon: ClipboardList },
  { label: "Alimentos", href: "/foods", icon: Apple },
  { label: "Recetas", href: "/recipes", icon: ChefHat },
  { label: "Calculadora", href: "/calc", icon: Calculator },
  { label: "Ajustes", href: "/settings", icon: Settings },
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
        className="md:hidden text-[hsl(var(--muted-foreground))]"
        aria-label="Abrir menú"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex flex-col transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-2.5">
            <img src="/lutra-logo.svg" alt="Lutra" className="w-10 h-10 rounded-xl shrink-0" />
            <span className="text-lg font-bold tracking-tight">Lutra</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[hsl(var(--warm-cream))] text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--primary))]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
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
          <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">Mi cuenta</span>
        </div>
      </div>
    </>
  );
}
