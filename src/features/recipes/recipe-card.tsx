// @ts-nocheck
"use client"

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChefHat, MoreVertical, Clock, Users, Flame, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RecipeForm } from "./recipe-form";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: {
    _id: Id<"recipes">;
    name: string;
    description?: string;
    servings: number;
    prepTimeMin?: number;
    cookTimeMin?: number;
    caloriesPerServing: number;
    proteinGPerServing: number;
    fatGPerServing: number;
    carbsGPerServing: number;
    tags?: string[];
    isPublic: boolean;
  };
  onSelect?: (id: Id<"recipes">) => void;
}

export function RecipeCard({ recipe, onSelect }: RecipeCardProps) {
  const { toast } = useToast();
  const deleteRecipe = useMutation(api.recipes.deleteRecipe);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar receta "${recipe.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteRecipe({ id: recipe._id });
      toast({ title: "Receta eliminada" });
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  const totalTime = (recipe.prepTimeMin || 0) + (recipe.cookTimeMin || 0);

  return (
    <>
      <Card
        className={cn(
          "group hover:shadow-md transition-shadow cursor-pointer",
          onSelect && "hover:border-[hsl(var(--primary))]"
        )}
        onClick={() => onSelect?.(recipe._id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "hsl(var(--secondary))" }}
              >
                <ChefHat className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <CardTitle className="text-sm font-semibold truncate">{recipe.name}</CardTitle>
            </div>
            {!onSelect && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="w-4 h-4 mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-[hsl(var(--destructive))]"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {recipe.description && (
            <p className="text-xs line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              {recipe.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {recipe.servings} porc.
            </span>
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {totalTime} min
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1 pt-1">
            <div className="text-center">
              <div className="font-semibold text-sm flex items-center justify-center gap-0.5">
                <Flame className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                {Math.round(recipe.caloriesPerServing)}
              </div>
              <div className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>kcal</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm text-[#0C5E8A] dark:text-[#5D9CBD]">{recipe.proteinGPerServing.toFixed(1)}g</div>
              <div className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>prot</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm text-[#7a5c28] dark:text-[#DAC297]">{recipe.fatGPerServing.toFixed(1)}g</div>
              <div className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>gras</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm text-[#798C5E] dark:text-[#B0C09A]">{recipe.carbsGPerServing.toFixed(1)}g</div>
              <div className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>carbs</div>
            </div>
          </div>

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RecipeForm
        recipeId={recipe._id}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
