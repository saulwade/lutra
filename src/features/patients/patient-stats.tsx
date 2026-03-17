"use client";

import * as React from "react";
import {
  calculateBMI,
  getBMICategory,
  calculateIdealWeight,
  calculateEnergy,
  ACTIVITY_LABELS,
  GOAL_LABELS,
} from "@/lib/nutrition-calculator";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Scale, Ruler, Activity, Flame, Target, Info } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PatientStatsData {
  sex: "male" | "female";
  age?: number;
  heightCm: number;
  weightKg: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "weight_loss" | "maintenance" | "weight_gain" | "muscle_gain" | "health";
  bodyFatPct?: number;
}

interface PatientStatsProps {
  patient: PatientStatsData;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  tooltip,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  tooltip?: string;
}) {
  const card = (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              {label}
            </p>
            <p className={cn("text-2xl font-bold leading-tight", accent ?? "text-[hsl(var(--foreground))]")}>
              {value}
            </p>
            {sub && (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{sub}</p>
            )}
          </div>
          <div className="rounded-lg bg-[hsl(var(--muted))] p-2">
            <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!tooltip) return card;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent className="max-w-56 text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── BMR Progress Bar ─────────────────────────────────────────────────────────

function EnergyBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
        <span className="font-semibold">{value.toLocaleString()} kcal</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PatientStats({ patient }: PatientStatsProps) {
  const bmi = calculateBMI(patient.weightKg, patient.heightCm);
  const { label: bmiLabel, color: bmiColor } = getBMICategory(bmi);
  const idealWeight = calculateIdealWeight(patient.heightCm, patient.sex);
  const weightDiff = Math.round((patient.weightKg - idealWeight) * 10) / 10;

  const ageYears = patient.age ?? 30;
  const energyResult = calculateEnergy(
    {
      sex: patient.sex,
      ageYears,
      weightKg: patient.weightKg,
      heightCm: patient.heightCm,
      activityLevel: patient.activityLevel,
      goal: patient.goal,
      bodyFatPct: patient.bodyFatPct,
    },
    "mifflin"
  );

  const maxKcal = Math.max(energyResult.targetCalories * 1.2, 3000);

  return (
    <div className="space-y-4">
      {/* Top grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* BMI */}
        <StatCard
          icon={Scale}
          label="IMC"
          value={String(bmi)}
          sub={bmiLabel}
          accent={bmiColor}
          tooltip="Índice de Masa Corporal. Calculado como peso(kg) / estatura(m)²"
        />

        {/* Ideal Weight */}
        <StatCard
          icon={Ruler}
          label="Peso ideal"
          value={`${idealWeight} kg`}
          sub={
            weightDiff === 0
              ? "En rango"
              : weightDiff > 0
              ? `+${weightDiff} kg sobre ideal`
              : `${Math.abs(weightDiff)} kg bajo ideal`
          }
          tooltip="Fórmula de Devine. Puede variar según composición corporal."
        />

        {/* Activity */}
        <StatCard
          icon={Activity}
          label="Actividad"
          value={`×${energyResult.activityFactor}`}
          sub={ACTIVITY_LABELS[patient.activityLevel]}
          tooltip="Factor de actividad física aplicado al metabolismo basal para calcular el TDEE."
        />

        {/* Goal */}
        <Card className="overflow-hidden transition-shadow hover:shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Objetivo
                </p>
                <Badge
                  variant="secondary"
                  className="mt-1 text-xs font-medium"
                >
                  {GOAL_LABELS[patient.goal]}
                </Badge>
                {energyResult.goalAdjustmentKcal !== 0 && (
                  <p className={cn(
                    "text-xs font-medium",
                    energyResult.goalAdjustmentKcal < 0
                      ? "text-blue-600"
                      : "text-orange-600"
                  )}>
                    {energyResult.goalAdjustmentKcal > 0 ? "+" : ""}
                    {energyResult.goalAdjustmentKcal} kcal/día
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-[hsl(var(--muted))] p-2">
                <Target className="h-4 w-4 text-[hsl(var(--primary))]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy breakdown card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Flame className="h-4 w-4 text-[hsl(var(--primary))]" />
            Requerimiento energético estimado
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                </TooltipTrigger>
                <TooltipContent className="max-w-64 text-xs">
                  Calculado con la fórmula Mifflin-St Jeor (1990). El TMB es el
                  metabolismo basal; el GET incluye el factor de actividad.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <EnergyBar
            label="TMB (Metabolismo Basal)"
            value={energyResult.bmr}
            max={maxKcal}
            color="bg-[hsl(var(--primary))]/40"
          />
          <EnergyBar
            label="GET (Gasto Energético Total)"
            value={energyResult.tdee}
            max={maxKcal}
            color="bg-[hsl(var(--primary))]/70"
          />
          <EnergyBar
            label="Meta calórica diaria"
            value={energyResult.targetCalories}
            max={maxKcal}
            color="bg-[hsl(var(--primary))]"
          />
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-3 py-2 text-center">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Calorías objetivo: </span>
            <span className="text-sm font-bold text-[hsl(var(--primary))]">
              {energyResult.targetCalories.toLocaleString()} kcal/día
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
