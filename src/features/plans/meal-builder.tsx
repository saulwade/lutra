// @ts-nocheck
"use client"

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { macrosFromFood } from "@/lib/nutrition-calculator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FoodSearch, type FoodItem } from "@/features/foods/food-search";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  Utensils,
  Clock,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MealFood {
  _id: Id<"mealFoods">;
  name: string;
  quantity: number;
  unit: string;
  weightG: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG?: number;
  smaeCategory?: string;
  order: number;
}

export interface Meal {
  _id: Id<"meals">;
  name: string;
  time?: string;
  order: number;
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
}

interface MealBuilderProps {
  planId: Id<"plans">;
  meals: Meal[];
  mealFoods: Record<string, MealFood[]>;
  targetCalories?: number;
  targetProteinG?: number;
  targetFatG?: number;
  targetCarbsG?: number;
}

// ─── Add Food Dialog ──────────────────────────────────────────────────────────

function AddFoodDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (food: FoodItem, quantity: number) => Promise<void>;
}) {
  const [selectedFood, setSelectedFood] = React.useState<FoodItem | null>(null);
  const [quantity, setQuantity] = React.useState<number>(1);
  const [adding, setAdding] = React.useState(false);

  const reset = () => {
    setSelectedFood(null);
    setQuantity(1);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const calculatedWeight = selectedFood
    ? Math.round(selectedFood.servingWeightG * quantity * 10) / 10
    : 0;

  const calculatedMacros =
    selectedFood && calculatedWeight > 0
      ? macrosFromFood(
          {
            calories: selectedFood.calories,
            proteinG: selectedFood.proteinG,
            fatG: selectedFood.fatG,
            carbsG: selectedFood.carbsG,
            servingWeightG: selectedFood.servingWeightG,
          },
          calculatedWeight
        )
      : null;

  const handleAdd = async () => {
    if (!selectedFood) return;
    setAdding(true);
    try {
      await onAdd(selectedFood, quantity);
      handleClose();
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Agregar alimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFood ? (
            <FoodSearch onFoodSelect={setSelectedFood} maxHeight="280px" />
          ) : (
            <div className="space-y-4">
              {/* Selected food */}
              <div className="flex items-start justify-between rounded-lg bg-[hsl(var(--accent))] p-3">
                <div className="min-w-0">
                  <p className="font-medium text-[hsl(var(--foreground))]">
                    {selectedFood.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                    {selectedFood.category}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={() => setSelectedFood(null)}
                >
                  Cambiar
                </Button>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Porciones</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={0.25}
                    step={0.25}
                    className="h-8 text-sm"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    1 porción = {selectedFood.servingAmount} {selectedFood.servingUnit}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Peso total</Label>
                  <div className="flex h-8 items-center rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--muted))] px-3 text-sm">
                    {calculatedWeight} g
                  </div>
                </div>
              </div>

              {/* Macro preview */}
              {calculatedMacros && (
                <div className="grid grid-cols-4 gap-2 rounded-lg bg-[hsl(var(--muted))] p-3">
                  {[
                    { label: "Calorías", value: `${calculatedMacros.calories}`, unit: "kcal" },
                    { label: "Proteína", value: `${calculatedMacros.proteinG}`, unit: "g", color: "text-blue-600" },
                    { label: "Grasa", value: `${calculatedMacros.fatG}`, unit: "g", color: "text-yellow-600" },
                    { label: "Carbos", value: `${calculatedMacros.carbsG}`, unit: "g", color: "text-green-600" },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label} className="text-center">
                      <p className={cn("text-sm font-semibold", color ?? "text-[hsl(var(--foreground))]")}>
                        {value}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{unit}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={adding}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selectedFood || adding}>
            {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Macro Progress Row ───────────────────────────────────────────────────────

function MacroBar({
  label,
  value,
  total,
  target,
  color,
}: {
  label: string;
  value: number;
  total: number;
  target?: number;
  color: string;
}) {
  const mealPct = total > 0 ? (value / total) * 100 : 0;
  const targetPct = target ? Math.min((value / target) * 100, 100) : null;

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
        <span className="font-medium">
          {Math.round(value)}g
          {target ? (
            <span className="text-[hsl(var(--muted-foreground))]/70"> / {target}g</span>
          ) : null}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
        <div
          className={cn("h-full rounded-full transition-all duration-300", color)}
          style={{ width: `${targetPct ?? mealPct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Single Meal Section ──────────────────────────────────────────────────────

function MealSection({
  meal,
  foods,
  planId,
  targetCalories,
  targetProteinG,
  targetFatG,
  targetCarbsG,
  totalCalories,
}: {
  meal: Meal;
  foods: MealFood[];
  planId: Id<"plans">;
  targetCalories?: number;
  targetProteinG?: number;
  targetFatG?: number;
  targetCarbsG?: number;
  totalCalories: number;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const addFood = useMutation(api.meals.addFoodToMeal);
  const removeFood = useMutation(api.meals.removeFoodFromMeal);

  const handleAddFood = async (food: FoodItem, quantity: number) => {
    const weightG = Math.round(food.servingWeightG * quantity * 10) / 10;
    const macros = macrosFromFood(
      {
        calories: food.calories,
        proteinG: food.proteinG,
        fatG: food.fatG,
        carbsG: food.carbsG,
        servingWeightG: food.servingWeightG,
      },
      weightG
    );

    try {
      await addFood({
        mealId: meal._id,
        planId,
        foodId: food._id as Id<"foods">,
        name: food.name,
        quantity,
        unit: food.servingUnit,
        weightG,
        calories: macros.calories,
        proteinG: macros.proteinG,
        fatG: macros.fatG,
        carbsG: macros.carbsG,
        smaeCategory: food.categorySlug,
        order: foods.length,
      });
      toast({ title: "Alimento agregado", description: food.name });
    } catch {
      toast({
        title: "Error al agregar",
        description: "No se pudo agregar el alimento.",
        variant: "destructive",
      });
      throw new Error("add failed");
    }
  };

  const handleRemove = async (mealFoodId: Id<"mealFoods">, name: string) => {
    try {
      await removeFood({ mealFoodId });
      toast({ title: "Alimento eliminado", description: name });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar el alimento.",
        variant: "destructive",
      });
    }
  };

  const mealCaloriePct =
    targetCalories && targetCalories > 0
      ? Math.round((meal.totalCalories / targetCalories) * 100)
      : null;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        {/* Meal header */}
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--muted))]/50"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
          )}

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10">
            <Utensils className="h-4 w-4 text-[hsl(var(--primary))]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[hsl(var(--foreground))]">{meal.name}</span>
              {meal.time && (
                <span className="flex items-center gap-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                  <Clock className="h-3 w-3" />
                  {meal.time}
                </span>
              )}
              <Badge
                variant="secondary"
                className="ml-auto text-xs font-medium tabular-nums"
              >
                {Math.round(meal.totalCalories)} kcal
                {mealCaloriePct !== null && (
                  <span className="ml-1 opacity-70">({mealCaloriePct}%)</span>
                )}
              </Badge>
            </div>
            <div className="mt-0.5 flex gap-3 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="text-blue-600">P {Math.round(meal.totalProteinG)}g</span>
              <span className="text-yellow-600">G {Math.round(meal.totalFatG)}g</span>
              <span className="text-green-600">C {Math.round(meal.totalCarbsG)}g</span>
              <span>{foods.length} alimento{foods.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div>
            <Separator />

            {/* Progress bars */}
            <div className="grid grid-cols-3 gap-3 px-4 py-3">
              <MacroBar
                label="Proteína"
                value={meal.totalProteinG}
                total={meal.totalProteinG + meal.totalFatG + meal.totalCarbsG}
                target={targetProteinG ? Math.round(targetProteinG * 0.25) : undefined}
                color="bg-blue-400"
              />
              <MacroBar
                label="Grasa"
                value={meal.totalFatG}
                total={meal.totalProteinG + meal.totalFatG + meal.totalCarbsG}
                target={targetFatG ? Math.round(targetFatG * 0.25) : undefined}
                color="bg-yellow-400"
              />
              <MacroBar
                label="Carbos"
                value={meal.totalCarbsG}
                total={meal.totalProteinG + meal.totalFatG + meal.totalCarbsG}
                target={targetCarbsG ? Math.round(targetCarbsG * 0.25) : undefined}
                color="bg-green-400"
              />
            </div>

            <Separator />

            {/* Foods list */}
            {foods.length > 0 ? (
              <ScrollArea className="max-h-64">
                <div className="divide-y divide-[hsl(var(--border))]">
                  {foods.map((mf) => (
                    <div
                      key={mf._id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                          {mf.name}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {mf.quantity} {mf.unit} · {mf.weightG}g
                          {mf.smaeCategory && (
                            <Badge variant="outline" className="ml-1.5 py-0 text-[10px]">
                              {mf.smaeCategory}
                            </Badge>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {Math.round(mf.calories)} kcal
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          <span className="text-blue-600">P{Math.round(mf.proteinG)}</span>
                          {" "}
                          <span className="text-yellow-600">G{Math.round(mf.fatG)}</span>
                          {" "}
                          <span className="text-green-600">C{Math.round(mf.carbsG)}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
                        onClick={() => handleRemove(mf._id, mf.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-sm text-[hsl(var(--muted-foreground))]">
                <Utensils className="mb-1.5 h-5 w-5 opacity-30" />
                Sin alimentos. Agrega uno.
              </div>
            )}

            {/* Add button */}
            <div className="border-t border-[hsl(var(--border))] p-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Agregar alimento
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddFoodDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddFood}
      />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MealBuilder({
  planId,
  meals,
  mealFoods,
  targetCalories,
  targetProteinG,
  targetFatG,
  targetCarbsG,
}: MealBuilderProps) {
  // Totals across all meals
  const totalCalories = meals.reduce((s, m) => s + m.totalCalories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.totalProteinG, 0);
  const totalFat = meals.reduce((s, m) => s + m.totalFatG, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.totalCarbsG, 0);

  return (
    <div className="space-y-3">
      {/* Daily summary bar */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Resumen del día
          </span>
          {targetCalories && (
            <Badge
              variant={totalCalories > targetCalories ? "destructive" : "secondary"}
              className="text-xs tabular-nums"
            >
              {Math.round(totalCalories)} / {targetCalories} kcal
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {/* Calorie progress */}
          {targetCalories && (
            <div className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-[hsl(var(--muted-foreground))]">Calorías totales</span>
                <span className="font-medium">
                  {Math.round(totalCalories)}{" "}
                  <span className="text-[hsl(var(--muted-foreground))]/70">
                    / {targetCalories} kcal
                  </span>
                </span>
              </div>
              <Progress
                value={Math.min((totalCalories / targetCalories) * 100, 100)}
                className="h-2"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <MacroBar
              label="Proteína"
              value={totalProtein}
              total={totalProtein + totalFat + totalCarbs}
              target={targetProteinG}
              color="bg-blue-400"
            />
            <MacroBar
              label="Grasa"
              value={totalFat}
              total={totalProtein + totalFat + totalCarbs}
              target={targetFatG}
              color="bg-yellow-400"
            />
            <MacroBar
              label="Carbos"
              value={totalCarbs}
              total={totalProtein + totalFat + totalCarbs}
              target={targetCarbsG}
              color="bg-green-400"
            />
          </div>
        </div>
      </div>

      {/* Meal sections */}
      {meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] py-12 text-[hsl(var(--muted-foreground))]">
          <Utensils className="mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">Sin comidas en este plan</p>
          <p className="mt-0.5 text-xs">Las comidas aparecerán aquí al crearlas</p>
        </div>
      ) : (
        meals.map((meal) => (
          <MealSection
            key={meal._id}
            meal={meal}
            foods={mealFoods[meal._id] ?? []}
            planId={planId}
            targetCalories={targetCalories}
            targetProteinG={targetProteinG}
            targetFatG={targetFatG}
            targetCarbsG={targetCarbsG}
            totalCalories={totalCalories}
          />
        ))
      )}
    </div>
  );
}
