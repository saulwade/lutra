// @ts-nocheck
"use client"

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { patientSchema, type PatientFormData } from "@/lib/schemas";
import { calculateBMI, getBMICategory, ACTIVITY_LABELS, GOAL_LABELS } from "@/lib/nutrition-calculator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Edit } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PatientFormProps {
  patientId?: Id<"patients">;
  onSuccess?: (id: Id<"patients">) => void;
  trigger?: React.ReactNode;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[hsl(var(--foreground))]">
        {label}
        {required && <span className="ml-0.5 text-[hsl(var(--destructive))]">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-[hsl(var(--destructive))]">{error}</p>}
    </div>
  );
}

// ─── BMI Preview ──────────────────────────────────────────────────────────────

function BMIPreview({ weight, height }: { weight: number; height: number }) {
  if (!weight || !height || weight <= 0 || height <= 0) return null;
  const bmi = calculateBMI(weight, height);
  const { label, color } = getBMICategory(bmi);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-sm">
      <span className="text-[hsl(var(--muted-foreground))]">IMC:</span>
      <span className="font-semibold">{bmi}</span>
      <Badge
        variant="outline"
        className={cn("text-xs", color)}
      >
        {label}
      </Badge>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PatientForm({ patientId, onSuccess, trigger }: PatientFormProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const isEditMode = Boolean(patientId);

  const existingPatient = useQuery(
    api.patients.getPatient,
    patientId && open ? { patientId } : "skip"
  );

  const createPatient = useMutation(api.patients.createPatient);
  const updatePatient = useMutation(api.patients.updatePatient);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      activityLevel: "moderate",
      goal: "maintenance",
      sex: "female",
    },
  });

  // Populate form when editing
  React.useEffect(() => {
    if (existingPatient && isEditMode) {
      reset({
        name: existingPatient.name,
        email: existingPatient.email ?? "",
        phone: existingPatient.phone ?? "",
        birthDate: existingPatient.birthDate ?? "",
        age: existingPatient.age,
        sex: existingPatient.sex,
        heightCm: existingPatient.heightCm,
        weightKg: existingPatient.weightKg,
        waistCm: existingPatient.waistCm,
        hipCm: existingPatient.hipCm,
        neckCm: existingPatient.neckCm,
        bodyFatPct: existingPatient.bodyFatPct,
        muscleMassKg: existingPatient.muscleMassKg,
        activityLevel: existingPatient.activityLevel,
        goal: existingPatient.goal,
        notes: existingPatient.notes ?? "",
      });
    }
  }, [existingPatient, isEditMode, reset]);

  const watchedWeight = watch("weightKg");
  const watchedHeight = watch("heightCm");

  const onSubmit = async (data: PatientFormData) => {
    try {
      // Strip empty strings for optional fields
      const clean = {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        birthDate: data.birthDate || undefined,
        notes: data.notes || undefined,
      };

      if (isEditMode && patientId) {
        await updatePatient({ patientId, ...clean });
        toast({ title: "Paciente actualizado", description: `${data.name} ha sido actualizado.` });
        onSuccess?.(patientId);
      } else {
        const id = await createPatient(clean as Parameters<typeof createPatient>[0]);
        toast({ title: "Paciente creado", description: `${data.name} ha sido registrado.` });
        onSuccess?.(id);
        reset();
      }
      setOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    }
  };

  const defaultTrigger = isEditMode ? (
    <Button variant="outline" size="sm">
      <Edit className="mr-1.5 h-3.5 w-3.5" />
      Editar
    </Button>
  ) : (
    <Button>
      <UserPlus className="mr-2 h-4 w-4" />
      Nuevo Paciente
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditMode ? "Editar Paciente" : "Nuevo Paciente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ── Section 1: Personal Data ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Datos Personales
              </span>
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nombre completo" error={errors.name?.message} required>
                  <Input
                    {...register("name")}
                    placeholder="Ej. María García López"
                    className={cn(errors.name && "border-[hsl(var(--destructive))]")}
                  />
                </Field>
              </div>

              <Field label="Correo electrónico" error={errors.email?.message}>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="correo@ejemplo.com"
                />
              </Field>

              <Field label="Teléfono" error={errors.phone?.message}>
                <Input
                  {...register("phone")}
                  type="tel"
                  placeholder="+52 55 1234 5678"
                />
              </Field>

              <Field label="Sexo" error={errors.sex?.message} required>
                <Select
                  defaultValue="female"
                  onValueChange={(v) =>
                    setValue("sex", v as "male" | "female", { shouldValidate: true })
                  }
                  value={watch("sex")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Edad (años)" error={errors.age?.message}>
                <Input
                  {...register("age", { valueAsNumber: true })}
                  type="number"
                  placeholder="30"
                  min={1}
                  max={120}
                />
              </Field>

              <Field
                label="Nivel de actividad"
                error={errors.activityLevel?.message}
                required
              >
                <Select
                  defaultValue="moderate"
                  onValueChange={(v) =>
                    setValue(
                      "activityLevel",
                      v as PatientFormData["activityLevel"],
                      { shouldValidate: true }
                    )
                  }
                  value={watch("activityLevel")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(ACTIVITY_LABELS) as [
                        PatientFormData["activityLevel"],
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Objetivo" error={errors.goal?.message} required>
                <Select
                  defaultValue="maintenance"
                  onValueChange={(v) =>
                    setValue("goal", v as PatientFormData["goal"], { shouldValidate: true })
                  }
                  value={watch("goal")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(GOAL_LABELS) as [PatientFormData["goal"], string][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <Separator />

          {/* ── Section 2: Anthropometrics ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Datos Antropométricos
              </span>
              <div className="h-px flex-1 bg-[hsl(var(--border))]" />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Estatura (cm)" error={errors.heightCm?.message} required>
                <Input
                  {...register("heightCm", { valueAsNumber: true })}
                  type="number"
                  placeholder="165"
                  min={50}
                  max={250}
                  className={cn(errors.heightCm && "border-[hsl(var(--destructive))]")}
                />
              </Field>

              <Field label="Peso (kg)" error={errors.weightKg?.message} required>
                <Input
                  {...register("weightKg", { valueAsNumber: true })}
                  type="number"
                  placeholder="65"
                  step={0.1}
                  min={1}
                  max={500}
                  className={cn(errors.weightKg && "border-[hsl(var(--destructive))]")}
                />
              </Field>

              <div className="flex items-end">
                <BMIPreview weight={watchedWeight} height={watchedHeight} />
              </div>

              <Field label="Cintura (cm)" error={errors.waistCm?.message}>
                <Input
                  {...register("waistCm", { valueAsNumber: true })}
                  type="number"
                  placeholder="80"
                />
              </Field>

              <Field label="Cadera (cm)" error={errors.hipCm?.message}>
                <Input
                  {...register("hipCm", { valueAsNumber: true })}
                  type="number"
                  placeholder="95"
                />
              </Field>

              <Field label="Cuello (cm)" error={errors.neckCm?.message}>
                <Input
                  {...register("neckCm", { valueAsNumber: true })}
                  type="number"
                  placeholder="36"
                />
              </Field>

              <Field label="% Grasa corporal" error={errors.bodyFatPct?.message}>
                <Input
                  {...register("bodyFatPct", { valueAsNumber: true })}
                  type="number"
                  placeholder="25"
                  step={0.1}
                />
              </Field>

              <Field label="Masa muscular (kg)" error={errors.muscleMassKg?.message}>
                <Input
                  {...register("muscleMassKg", { valueAsNumber: true })}
                  type="number"
                  placeholder="30"
                  step={0.1}
                />
              </Field>
            </div>

            <Field label="Notas clínicas" error={errors.notes?.message}>
              <Textarea
                {...register("notes")}
                placeholder="Alergias, condiciones médicas, observaciones relevantes..."
                rows={3}
                className="resize-none"
              />
            </Field>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Guardar cambios" : "Crear paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
