"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Sun, Moon } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Pacientes",
  "/plans": "Planes",
  "/foods": "Alimentos SMAE",
  "/recipes": "Recetas",
  "/calc": "Calculadora Nutricional",
  "/settings": "Ajustes",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [key, label] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + "/")) return label;
  }
  return "Lutra";
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-[hsl(var(--muted-foreground))]"
      aria-label="Cambiar tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Left: mobile menu + page title */}
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
          {title}
        </h2>
      </div>

      {/* Right: theme toggle + notifications + user */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="text-[hsl(var(--muted-foreground))] relative"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
        </Button>
        <UserButton />
      </div>
    </header>
  );
}
