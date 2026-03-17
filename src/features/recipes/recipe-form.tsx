// @ts-nocheck
"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { recipeSchema, type RecipeFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipeFormProps {
  recipeId?: Id<"recipes">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (id: Id<"recipes">) => void;
}

export function RecipeForm({ recipeId, open, onOpenChange, onSuccess }: RecipeFormProps) {
  const { toast } = useToast();
  const createRecipe = useMutation(api.recipes.createRecipe);
  const updateRecipe = useMutation(api.recipes.updateRecipe);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { servings: 1, isPublic: false },
  });

  async function onSubmit(data: RecipeFormData) {
    setIsSubmitting(true);
    try {
      if (recipeId) {
        await updateRecipe({ id: recipeId, ...data });
        toast({ title: "Receta actualizada" });
        onSuccess?.(recipeId);
      } else {
        const id = await createRecipe(data);
        toast({ title: "Receta creada" });
        reset();
        onSuccess?.(id);
      }
      onOpenChange(false);
    } catch {
      toast({ title: "Error al guardar receta", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            {recipeId ? "Editar receta" : "Nueva receta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de la receta *</Label>
            <Input id="name" {...register("name")} placeholder="Ej. Ensalada de atún" className="mt-1" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register("description")} rows={2} placeholder="Descripción corta..." className="mt-1" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="servings" className="flex items-center gap-1">
                <Users className="w-3 h-3" /> Porciones
              </Label>
              <Input
                id="servings"
                type="number"
                min={1}
                {...register("servings", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="prepTimeMin" className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Prep (min)
              </Label>
              <Input
                id="prepTimeMin"
                type="number"
                min={0}
                {...register("prepTimeMin", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cookTimeMin" className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Cocción (min)
              </Label>
              <Input
                id="cookTimeMin"
                type="number"
                min={0}
                {...register("cookTimeMin", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instrucciones</Label>
            <Textarea id="instructions" {...register("instructions")} rows={4} placeholder="Paso a paso..." className="mt-1" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : recipeId ? "Actualizar" : "Crear receta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
