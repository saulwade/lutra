// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Search, Apple, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const CATEGORY_COLORS: Record<string, string> = {
  Verduras: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Frutas: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "Cereales y tubérculos sin grasa": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  "Cereales y tubérculos con grasa": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Leguminosas: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  "AOA muy baja grasa": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "AOA baja grasa": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "AOA moderada grasa": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "AOA alta grasa": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "Leche descremada": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "Leche semidescremada": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "Leche entera": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
  "Leche con azúcar": "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "Aceites y grasas sin proteína": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "Aceites y grasas con proteína": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "Azúcares sin grasa": "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "Azúcares con grasa": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FoodsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [selectedFood, setSelectedFood] = useState<any>(null);

  useEffect(() => { setPage(1); }, [category]);
  useEffect(() => { setSearchPage(1); }, [search, category]);

  const isSearching = search.trim().length > 0;

  const browseResult = useQuery(
    api.foods.getFoods,
    !isSearching
      ? {
          category: category !== "all" ? category : undefined,
          page,
          pageSize: PAGE_SIZE,
        }
      : "skip"
  );

  const searchResults = useQuery(
    api.foods.searchFoods,
    isSearching
      ? {
          query: search,
          category: category !== "all" ? category : undefined,
          limit: 200,
        }
      : "skip"
  );

  const foodGroups = useQuery(api.foods.getFoodGroups);

  let foods: any[] | undefined;
  let totalCount = 0;
  let totalPages = 1;

  if (isSearching) {
    if (searchResults !== undefined) {
      totalCount = searchResults.length;
      totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
      const safeSearchPage = Math.min(searchPage, totalPages);
      const start = (safeSearchPage - 1) * PAGE_SIZE;
      foods = searchResults.slice(start, start + PAGE_SIZE);
    }
  } else {
    if (browseResult !== undefined) {
      foods = browseResult.foods;
      totalCount = browseResult.totalCount;
      totalPages = browseResult.totalPages;
    }
  }

  const currentPage = isSearching ? Math.min(searchPage, totalPages) : page;
  const isLoading = foods === undefined;

  function handlePageChange(newPage: number) {
    if (isSearching) setSearchPage(newPage);
    else setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Base de Alimentos SMAE</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {isLoading
            ? "Cargando..."
            : `${totalCount} alimento${totalCount !== 1 ? "s" : ""} encontrado${totalCount !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder="Buscar alimento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Categoría SMAE" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {foodGroups?.map((g) => (
              <SelectItem key={g._id} value={g.name}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Food Table */}
      <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        {isLoading ? (
          <FoodTableSkeleton />
        ) : foods?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
              <Apple className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Prueba con otro término o categoría
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--muted))]">
                <tr className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 font-semibold">Alimento</th>
                  <th className="text-left px-4 py-2.5 font-semibold hidden sm:table-cell">Categoría</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Porción</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Kcal</th>
                  <th className="text-right px-4 py-2.5 font-semibold">P (g)</th>
                  <th className="text-right px-4 py-2.5 font-semibold">L (g)</th>
                  <th className="text-right px-4 py-2.5 font-semibold">HC (g)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {foods?.map((food) => (
                  <tr
                    key={food._id}
                    onClick={() => setSelectedFood(food)}
                    className="hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-medium">
                      <span className="hover:text-[hsl(var(--primary))] transition-colors">
                        {food.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          CATEGORY_COLORS[food.category] ?? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                        )}
                      >
                        {food.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[hsl(var(--muted-foreground))]">
                      {food.servingAmount} {food.servingUnit}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">{food.calories}</td>
                    <td className="px-4 py-2.5 text-right text-blue-600">{food.proteinG}</td>
                    <td className="px-4 py-2.5 text-right text-yellow-600">{food.fatG}</td>
                    <td className="px-4 py-2.5 text-right text-[hsl(var(--primary))]">{food.carbsG}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Food Detail Dialog */}
      <FoodDetailDialog
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
      />
    </div>
  );
}

// ─── Food Detail Dialog ───────────────────────────────────────────────────────

function FoodDetailDialog({
  food,
  onClose,
}: {
  food: any | null;
  onClose: () => void;
}) {
  if (!food) return null;

  const totalMacroG = food.proteinG + food.fatG + food.carbsG;

  return (
    <Dialog open={!!food} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{food.name}</DialogTitle>
        </DialogHeader>
        {/* Top banner */}
        <div className="bg-[hsl(var(--accent))] px-6 pt-6 pb-5 rounded-t-xl">
          <div className="flex items-start justify-between gap-3 mb-3">
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium",
                CATEGORY_COLORS[food.category] ?? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
              )}
            >
              {food.category}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[hsl(var(--text-strong))] leading-tight mb-1">
            {food.name}
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Porción: {food.servingAmount} {food.servingUnit}
            {food.servingWeightG && ` (${food.servingWeightG} g neto)`}
            {food.grossWeightG && food.grossWeightG !== food.servingWeightG
              ? ` / ${food.grossWeightG} g bruto`
              : ""}
          </p>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-5 mt-4">
          {/* Calorie hero */}
          <div className="flex items-center justify-between bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl px-5 py-4">
            <div>
              <p className="text-3xl font-extrabold text-[hsl(var(--text-strong))]">
                {food.calories}
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                Kilocalorías
              </p>
            </div>
            {/* Macro proportion bars */}
            {totalMacroG > 0 && (
              <div className="flex flex-col gap-1.5 items-end">
                <MacroPill
                  label="Proteína"
                  value={food.proteinG}
                  total={totalMacroG}
                  color="bg-blue-500"
                  textColor="text-blue-600 dark:text-blue-400"
                />
                <MacroPill
                  label="Lípidos"
                  value={food.fatG}
                  total={totalMacroG}
                  color="bg-yellow-400"
                  textColor="text-yellow-600 dark:text-yellow-400"
                />
                <MacroPill
                  label="Hidratos"
                  value={food.carbsG}
                  total={totalMacroG}
                  color="bg-[hsl(var(--primary))]"
                  textColor="text-[hsl(var(--primary))]"
                />
              </div>
            )}
          </div>

          {/* Macronutrimentos */}
          <Section title="Macronutrimentos">
            <NutrientRow label="Proteína" value={food.proteinG} unit="g" bold />
            <NutrientRow label="Hidratos de carbono" value={food.carbsG} unit="g" bold />
            {food.sugarG != null && (
              <NutrientRow label="  del cual: Azúcares" value={food.sugarG} unit="g" indent />
            )}
            <NutrientRow label="Lípidos totales" value={food.fatG} unit="g" bold />
            {food.saturatedFatG != null && (
              <NutrientRow label="  Ácidos grasos saturados" value={food.saturatedFatG} unit="g" indent />
            )}
            {food.monounsatFatG != null && (
              <NutrientRow label="  Ácidos grasos monoinsaturados" value={food.monounsatFatG} unit="g" indent />
            )}
            {food.polyunsatFatG != null && (
              <NutrientRow label="  Ácidos grasos poliinsaturados" value={food.polyunsatFatG} unit="g" indent />
            )}
            {food.fiberG != null && (
              <NutrientRow label="Fibra dietética" value={food.fiberG} unit="g" bold />
            )}
            {food.cholesterolMg != null && (
              <NutrientRow label="Colesterol" value={food.cholesterolMg} unit="mg" bold />
            )}
            {food.ethanolG != null && food.ethanolG > 0 && (
              <NutrientRow label="Etanol" value={food.ethanolG} unit="g" bold />
            )}
          </Section>

          {/* Vitaminas */}
          {(food.vitaminAMgRE != null || food.vitaminCMg != null || food.folicAcidMg != null) && (
            <Section title="Vitaminas">
              {food.vitaminAMgRE != null && (
                <NutrientRow label="Vitamina A" value={food.vitaminAMgRE} unit="µg RE" />
              )}
              {food.vitaminCMg != null && (
                <NutrientRow label="Vitamina C" value={food.vitaminCMg} unit="mg" />
              )}
              {food.folicAcidMg != null && (
                <NutrientRow label="Ácido fólico" value={food.folicAcidMg} unit="µg" />
              )}
            </Section>
          )}

          {/* Minerales */}
          {(food.calciumMg != null || food.ironMg != null || food.potassiumMg != null ||
            food.sodiumMg != null || food.phosphorusMg != null) && (
            <Section title="Minerales">
              {food.calciumMg != null && (
                <NutrientRow label="Calcio" value={food.calciumMg} unit="mg" />
              )}
              {food.ironMg != null && (
                <NutrientRow label="Hierro" value={food.ironMg} unit="mg" />
              )}
              {food.potassiumMg != null && (
                <NutrientRow label="Potasio" value={food.potassiumMg} unit="mg" />
              )}
              {food.sodiumMg != null && (
                <NutrientRow label="Sodio" value={food.sodiumMg} unit="mg" />
              )}
              {food.phosphorusMg != null && (
                <NutrientRow label="Fósforo" value={food.phosphorusMg} unit="mg" />
              )}
            </Section>
          )}

          {/* Índices glucémicos */}
          {(food.glycemicIndex != null || food.glycemicLoad != null) && (
            <Section title="Índices glucémicos">
              {food.glycemicIndex != null && (
                <NutrientRow label="Índice glucémico" value={food.glycemicIndex} unit="" />
              )}
              {food.glycemicLoad != null && (
                <NutrientRow label="Carga glucémica" value={food.glycemicLoad} unit="" />
              )}
            </Section>
          )}

          {/* Source badge */}
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center pt-1">
            Fuente: {food.source === "smae" ? "Sistema Mexicano de Alimentos Equivalentes (SMAE)" : food.source}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroPill({
  label,
  value,
  total,
  color,
  textColor,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  textColor: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[hsl(var(--muted-foreground))] w-16 text-right">{label}</span>
      <div className="w-24 h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-xs font-semibold w-8", textColor)}>
        {value}g
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
        {title}
      </p>
      <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl overflow-hidden divide-y divide-[hsl(var(--border))]">
        {children}
      </div>
    </div>
  );
}

function NutrientRow({
  label,
  value,
  unit,
  bold = false,
  indent = false,
}: {
  label: string;
  value: number;
  unit: string;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2.5 text-sm",
        indent && "pl-8 bg-[hsl(var(--muted)/0.4)]"
      )}
    >
      <span
        className={cn(
          "text-[hsl(var(--foreground))]",
          bold ? "font-semibold" : "font-normal",
          indent && "text-[hsl(var(--muted-foreground))]"
        )}
      >
        {label.replace(/^  /, "")}
      </span>
      <span className={cn("tabular-nums text-[hsl(var(--foreground))]", bold ? "font-semibold" : "font-normal")}>
        {typeof value === "number" ? value : "—"}
        {unit && <span className="text-[hsl(var(--muted-foreground))] ml-1 text-xs">{unit}</span>}
      </span>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  function getPages(): (number | "...")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  const pages = getPages();

  return (
    <div className="flex items-center justify-center gap-1 py-2">
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="w-8 h-8 flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]"
          >
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "outline"}
            size="icon"
            className={cn(
              "w-8 h-8 text-sm",
              p === currentPage &&
                "bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]"
            )}
            onClick={() => onPageChange(p as number)}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FoodTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[hsl(var(--muted))]">
          <tr>
            {[...Array(7)].map((_, i) => (
              <th key={i} className="px-4 py-2.5">
                <Skeleton className="h-4 w-full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border))]">
          {[...Array(10)].map((_, i) => (
            <tr key={i}>
              {[...Array(7)].map((_, j) => (
                <td key={j} className="px-4 py-2.5">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
