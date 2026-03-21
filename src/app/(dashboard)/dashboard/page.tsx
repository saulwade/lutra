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

// ─── Icon system — strictly on brand palette ──────────────────────────────
// bg: color/10-15 opacity  •  icon: solid brand color

// Alta prioridad — cards verticales grandes
const PRIMARY_ACTIONS = [
  {
    label:       "Nuevo paciente",
    description: "Registra datos clínicos y antropometría",
    href:        "/patients",
    icon:        Users,
    iconBg:      "bg-[#0C5E8A]/10 dark:bg-[#0C5E8A]/15",
    iconColor:   "text-[#0C5E8A] dark:text-[#5D9CBD]",
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
] as const;

// Media + baja prioridad — cards horizontales compactas
const SECONDARY_ACTIONS = [
  {
    label:     "Calculadora",
    href:      "/calc",
    icon:      Calculator,
    iconBg:    "bg-[#798C5E]/10 dark:bg-[#798C5E]/15",
    iconColor: "text-[#798C5E] dark:text-[#B0C09A]",
  },
  {
    label:     "Crear plan",
    href:      "/plans",
    icon:      ClipboardList,
    iconBg:    "bg-[#5D9CBD]/12 dark:bg-[#5D9CBD]/18",
    iconColor: "text-[#5D9CBD] dark:text-[#5D9CBD]",
  },
  {
    label:     "Alimentos",
    href:      "/foods",
    icon:      Apple,
    iconBg:    "bg-[#798C5E]/10 dark:bg-[#798C5E]/15",
    iconColor: "text-[#798C5E] dark:text-[#B0C09A]",
  },
  {
    label:     "Recetas",
    href:      "/recipes",
    icon:      ChefHat,
    iconBg:    "bg-[#DAC297]/25 dark:bg-[#DAC297]/12",
    iconColor: "text-[#7a5c28] dark:text-[#DAC297]",
  },
] as const;

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

// ─── Clinical insight chip ────────────────────────────────────────────────────
function InsightChip({
  count,
  label,
  dotColor,
  href,
}: {
  count: number;
  label: string;
  dotColor: string;
  href: string;
}) {
  const inner = (
    <>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
      <span className="text-xs font-semibold tabular-nums">{count}</span>
      <span className="text-xs text-[hsl(var(--muted-foreground))]">{label}</span>
    </>
  );

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity"
    >
      {inner}
    </Link>
  );
}

