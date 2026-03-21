// @ts-nocheck
"use client"

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Id } from "@/../convex/_generated/dataModel";
import {
  ChefHat,
  Plus,
  Clock,
  Utensils,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
  ImageIcon,
  FileUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ─── Schema ───────────────────────────────────────────────────────────────────

const recipeSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prepTimeMin: z.coerce.number().min(0).optional(),
  cookTimeMin: z.coerce.number().min(0).optional(),
  servings: z.coerce.number().min(1, "Al menos 1 porción"),
  isPublic: z.boolean().default(false),
});

type RecipeForm = z.infer<typeof recipeSchema>;

// ─── Ingredient parser & unit conversion ──────────────────────────────────────

/** Maps every known unit variant → canonical form */
const UNIT_ALIASES: Record<string, string> = {
  // grams
  g: "g", gr: "g", grs: "g", gramo: "g", gramos: "g",
  // kilograms
  kg: "kg", kilogramo: "kg", kilogramos: "kg",
  // milligrams
  mg: "mg",
  // milliliters
  ml: "ml", mililitro: "ml", mililitros: "ml",
  // liters
  l: "l", lt: "l", lts: "l", litro: "l", litros: "l",
  // cups
  taza: "taza", tazas: "taza", tza: "taza", tzas: "taza", cup: "taza", cups: "taza",
  // tablespoons
  cda: "cda", cdas: "cda", cucharada: "cda", cucharadas: "cda", tbsp: "cda",
  // teaspoons
  cdita: "cdita", cditas: "cdita", cdta: "cdita", cdtas: "cdita",
  cucharadita: "cdita", cucharaditas: "cdita", tsp: "cdita",
  // pieces
  pieza: "pza", piezas: "pza", pz: "pza", pza: "pza",
  unidad: "pza", unidades: "pza", und: "pza",
  // portions
  porcion: "pza", porciones: "pza",
  // oz / lb
  oz: "oz", onza: "oz", onzas: "oz",
  lb: "lb", libra: "lb", libras: "lb",
};

/** Grams equivalent per canonical unit (for mass/volume conversion) */
const UNIT_TO_G: Record<string, number> = {
  g: 1,
  mg: 0.001,
  kg: 1000,
  ml: 1,
  l: 1000,
  taza: 240,   // standard culinary cup
  cda: 15,     // tablespoon
  cdita: 5,    // teaspoon
  oz: 28.35,
  lb: 453.6,
  // "pza" handled specially — count × food.servingWeightG
};

/** Unicode fraction glyphs → fraction strings */
const UNICODE_FRACS: [RegExp, string][] = [
  [/½/g, "1/2"], [/¼/g, "1/4"], [/¾/g, "3/4"],
  [/⅓/g, "1/3"], [/⅔/g, "2/3"], [/⅛/g, "1/8"],
];

function normalizeUnit(raw: string): string {
  return UNIT_ALIASES[raw.toLowerCase().replace(/\.$/, "")] ?? "pza";
}

function parseQuantity(s: string): number {
  s = s.trim();
  // Mixed fraction: "2 1/2"
  const mix = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mix) return +mix[1] + +mix[2] / +mix[3];
  // Simple fraction: "1/2"
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return +frac[1] / +frac[2];
  // Decimal or integer
  return parseFloat(s.replace(",", ".")) || 0;
}

interface ParsedIngredient {
  rawText: string;
  quantity: number;
  unit: string;   // canonical: g | kg | ml | l | taza | cda | cdita | pza | oz | lb
  name: string;
}

