"use client";

import * as React from "react";
import {
  calculateEnergy,
  calculateMacros,
  calculateBMI,
  getBMICategory,
  DEFAULT_MACRO_DISTRIBUTION,
  ACTIVITY_LABELS,
  GOAL_LABELS,
  type FormulaType,
  type MacroDistribution,
} from "@/lib/nutrition-calculator";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, ChevronRight, Flame, Dumbbell, Droplets, Wheat } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PlanCalculatorPatient {
  sex: "male" | "female";
  age?: number;
  heightCm: number;
  weightKg: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "weight_loss" | "maintenance" | "weight_gain" | "muscle_gain" | "health";
  bodyFatPct?: number;
}

export interface CalculatedResult {
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
  targetProteinPct: number;
  targetFatPct: number;
  targetCarbsPct: number;
  bmr: number;
  tdee: number;
  formula: FormulaType;
  activityFactor: number;
  goalAdjustmentKcal: number;
}

interface PlanCalculatorProps {
  patient: PlanCalculatorPatient;
  onCalculated: (result: CalculatedResult) => void;
  initialCalories?: number;
}

// ─── Formula labels ───────────────────────────────────────────────────────────

const FORMULA_LABELS: Record<FormulaType, { name: string; desc: string }> = {
  mifflin: {
    name: "Mifflin-St Jeor",
    desc: "Más precisa para la población general (1990)",
  },
  harris_benedict: {
    name: "Harris-Benedict",
    desc: "Fórmula revisada ampliamente usada (1984)",
  },
  who_fao: {
    name: "WHO/FAO",
    desc: "Recomendaciones internacionales de salud",
  },
};

// ─── MacroSlider ──────────────────────────────────────────────────────────────

function MacroRow({
  label,
  icon: Icon,
  color,
  pct,
  grams,
  kcal,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  pct: number;
  grams: number;
  kcal: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", color)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="flex-1 text-sm font-medium text-[hsl(var(--foreground))]">{label}</span>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={5}
            max={70}
            value={pct}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-7 w-14 px-2 text-center text-sm"
          />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">%</span>
        </div>
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="flex justify-end gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        <span className="font-semibold text-[hsl(var(--foreground))]">{grams} g</span>
        <span>·</span>
        <span>{kcal} kcal</span>
      </div>
    </div>
  );
}

// ─── EnergyRow ─────────────────────────────────────────────────────────────────

