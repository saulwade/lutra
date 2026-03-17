"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, Leaf, Flame, Dumbbell, Droplets, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MealFood {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

interface Meal {
  _id: string;
  name: string;
  time?: string;
  notes?: string;
  totalCalories?: number;
  totalProteinG?: number;
  totalFatG?: number;
  totalCarbsG?: number;
  foods: MealFood[];
}

interface PlanPreviewProps {
  plan: {
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    targetCalories: number;
    targetProteinG: number;
    targetFatG: number;
    targetCarbsG: number;
    targetProteinPct: number;
    targetFatPct: number;
    targetCarbsPct: number;
  };
  patient: {
    name: string;
    age?: number;
    sex: string;
    weightKg: number;
    heightCm: number;
    goal: string;
  };
  nutritionist: {
    name: string;
    cedula?: string;
    clinicName?: string;
    email: string;
  };
  meals: Meal[];
  onPrint?: () => void;
}

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  maintenance: "Mantenimiento",
  weight_gain: "Aumento de peso",
  muscle_gain: "Aumento de masa muscular",
  health: "Salud general",
};

function MacroPill({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn("text-lg font-bold", color)}>
        {unit === "kcal" ? Math.round(value) : value.toFixed(1)}
      </span>
      <span className="text-[10px] uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>
        {unit === "kcal" ? unit : `${unit} ${label}`}
      </span>
    </div>
  );
}