export default function DashboardPage() {
  const { user }                                    = useUser();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const patients = useQuery(api.patients.getPatients,    isAuthenticated ? {} : "skip");
  const plans    = useQuery(api.plans.getRecentPlans,   isAuthenticated ? { limit: 5 } : "skip");
  const stats    = useQuery(api.plans.getDashboardStats, isAuthenticated ? {} : "skip");

  const isLoading      = authLoading || patients === undefined || stats === undefined;
  const recentPatients = patients?.slice(-5).reverse() ?? [];
  const recentPlans    = plans ?? [];
  const isFirstTime    = !isLoading && (patients?.length ?? 0) === 0;

  const firstName = user?.firstName ?? user?.username ?? "nutrióloga";

  // Derived insight flags
  const hasAlerts = !!stats && (
    stats.patientsWithoutPlan > 0 ||
    stats.lowAdherence > 0 ||
    stats.draftPlans > 0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 w-full">

      {/* ════════════════ COLUMNA IZQUIERDA ════════════════ */}
      <div className="flex flex-col gap-5 min-w-0">

        {/* ── 1. HERO ── */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
          <div className="px-6 pt-7 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2 capitalize">
                  {getTodayStr()}
                </p>
                <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] leading-tight">
                  {getGreeting()},<br className="sm:hidden" /> {firstName}
                </h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">
                  Tu espacio de trabajo clínico
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button asChild size="sm"
                  className="bg-[#0C5E8A] text-white hover:bg-[#0a4d72] h-9 px-4 text-xs gap-1.5 font-semibold">
                  <Link href="/patients">
                    <Plus className="w-3.5 h-3.5" />
                    Paciente
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline"
                  className="h-9 px-4 text-xs gap-1.5 border-[#0C5E8A]/30 text-[#0C5E8A] hover:bg-[#0C5E8A]/8 font-semibold dark:border-[#5D9CBD]/40 dark:text-[#5D9CBD]">
                  <Link href="/ai">
                    <Sparkles className="w-3.5 h-3.5" />
                    Plan IA
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* ── Clinical insights bar ── */}
          <div className="px-6 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] flex items-center gap-4 flex-wrap min-h-[42px]">
            {isLoading ? (
              <Skeleton className="h-3.5 w-56" />
            ) : stats && stats.totalPatients === 0 ? (
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Comienza registrando tu primer paciente
              </span>
            ) : stats ? (
              <>
                {/* Alert chips — shown only when count > 0 */}
                {stats.patientsWithoutPlan > 0 && (
                  <InsightChip
                    count={stats.patientsWithoutPlan}
                    label={stats.patientsWithoutPlan === 1 ? "sin plan" : "sin plan"}
                    dotColor="bg-[#974315]"
                    href="/patients"
                  />
                )}
                {stats.lowAdherence > 0 && (
                  <InsightChip
                    count={stats.lowAdherence}
                    label={stats.lowAdherence === 1 ? "baja adherencia" : "baja adherencia"}
                    dotColor="bg-[#974315]"
                    href="/patients"
                  />
                )}
                {stats.draftPlans > 0 && (
                  <InsightChip
                    count={stats.draftPlans}
                    label={stats.draftPlans === 1 ? "borrador" : "borradores"}
                    dotColor="bg-[#5D9CBD]"
                    href="/plans"
                  />
                )}
                {stats.recentPatients > 0 && (
                  <InsightChip
                    count={stats.recentPatients}
                    label={stats.recentPatients === 1 ? "nuevo esta semana" : "nuevos esta semana"}
                    dotColor="bg-[#5D9CBD]"
                    href="/patients"
                  />
                )}

                {/* Context chip — always shown */}
                {stats.activePatients > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#798C5E]" />
                    <span className="text-xs font-semibold tabular-nums">{stats.activePatients}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {stats.activePatients === 1 ? "activo" : "activos"}
                    </span>
                  </span>
                )}

                {/* All-clear state */}
                {!hasAlerts && stats.activePatients > 0 && (
                  <>
                    <span className="text-[hsl(var(--border))]">·</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Todo en orden</span>
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* ── 2. ONBOARDING (solo primera vez) ── */}
        {isFirstTime && (
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
            <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-3">
              Primeros pasos
            </p>
            <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
              {[
                { n: "1", title: "Configura tu perfil",         desc: "Nombre, cédula y logo del consultorio",     href: "/settings" },
                { n: "2", title: "Registra tu primer paciente", desc: "Datos clínicos, antropometría y objetivo",  href: "/patients" },
                { n: "3", title: "Genera un plan con IA",       desc: "Plan SMAE personalizado en menos de 1 min", href: "/ai"       },
              ].map(({ n, title, desc, href }) => (
                <Link key={n} href={href}
                  className="flex items-center gap-3 py-3 hover:bg-[hsl(var(--muted))] -mx-1 px-1 rounded-lg transition-colors group first:pt-0 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-[#0C5E8A] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
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

        {/* ── 3. ACCIONES ── */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
            Acciones rápidas
          </p>

          {/* Alta prioridad — verticales grandes */}
          <div className="grid grid-cols-2 gap-3">
            {PRIMARY_ACTIONS.map(({ label, description, href, icon: Icon, iconBg, iconColor, highlight }) => (
              <Link key={href} href={href}
                className={cn(
                  "flex flex-col gap-6 p-5 rounded-xl border transition-colors group",
                  highlight
                    ? "bg-[hsl(var(--accent))] border-[hsl(var(--primary)/0.2)] hover:border-[hsl(var(--primary)/0.4)]"
                    : "bg-[hsl(var(--surface))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
                )}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
                  <Icon className={cn("w-5 h-5", iconColor)} />
                </div>
                <div>
                  <p className={cn(
                    "text-sm font-bold leading-tight",
                    highlight ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--foreground))]",
                  )}>
                    {label}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 leading-snug">
                    {description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Media + baja prioridad — horizontales compactas */}
          <div className="grid grid-cols-2 gap-2">
            {SECONDARY_ACTIONS.map(({ label, href, icon: Icon, iconBg, iconColor }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--muted))] transition-colors group">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                  <Icon className={cn("w-3.5 h-3.5", iconColor)} />
                </div>
                <p className="text-xs font-semibold flex-1 leading-tight">{label}</p>
                <ArrowRight className="w-3 h-3 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ════════════════ COLUMNA DERECHA ════════════════ */}
      <div className="flex flex-col gap-5 min-w-0">

        {/* ── 4. PACIENTES RECIENTES ── */}
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
                      <Skeleton className="h-3 w-28 mb-1.5" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Users className="w-7 h-7 text-[hsl(var(--muted-foreground))] opacity-30 mx-auto mb-2" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Sin pacientes aún</p>
                <Link href="/patients"
                  className="text-xs text-[hsl(var(--primary))] hover:underline mt-1 inline-block">
                  Agregar el primero →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
                {recentPatients.map((p) => {
                  const initials = p.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <Link key={p._id} href={`/patients/${p._id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--muted))] transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center shrink-0">
                        <span className="text-[hsl(var(--primary))] text-xs font-semibold">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
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

        {/* ── 5. PLANES RECIENTES ── */}
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
                      <Skeleton className="h-3 w-36 mb-1.5" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPlans.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <ClipboardList className="w-7 h-7 text-[hsl(var(--muted-foreground))] opacity-30 mx-auto mb-2" />
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
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
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

    </div>
  );
}