function EnergyRow({
  label,
  value,
  dimmed,
  highlight,
}: {
  label: string;
  value: number;
  dimmed?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
        highlight
          ? "bg-[hsl(var(--primary))]/10 font-semibold text-[hsl(var(--primary))]"
          : dimmed
          ? "text-[hsl(var(--muted-foreground))]"
          : ""
      )}
    >
      <span>{label}</span>
      <span className={highlight ? "text-base font-bold" : ""}>
        {value.toLocaleString()} kcal
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlanCalculator({ patient, onCalculated, initialCalories }: PlanCalculatorProps) {
  const [formula, setFormula] = React.useState<FormulaType>("mifflin");
  const [customCalories, setCustomCalories] = React.useState<number | null>(null);

  // Macro distribution state
  const defaultDistrib = DEFAULT_MACRO_DISTRIBUTION[patient.goal];
  const [distribution, setDistribution] = React.useState<MacroDistribution>(defaultDistrib);

  const ageYears = patient.age ?? 30;
  const bmi = calculateBMI(patient.weightKg, patient.heightCm);
  const { label: bmiLabel, color: bmiColor } = getBMICategory(bmi);

  const energy = calculateEnergy(
    {
      sex: patient.sex,
      ageYears,
      weightKg: patient.weightKg,
      heightCm: patient.heightCm,
      activityLevel: patient.activityLevel,
      goal: patient.goal,
      bodyFatPct: patient.bodyFatPct,
    },
    formula
  );

  const targetCalories = customCalories ?? energy.targetCalories;
  const macros = calculateMacros(targetCalories, distribution);

  const distribSum = distribution.proteinPct + distribution.fatPct + distribution.carbsPct;
  const distribValid = distribSum === 100;

  // Update a single macro pct; auto-adjust the remaining one
  const updateMacro = (
    key: keyof MacroDistribution,
    value: number
  ) => {
    const clamped = Math.min(Math.max(value, 5), 85);
    setDistribution((prev) => {
      const other = (Object.keys(prev) as (keyof MacroDistribution)[]).filter(
        (k) => k !== key
      );
      const total = clamped + prev[other[0]] + prev[other[1]];
      if (total <= 100) {
        // Distribute leftover to carbs (last key)
        const leftover = 100 - clamped - prev[other[0]];
        return {
          ...prev,
          [key]: clamped,
          [other[1]]: Math.max(leftover, 5),
        };
      }
      // Shrink the last "other" macro
      const shrink = total - 100;
      const newOther1 = Math.max(prev[other[1]] - shrink, 5);
      return { ...prev, [key]: clamped, [other[1]]: newOther1 };
    });
  };

  const handleUse = () => {
    if (!distribValid) return;
    onCalculated({
      targetCalories,
      targetProteinG: macros.proteinG,
      targetFatG: macros.fatG,
      targetCarbsG: macros.carbsG,
      targetProteinPct: distribution.proteinPct,
      targetFatPct: distribution.fatPct,
      targetCarbsPct: distribution.carbsPct,
      bmr: energy.bmr,
      tdee: energy.tdee,
      formula,
      activityFactor: energy.activityFactor,
      goalAdjustmentKcal: energy.goalAdjustmentKcal,
    });
  };

  // Reset to goal defaults
  const handleReset = () => {
    setDistribution(DEFAULT_MACRO_DISTRIBUTION[patient.goal]);
    setCustomCalories(null);
  };

  return (
    <div className="space-y-4">
      {/* Patient Summary */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Calculator className="h-4 w-4 text-[hsl(var(--primary))]" />
            Resumen del paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Peso", value: `${patient.weightKg} kg` },
              { label: "Estatura", value: `${patient.heightCm} cm` },
              {
                label: "Edad",
                value: patient.age ? `${patient.age} años` : "N/A",
              },
              { label: "Sexo", value: patient.sex === "female" ? "Femenino" : "Masculino" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-center">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span>
              IMC <span className={cn("font-semibold", bmiColor)}>{bmi} — {bmiLabel}</span>
            </span>
            <Separator orientation="vertical" className="h-3" />
            <span>{ACTIVITY_LABELS[patient.activityLevel]}</span>
            <Separator orientation="vertical" className="h-3" />
            <Badge variant="secondary" className="text-xs">
              {GOAL_LABELS[patient.goal]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Formula selector */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold">Fórmula de cálculo</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <Select value={formula} onValueChange={(v) => setFormula(v as FormulaType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(FORMULA_LABELS) as [FormulaType, { name: string; desc: string }][]).map(
                ([key, { name, desc }]) => (
                  <SelectItem key={key} value={key}>
                    <span className="font-medium">{name}</span>
                    <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">{desc}</span>
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Energy results */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Flame className="h-4 w-4 text-[hsl(var(--primary))]" />
            Resultados energéticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pb-4">
          <EnergyRow label="TMB (Metabolismo Basal)" value={energy.bmr} dimmed />
          <EnergyRow label={`GET (×${energy.activityFactor} actividad)`} value={energy.tdee} />
          {energy.goalAdjustmentKcal !== 0 && (
            <div className="flex justify-between px-3 py-1 text-xs text-[hsl(var(--muted-foreground))]">
              <span>Ajuste por objetivo</span>
              <span className={cn(
                "font-medium",
                energy.goalAdjustmentKcal < 0 ? "text-blue-600" : "text-orange-600"
              )}>
                {energy.goalAdjustmentKcal > 0 ? "+" : ""}
                {energy.goalAdjustmentKcal} kcal
              </span>
            </div>
          )}
          <EnergyRow label="Meta calórica recomendada" value={energy.targetCalories} highlight />

          {/* Custom override */}
          <div className="pt-3">
            <Label className="mb-1.5 block text-xs text-[hsl(var(--muted-foreground))]">
              Ajuste manual de calorías (opcional)
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={String(energy.targetCalories)}
                value={customCalories ?? ""}
                onChange={(e) =>
                  setCustomCalories(e.target.value ? Number(e.target.value) : null)
                }
                min={500}
                max={10000}
                className="h-8 text-sm"
              />
              {customCalories !== null && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setCustomCalories(null)}
                >
                  Restablecer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macro distribution */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Distribución de macros</CardTitle>
            <div className="flex items-center gap-2">
              {!distribValid && (
                <span className="text-xs font-medium text-[hsl(var(--destructive))]">
                  Suma: {distribSum}% (debe ser 100%)
                </span>
              )}
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleReset}>
                Restablecer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          <MacroRow
            label="Proteínas"
            icon={Dumbbell}
            color="bg-blue-100 text-blue-600"
            pct={distribution.proteinPct}
            grams={macros.proteinG}
            kcal={macros.proteinKcal}
            onChange={(v) => updateMacro("proteinPct", v)}
          />
          <MacroRow
            label="Grasas"
            icon={Droplets}
            color="bg-yellow-100 text-yellow-600"
            pct={distribution.fatPct}
            grams={macros.fatG}
            kcal={macros.fatKcal}
            onChange={(v) => updateMacro("fatPct", v)}
          />
          <MacroRow
            label="Carbohidratos"
            icon={Wheat}
            color="bg-green-100 text-green-600"
            pct={distribution.carbsPct}
            grams={macros.carbsG}
            kcal={macros.carbsKcal}
            onChange={(v) => updateMacro("carbsPct", v)}
          />

          <div className="rounded-lg bg-[hsl(var(--muted))] p-3">
            <div className="mb-2 flex justify-between text-xs font-medium text-[hsl(var(--muted-foreground))]">
              <span>Total calorías</span>
              <span className="font-bold text-[hsl(var(--foreground))]">
                {targetCalories.toLocaleString()} kcal
              </span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              <div
                className="bg-blue-400 transition-all"
                style={{ width: `${distribution.proteinPct}%` }}
                title={`Proteínas ${distribution.proteinPct}%`}
              />
              <div
                className="bg-yellow-400 transition-all"
                style={{ width: `${distribution.fatPct}%` }}
                title={`Grasas ${distribution.fatPct}%`}
              />
              <div
                className="bg-green-400 transition-all"
                style={{ width: `${distribution.carbsPct}%` }}
                title={`Carbohidratos ${distribution.carbsPct}%`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Button
        className="w-full"
        size="lg"
        disabled={!distribValid}
        onClick={handleUse}
      >
        Usar estos valores
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