function parseIngredientLines(text: string): ParsedIngredient[] {
  const results: ParsedIngredient[] = [];

  // Build unit-detection regex (longest-first to avoid partial matches)
  const unitKeys = Object.keys(UNIT_ALIASES)
    .sort((a, b) => b.length - a.length)
    .map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const unitPat = new RegExp(`^(${unitKeys.join("|")})\\.?$`, "i");

  // Quantity patterns: mixed fraction | simple fraction | decimal | integer
  const QTY = "(\\d+\\s+\\d+\\s*/\\s*\\d+|\\d+\\s*/\\s*\\d+|\\d+[,.]\\d+|\\d+)";
  const fullRe = new RegExp(`^${QTY}\\s+(\\S+)\\s+(.+)$`);
  const simpleRe = new RegExp(`^${QTY}\\s+(.+)$`);

  for (const rawLine of text.split("\n")) {
    let line = rawLine;
    // Normalize unicode fractions
    for (const [re, rep] of UNICODE_FRACS) line = line.replace(re, rep);
    // Strip list markers (bullets, numbered lists)
    line = line.replace(/^[\s\-–•*·]+/, "").replace(/^\d+[.)]\s*/, "").trim();
    if (line.length < 2) continue;

    const fullM = line.match(fullRe);
    if (fullM) {
      const qty = parseQuantity(fullM[1]);
      const maybeUnit = fullM[2];
      const rest = fullM[3].trim();
      if (unitPat.test(maybeUnit)) {
        results.push({ rawText: rawLine.trim(), quantity: qty, unit: normalizeUnit(maybeUnit), name: rest });
      } else {
        // maybeUnit is part of the ingredient name
        results.push({ rawText: rawLine.trim(), quantity: qty, unit: "pza", name: `${maybeUnit} ${rest}`.trim() });
      }
      continue;
    }

    const simpleM = line.match(simpleRe);
    if (simpleM) {
      results.push({ rawText: rawLine.trim(), quantity: parseQuantity(simpleM[1]), unit: "pza", name: simpleM[2].trim() });
      continue;
    }

    results.push({ rawText: rawLine.trim(), quantity: 1, unit: "pza", name: line.trim() });
  }

  return results.filter((p) => p.name.length > 1);
}

/**
 * Given user qty+unit and a matched SMAE food, compute:
 * - weightG: actual grams to log
 * - scale:   multiplier against food's per-serving macros
 */
