// @ts-nocheck
"use client";

import Link from "next/link";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Users,
  ClipboardList,
  Apple,
  ChefHat,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const patients = useQuery(api.patients.getPatients, isAuthenticated ? {} : "skip");
  const foods = useQuery(api.foods.getFoods, isAuthenticated ? {} : "skip");
  const recipes = useQuery(api.recipes.getRecipes, isAuthenticated ? {} : "skip");

  const isLoading = authLoading || patients === undefined;

  const totalPatients = patients?.length ?? 0;
  const totalFoods = foods?.totalCount ?? 0;
  const totalRecipes = recipes?.length ?? 0;
  // Recent 5 patients
  const recentPatients = patients?.slice(-5).reverse() ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-white overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5">
          <img
            src="/lutra-logo.svg"
            alt="Lutra"
            className="w-24 h-24 shrink-0 rounded-2xl self-center sm:self-auto"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
              Bienvenido a Lutra
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
              Tu plataforma nutricional — pacientes, planes y equivalentes SMAE en un solo lugar.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button asChild size="sm" className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(81,10%,44%)]">
                <Link href="/patients">
                  <Plus className="w-4 h-4 mr-1" />
                  Nuevo Paciente
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/plans">
                  <ClipboardList className="w-4 h-4 mr-1" />
                  Nuevo Plan
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pacientes"
          icon={Users}
          value={isLoading ? null : totalPatients}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          label="Planes Activos"
          icon={ClipboardList}
          value={isLoading ? null : 0}
          color="text-[hsl(var(--primary))]"
          bg="bg-[hsl(81,10%,94%)]"
          hint="Próximamente"
        />
        <StatCard
          label="Alimentos SMAE"
          icon={Apple}
          value={isLoading ? null : totalFoods}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <StatCard
          label="Recetas"
          icon={ChefHat}
          value={isLoading ? null : totalRecipes}
          color="text-purple-600"
          bg="bg-purple-50"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card className="bg-white border-[hsl(var(--border))]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Pacientes Recientes
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-[hsl(var(--primary))] text-xs">
              <Link href="/patients">
                Ver todos
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-3.5 w-28 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPatients.length === 0 ? (
              <EmptyState
                icon={Users}
                message="No tienes pacientes aún"
                action={{ label: "Agregar paciente", href: "/patients" }}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {recentPatients.map((p) => {
                  const initials = p.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <Link
                      key={p._id}
                      href={`/patients/${p._id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-[hsl(81,10%,92%)] flex items-center justify-center shrink-0">
                        <span className="text-[hsl(var(--primary))] text-xs font-semibold">
                          {initials}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {p.age ? `${p.age} años · ` : ""}
                          {p.sex === "male" ? "Masculino" : "Femenino"}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${GOAL_COLORS[p.goal] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {GOAL_LABELS[p.goal] ?? p.goal}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white border-[hsl(var(--border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 flex flex-col gap-2">
            {[
              {
                label: "Registrar nuevo paciente",
                description: "Agrega datos antropométricos y metas",
                href: "/patients",
                icon: Users,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Crear plan alimenticio",
                description: "Diseña un plan con base SMAE",
                href: "/plans",
                icon: ClipboardList,
                color: "text-[hsl(var(--primary))]",
                bg: "bg-[hsl(81,10%,94%)]",
              },
              {
                label: "Explorar alimentos SMAE",
                description: "Busca y filtra la base de alimentos",
                href: "/foods",
                icon: Apple,
                color: "text-orange-600",
                bg: "bg-orange-50",
              },
              {
                label: "Crear receta",
                description: "Diseña recetas con macros calculados",
                href: "/recipes",
                icon: ChefHat,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
            ].map(({ label, description, href, icon: Icon, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors group"
              >
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                    {description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors shrink-0" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  icon: Icon,
  value,
  color,
  bg,
  hint,
}: {
  label: string;
  icon: React.ElementType;
  value: number | null;
  color: string;
  bg: string;
  hint?: string;
}) {
  return (
    <Card className="bg-white border-[hsl(var(--border))]">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {value === null ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{value}</p>
        )}
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
          {hint && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] opacity-60">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: React.ElementType;
  message: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
        <Icon className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
      </div>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{message}</p>
      {action && (
        <Button asChild size="sm" variant="outline">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
