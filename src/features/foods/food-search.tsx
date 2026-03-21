// @ts-nocheck
"use client"

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { cn } from "@/lib/utils";
import { normalizeQuery, rankFoodResults, debugMatch } from "@/lib/food-matcher";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Salad, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FoodItem {
  _id: string;
  name: string;
  category: string;
  categorySlug: string;
  servingAmount: number;
  servingUnit: string;
  servingWeightG: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG?: number;
}

interface FoodSearchProps {
  onFoodSelect: (food: FoodItem) => void;
  categoryFilter?: string;
  placeholder?: string;
  maxHeight?: string;
}

// ─── SMAE categories ─────────────────────────────────────────────────────────

const SMAE_CATEGORIES = [
  { value: "all", label: "Todas las categorías" },
  { value: "verduras", label: "Verduras" },
  { value: "frutas", label: "Frutas" },
  { value: "cereales_sin_grasa", label: "Cereales sin grasa" },
  { value: "cereales_con_grasa", label: "Cereales con grasa" },
  { value: "leguminosas", label: "Leguminosas" },
  { value: "aoa_muy_baja_grasa", label: "AOA muy baja grasa" },
  { value: "aoa_baja_grasa", label: "AOA baja grasa" },
  { value: "aoa_mediana_grasa", label: "AOA mediana grasa" },
  { value: "aoa_alta_grasa", label: "AOA alta grasa" },
  { value: "leche_descremada", label: "Leche descremada" },
  { value: "leche_semidescremada", label: "Leche semidescremada" },
  { value: "leche_entera", label: "Leche entera" },
  { value: "grasas_sin_proteina", label: "Grasas sin proteína" },
  { value: "grasas_con_proteina", label: "Grasas con proteína" },
  { value: "azucares_sin_grasa", label: "Azúcares sin grasa" },
];

// ─── Food Result Row ──────────────────────────────────────────────────────────

function FoodRow({
  food,
  onSelect,
}: {
  food: FoodItem;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left",
        "transition-colors hover:bg-[hsl(var(--accent))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
      )}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--muted))]">
        <Salad className="h-4 w-4 text-[hsl(var(--primary))]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
          {food.name}
        </p>
        <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
          {food.servingAmount} {food.servingUnit}
          {food.servingWeightG ? ` (${food.servingWeightG} g)` : ""}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
          {food.calories} kcal
        </p>
        <div className="mt-0.5 flex justify-end gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="text-blue-600 dark:text-blue-400">P {food.proteinG}g</span>
          <span className="text-yellow-600 dark:text-yellow-400">G {food.fatG}g</span>
          <span className="text-green-600 dark:text-green-400">C {food.carbsG}g</span>
        </div>
      </div>
    </button>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="h-8 w-8 rounded-md" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <div className="space-y-1.5 text-right">
        <Skeleton className="ml-auto h-3.5 w-16" />
        <Skeleton className="ml-auto h-3 w-20" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FoodSearch({
  onFoodSelect,
  categoryFilter,
  placeholder = "Buscar alimento...",
  maxHeight = "320px",
}: FoodSearchProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>(categoryFilter ?? "all");

  // Debounce
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue.trim()), 350);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Normalizar el query antes de enviar a Convex
  const normalizedQuery = React.useMemo(
    () => (debouncedQuery.length >= 2 ? normalizeQuery(debouncedQuery) : ""),
    [debouncedQuery]
  );

  // Query principal con el término normalizado (más preciso)
  const primaryResults = useQuery(
    api.foods.searchFoods,
    normalizedQuery.length >= 2
      ? {
          query: normalizedQuery,
          category: category !== "all" ? category : undefined,
          limit: 40,
        }
      : "skip"
  );

  // Query secundario con el input original (si difiere del normalizado)
  // Captura alimentos que contengan las palabras originales aunque el normalizado no las tenga
  const originalDiffersFromNormalized =
    debouncedQuery.length >= 2 &&
    normalizedQuery !== debouncedQuery.toLowerCase();

  const secondaryResults = useQuery(
    api.foods.searchFoods,
    originalDiffersFromNormalized
      ? {
          query: debouncedQuery,
          category: category !== "all" ? category : undefined,
          limit: 20,
        }
      : "skip"
  );

  // Combinar, deduplicar y rankear con el matcher
  const rankedResults = React.useMemo(() => {
    if (!primaryResults && !secondaryResults) return undefined;

    const combined = [...(primaryResults ?? []), ...(secondaryResults ?? [])];

    // Deduplicar por _id
    const seen = new Set<string>();
    const unique = combined.filter((f) => {
      if (seen.has(f._id)) return false;
      seen.add(f._id);
      return true;
    });

    // Debug en desarrollo
    debugMatch(debouncedQuery, unique);

    // Rankear: normalizar + score + filtrar absurdos
    return rankFoodResults(debouncedQuery, unique);
  }, [primaryResults, secondaryResults, debouncedQuery]);

  const isLoading =
    debouncedQuery.length >= 2 &&
    (primaryResults === undefined || (originalDiffersFromNormalized && secondaryResults === undefined));

  const hasResults = Array.isArray(rankedResults) && rankedResults.length > 0;
  const showEmpty = debouncedQuery.length >= 2 && !isLoading && !hasResults;
  const showPrompt = debouncedQuery.length < 2;

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar + category */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="pl-9 pr-8"
            autoComplete="off"
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setInputValue("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {!categoryFilter && (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44 shrink-0">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {SMAE_CATEGORIES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Indicador de normalización (solo dev) */}
      {process.env.NODE_ENV === "development" &&
        debouncedQuery.length >= 2 &&
        normalizedQuery !== debouncedQuery.toLowerCase() && (
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono px-1">
            🔍 buscando: &quot;{normalizedQuery}&quot;
          </p>
        )}

      {/* Results area */}
      <div
        className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))]"
        style={{ minHeight: "120px", maxHeight }}
      >
        {showPrompt && (
          <div className="flex h-28 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
            Escribe al menos 2 caracteres para buscar
          </div>
        )}

        {isLoading && (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {showEmpty && (
          <div className="flex h-28 flex-col items-center justify-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
            <Salad className="h-6 w-6 opacity-30" />
            <span>Sin resultados para &quot;{debouncedQuery}&quot;</span>
            {category !== "all" && (
              <button
                type="button"
                className="text-xs text-[hsl(var(--primary))] underline"
                onClick={() => setCategory("all")}
              >
                Buscar en todas las categorías
              </button>
            )}
          </div>
        )}

        {hasResults && (
          <ScrollArea style={{ maxHeight }}>
            <div className="py-1">
              {rankedResults!.map((food) => (
                <FoodRow
                  key={food._id}
                  food={food as FoodItem}
                  onSelect={() => onFoodSelect(food as FoodItem)}
                />
              ))}
              <div className="px-3 py-1.5">
                <Badge variant="secondary" className="text-xs">
                  {rankedResults!.length} resultado{rankedResults!.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