function computeWeightAndScale(
  quantity: number,
  unit: string,
  food: any,
): { weightG: number; scale: number } {
  const servingW = food.servingWeightG ?? food.servingAmount ?? 1;

  // Mass / volume unit → convert directly to grams
  if (UNIT_TO_G[unit] !== undefined) {
    const weightG = quantity * UNIT_TO_G[unit];
    return { weightG, scale: weightG / servingW };
  }

  // Piece / unknown unit → count-based using food's per-serving weight
  const weightG = (quantity / (food.servingAmount || 1)) * servingW;
  return { weightG, scale: quantity / (food.servingAmount || 1) };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<Id<"recipes"> | null>(null);

  const recipes = useQuery(api.recipes.getRecipes, { includePublic: false });
  const createRecipe = useMutation(api.recipes.createRecipe);
  const deleteRecipe = useMutation(api.recipes.deleteRecipe);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecipeForm>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { servings: 1, isPublic: false },
  });

  const isPublic = watch("isPublic");

  const filtered = recipes?.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  async function onSubmit(data: RecipeForm) {
    try {
      const id = await createRecipe({
        name: data.name,
        description: data.description || undefined,
        instructions: data.instructions || undefined,
        prepTimeMin: data.prepTimeMin,
        cookTimeMin: data.cookTimeMin,
        servings: data.servings,
        isPublic: data.isPublic,
      });
      toast({ title: "Receta creada" });
      setCreateDialogOpen(false);
      reset();
      setSelectedRecipeId(id as Id<"recipes">);
    } catch {
      toast({ title: "Error al crear receta", variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Recetas</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {recipes === undefined
              ? "Cargando..."
              : `${recipes.length} receta${recipes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
          >
            <FileUp className="w-4 h-4 mr-1" />
            Importar receta
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nueva Receta
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <Input
          placeholder="Buscar receta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Recipe Grid */}
      {recipes === undefined ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))]">
          <div className="w-14 h-14 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
          </div>
          <p className="text-sm font-medium">
            {search ? "Sin resultados" : "Sin recetas aún"}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {search
              ? "Intenta con otro término"
              : "Crea o importa tu primera receta para usarla en planes"}
          </p>
          {!search && (
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
              >
                <FileUp className="w-4 h-4 mr-1" />
                Importar
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]"
              >
                <Plus className="w-4 h-4 mr-1" />
                Crear receta
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((recipe) => (
            <RecipeCard
              key={recipe._id}
              recipe={recipe}
              onEdit={() => setSelectedRecipeId(recipe._id)}
              onDelete={async () => {
                if (!confirm(`¿Eliminar "${recipe.name}"? Esta acción no se puede deshacer.`)) return;
                try {
                  await deleteRecipe({ recipeId: recipe._id });
                  toast({ title: "Receta eliminada" });
                } catch {
                  toast({ title: "Error al eliminar receta", variant: "destructive" });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Create Recipe Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Receta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...register("name")} placeholder="Ensalada de atún" />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Breve descripción de la receta"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructions">Preparación</Label>
              <Textarea
                id="instructions"
                {...register("instructions")}
                placeholder="Pasos para preparar la receta..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prepTimeMin">Prep (min)</Label>
                <Input id="prepTimeMin" type="number" {...register("prepTimeMin")} placeholder="10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cookTimeMin">Cocción (min)</Label>
                <Input id="cookTimeMin" type="number" {...register("cookTimeMin")} placeholder="15" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="servings">Porciones *</Label>
                <Input id="servings" type="number" {...register("servings")} placeholder="4" />
                {errors.servings && (
                  <p className="text-xs text-red-500">{errors.servings.message}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPublic"
                checked={isPublic}
                onCheckedChange={(v) => setValue("isPublic", Boolean(v))}
              />
              <Label htmlFor="isPublic" className="cursor-pointer">
                Hacer pública (visible para otros nutriólogos)
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCreateDialogOpen(false); reset(); }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Crear receta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Recipe Dialog */}
      <ImportRecipeDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onCreated={(id) => { setImportDialogOpen(false); setSelectedRecipeId(id); }}
      />

      {/* Recipe Detail / Ingredients Dialog */}
      <RecipeDetailDialog
        recipeId={selectedRecipeId}
        onClose={() => setSelectedRecipeId(null)}
      />
    </div>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────

function RecipeCard({ recipe, onEdit, onDelete }: { recipe: any; onEdit: () => void; onDelete: () => void }) {
  const totalTime = (recipe.prepTimeMin ?? 0) + (recipe.cookTimeMin ?? 0);
  return (
    <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] overflow-hidden flex flex-col hover:shadow-sm transition-shadow">
      {/* Image area */}
      <div className="relative w-full h-36 bg-[hsl(var(--muted))] shrink-0">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-[hsl(var(--muted-foreground))] opacity-40" />
          </div>
        )}
        {recipe.isPublic && (
          <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-[hsl(var(--surface))]/90 rounded font-medium text-[hsl(var(--muted-foreground))]">
            Pública
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Name + desc */}
        <div>
          <p className="text-sm font-semibold line-clamp-1">{recipe.name}</p>
          {recipe.description && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1 mt-0.5">
              {recipe.description}
            </p>
          )}
        </div>

        <Separator />

        {/* Macros */}
        <div className="grid grid-cols-4 gap-1 text-center">
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
              {Math.round(recipe.caloriesPerServing)}
            </p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">kcal</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600">
              {recipe.proteinGPerServing?.toFixed(1)}g
            </p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">prot</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-yellow-600">
              {recipe.fatGPerServing?.toFixed(1)}g
            </p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">lip</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--primary))]">
              {recipe.carbsGPerServing?.toFixed(1)}g
            </p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">HC</p>
          </div>
        </div>

        {/* Time + servings */}
        <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {totalTime} min
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Utensils className="w-3 h-3" />
            {recipe.servings} porción{recipe.servings !== 1 ? "es" : ""}
          </span>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={onEdit}
          >
            Ver / editar ingredientes
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Recipe Detail Dialog ─────────────────────────────────────────────────────

function RecipeDetailDialog({
  recipeId,
  onClose,
}: {
  recipeId: Id<"recipes"> | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState("1");
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recipe = useQuery(
    api.recipes.getRecipe,
    recipeId ? { recipeId } : "skip"
  );
  const foodResults = useQuery(
    api.foods.searchFoods,
    foodSearch.trim().length >= 2 ? { query: foodSearch, limit: 10 } : "skip"
  );
  const addIngredientMutation = useMutation(api.recipes.addIngredient);
  const removeIngredientMutation = useMutation(api.recipes.removeIngredient);
  const generateUploadUrl = useMutation(api.recipes.generateUploadUrl);
  const saveRecipeImage = useMutation(api.recipes.saveRecipeImage);
  const removeRecipeImage = useMutation(api.recipes.removeRecipeImage);

  function handleClose() {
    setFoodSearch("");
    setSelectedFood(null);
    setQuantity("1");
    onClose();
  }

  async function handleImageUpload(file: File) {
    if (!recipeId) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Formato no soportado. Usa JPG, PNG o WEBP", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "La imagen no debe superar 5 MB", variant: "destructive" });
      return;
    }
    setUploadingImage(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await saveRecipeImage({ recipeId, storageId });
      toast({ title: "Imagen guardada" });
    } catch {
      toast({ title: "Error al subir imagen", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleAddIngredient() {
    if (!selectedFood || !recipeId || !recipe) return;
    setAddingIngredient(true);
    try {
      const qty = parseFloat(quantity) || 1;
      const scale = qty / selectedFood.servingAmount;
      const nextOrder = recipe.ingredients?.length ?? 0;

      await addIngredientMutation({
        recipeId,
        foodId: selectedFood._id,
        quantity: qty,
        unit: selectedFood.servingUnit,
        weightG: selectedFood.servingWeightG * scale,
        calories: selectedFood.calories * scale,
        proteinG: selectedFood.proteinG * scale,
        fatG: selectedFood.fatG * scale,
        carbsG: selectedFood.carbsG * scale,
        order: nextOrder,
      });

      setSelectedFood(null);
      setFoodSearch("");
      setQuantity("1");
      toast({ title: "Ingrediente agregado" });
    } catch {
      toast({ title: "Error al agregar ingrediente", variant: "destructive" });
    } finally {
      setAddingIngredient(false);
    }
  }

  async function handleRemoveIngredient(recipeFoodId: Id<"recipeFoods">) {
    try {
      await removeIngredientMutation({ recipeFoodId });
    } catch {
      toast({ title: "Error al eliminar ingrediente", variant: "destructive" });
    }
  }

  const previewMacros = selectedFood
    ? (() => {
        const qty = parseFloat(quantity) || 1;
        const scale = qty / selectedFood.servingAmount;
        return {
          calories: Math.round(selectedFood.calories * scale),
          proteinG: (selectedFood.proteinG * scale).toFixed(1),
          fatG: (selectedFood.fatG * scale).toFixed(1),
          carbsG: (selectedFood.carbsG * scale).toFixed(1),
        };
      })()
    : null;

  return (
    <Dialog open={!!recipeId} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe?.name ?? "Cargando..."}</DialogTitle>
        </DialogHeader>

        {!recipe ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-2">
            {/* Image upload */}
            <div className="flex items-center gap-4">
              <div
                className="w-24 h-24 rounded-xl overflow-hidden bg-[hsl(var(--muted))] flex items-center justify-center shrink-0 border border-[hsl(var(--border))] cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[hsl(var(--muted-foreground))] opacity-50" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage
                    ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {recipe.imageUrl ? "Cambiar foto" : "Subir foto"}
                </Button>
                {recipe.imageUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-600 text-xs"
                    onClick={() => removeRecipeImage({ recipeId: recipe._id })}
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Quitar foto
                  </Button>
                )}
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  JPG, PNG o WEBP · máx. 5 MB
                </p>
              </div>
            </div>

            {/* Per-serving macro summary */}
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-4 gap-2 bg-[hsl(var(--muted))] rounded-xl p-3">
                <MacroBox label="kcal" value={Math.round(recipe.caloriesPerServing)} color="text-foreground" />
                <MacroBox label="Prot (g)" value={recipe.proteinGPerServing?.toFixed(1)} color="text-blue-600" />
                <MacroBox label="Lip (g)" value={recipe.fatGPerServing?.toFixed(1)} color="text-yellow-600" />
                <MacroBox label="HC (g)" value={recipe.carbsGPerServing?.toFixed(1)} color="text-[hsl(var(--primary))]" />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                Por porción · receta para {recipe.servings} porción{recipe.servings !== 1 ? "es" : ""}
              </p>
            </div>

            {/* Ingredient list */}
            <div>
              <p className="text-sm font-semibold mb-2">
                Ingredientes ({recipe.ingredients?.length ?? 0})
              </p>
              {recipe.ingredients?.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center border rounded-lg">
                  Sin ingredientes. Busca un alimento abajo para agregar.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {recipe.ingredients?.map((ing: any) => (
                    <IngredientRow
                      key={ing._id}
                      ingredient={ing}
                      onRemove={() => handleRemoveIngredient(ing._id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Add ingredient section */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">Agregar ingrediente</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  placeholder="Buscar alimento SMAE... (mín. 2 letras)"
                  value={foodSearch}
                  onChange={(e) => {
                    setFoodSearch(e.target.value);
                    setSelectedFood(null);
                  }}
                  className="pl-9"
                />
              </div>

              {foodSearch.trim().length >= 2 && !selectedFood && (
                <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {foodResults === undefined ? (
                    <div className="flex justify-center py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : foodResults.length === 0 ? (
                    <p className="text-sm text-center py-3 text-[hsl(var(--muted-foreground))]">
                      Sin resultados
                    </p>
                  ) : (
                    foodResults.map((food: any) => (
                      <button
                        key={food._id}
                        type="button"
                        onClick={() => {
                          setSelectedFood(food);
                          setFoodSearch(food.name);
                          setQuantity(String(food.servingAmount));
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--muted))] transition-colors flex items-center justify-between gap-2 text-sm border-b last:border-0"
                      >
                        <span className="font-medium">{food.name}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">
                          {food.calories} kcal / {food.servingAmount} {food.servingUnit}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedFood && (
                <div className="flex flex-col gap-3 p-3 bg-[hsl(var(--muted))] rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{selectedFood.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {selectedFood.calories} kcal · {selectedFood.proteinG}g prot · {selectedFood.fatG}g lip · {selectedFood.carbsG}g HC por {selectedFood.servingAmount} {selectedFood.servingUnit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedFood(null); setFoodSearch(""); setQuantity("1"); }}
                      className="text-[hsl(var(--muted-foreground))] hover:text-foreground text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="w-36 space-y-1">
                      <Label className="text-xs">Cantidad ({selectedFood.servingUnit})</Label>
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    {previewMacros && (
                      <div className="flex gap-3 text-xs text-center pb-1">
                        <div>
                          <p className="font-semibold">{previewMacros.calories}</p>
                          <p className="text-[hsl(var(--muted-foreground))]">kcal</p>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-600">{previewMacros.proteinG}g</p>
                          <p className="text-[hsl(var(--muted-foreground))]">prot</p>
                        </div>
                        <div>
                          <p className="font-semibold text-yellow-600">{previewMacros.fatG}g</p>
                          <p className="text-[hsl(var(--muted-foreground))]">lip</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[hsl(var(--primary))]">{previewMacros.carbsG}g</p>
                          <p className="text-[hsl(var(--muted-foreground))]">HC</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddIngredient}
                    disabled={addingIngredient}
                    size="sm"
                    className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)] w-full"
                  >
                    {addingIngredient && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Agregar ingrediente
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Import Recipe Dialog ─────────────────────────────────────────────────────

function ImportRecipeDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: Id<"recipes">) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<"text" | "match" | "confirm">("text");

  // Step 1 state
  const [recipeName, setRecipeName] = useState("");
  const [servings, setServings] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsedLines, setParsedLines] = useState<any[]>([]);

  // Step 2 state — user selections: index → selected food or null
  const [selections, setSelections] = useState<Record<number, any>>({});
  const [customSearches, setCustomSearches] = useState<Record<number, string>>({});

  // Step 3 confirm
  const [creating, setCreating] = useState(false);

  // Query SMAE matches (only active in step 2)
  const ingredientNames = step === "match" ? parsedLines.map((p) => p.name) : [];
  const matches = useQuery(
    api.recipes.matchIngredients,
    step === "match" && ingredientNames.length > 0 ? { names: ingredientNames } : "skip"
  );

  // Individual re-search per ingredient
  const [reSearchIdx, setReSearchIdx] = useState<number | null>(null);
  const reSearchQuery = reSearchIdx !== null ? (customSearches[reSearchIdx] ?? "") : "";
  const reSearchResults = useQuery(
    api.foods.searchFoods,
    reSearchQuery.trim().length >= 2 ? { query: reSearchQuery, limit: 6 } : "skip"
  );

  const createRecipe = useMutation(api.recipes.createRecipe);
  const addIngredient = useMutation(api.recipes.addIngredient);

  function handleClose() {
    setStep("text");
    setRecipeName("");
    setServings(1);
    setInstructions("");
    setRawText("");
    setParsedLines([]);
    setSelections({});
    setCustomSearches({});
    setReSearchIdx(null);
    onClose();
  }

  function handleParse() {
    const lines = parseIngredientLines(rawText);
    if (lines.length === 0) {
      toast({ title: "No se detectaron ingredientes en el texto", variant: "destructive" });
      return;
    }
    setParsedLines(lines);
    setSelections({});
    setCustomSearches({});
    setReSearchIdx(null);
    setStep("match");
  }

  // Auto-select first match when matches load
  const prevMatchesRef = useRef<any>(null);
  if (matches && matches !== prevMatchesRef.current) {
    prevMatchesRef.current = matches;
    const auto: Record<number, any> = { ...selections };
    matches.forEach((m: any, idx: number) => {
      if (auto[idx] === undefined && m.matches.length > 0) {
        auto[idx] = m.matches[0];
      }
    });
    // Only update if there are new auto-selections
    const hasNew = Object.keys(auto).some((k) => selections[Number(k)] !== auto[Number(k)]);
    if (hasNew) setSelections(auto);
  }

  async function handleCreate() {
    if (!recipeName.trim()) return;
    setCreating(true);
    try {
      const id = await createRecipe({
        name: recipeName.trim(),
        instructions: instructions || undefined,
        servings,
        isPublic: false,
      });

      let order = 0;
      for (let i = 0; i < parsedLines.length; i++) {
        const food = selections[i];
        if (!food) continue;
        const p = parsedLines[i];

        // Compute weight in grams using unit-aware conversion
        const { weightG, scale } = computeWeightAndScale(p.quantity, p.unit, food);
        if (weightG < 0.1) continue; // skip if calculation failed

        await addIngredient({
          recipeId: id as Id<"recipes">,
          foodId: food._id,
          quantity: p.quantity,
          unit: p.unit,
          weightG,
          calories: food.calories * scale,
          proteinG: food.proteinG * scale,
          fatG: food.fatG * scale,
          carbsG: food.carbsG * scale,
          order: order++,
        });
      }

      toast({ title: "Receta importada exitosamente" });
      onCreated(id as Id<"recipes">);
    } catch {
      toast({ title: "Error al crear receta", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  const matchedCount = Object.values(selections).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar receta</DialogTitle>
        </DialogHeader>

        {step === "text" && (
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Pega el texto de tu receta. El sistema detectará los ingredientes automáticamente y los conectará con la base SMAE.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre de la receta *</Label>
                <Input
                  placeholder="Enchiladas verdes"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Porciones</Label>
                <Input
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Lista de ingredientes *</Label>
              <Textarea
                rows={8}
                placeholder={`Pega los ingredientes aquí. Ejemplos:\n2 huevos\n50 g queso panela\n1 taza arroz\n1 cdita aceite de oliva\n3 tortillas de maíz`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Soporta formato: "2 huevos", "50 g queso", "1 taza arroz", "1 cdita aceite"
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Preparación (opcional)</Label>
              <Textarea
                rows={3}
                placeholder="Pasos de preparación..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button
                onClick={handleParse}
                disabled={!recipeName.trim() || !rawText.trim()}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]"
              >
                Detectar ingredientes →
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "match" && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Se detectaron <strong>{parsedLines.length}</strong> ingredientes.
                Revisa las coincidencias con la base SMAE y ajusta si es necesario.
              </p>
              <span className="text-xs bg-[hsl(var(--muted))] px-2 py-1 rounded-full">
                {matchedCount}/{parsedLines.length} conectados
              </span>
            </div>

            {matches === undefined ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-sm text-[hsl(var(--muted-foreground))]">Buscando coincidencias SMAE...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {parsedLines.map((line, idx) => {
                  const matchData = matches[idx];
                  const selected = selections[idx];
                  const isSearching = reSearchIdx === idx;

                  return (
                    <div key={idx} className="rounded-lg border border-[hsl(var(--border))] p-3 flex flex-col gap-2">
                      {/* Header: raw text + parsed badges */}
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[hsl(var(--muted-foreground))] w-5 shrink-0 mt-0.5">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium font-mono">{line.rawText}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-1.5 py-0.5 rounded">
                              qty: {line.quantity} {line.unit}
                            </span>
                            <span className="text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-1.5 py-0.5 rounded">
                              "{line.name}"
                            </span>
                          </div>
                        </div>
                        {selected ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        )}
                      </div>

                      {/* SMAE match suggestions */}
                      <div className="pl-7">
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Vinculado SMAE:</p>
                        <div className="flex flex-wrap gap-1">
                          {matchData?.matches.map((food: any) => (
                            <button
                              key={food._id}
                              onClick={() => { setSelections({ ...selections, [idx]: food }); setReSearchIdx(null); }}
                              className={cn(
                                "text-xs px-2 py-1 rounded border transition-colors",
                                selected?._id === food._id
                                  ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                                  : "bg-[hsl(var(--surface))] hover:bg-[hsl(var(--muted))] border-[hsl(var(--border))]"
                              )}
                            >
                              {food.name}
                              <span className="ml-1 opacity-60">{Math.round(food.calories)}kcal/{food.servingAmount}{food.servingUnit}</span>
                            </button>
                          ))}
                          <button
                            onClick={() => { setReSearchIdx(isSearching ? null : idx); setCustomSearches({ ...customSearches, [idx]: "" }); }}
                            className="text-xs px-2 py-1 rounded border border-dashed border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                          >
                            {isSearching ? "Cancelar" : "Buscar otro..."}
                          </button>
                          {selected && (
                            <button
                              onClick={() => { const s = { ...selections }; delete s[idx]; setSelections(s); }}
                              className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-400"
                            >
                              Omitir
                            </button>
                          )}
                        </div>

                        {/* Custom search box */}
                        {isSearching && (
                          <div className="mt-2 flex flex-col gap-1">
                            <Input
                              autoFocus
                              placeholder="Buscar en SMAE..."
                              value={customSearches[idx] ?? ""}
                              onChange={(e) => setCustomSearches({ ...customSearches, [idx]: e.target.value })}
                              className="h-7 text-xs"
                            />
                            {reSearchResults && reSearchResults.length > 0 && (
                              <div className="border rounded overflow-hidden max-h-32 overflow-y-auto">
                                {reSearchResults.map((food: any) => (
                                  <button
                                    key={food._id}
                                    onClick={() => { setSelections({ ...selections, [idx]: food }); setReSearchIdx(null); }}
                                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-[hsl(var(--muted))] border-b last:border-0"
                                  >
                                    <span className="font-medium">{food.name}</span>
                                    <span className="ml-1 text-[hsl(var(--muted-foreground))]">
                                      {Math.round(food.calories)}kcal/{food.servingAmount}{food.servingUnit}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Computed macro preview with weight audit */}
                        {selected && (() => {
                          const { weightG, scale } = computeWeightAndScale(line.quantity, line.unit, selected);
                          const bad = weightG < 0.5;
                          return (
                            <div className={cn(
                              "mt-2 rounded px-2 py-1.5 text-xs",
                              bad ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                            )}>
                              {bad ? (
                                <span>⚠ No se pudo calcular el gramaje. Verifica la cantidad.</span>
                              ) : (
                                <span>
                                  ~{Math.round(weightG)} g →{" "}
                                  <strong>{Math.round(selected.calories * scale)} kcal</strong>{" · "}
                                  {(selected.proteinG * scale).toFixed(1)}g P{" · "}
                                  {(selected.fatG * scale).toFixed(1)}g L{" · "}
                                  {(selected.carbsG * scale).toFixed(1)}g HC
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("text")}>← Volver</Button>
              <Button
                onClick={handleCreate}
                disabled={creating || matchedCount === 0}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]"
              >
                {creating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Crear receta con {matchedCount} ingrediente{matchedCount !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MacroBox({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-sm font-bold", color)}>{value}</p>
      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{label}</p>
    </div>
  );
}

function IngredientRow({ ingredient, onRemove }: { ingredient: any; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border bg-[hsl(var(--surface))] text-sm">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {ingredient.food?.name ?? "Alimento desconocido"}
        </p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {ingredient.quantity} {ingredient.unit} ·{" "}
          {Math.round(ingredient.calories)} kcal ·{" "}
          {ingredient.proteinG.toFixed(1)}g P · {ingredient.fatG.toFixed(1)}g L · {ingredient.carbsG.toFixed(1)}g HC
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors shrink-0 p-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
