import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[hsl(81,10%,54%)] via-[hsl(81,10%,28%)] to-[hsl(81,10%,20%)]">
      {/* Subtle background dots pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full px-4">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <img src="/lutra-logo.svg" alt="Lutra" className="w-20 h-20 rounded-2xl shadow-lg" />
          <h1 className="text-white text-3xl font-bold tracking-tight">
            Lutra
          </h1>
          <p className="text-white/70 text-sm text-center max-w-xs">
            Plataforma profesional para nutriólogos
          </p>
        </div>

        {children}

        <p className="text-white/50 text-xs text-center pb-4">
          &copy; {new Date().getFullYear()} Lutra. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
