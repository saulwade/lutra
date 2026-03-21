// @ts-nocheck
"use client";

import Link from "next/link";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  ClipboardList,
  Apple,
  ChefHat,
  Plus,
  ArrowRight,
  Calculator,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  maintenance: "Mantenimiento",
  weight_gain: "Ganancia de peso",
  muscle_gain: "Masa muscular",
  health:      "Salud general",
};

const QUICK_ACTIONS = [
  {
    label:       "Nuevo paciente",
    description: "Registrar datos, antropometría y objetivo clínico",
    href:        "/patients",
    icon:        Users,
    iconBg:      "bg-orange-50 dark:bg-orange-950/30",
    iconColor:   "text-orange-500",
  },
  {
    label:       "Plan con IA",
    description: "Equivalentes SMAE calculados en segundos",
    href:        "/ai",
    icon:        Sparkles,
    iconBg:      "bg-[hsl(var(--accent))]",
    iconColor:   "text-[hsl(var(--primary))]",
    highlight:   true,
  },
  {
    label:       "Calculadora",
    description: "GET, IMC y distribución de macros",
    href:        "/calc",
    icon:        Calculator,
    iconBg:      "bg-slate-100 dark:bg-slate-800/50",
    iconColor:   "text-slate-500",
  },
  {
    label:       "Crear plan",
    description: "Constructor manual con base SMAE",
    href:        "/plans",
    icon:        ClipboardList,
    iconBg:      "bg-blue-50 dark:bg-blue-950/30",
    iconColor:   "text-blue-500",
  },
  {
    label:       "Alimentos",
    description: "Busca y filtra 2,870+ alimentos SMAE",
    href:        "/foods",
    icon:        Apple,
    iconBg:      "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor:   "text-emerald-500",
  },
  {
    label:       "Recetas",
    description: "Recetas con macros calculados",
    href:        "/recipes",
    icon:        ChefHat,
    iconBg:      "bg-amber-50 dark:bg-amber-950/30",
    iconColor:   "text-amber-500",
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getTodayStr() {
  return new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  });
}

export default function DashboardPage() {
  const { user }                                    = useUser();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const patients = useQuery(api.patients.getPatients,  isAuthenticated ? {} : "skip");
  const recipes  = useQuery(api.recipes.getRecipes,   isAuthenticated ? {} : "skip");
  const plans    = useQuery(api.plans.getRecentPlans, isAuthenticated ? { limit: 5 } : "skip");

  const isLoading      = authLoading || patients === undefined;
  const recentPatients = patients?.slice(-5).reverse() ?? [];
  const recentPlans    = plans ?? [];
  const isFirstTime    = !isLoading && (patients?.length ?? 0) === 0;

  const firstName = user?.firstName ?? user?.username ?? "nutrióloga";

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">

      {/* ── 1. HERO ── */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
        {/* Main content */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))] leading-tight">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))] capitalize mt-0.5">
                {getTodayStr()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0 pt-0.5">
              <Button asChild size="sm"
                className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)] h-8 px-3 text-xs gap-1.5">
                <Link href="/patients">
                  <Plus className="w-3.5 h-3.5" />
                  Paciente
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline"
                className="h-8 px-3 text-xs gap-1.5 border-[hsl(var(--primary)/0.35)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]">
                <Link href="/ai">
                  <Sparkles className="w-3.5 h-3.5" />
                  Plan con IA
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats footer bar inside hero */}
        <div className="px-5 py-2.5 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] flex items-center gap-1 text-sm">
          {isLoading ? (
            <Skeleton className="h-3.5 w-40" />
          ) : (
            <>
              <span className="font-semibold tabular-nums">{patients?.length ?? 0}</span>
              <span className="text-[hsl(var(--muted-foreground))] ml-1 mr-3">pacientes</span>
              <span className="text-[hsl(var(--border))]">·</span>
              <span className="font-semibold tabular-nums ml-3">{plans?.length ?? 0}</span>
              <span className="text-[hsl(var(--muted-foreground))] ml-1 mr-3">planes</span>
              <span className="text-[hsl(var(--border))]">·</span>
              <span className="font-semibold tabular-nums ml-3">{recipes?.length ?? 0}</span>
              <span className="text-[hsl(var(--muted-foreground))] ml-1">recetas</span>
            </>
          )}
        </div>
      </div>

      {/* ── 2. ONBOARDING (first time only) ── */}
      {isFirstTime && (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
          <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-3">
            Primeros pasos
          </p>
          <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
            {[
              { n: "1", title: "Configura tu perfil",         desc: "Nombre, cédula y logo del consultorio",    href: "/settings"  },
              { n: "2", title: "Registra tu primer paciente", desc: "Datos clínicos, antropometría y objetivo", href: "/patients"  },
              { n: "3", title: "Genera un plan con IA",       desc: "Plan SMAE personalizado en menos de 1 min", href: "/ai"       },
            ].map(({ n, title, desc, href }) => (
              <Link key={n} href={href}
                className="flex items-center gap-3 py-3 hover:bg-[hsl(var(--muted))] -mx-1 px-1 rounded-lg transition-colors group first:pt-0 last:pb-0">
                <div className="w-6 h-6 rounded-full bg-[hsl(var(--cta))] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {n}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. ACTIONS GRID ── */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
          Acciones
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {QUICK_ACTIONS.map(({ label, description, href, icon: Icon, iconBg, iconColor, highlight }) => (
            <Link key={href} href={href}
              className={cn(
                "flex flex-col gap-3 p-4 rounded-xl border transition-colors group",
                highlight
                  ? "bg-[hsl(var(--accent))] border-[hsl(var(--primary)/0.2)] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary)/0.4)]"
                  : "bg-[hsl(var(--surface))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
              )}>
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                iconBg,
              )}>
                <Icon className={cn("w-4.5 h-4.5", iconColor)} style={{ width: "1.1rem", height: "1.1rem" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold leading-tight",
                  highlight && "text-[hsl(var(--primary))]",
                )}>
                  {label}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 leading-snug line-clamp-2">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 4. RECENT PATIENTS ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
            Pacientes recientes
          </p>
          <Link href="/patients"
            className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-0.5">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-32 mb-1.5" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPatients.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Users className="w-8 h-8 text-[hsl(var(--muted-foreground))] opacity-30 mx-auto mb-2" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Sin pacientes aún</p>
              <Link href="/patients"
                className="text-xs text-[hsl(var(--primary))] hover:underline mt-1 inline-block">
                Agregar el primero →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
              {recentPatients.map((p) => {
                const initials = p.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <Link key={p._id} href={`/patients/${p._id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--muted))] transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center shrink-0">
                      <span className="text-[hsl(var(--primary))] text-xs font-semibold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {GOAL_LABELS[p.goal] ?? p.goal}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 5. RECENT PLANS ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
            Planes recientes
          </p>
          <Link href="/plans"
            className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-0.5">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-40 mb-1.5" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPlans.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <ClipboardList className="w-8 h-8 text-[hsl(var(--muted-foreground))] opacity-30 mx-auto mb-2" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Sin planes aún</p>
              <Link href="/ai"
                className="text-xs text-[hsl(var(--primary))] hover:underline mt-1 inline-block">
                Generar con IA →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
              {recentPlans.map((plan) => (
                <Link key={plan._id} href={`/plans/${plan._id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--muted))] transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plan.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {plan.targetCalories} kcal · {plan.status === "active" ? "Activo" : plan.status === "draft" ? "Borrador" : "Archivado"}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
