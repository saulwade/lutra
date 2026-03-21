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
  weight_loss:  "Pérdida de peso",
  maintenance:  "Mantenimiento",
  weight_gain:  "Ganancia de peso",
  muscle_gain:  "Masa muscular",
  health:       "Salud general",
};

const QUICK_ACTIONS = [
  {
    label:       "Nuevo paciente",
    description: "Registrar datos, antropometría y objetivo clínico",
    href:        "/patients",
    icon:        Users,
  },
  {
    label:       "Plan con IA",
    description: "Equivalentes SMAE calculados en segundos",
    href:        "/ai",
    icon:        Sparkles,
    highlight:   true,
  },
  {
    label:       "Calculadora energética",
    description: "GET, IMC y distribución de macros SMAE",
    href:        "/calc",
    icon:        Calculator,
  },
  {
    label:       "Crear plan alimenticio",
    description: "Constructor manual con base SMAE",
    href:        "/plans",
    icon:        ClipboardList,
  },
  {
    label:       "Base de alimentos",
    description: "Busca y filtra 2,870+ alimentos SMAE",
    href:        "/foods",
    icon:        Apple,
  },
  {
    label:       "Recetas",
    description: "Recetas con macros calculados automáticamente",
    href:        "/recipes",
    icon:        ChefHat,
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
  const { user }                          = useUser();
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
    <div className="flex flex-col gap-8 w-full max-w-2xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">
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

      {/* ── Inline stats ── */}
      {!isLoading && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] -mt-5">
          {patients?.length ?? 0} paciente{(patients?.length ?? 0) !== 1 ? "s" : ""}
          {" · "}
          {plans?.length ?? 0} plan{(plans?.length ?? 0) !== 1 ? "es" : ""}
          {" · "}
          {recipes?.length ?? 0} receta{(recipes?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      )}

      {/* ── Onboarding (first time only) ── */}
      {isFirstTime && (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
            Primeros pasos
          </p>
          <div className="flex flex-col gap-1">
            {[
              { n: "1", title: "Configura tu perfil",           desc: "Nombre, cédula y logo del consultorio", href: "/settings"  },
              { n: "2", title: "Registra tu primer paciente",   desc: "Datos clínicos, antropometría y objetivo", href: "/patients" },
              { n: "3", title: "Genera un plan con IA",         desc: "Plan SMAE personalizado en menos de 1 min", href: "/ai"     },
            ].map(({ n, title, desc, href }) => (
              <Link key={n} href={href}
                className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors group -mx-2">
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

      {/* ── Quick actions ── */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">
          Acciones
        </p>
        {QUICK_ACTIONS.map(({ label, description, href, icon: Icon, highlight }, i) => (
          <Link key={href} href={href}
            className={cn(
              "flex items-center gap-3 px-2 py-3 rounded-lg transition-colors group",
              "border-b border-[hsl(var(--border))] last:border-0",
              "hover:bg-[hsl(var(--muted))]",
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              highlight ? "bg-[hsl(var(--accent))]" : "bg-[hsl(var(--muted))]",
            )}>
              <Icon className={cn(
                "w-4 h-4",
                highlight ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]",
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium leading-tight",
                highlight && "text-[hsl(var(--primary))]",
              )}>
                {label}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                {description}
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ))}
      </div>

      {/* ── Recent patients ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
            Pacientes recientes
          </p>
          <Link href="/patients"
            className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-0.5">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3 py-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-32 mb-1.5" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : recentPatients.length === 0 ? (
          <div className="px-2 py-4 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Sin pacientes aún</p>
            <Link href="/patients"
              className="text-xs text-[hsl(var(--primary))] hover:underline mt-1 inline-block">
              Agregar el primero →
            </Link>
          </div>
        ) : (
          recentPatients.map((p) => {
            const initials = p.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
            return (
              <Link key={p._id} href={`/patients/${p._id}`}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors border-b border-[hsl(var(--border))] last:border-0 group">
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
          })
        )}
      </div>

      {/* ── Recent plans ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
            Planes recientes
          </p>
          <Link href="/plans"
            className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-0.5">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3 py-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-40 mb-1.5" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : recentPlans.length === 0 ? (
          <div className="px-2 py-4 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Sin planes aún</p>
            <Link href="/ai"
              className="text-xs text-[hsl(var(--primary))] hover:underline mt-1 inline-block">
              Generar con IA →
            </Link>
          </div>
        ) : (
          recentPlans.map((plan) => (
            <Link key={plan._id} href={`/plans/${plan._id}`}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors border-b border-[hsl(var(--border))] last:border-0 group">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{plan.title}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {plan.targetCalories} kcal
                  {" · "}
                  {plan.status === "active" ? "Activo" : plan.status === "draft" ? "Borrador" : "Archivado"}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))
        )}
      </div>

    </div>
  );
}