export function PlanPreview({ plan, patient, nutritionist, meals, onPrint }: PlanPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  }

  const totalActualCalories = meals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
  const totalActualProtein = meals.reduce((sum, m) => sum + (m.totalProteinG || 0), 0);
  const totalActualFat = meals.reduce((sum, m) => sum + (m.totalFatG || 0), 0);
  const totalActualCarbs = meals.reduce((sum, m) => sum + (m.totalCarbsG || 0), 0);

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir
        </Button>
        <Button size="sm" onClick={handlePrint}>
          <Download className="w-4 h-4 mr-2" /> Descargar PDF
        </Button>
      </div>

      {/* Printable content */}
      <div
        ref={printRef}
        className="bg-white border rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-none"
        style={{ maxWidth: 800, margin: "0 auto" }}
      >
        {/* Header */}
        <div
          className="px-8 py-6"
          style={{ backgroundColor: "hsl(var(--primary))", color: "white" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-5 h-5 opacity-80" />
                <span className="text-sm font-medium opacity-80">
                  {nutritionist.clinicName || "Lutra"}
                </span>
              </div>
              <h1 className="text-2xl font-bold">{plan.title}</h1>
              <p className="mt-1 opacity-80 text-sm">Plan alimenticio personalizado</p>
            </div>
            <div className="text-right text-sm opacity-80">
              <p className="font-medium text-white">{nutritionist.name}</p>
              {nutritionist.cedula && <p>Cédula: {nutritionist.cedula}</p>}
              <p>{nutritionist.email}</p>
            </div>
          </div>

          {/* Dates */}
          {(plan.startDate || plan.endDate) && (
            <div className="mt-4 flex gap-4 text-sm opacity-80">
              {plan.startDate && (
                <span>
                  Inicio:{" "}
                  {format(new Date(plan.startDate), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              )}
              {plan.endDate && (
                <span>
                  Fin:{" "}
                  {format(new Date(plan.endDate), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Patient info */}
        <div className="px-8 py-4" style={{ backgroundColor: "hsl(var(--secondary))" }}>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Paciente</span>
              <p className="font-semibold">{patient.name}</p>
            </div>
            {patient.age && (
              <div>
                <span style={{ color: "hsl(var(--muted-foreground))" }}>Edad</span>
                <p className="font-semibold">{patient.age} años</p>
              </div>
            )}
            <div>
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Peso</span>
              <p className="font-semibold">{patient.weightKg} kg</p>
            </div>
            <div>
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Talla</span>
              <p className="font-semibold">{patient.heightCm} cm</p>
            </div>
            <div>
              <span style={{ color: "hsl(var(--muted-foreground))" }}>Objetivo</span>
              <p className="font-semibold">{GOAL_LABELS[patient.goal] || patient.goal}</p>
            </div>
          </div>
        </div>

        {/* Macro targets */}
        <div className="px-8 py-5 border-b">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
            Requerimiento diario
          </h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <MacroPill label="" value={plan.targetCalories} unit="kcal" color="text-orange-500" />
            <MacroPill label="proteína" value={plan.targetProteinG} unit="g" color="text-blue-600" />
            <MacroPill label="grasa" value={plan.targetFatG} unit="g" color="text-yellow-600" />
            <MacroPill label="carbs" value={plan.targetCarbsG} unit="g" color="text-green-600" />
          </div>
          {/* Macro bar */}
          <div className="mt-4 flex rounded-full overflow-hidden h-2">
            <div
              className="bg-blue-500 transition-all"
              style={{ width: `${plan.targetProteinPct}%` }}
            />
            <div
              className="bg-yellow-400 transition-all"
              style={{ width: `${plan.targetFatPct}%` }}
            />
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${plan.targetCarbsPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span>Proteína {plan.targetProteinPct}%</span>
            <span>Grasa {plan.targetFatPct}%</span>
            <span>Carbohidratos {plan.targetCarbsPct}%</span>
          </div>
        </div>

        {/* Meals */}
        <div className="px-8 py-5 space-y-6">
          {meals.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "hsl(var(--muted-foreground))" }}>
              No hay tiempos de comida en este plan.
            </p>
          ) : (
            meals.map((meal) => (
              <div key={meal._id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "hsl(var(--primary))" }}
                    />
                    <h3 className="font-semibold text-base">{meal.name}</h3>
                    {meal.time && (
                      <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {meal.time}
                      </span>
                    )}
                  </div>
                  {meal.totalCalories !== undefined && (
                    <span className="text-xs font-medium text-orange-500">
                      {Math.round(meal.totalCalories)} kcal
                    </span>
                  )}
                </div>

                {meal.foods.length > 0 ? (
                  <div className="ml-4 space-y-1">
                    <div className="grid grid-cols-12 text-[11px] uppercase tracking-wide mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <span className="col-span-5">Alimento</span>
                      <span className="col-span-2 text-right">Cantidad</span>
                      <span className="col-span-1 text-right">kcal</span>
                      <span className="col-span-1 text-right">Prot</span>
                      <span className="col-span-1 text-right">Gras</span>
                      <span className="col-span-2 text-right">Carbs</span>
                    </div>
                    {meal.foods.map((food, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 text-sm py-1 border-b last:border-0"
                        style={{ borderColor: "hsl(var(--border))" }}
                      >
                        <span className="col-span-5 font-medium">{food.name}</span>
                        <span className="col-span-2 text-right" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {food.quantity} {food.unit}
                        </span>
                        <span className="col-span-1 text-right text-orange-600 text-xs">
                          {Math.round(food.calories)}
                        </span>
                        <span className="col-span-1 text-right text-blue-600 text-xs">
                          {food.proteinG.toFixed(1)}
                        </span>
                        <span className="col-span-1 text-right text-yellow-600 text-xs">
                          {food.fatG.toFixed(1)}
                        </span>
                        <span className="col-span-2 text-right text-xs" style={{ color: "hsl(var(--primary))" }}>
                          {food.carbsG.toFixed(1)}g
                        </span>
                      </div>
                    ))}
                    {/* Meal total */}
                    {meal.totalCalories !== undefined && (
                      <div className="grid grid-cols-12 text-xs font-semibold pt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                        <span className="col-span-5">Total</span>
                        <span className="col-span-2" />
                        <span className="col-span-1 text-right text-orange-600">{Math.round(meal.totalCalories)}</span>
                        <span className="col-span-1 text-right text-blue-600">{(meal.totalProteinG || 0).toFixed(1)}</span>
                        <span className="col-span-1 text-right text-yellow-600">{(meal.totalFatG || 0).toFixed(1)}</span>
                        <span className="col-span-2 text-right" style={{ color: "hsl(var(--primary))" }}>{(meal.totalCarbsG || 0).toFixed(1)}g</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="ml-4 text-xs italic" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Sin alimentos asignados
                  </p>
                )}

                {meal.notes && (
                  <p className="ml-4 mt-2 text-xs italic" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Nota: {meal.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Daily totals */}
        {meals.length > 0 && (
          <div className="px-8 py-4 border-t" style={{ backgroundColor: "hsl(var(--secondary))" }}>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
              Total del día
            </h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <MacroPill label="" value={totalActualCalories} unit="kcal" color="text-orange-500" />
              <MacroPill label="proteína" value={totalActualProtein} unit="g" color="text-blue-600" />
              <MacroPill label="grasa" value={totalActualFat} unit="g" color="text-yellow-600" />
              <MacroPill label="carbs" value={totalActualCarbs} unit="g" color="text-green-600" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="px-8 py-4 text-center text-xs"
          style={{ color: "hsl(var(--muted-foreground))", borderTop: "1px solid hsl(var(--border))" }}
        >
          <p>Plan elaborado por {nutritionist.name} · {nutritionist.email}</p>
          <p className="mt-1">Generado con Lutra · {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
        </div>
      </div>
    </div>
  );
}
