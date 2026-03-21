// @ts-nocheck
"use client"

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { calculateBMI, getBMICategory, GOAL_LABELS } from "@/lib/nutrition-calculator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PatientForm } from "./patient-form";
import { MoreHorizontal, Pencil, Trash2, ChevronRight } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PatientCardData {
  _id: Id<"patients">;
  name: string;
  sex: "male" | "female";
  age?: number;
  heightCm: number;
  weightKg: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "weight_loss" | "maintenance" | "weight_gain" | "muscle_gain" | "health";
  createdAt: number;
  email?: string;
}

interface PatientCardProps {
  patient: PatientCardData;
  onDeleted?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const GOAL_BADGE_STYLES: Record<PatientCardData["goal"], string> = {
  weight_loss:
    "bg-[#0C5E8A]/10 text-[#0C5E8A] border-[#0C5E8A]/20 dark:bg-[#0C5E8A]/15 dark:text-[#5D9CBD]",
  maintenance:
    "bg-[#798C5E]/10 text-[#3d4e2c] border-[#798C5E]/20 dark:bg-[#798C5E]/15 dark:text-[#B0C09A]",
  weight_gain:
    "bg-[#DAC297]/30 text-[#7a5c28] border-[#DAC297]/40 dark:bg-[#DAC297]/12 dark:text-[#DAC297]",
  muscle_gain:
    "bg-[#5D9CBD]/15 text-[#0C5E8A] border-[#5D9CBD]/20 dark:bg-[#5D9CBD]/15 dark:text-[#5D9CBD]",
  health:
    "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]",
};

const SEX_AVATAR_COLORS: Record<PatientCardData["sex"], string> = {
  female: "bg-[#5D9CBD]/15 text-[#0C5E8A] dark:bg-[#5D9CBD]/20 dark:text-[#5D9CBD]",
  male:   "bg-[#0C5E8A]/10 text-[#0C5E8A] dark:bg-[#0C5E8A]/15 dark:text-[#5D9CBD]",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PatientCard({ patient, onDeleted }: PatientCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const deletePatient = useMutation(api.patients.deletePatient);
  const [deleting, setDeleting] = React.useState(false);

  const bmi = calculateBMI(patient.weightKg, patient.heightCm);
  const { label: bmiLabel, color: bmiColor } = getBMICategory(bmi);
  const goalLabel = GOAL_LABELS[patient.goal];
  const initials = getInitials(patient.name);

  const handleNavigate = () => {
    router.push(`/patients/${patient._id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar a ${patient.name}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await deletePatient({ patientId: patient._id });
      toast({ title: "Paciente eliminado", description: `${patient.name} ha sido eliminado.` });
      onDeleted?.();
    } catch {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el paciente.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all duration-150",
        "hover:shadow-md hover:border-[hsl(var(--primary))]/40",
        deleting && "opacity-50 pointer-events-none"
      )}
      onClick={handleNavigate}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar className={cn("h-11 w-11 shrink-0 text-sm font-semibold", SEX_AVATAR_COLORS[patient.sex])}>
            <AvatarFallback className={cn("text-sm font-semibold", SEX_AVATAR_COLORS[patient.sex])}>
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Main info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-[hsl(var(--foreground))]">
                {patient.name}
              </p>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              {patient.age && (
                <span>{patient.age} años</span>
              )}
              <span>{patient.sex === "female" ? "Femenino" : "Masculino"}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                {patient.weightKg} kg · {patient.heightCm} cm
              </span>
            </div>
          </div>

          {/* BMI */}
          <div className="hidden shrink-0 text-center sm:block">
            <p className="text-lg font-bold leading-none text-[hsl(var(--foreground))]">
              {bmi}
            </p>
            <p className={cn("mt-0.5 text-xs font-medium", bmiColor)}>
              {bmiLabel}
            </p>
          </div>

          {/* Goal badge */}
          <div className="hidden shrink-0 md:block">
            <Badge
              variant="outline"
              className={cn("text-xs font-medium", GOAL_BADGE_STYLES[patient.goal])}
            >
              {goalLabel}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1 pl-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Opciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <PatientForm
                  patientId={patient._id}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-[hsl(var(--destructive))] focus:text-[hsl(var(--destructive))]"
                  onSelect={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>

        {/* Mobile extras */}
        <div className="mt-2 flex items-center gap-2 sm:hidden">
          <span className={cn("text-xs font-semibold", bmiColor)}>
            IMC {bmi} · {bmiLabel}
          </span>
          <Badge
            variant="outline"
            className={cn("ml-auto text-xs", GOAL_BADGE_STYLES[patient.goal])}
          >
            {goalLabel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
