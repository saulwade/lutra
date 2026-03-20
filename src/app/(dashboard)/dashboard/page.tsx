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
  Calendar,
  Clock,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  maintenance: "Mantenimiento",
  weight_gain: "Ganancia de peso",
  muscle_gain: "Masa muscular",
  health: "Salud general",
};

const GOAL_COLORS: Record<string, string> = {
  weight_loss: "bg-blue-100 text-blue-700",
  maintenance: "bg-green-100 text-green-700",
  weight_gain: "bg-orange-100 text-orange-700",
  muscle_gain: "bg-purple-100 text-purple-700",
  health: "bg-teal-100 text-teal-700",
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getTodayStr() {
  return new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const QUICK_ACTIONS = [
  {
    label: "Nuevo paciente",
    description: "Registrar datos y calcular requerimientos",
    href: "/patients",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Calculadora energética",
    description: "GET, IMC, distribución de macros SMAE",
    href: "/calc",
    icon: Calculator,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Generar plan con IA",
    description: "Plan SMAE personalizado en segundos",
    href: "/ai",
    icon: Sparkles,
    color: "text-[hsl(81,10%,54%)]",
    bg: "bg-[hsl(81,10%,94%)]",
  },
  {
    label: "Crear plan alimenticio",
    description: "Constructor manual con base SMAE",
    href: "/plans",
    icon: ClipboardList,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    label: "Nueva receta",
    description: "Recetas con macros calculados automáticamente",
    href: "/recipes",
    icon: ChefHat,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    label: "Base de alimentos SMAE",
    description: "Busca y filtra 2,870+ alimentos",
    href: "/foods",
    icon: Apple,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

export default function DashboardPage() {
  const { user } = useUser();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const patients = useQuery(api.patients.getPatients, isAuthenticated ? {} : "skip");
  const recipes  = useQuery(api.recipes.getRecipes,  isAuthenticated ? {} : "skip");
  const plans    = useQuery(api.plans.getPlans,       isAuthenticated ? {} : "skip");

  const isLoading = authLoading || patients === undefined;

  const recentPatients = patients?.slice(-5).reverse() ?? [];
  const recentPlans    = plans?.slice(-4).reverse() ?? [];

  const firstName = user?.firstName ?? user?.username ?? "nutrióloga";
  const today = getTodayStr();
  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* ── Welcome band ── */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-white overflow-hidden">
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(81,10%,92%)] flex items-center justify-center shrink-0">
            <img src="/lutra-logo.svg" alt="Lutra" className="w-9 h-9 rounded-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span className="capitalize">{today}</span>
            </p>
            <h1 className="text-2xl font-bold">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
              ¿Con qué empezamos hoy?
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild size="sm" className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(81,10%,44%)]">
              <Link href="/patients">
                <Plus className="w-4 h-4 mr-1" />
                Nuevo paciente
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/ai">
                <Sparkles className="w-4 h-4 mr-1" />
                Plan con IA
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pacientes" icon={Users}        value={isLoading ? null : (patients?.length ?? 0)} color="text-blue-600"                   bg="bg-blue-50" />
        <StatCard label="Planes"    icon={ClipboardList} value={isLoading ? null : (plans?.length ?? 0)}    color="text-indigo-600"                  bg="bg-indigo-50" />
        <StatCard label="Recetas"   icon={ChefHat}       value={isLoading ? null : (recipes?.length ?? 0)}  color="text-purple-600"                  bg="bg-purple-50" />
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Quick actions — 3 cols */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
            Acciones rápidas
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ label, description, href, icon: Icon, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 p-4 rounded-xl border border-[hsl(var(--border))] bg-white hover:bg-[hsl(var(--muted))] hover:border-[hsl(81,10%,78%)] transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-snug mt-0.5 truncate">{description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right column — 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Recent patients */}
          <Card className="bg-white border-[hsl(var(--border))]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Pacientes recientes
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-[hsl(var(--primary))] text-xs h-7 px-2">
                <Link href="/patients">
                  Ver todos
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="pt-3 pb-2">
              {isLoading ? (
                <div className="flex flex-col gap-3 py-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-3 w-24 mb-1" />
                        <Skeleton className="h-2.5 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentPatients.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-2 text-center">
                  <Users className="w-8 h-8 text-[hsl(var(--muted-foreground))] opacity-40" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Sin pacientes aún</p>
                  <Button asChild size="sm" variant="outline" className="mt-1">
                    <Link href="/patients">Agregar paciente</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {recentPatients.map((p, i) => {
                    const initials = p.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                    return (
                      <Link
                        key={p._id}
                        href={`/patients/${p._id}`}
                        className={`flex items-center gap-3 py-2.5 px-1 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors ${i < recentPatients.length - 1 ? "border-b border-[hsl(var(--border))]" : ""}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[hsl(81,10%,92%)] flex items-center justify-center shrink-0">
                          <span className="text-[hsl(var(--primary))] text-xs font-semibold">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {GOAL_LABELS[p.goal] ?? p.goal}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent plans */}
          <Card className="bg-white border-[hsl(var(--border))]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Planes recientes
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-[hsl(var(--primary))] text-xs h-7 px-2">
                <Link href="/plans">
                  Ver todos
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="pt-3 pb-2">
              {isLoading ? (
                <div className="flex flex-col gap-3 py-1">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-lg" />
                  ))}
                </div>
              ) : recentPlans.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-2 text-center">
                  <ClipboardList className="w-8 h-8 text-[hsl(var(--muted-foreground))] opacity-40" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Sin planes aún</p>
                  <Button asChild size="sm" variant="outline" className="mt-1">
                    <Link href="/plans">Crear plan</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {recentPlans.map((plan, i) => (
                    <Link
                      key={plan._id}
                      href={`/plans/${plan._id}`}
                      className={`flex items-center gap-3 py-2.5 px-1 hover:bg-[hsl(var(--muted))] rounded-lg transition-colors ${i < recentPlans.length - 1 ? "border-b border-[hsl(var(--border))]" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{plan.title}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {plan.targetCalories} kcal · {plan.status === "active" ? "Activo" : plan.status === "draft" ? "Borrador" : "Archivado"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  icon: Icon,
  value,
  color,
  bg,
}: {
  label: string;
  icon: React.ElementType;
  value: number | null;
  color: string;
  bg: string;
}) {
  return (
    <Card className="bg-white border-[hsl(var(--border))]">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          {value === null ? (
            <Skeleton className="h-7 w-10 mb-1" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
