// @ts-nocheck
"use client"

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import {
  ArrowLeft,
  Plus,
  Utensils,
  Calendar,
  Target,
  Trash2,
  Search,
  X,
  Loader2,
  Download,
  ChefHat,
  LayoutTemplate,
  AlertTriangle,
  CheckCircle2,
  Archive,
  FileEdit,
  ListChecks,
  StickyNote,
  Sun,
  Coffee,
  Moon,
  Apple,
  History,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  active:   "bg-[hsl(var(--accent))] text-[hsl(var(--primary))] border border-[hsl(var(--border))]",
  draft:    "bg-[hsl(var(--warm-cream))] text-[hsl(var(--terracotta))] border border-[hsl(var(--border))]",
  archived: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  draft: "Borrador",
  archived: "Archivado",
};

const MEAL_COLORS: Record<string, string> = {
  Desayuno:      "bg-[hsl(var(--warm-cream))] border-[hsl(var(--border))]",
  "Colación AM": "bg-[hsl(var(--accent))] border-[hsl(var(--border))]",
  Comida:        "bg-[hsl(var(--surface))] border-[hsl(var(--border))]",
  "Colación PM": "bg-[hsl(var(--muted))] border-[hsl(var(--border))]",
  Cena:          "bg-[hsl(var(--warm-cream))] border-[hsl(var(--border))]",
};

const PRESET_MEALS = ["Desayuno", "Colación AM", "Comida", "Colación PM", "Cena"];

// Distribution % defaults per group: [Desayuno, Col.AM, Comida, Col.PM, Cena]
const DIST_PCT: Record<string, number[]> = {
  verduras:    [0.10, 0.00, 0.60, 0.00, 0.30],
  frutas:      [0.30, 0.25, 0.10, 0.25, 0.10],
  cereales:    [0.25, 0.10, 0.35, 0.10, 0.20],
  aoa:         [0.20, 0.00, 0.50, 0.05, 0.25],
  leche:       [0.50, 0.25, 0.00, 0.25, 0.00],
  grasas:      [0.25, 0.10, 0.40, 0.05, 0.20],
  leguminosas: [0.00, 0.00, 0.70, 0.00, 0.30],
  azucares:    [0.30, 0.20, 0.20, 0.15, 0.15],
};

const DIST_GROUPS: { key: string; label: string; smaeKeys: string[] }[] = [
  { key: "verduras",    label: "Verduras",    smaeKeys: ["verduras"] },
  { key: "frutas",      label: "Frutas",      smaeKeys: ["frutas"] },
  { key: "cereales",    label: "Cereales",    smaeKeys: ["cerealesSinGrasa", "cerealesConGrasa"] },
  { key: "aoa",         label: "AOA",         smaeKeys: ["aoaMuyBajaGrasa", "aoaBajaGrasa", "aoaMedGrasa", "aoaAltaGrasa"] },
  { key: "leche",       label: "Leche",       smaeKeys: ["lecheDes", "lecheSemi", "lecheEntera", "lecheConAzucar"] },
  { key: "grasas",      label: "Grasas",      smaeKeys: ["grasasSinProt", "grasasConProt"] },
  { key: "leguminosas", label: "Leguminosas", smaeKeys: ["leguminosas"] },
  { key: "azucares",    label: "Azúcares",    smaeKeys: ["azucaresSinGrasa", "azucaresConGrasa"] },
];

const MEAL_NAMES_SHORT = ["Des.", "Col.AM", "Comida", "Col.PM", "Cena"];

const SMAE_META: Record<string, { label: string; kcal: number; p: number; l: number; hc: number }> = {
  verduras:         { label: "Verduras",              kcal: 25,  p: 2, l: 0, hc: 4  },
  frutas:           { label: "Frutas",                kcal: 60,  p: 0, l: 0, hc: 15 },
  cerealesSinGrasa: { label: "Cereales sin grasa",    kcal: 70,  p: 2, l: 0, hc: 15 },
  cerealesConGrasa: { label: "Cereales con grasa",    kcal: 115, p: 2, l: 4, hc: 15 },
  leguminosas:      { label: "Leguminosas",           kcal: 120, p: 8, l: 1, hc: 20 },
  aoaMuyBajaGrasa:  { label: "AOA muy baja grasa",    kcal: 40,  p: 7, l: 1, hc: 0  },
  aoaBajaGrasa:     { label: "AOA baja grasa",        kcal: 55,  p: 7, l: 3, hc: 0  },
  aoaMedGrasa:      { label: "AOA mediana grasa",     kcal: 75,  p: 7, l: 5, hc: 0  },
  aoaAltaGrasa:     { label: "AOA alta grasa",        kcal: 100, p: 7, l: 8, hc: 0  },
  lecheDes:         { label: "Leche descremada",      kcal: 95,  p: 9, l: 2, hc: 12 },
  lecheSemi:        { label: "Leche semidescremada",  kcal: 110, p: 9, l: 4, hc: 12 },
  lecheEntera:      { label: "Leche entera",          kcal: 150, p: 9, l: 8, hc: 12 },
  lecheConAzucar:   { label: "Leche con azúcar",      kcal: 200, p: 8, l: 5, hc: 30 },
  grasasSinProt:    { label: "Grasas sin proteína",   kcal: 45,  p: 0, l: 5, hc: 0  },
  grasasConProt:    { label: "Grasas con proteína",   kcal: 70,  p: 3, l: 5, hc: 3  },
  azucaresSinGrasa: { label: "Azúcares sin grasa",    kcal: 40,  p: 0, l: 0, hc: 10 },
  azucaresConGrasa: { label: "Azúcares con grasa",    kcal: 85,  p: 0, l: 4, hc: 10 },
};

// Meal-time icon map
const MEAL_ICONS: Record<string, { icon: any; accent: string; bg: string }> = {
  "Desayuno":    { icon: Sun,      accent: "#d97706", bg: "#fef9c3" },
  "Colación AM": { icon: Coffee,   accent: "#16a34a", bg: "#dcfce7" },
  "Comida":      { icon: Utensils, accent: "#2563eb", bg: "#dbeafe" },
  "Colación PM": { icon: Apple,    accent: "#ea580c", bg: "#ffedd5" },
  "Cena":        { icon: Moon,     accent: "#7c3aed", bg: "#ede9fe" },
};

// SMAE group dot colors (matching calc/page.tsx SMAE colors)
const GROUP_DOT: Record<string, string> = {
  verduras:         "#4ade80",
  frutas:           "#fb923c",
  cerealesSinGrasa: "#facc15",
  cerealesConGrasa: "#a16207",
  leguminosas:      "#92400e",
  aoaMuyBajaGrasa:  "#93c5fd",
  aoaBajaGrasa:     "#3b82f6",
  aoaMedGrasa:      "#1d4ed8",
  aoaAltaGrasa:     "#1e3a8a",
  lecheDes:         "#bae6fd",
  lecheSemi:        "#38bdf8",
  lecheEntera:      "#0369a1",
  lecheConAzucar:   "#0891b2",
  grasasSinProt:    "#fbbf24",
  grasasConProt:    "#d97706",
  azucaresSinGrasa: "#fb7185",
  azucaresConGrasa: "#e11d48",
};

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const planId = id as Id<"plans">;
  const { toast } = useToast();
  const router = useRouter();

  const [addFoodMealId, setAddFoodMealId] = useState<string | null>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [customMealName, setCustomMealName] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [notesValue, setNotesValue] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [equivEdits, setEquivEdits] = useState<Record<string, number> | null>(null);
  const [savingEquivs, setSavingEquivs] = useState(false);
  const [distEdits, setDistEdits] = useState<Record<string, number[]> | null>(null);
  const [savingDist, setSavingDist] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const [showVersionForm, setShowVersionForm] = useState(false);

  const plan = useQuery(api.plans.getPlan, { planId });
  const nutritionist = useQuery(api.nutritionists.getCurrentNutritionist);
  const planVersions = useQuery(api.planVersions.getByPlan, { planId });
  const saveVersion = useMutation(api.planVersions.save);
  const deleteVersion = useMutation(api.planVersions.remove);
  const createMeal = useMutation(api.meals.createMeal);
  const deleteMealMutation = useMutation(api.meals.deleteMeal);
  const addFoodToMeal = useMutation(api.meals.addFoodToMeal);
  const removeFoodFromMeal = useMutation(api.meals.removeFoodFromMeal);
  const saveAsTemplateMutation = useMutation(api.plans.saveAsTemplate);
  const deletePlanMutation = useMutation(api.plans.deletePlan);
  const updatePlanMutation = useMutation(api.plans.updatePlan);

  // Patient pathologies (for glycemic control flag, etc.)
  const patientPathologies = useQuery(
    api.patientPathologies.getByPatient,
    plan?.patientId ? { patientId: plan.patientId } : "skip"
  );

  async function handleAddMeal(name: string) {
    if (!name.trim()) return;
    try {
      const nextOrder = (plan?.meals?.length ?? 0);
      await createMeal({ planId, name: name.trim(), order: nextOrder });
      setShowAddMeal(false);
      setCustomMealName("");
    } catch {
      toast({ title: "Error al agregar tiempo de comida", variant: "destructive" });
    }
  }

  async function handleDeleteMeal(mealId: string) {
    try {
      await deleteMealMutation({ mealId: mealId as Id<"meals"> });
      if (addFoodMealId === mealId) setAddFoodMealId(null);
    } catch {
      toast({ title: "Error al eliminar tiempo de comida", variant: "destructive" });
    }
  }

  async function handleAddFood(mealId: string, food: any, qty: number) {
    try {
      const scale = qty / food.servingAmount;
      await addFoodToMeal({
        mealId: mealId as Id<"meals">,
        planId: planId,
        foodId: food._id,
        name: food.name,
        quantity: qty,
        unit: food.servingUnit,
        weightG: (food.servingWeightG ?? food.servingAmount) * scale,
        smaeCategory: food.category,
        calories: food.calories * scale,
        proteinG: food.proteinG * scale,
        fatG: food.fatG * scale,
        carbsG: food.carbsG * scale,
        order: 0,
      });
      toast({ title: `${food.name} agregado` });
    } catch {
      toast({ title: "Error al agregar alimento", variant: "destructive" });
    }
  }

  async function handleRemoveFood(mealFoodId: string) {
    try {
      await removeFoodFromMeal({ mealFoodId: mealFoodId as Id<"mealFoods"> });
    } catch {
      toast({ title: "Error al eliminar alimento", variant: "destructive" });
    }
  }

  async function handleAddRecipe(mealId: string, recipe: any, servings: number) {
    try {
      await addFoodToMeal({
        mealId: mealId as Id<"meals">,
        planId: planId,
        recipeId: recipe._id,
        name: `${recipe.name} (${servings} porc.)`,
        quantity: servings,
        unit: "porción",
        weightG: 0,
        calories: recipe.caloriesPerServing * servings,
        proteinG: recipe.proteinGPerServing * servings,
        fatG: recipe.fatGPerServing * servings,
        carbsG: recipe.carbsGPerServing * servings,
        order: 0,
      });
      toast({ title: `${recipe.name} agregado` });
    } catch {
      toast({ title: "Error al agregar receta", variant: "destructive" });
    }
  }

  async function handleSaveAsTemplate() {
    setSavingTemplate(true);
    try {
      await saveAsTemplateMutation({ planId });
      toast({ title: "Plantilla guardada", description: "Disponible al crear nuevos planes" });
    } catch {
      toast({ title: "Error al guardar plantilla", variant: "destructive" });
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeletePlan() {
    setDeleting(true);
    try {
      await deletePlanMutation({ planId });
      toast({ title: "Plan eliminado" });
      router.push("/plans");
    } catch {
      toast({ title: "Error al eliminar plan", variant: "destructive" });
      setDeleting(false);
    }
  }

  async function handleSaveVersion() {
    if (!plan) return;
    setSavingVersion(true);
    try {
      const allF = plan.meals?.flatMap((m: any) => m.foods ?? []) ?? [];
      await saveVersion({
        planId,
        patientId: plan.patientId ?? undefined,
        date: new Date().toISOString().slice(0, 10),
        label: versionLabel.trim() || undefined,
        targetCalories: plan.targetCalories,
        targetProteinG: plan.targetProteinG,
        targetFatG: plan.targetFatG,
        targetCarbsG: plan.targetCarbsG,
        equivalentsSnapshot: plan.equivalentsPerDay ?? undefined,
        distributionSnapshot: plan.distributionPerMeal ?? undefined,
        actualCalories: allF.reduce((s: number, f: any) => s + (f.calories ?? 0), 0),
        actualProteinG: allF.reduce((s: number, f: any) => s + (f.proteinG ?? 0), 0),
        actualFatG: allF.reduce((s: number, f: any) => s + (f.fatG ?? 0), 0),
        actualCarbsG: allF.reduce((s: number, f: any) => s + (f.carbsG ?? 0), 0),
      });
      toast({ title: "Versión guardada" });
      setVersionLabel("");
      setShowVersionForm(false);
    } catch {
      toast({ title: "Error al guardar versión", variant: "destructive" });
    } finally {
      setSavingVersion(false);
    }
  }

  async function handleChangeStatus(status: "draft" | "active" | "archived") {
    setChangingStatus(true);
    try {
      await updatePlanMutation({ planId, status });
    } catch {
      toast({ title: "Error al cambiar estado", variant: "destructive" });
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleSaveNotes() {
    if (notesValue === null) return;
    setSavingNotes(true);
    try {
      await updatePlanMutation({ planId, description: notesValue });
      toast({ title: "Notas guardadas" });
    } catch {
      toast({ title: "Error al guardar notas", variant: "destructive" });
    } finally {
      setSavingNotes(false);
    }
  }

  function getEquivs() {
    if (equivEdits) return equivEdits;
    // Initialize from plan or zeroes
    const base: Record<string, number> = {};
    for (const key of Object.keys(SMAE_META)) {
      base[key] = (plan?.equivalentsPerDay as any)?.[key] ?? 0;
    }
    return base;
  }

  function changeEquiv(key: string, delta: number) {
    const current = getEquivs();
    const next = Math.max(0, Math.round((current[key] + delta) * 2) / 2);
    setEquivEdits({ ...current, [key]: next });
  }

  async function handleSaveEquivs() {
    if (!equivEdits) return;
    setSavingEquivs(true);
    try {
      await updatePlanMutation({ planId, equivalentsPerDay: equivEdits as any });
      toast({ title: "Equivalentes guardados" });
      setEquivEdits(null); // reset dirty state; plan will reload from Convex
    } catch {
      toast({ title: "Error al guardar equivalentes", variant: "destructive" });
    } finally {
      setSavingEquivs(false);
    }
  }

  function getGroupTotal(smaeKeys: string[], equivs: Record<string, number>) {
    return smaeKeys.reduce((s, k) => s + (equivs[k] ?? 0), 0);
  }

  function getDist(): Record<string, number[]> {
    if (distEdits) return distEdits;
    // If plan has saved distribution, use that
    if (plan?.distributionPerMeal) return plan.distributionPerMeal as Record<string, number[]>;
    // Auto-compute from DIST_PCT × group totals
    const equivs = getEquivs();
    const result: Record<string, number[]> = {};
    for (const grp of DIST_GROUPS) {
      const total = getGroupTotal(grp.smaeKeys, equivs);
      result[grp.key] = DIST_PCT[grp.key].map(pct => Math.round(total * pct * 2) / 2);
    }
    return result;
  }

  function changeDist(groupKey: string, mealIdx: number, delta: number) {
    const current = getDist();
    const arr = [...(current[groupKey] ?? [0, 0, 0, 0, 0])];
    arr[mealIdx] = Math.max(0, Math.round((arr[mealIdx] + delta) * 2) / 2);
    setDistEdits({ ...current, [groupKey]: arr });
  }

  async function handleSaveDist() {
    if (!distEdits) return;
    setSavingDist(true);
    try {
      await updatePlanMutation({ planId, distributionPerMeal: distEdits as any });
      toast({ title: "Distribución guardada" });
      setDistEdits(null);
    } catch {
      toast({ title: "Error al guardar distribución", variant: "destructive" });
    } finally {
      setSavingDist(false);
    }
  }

  async function handleDownloadPDF() {
    if (!plan || !nutritionist) return;
    setDownloadingPdf(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { PlanPDFDocument } = await import("@/features/plans/plan-pdf");
      const patient = plan.patient ?? {
        name: "Paciente",
        sex: "female",
        weightKg: 0,
        heightCm: 0,
        goal: "maintenance",
      };
      const blob = await pdf(
        <PlanPDFDocument
          plan={{
            ...plan,
            equivalentsPerDay: plan.equivalentsPerDay ?? undefined,
            distributionPerMeal: (plan.distributionPerMeal as any) ?? undefined,
            description: plan.description ?? undefined,
          }}
          patient={patient}
          nutritionist={nutritionist}
          meals={(plan.meals ?? []).map((m: any) => ({
            ...m,
            foods: m.foods ?? [],
          }))}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${plan.title.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Error al generar PDF", variant: "destructive" });
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (plan === undefined) return <PlanDetailSkeleton />;

  if (plan === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-[hsl(var(--muted-foreground))]">Plan no encontrado</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/plans">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>
    );
  }

  const allFoods = plan.meals?.flatMap((m: any) => m.foods ?? []) ?? [];
  const actualCalories = allFoods.reduce((s: number, f: any) => s + (f.calories ?? 0), 0);
  const actualProtein = allFoods.reduce((s: number, f: any) => s + (f.proteinG ?? 0), 0);
  const actualFat = allFoods.reduce((s: number, f: any) => s + (f.fatG ?? 0), 0);
  const actualCarbs = allFoods.reduce((s: number, f: any) => s + (f.carbsG ?? 0), 0);

  const calPct = Math.min(100, plan.targetCalories > 0 ? (actualCalories / plan.targetCalories) * 100 : 0);
  const protPct = Math.min(100, plan.targetProteinG > 0 ? (actualProtein / plan.targetProteinG) * 100 : 0);
  const fatPct = Math.min(100, plan.targetFatG > 0 ? (actualFat / plan.targetFatG) * 100 : 0);
  const carbsPct = Math.min(100, plan.targetCarbsG > 0 ? (actualCarbs / plan.targetCarbsG) * 100 : 0);

  const existingMealNames = new Set(plan.meals?.map((m: any) => m.name) ?? []);
  const availablePresets = PRESET_MEALS.filter((p) => !existingMealNames.has(p));

  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 text-[hsl(var(--muted-foreground))]">
        <Link href="/plans">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Planes
        </Link>
      </Button>

      {/* Plan header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{plan.title}</h1>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                STATUS_STYLES[plan.status] ?? "bg-gray-100 text-gray-600"
              )}
            >
              {STATUS_LABELS[plan.status] ?? plan.status}
            </span>
          </div>
          {/* Quick status change */}
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))] mr-1">Estado:</span>
            {plan.status !== "draft" && (
              <button
                onClick={() => handleChangeStatus("draft")}
                disabled={changingStatus}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-[hsl(var(--border))] hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700 transition-colors"
              >
                <FileEdit className="w-3 h-3" />
                Borrador
              </button>
            )}
            {plan.status !== "active" && (
              <button
                onClick={() => handleChangeStatus("active")}
                disabled={changingStatus}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-[hsl(var(--border))] hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                Activar
              </button>
            )}
            {plan.status !== "archived" && (
              <button
                onClick={() => handleChangeStatus("archived")}
                disabled={changingStatus}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-[hsl(var(--border))] hover:bg-gray-100 hover:border-gray-300 hover:text-gray-600 transition-colors"
              >
                <Archive className="w-3 h-3" />
                Archivar
              </button>
            )}
          </div>
          {plan.description && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {plan.description}
            </p>
          )}
          {(plan.startDate || plan.endDate) && (
            <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] mt-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {plan.startDate}
              {plan.endDate ? ` → ${plan.endDate}` : ""}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72] flex-1 sm:flex-none"
          >
            {downloadingPdf
              ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              : <Download className="w-4 h-4 mr-1.5" />}
            Descargar PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveAsTemplate}
            disabled={savingTemplate}
            className="flex-1 sm:flex-none"
          >
            {savingTemplate
              ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              : <LayoutTemplate className="w-4 h-4 mr-1.5" />}
            Plantilla
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Eliminar plan
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              ¿Estás seguro de que quieres eliminar <strong>{plan.title}</strong>? Esta acción no se puede deshacer y se borrarán todos los tiempos de comida y alimentos del plan.
            </p>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePlan}
                disabled={deleting}
              >
                {deleting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Eliminar plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Nutritional targets */}
      <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-[hsl(var(--primary))]" />
          <h2 className="text-sm font-semibold">Distribución Nutricional</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <NutrientBar label="Calorías" actual={Math.round(actualCalories)} target={plan.targetCalories} unit="kcal" pct={calPct} />
          <NutrientBar label="Proteínas" actual={Math.round(actualProtein)} target={plan.targetProteinG} unit="g" pct={protPct} />
          <NutrientBar label="Lípidos" actual={Math.round(actualFat)} target={plan.targetFatG} unit="g" pct={fatPct} />
          <NutrientBar label="Hidratos de C." actual={Math.round(actualCarbs)} target={plan.targetCarbsG} unit="g" pct={carbsPct} />
        </div>
        <Separator className="my-4" />
        <div className="flex items-center gap-6 text-xs text-[hsl(var(--muted-foreground))]">
          <span>Distribución objetivo:</span>
          <span className="text-blue-600 font-medium">P {plan.targetProteinPct}%</span>
          <span className="text-yellow-600 font-medium">L {plan.targetFatPct}%</span>
          <span className="text-[hsl(var(--primary))] font-medium">HC {plan.targetCarbsPct}%</span>
          {plan.tdee && <span className="ml-auto">TDEE: {Math.round(plan.tdee)} kcal</span>}
          {plan.bmr && <span>BMR: {Math.round(plan.bmr)} kcal</span>}
        </div>
      </div>

      {/* Glycemic Control Banner */}
      {patientPathologies?.glycemicControl && (
        <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--warm-cream))] p-4">
          <span className="text-[hsl(var(--slate-ui))] text-lg">💧</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Control glucémico activo</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              Este paciente tiene control glucémico activado
              {patientPathologies.conditions?.some((c) => c.toLowerCase().includes("diabetes")) && " (Diabetes registrada)"}.
              Prioriza cereales de bajo índice glucémico, incluye leguminosas en cada tiempo y limita azúcares simples.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {[
                { label: "HC objetivo", val: `${Math.round(plan.targetCarbsG)}g/día`, hint: `${plan.targetCarbsPct}% del VCT` },
                { label: "Equiv. cereales/día", val: `${(getEquivs()["cerealesSinGrasa"] ?? 0) + (getEquivs()["cerealesConGrasa"] ?? 0)} equiv.` },
                { label: "Equiv. leguminosas", val: `${getEquivs()["leguminosas"] ?? 0} equiv.` },
                { label: "Equiv. azúcares", val: `${(getEquivs()["azucaresSinGrasa"] ?? 0) + (getEquivs()["azucaresConGrasa"] ?? 0)} equiv.` },
              ].map((item) => (
                <span key={item.label} className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg px-2 py-1 text-[hsl(var(--foreground))]">
                  <span className="font-medium">{item.label}:</span> {item.val}
                  {item.hint && <span className="opacity-70 ml-1">({item.hint})</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SMAE Equivalents section — editable */}
      {(() => {
        const equivs = getEquivs();
        const isDirty = equivEdits !== null;
        const totalKcal = Object.entries(equivs).reduce((s, [k, v]) => s + (SMAE_META[k]?.kcal ?? 0) * v, 0);
        const totalP    = Object.entries(equivs).reduce((s, [k, v]) => s + (SMAE_META[k]?.p   ?? 0) * v, 0);
        const totalL    = Object.entries(equivs).reduce((s, [k, v]) => s + (SMAE_META[k]?.l   ?? 0) * v, 0);
        const totalHC   = Object.entries(equivs).reduce((s, [k, v]) => s + (SMAE_META[k]?.hc  ?? 0) * v, 0);
        return (
          <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[hsl(var(--primary))]" />
                <h2 className="text-sm font-semibold">Equivalentes SMAE Diarios</h2>
                {isDirty && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    Sin guardar
                  </span>
                )}
              </div>
              {isDirty && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEquivEdits(null)}
                    className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    Descartar
                  </button>
                  <Button
                    size="sm"
                    onClick={handleSaveEquivs}
                    disabled={savingEquivs}
                    className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72] h-7 text-xs"
                  >
                    {savingEquivs && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Guardar cambios
                  </Button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[hsl(var(--table-header))] text-[hsl(var(--foreground))] border-b border-[hsl(var(--border))]">
                    <th className="text-left pb-2 pt-2 px-1 font-bold uppercase tracking-wider text-[11px]">Grupo</th>
                    <th className="text-center pb-2 pt-2 font-bold uppercase tracking-wider text-[11px] w-32">Equivalentes</th>
                    <th className="text-right pb-2 pt-2 font-bold uppercase tracking-wider text-[11px]">Kcal</th>
                    <th className="text-right pb-2 pt-2 font-bold uppercase tracking-wider text-[11px]">P (g)</th>
                    <th className="text-right pb-2 pt-2 font-bold uppercase tracking-wider text-[11px]">L (g)</th>
                    <th className="text-right pb-2 pt-2 font-bold uppercase tracking-wider text-[11px]">HC (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(SMAE_META).map(([key, meta]) => {
                    const n = equivs[key] ?? 0;
                    const dimmed = n === 0;
                    return (
                      <tr
                        key={key}
                        className={cn(
                          "border-b border-[hsl(var(--border))]/50 last:border-0 transition-colors",
                          dimmed ? "opacity-40" : ""
                        )}
                      >
                        <td className="py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: GROUP_DOT[key] ?? "#cbd5e1" }} />
                            <span className="font-medium">{meta.label}</span>
                          </div>
                        </td>
                        <td className="py-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => changeEquiv(key, -0.5)}
                              className="w-5 h-5 rounded flex items-center justify-center border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-bold leading-none transition-colors"
                            >
                              −
                            </button>
                            <span className={cn(
                              "inline-flex items-center justify-center w-9 h-6 rounded font-semibold text-sm",
                              isDirty && equivs[key] !== ((plan.equivalentsPerDay as any)?.[key] ?? 0)
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"
                            )}>
                              {n}
                            </span>
                            <button
                              onClick={() => changeEquiv(key, 0.5)}
                              className="w-5 h-5 rounded flex items-center justify-center border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-bold leading-none transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="text-right py-1.5">{n > 0 ? Math.round(n * meta.kcal) : "—"}</td>
                        <td className="text-right py-1.5 text-blue-600">{n > 0 ? (n * meta.p).toFixed(1) : "—"}</td>
                        <td className="text-right py-1.5 text-yellow-600">{n > 0 ? (n * meta.l).toFixed(1) : "—"}</td>
                        <td className="text-right py-1.5 text-[hsl(var(--primary))]">{n > 0 ? (n * meta.hc).toFixed(1) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-semibold text-[hsl(var(--foreground))] border-t-2 border-[hsl(var(--border))]">
                    <td className="pt-2">Total</td>
                    <td />
                    <td className={cn("text-right pt-2", Math.abs(totalKcal - plan.targetCalories) > plan.targetCalories * 0.05 ? "text-red-600" : "text-green-600")}>
                      {Math.round(totalKcal)}
                      <span className="text-[hsl(var(--muted-foreground))] font-normal ml-1">/ {plan.targetCalories}</span>
                    </td>
                    <td className="text-right pt-2 text-blue-600">{totalP.toFixed(1)}</td>
                    <td className="text-right pt-2 text-yellow-600">{totalL.toFixed(1)}</td>
                    <td className="text-right pt-2 text-[hsl(var(--primary))]">{totalHC.toFixed(1)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Distribution per meal — editable */}
      {(() => {
        const equivs = getEquivs();
        const hasAnyEquiv = Object.values(equivs).some(v => v > 0);
        if (!hasAnyEquiv) return null;

        const dist = getDist();
        const isDistDirty = distEdits !== null;
        const savedDist = plan?.distributionPerMeal as Record<string, number[]> | undefined;

        return (
          <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[hsl(var(--primary))]" />
                <h2 className="text-sm font-semibold text-[hsl(var(--text-strong))]">Distribución por Tiempo de Comida</h2>
                {isDistDirty && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
                    Sin guardar
                  </span>
                )}
              </div>
              {isDistDirty && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDistEdits(null)}
                    className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    Descartar
                  </button>
                  <Button
                    size="sm"
                    onClick={handleSaveDist}
                    disabled={savingDist}
                    className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72] h-7 text-xs"
                  >
                    {savingDist && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Guardar
                  </Button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[hsl(var(--table-header))] text-[hsl(var(--foreground))] sticky top-0 z-10">
                    <th className="text-left py-2 px-3 font-bold uppercase tracking-wider text-[11px] border-b border-[hsl(var(--border))] w-28">
                      Grupo
                    </th>
                    <th className="text-center py-2 px-2 font-bold uppercase tracking-wider text-[11px] border-b border-[hsl(var(--border))] w-16">
                      Total
                    </th>
                    {PRESET_MEALS.map((name, i) => {
                      const mi = MEAL_ICONS[name];
                      const Icon = mi?.icon ?? Utensils;
                      return (
                        <th key={name} className="py-1.5 px-2 border-b border-[hsl(var(--border))] text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: mi?.bg ?? "#f1f5f4" }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: mi?.accent ?? "#8D957E" }} />
                            </div>
                            <span className="text-[10px] font-semibold tracking-tight">{MEAL_NAMES_SHORT[i]}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {DIST_GROUPS.map((grp, rowIdx) => {
                    const total = getGroupTotal(grp.smaeKeys, equivs);
                    if (total === 0) return null;
                    const vals = dist[grp.key] ?? [0, 0, 0, 0, 0];
                    const rowSum = vals.reduce((s, v) => s + v, 0);
                    const diff = Math.abs(rowSum - total);
                    const isBalanced = diff <= 0.4;
                    const isOver = rowSum > total + 0.4;
                    return (
                      <tr
                        key={grp.key}
                        className={cn(
                          "border-b border-[hsl(var(--border))]/60 last:border-0 transition-colors",
                          rowIdx % 2 === 1 ? "bg-[hsl(var(--muted))]/30" : ""
                        )}
                      >
                        {/* Group name */}
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: GROUP_DOT[grp.smaeKeys[0]] ?? "#cbd5e1" }}
                            />
                            <span className="font-semibold text-[hsl(var(--foreground))]">{grp.label}</span>
                          </div>
                        </td>

                        {/* Total column — validation badge */}
                        <td className="py-1.5 px-2 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md",
                            isBalanced
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : isOver
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          )}>
                            {rowSum}
                            <span className="font-normal text-[10px] opacity-70">/{total}</span>
                          </span>
                        </td>

                        {/* Meal cells */}
                        {vals.map((val, mIdx) => {
                          const savedVal = savedDist?.[grp.key]?.[mIdx];
                          const isChanged = isDistDirty && savedVal !== undefined && val !== savedVal;
                          return (
                            <td key={mIdx} className="py-1 px-1">
                              <div className="flex items-center justify-center gap-0.5">
                                <button
                                  onClick={() => changeDist(grp.key, mIdx, -0.5)}
                                  className="w-4 h-4 rounded flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] text-[11px] leading-none transition-colors"
                                  aria-label="Reducir"
                                >
                                  −
                                </button>
                                <span className={cn(
                                  "inline-flex items-center justify-center w-7 h-5 rounded text-xs font-semibold tabular-nums",
                                  isChanged
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                    : val > 0
                                      ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"
                                      : "text-[hsl(var(--muted-foreground))]"
                                )}>
                                  {val > 0 ? val : "·"}
                                </span>
                                <button
                                  onClick={() => changeDist(grp.key, mIdx, 0.5)}
                                  className="w-4 h-4 rounded flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] text-[11px] leading-none transition-colors"
                                  aria-label="Aumentar"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">
              Ajusta cuántos equivalentes de cada grupo van a cada tiempo de comida. El total debe coincidir con los equivalentes del plan.
            </p>
          </div>
        );
      })()}

      {/* Notas del nutriólogo */}
      <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-4">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote className="w-4 h-4 text-[hsl(var(--primary))]" />
          <h2 className="text-sm font-semibold">Notas del nutriólogo</h2>
          <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1">(se incluyen en el PDF)</span>
        </div>
        <Textarea
          placeholder="Escribe aquí indicaciones personalizadas, observaciones o notas para el paciente..."
          className="text-sm min-h-[80px] resize-none"
          value={notesValue ?? (plan.description ?? "")}
          onChange={(e) => setNotesValue(e.target.value)}
        />
        {notesValue !== null && notesValue !== (plan.description ?? "") && (
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72] h-8"
            >
              {savingNotes && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Guardar notas
            </Button>
          </div>
        )}
      </div>

      {/* Meal sections */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[hsl(var(--primary))]" />
            Tiempos de Comida
          </h2>
        </div>

        {plan.meals
          ?.slice()
          .sort((a: any, b: any) => a.order - b.order)
          .map((meal: any) => (
            <MealSection
              key={meal._id}
              meal={meal}
              isAddingFood={addFoodMealId === meal._id}
              onToggleAddFood={() =>
                setAddFoodMealId(addFoodMealId === meal._id ? null : meal._id)
              }
              onAddFood={(food, qty) => handleAddFood(meal._id, food, qty)}
              onAddRecipe={(recipe, servings) => handleAddRecipe(meal._id, recipe, servings)}
              onRemoveFood={handleRemoveFood}
              onDeleteMeal={() => handleDeleteMeal(meal._id)}
              dayActualCalories={actualCalories}
            />
          ))}

        {/* Add meal section */}
        {showAddMeal ? (
          <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 flex flex-col gap-3">
            <p className="text-sm font-medium">Nuevo tiempo de comida</p>
            {availablePresets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availablePresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAddMeal(preset)}
                    className="text-xs px-3 py-1.5 rounded-full border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors font-medium"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Nombre personalizado..."
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMeal(customMealName)}
                className="text-sm h-8"
              />
              <Button
                size="sm"
                onClick={() => handleAddMeal(customMealName)}
                disabled={!customMealName.trim()}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72] h-8"
              >
                Agregar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowAddMeal(false); setCustomMealName(""); }}
                className="h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddMeal(true)}
            className="w-full rounded-xl border border-dashed border-[hsl(var(--border))] p-4 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar tiempo de comida
          </button>
        )}

        {/* ── Version History ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              Historial de versiones
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowVersionForm((v) => !v)}
              className="h-7 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              Guardar versión actual
            </Button>
          </div>

          {showVersionForm && (
            <div className="px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] flex items-center gap-2">
              <input
                type="text"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="Etiqueta opcional (ej. Semana 3)"
                className="flex-1 h-8 px-3 text-sm rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] bg-[hsl(var(--surface))]"
                onKeyDown={(e) => e.key === "Enter" && handleSaveVersion()}
              />
              <Button size="sm" onClick={handleSaveVersion} disabled={savingVersion} className="h-8">
                {savingVersion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Guardar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowVersionForm(false)} className="h-8">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          <div className="divide-y divide-[hsl(var(--border))]">
            {planVersions === undefined && (
              <div className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">Cargando...</div>
            )}
            {planVersions?.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                Sin versiones guardadas. Guarda una instantánea del plan para consultar el historial.
              </div>
            )}
            {planVersions?.map((v: any) => (
              <div key={v._id} className="flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-xs text-[hsl(var(--muted-foreground))] tabular-nums">{v.date}</span>
                  {v.label && <span className="font-medium">{v.label}</span>}
                  <span className="text-[hsl(var(--muted-foreground))] text-xs">
                    {Math.round(v.targetCalories)} kcal objetivo
                    {v.actualCalories ? ` · ${Math.round(v.actualCalories)} kcal real` : ""}
                  </span>
                  {v.actualCalories && v.targetCalories > 0 && (
                    <span className={cn(
                      "text-xs font-semibold px-1.5 py-0.5 rounded-full",
                      (() => {
                        const pct = (v.actualCalories / v.targetCalories) * 100;
                        return pct >= 90 && pct <= 110
                          ? "bg-green-100 text-green-700"
                          : pct >= 70
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-orange-100 text-orange-700";
                      })()
                    )}>
                      {Math.round((v.actualCalories / v.targetCalories) * 100)}%
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteVersion({ versionId: v._id })}
                  className="text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function NutrientBar({
  label,
  actual,
  target,
  unit,
  pct,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
  pct: number;
}) {
  const barColor = pct >= 90 && pct <= 110 ? "bg-green-500"
    : pct > 110 ? "bg-red-400"
    : pct >= 70 ? "bg-yellow-400"
    : "bg-orange-300";
  const pctColor = pct >= 90 && pct <= 110 ? "text-green-600"
    : pct > 110 ? "text-red-600"
    : "text-yellow-600";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[hsl(var(--foreground))]">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn("font-bold", pctColor)}>{Math.round(pct)}%</span>
          <span className="text-[hsl(var(--muted-foreground))]">{actual}/{target} {unit}</span>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function MealSection({
  meal,
  isAddingFood,
  onToggleAddFood,
  onAddFood,
  onAddRecipe,
  onRemoveFood,
  onDeleteMeal,
  dayActualCalories,
}: {
  meal: any;
  isAddingFood: boolean;
  onToggleAddFood: () => void;
  onAddFood: (food: any, qty: number) => Promise<void>;
  onAddRecipe: (recipe: any, servings: number) => Promise<void>;
  onRemoveFood: (mealFoodId: string) => Promise<void>;
  onDeleteMeal: () => Promise<void>;
  dayActualCalories?: number;
}) {
  const mi = MEAL_ICONS[meal.name];
  const Icon = mi?.icon ?? Utensils;
  const accent = mi?.accent ?? "#8D957E";
  const bg = mi?.bg ?? "#f1f5f4";

  const totalCal = meal.foods?.reduce((s: number, f: any) => s + (f.calories ?? 0), 0) ?? 0;
  const totalProt = meal.foods?.reduce((s: number, f: any) => s + (f.proteinG ?? 0), 0) ?? 0;
  const totalFat = meal.foods?.reduce((s: number, f: any) => s + (f.fatG ?? 0), 0) ?? 0;
  const totalCarbs = meal.foods?.reduce((s: number, f: any) => s + (f.carbsG ?? 0), 0) ?? 0;
  const dayPct = dayActualCalories && dayActualCalories > 0 ? Math.round((totalCal / dayActualCalories) * 100) : null;

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
      {/* Meal header */}
      <div className="flex items-center gap-3 p-4">
        {/* Meal-time icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{meal.name}</h3>
              {meal.time && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{meal.time}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-[hsl(var(--foreground))] leading-none">{Math.round(totalCal)}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                kcal{dayPct !== null ? ` · ${dayPct}% del día` : ""}
              </p>
            </div>
          </div>

          {/* Macro chips + actions */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--slate-ui))]">P {Math.round(totalProt)}g</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--warm-cream))] text-[hsl(var(--terracotta))]">L {Math.round(totalFat)}g</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--primary))]">HC {Math.round(totalCarbs)}g</span>
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={onToggleAddFood}>
                {isAddingFood ? <X className="w-3 h-3" /> : <><Plus className="w-3 h-3 mr-1" />Alimento</>}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={onDeleteMeal}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add food panel */}
      {isAddingFood && (
        <div className="border-t border-[hsl(var(--border))] p-3">
          <AddFoodPanel onAddFood={onAddFood} onAddRecipe={onAddRecipe} />
        </div>
      )}

      {/* Foods table */}
      {meal.foods?.length === 0 && !isAddingFood ? (
        <div className="border-t border-[hsl(var(--border))] py-6 text-center">
          <p className="text-xs text-[hsl(var(--muted-foreground))] italic">Sin alimentos — usa "+ Alimento" para agregar</p>
        </div>
      ) : meal.foods?.length > 0 ? (
        <div className="border-t border-[hsl(var(--border))] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--foreground))] bg-[hsl(var(--table-header))] border-b border-[hsl(var(--border))]">
                <th className="text-left px-4 py-2">Alimento</th>
                <th className="text-right px-2 py-2">Cant.</th>
                <th className="text-right px-2 py-2">Kcal</th>
                <th className="text-right px-2 py-2">P</th>
                <th className="text-right px-2 py-2">L</th>
                <th className="text-right px-2 py-2">HC</th>
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {meal.foods
                ?.slice()
                .sort((a: any, b: any) => a.order - b.order)
                .map((food: any) => (
                  <tr key={food._id} className="border-t border-[hsl(var(--border))]/50 group hover:bg-[hsl(var(--muted))]/30 transition-colors">
                    <td className="px-4 py-2">
                      <p className="font-medium truncate max-w-[200px] text-sm">{food.name}</p>
                      {food.smaeCategory && (
                        <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--primary))] mt-0.5">
                          {food.smaeCategory}
                        </span>
                      )}
                    </td>
                    <td className="text-right text-xs text-[hsl(var(--muted-foreground))] px-2 py-2">
                      {food.quantity} {food.unit}
                    </td>
                    <td className="text-right px-2 py-2 font-bold text-[hsl(var(--foreground))]">{Math.round(food.calories)}</td>
                    <td className="text-right text-xs px-2 py-2 text-blue-600 font-medium">{food.proteinG?.toFixed(1)}</td>
                    <td className="text-right text-xs px-2 py-2 text-yellow-600 font-medium">{food.fatG?.toFixed(1)}</td>
                    <td className="text-right text-xs px-2 py-2 text-green-600 font-medium">{food.carbsG?.toFixed(1)}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => onRemoveFood(food._id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function AddFoodPanel({
  onAddFood,
  onAddRecipe,
}: {
  onAddFood: (food: any, qty: number) => Promise<void>;
  onAddRecipe: (recipe: any, servings: number) => Promise<void>;
}) {
  const [tab, setTab] = useState<"food" | "recipe">("food");

  return (
    <div className="bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--border))] p-3 mb-3 flex flex-col gap-2">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-[hsl(var(--muted))] rounded-md p-0.5 w-fit">
        <button
          onClick={() => setTab("food")}
          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
            tab === "food"
              ? "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] shadow-sm"
              : "text-[hsl(var(--muted-foreground))]"
          }`}
        >
          <Search className="w-3 h-3" />
          Alimento SMAE
        </button>
        <button
          onClick={() => setTab("recipe")}
          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
            tab === "recipe"
              ? "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] shadow-sm"
              : "text-[hsl(var(--muted-foreground))]"
          }`}
        >
          <ChefHat className="w-3 h-3" />
          Receta
        </button>
      </div>

      {tab === "food" ? (
        <FoodSearchTab onAddFood={onAddFood} />
      ) : (
        <RecipeTab onAddRecipe={onAddRecipe} />
      )}
    </div>
  );
}

function FoodSearchTab({ onAddFood }: { onAddFood: (food: any, qty: number) => Promise<void> }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [qty, setQty] = useState<number>(0);
  const [adding, setAdding] = useState(false);

  const results = useQuery(
    api.foods.searchFoods,
    search.trim().length >= 2 ? { query: search, limit: 8 } : "skip"
  );

  const previewScale = selected ? qty / (selected.servingAmount || 1) : 0;
  const previewCal = selected ? Math.round(selected.calories * previewScale) : 0;
  const previewProt = selected ? (selected.proteinG * previewScale).toFixed(1) : "0";
  const previewFat = selected ? (selected.fatG * previewScale).toFixed(1) : "0";
  const previewCarbs = selected ? (selected.carbsG * previewScale).toFixed(1) : "0";

  async function handleAdd() {
    if (!selected || qty <= 0) return;
    setAdding(true);
    try {
      await onAddFood(selected, qty);
      setSelected(null);
      setSearch("");
      setQty(0);
    } finally {
      setAdding(false);
    }
  }

  if (!selected) {
    return (
      <>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder="Buscar alimento SMAE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
            autoFocus
          />
        </div>
        {results && results.length > 0 && (
          <div className="flex flex-col divide-y divide-[hsl(var(--border))] rounded-md border border-[hsl(var(--border))] overflow-hidden">
            {results.map((food: any) => (
              <button
                key={food._id}
                onClick={() => { setSelected(food); setQty(food.servingAmount); }}
                className="flex items-center justify-between px-3 py-2 text-left hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{food.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {food.category} · {food.calories} kcal / {food.servingAmount} {food.servingUnit}
                  </p>
                </div>
                <Plus className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
        {search.trim().length >= 2 && results?.length === 0 && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-2">
            Sin resultados
          </p>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{selected.name}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{selected.category}</p>
        </div>
        <button
          onClick={() => { setSelected(null); setSearch(""); }}
          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0.1}
          step={0.1}
          value={qty}
          onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
          className="h-8 text-sm w-24"
        />
        <span className="text-sm text-[hsl(var(--muted-foreground))]">{selected.servingUnit}</span>
      </div>
      {qty > 0 && (
        <div className="flex gap-3 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded px-2 py-1.5">
          <span className="font-medium text-[hsl(var(--foreground))]">{previewCal} kcal</span>
          <span>P: {previewProt}g</span>
          <span>L: {previewFat}g</span>
          <span>HC: {previewCarbs}g</span>
        </div>
      )}
      <Button
        size="sm"
        disabled={qty <= 0 || adding}
        onClick={handleAdd}
        className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72] h-8 self-end"
      >
        {adding && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
        Agregar al plan
      </Button>
    </div>
  );
}

function RecipeTab({ onAddRecipe }: { onAddRecipe: (recipe: any, servings: number) => Promise<void> }) {
  const [selected, setSelected] = useState<any>(null);
  const [servings, setServings] = useState(1);
  const [adding, setAdding] = useState(false);

  const recipes = useQuery(api.recipes.getRecipes, {});

  const previewCal = selected ? Math.round(selected.caloriesPerServing * servings) : 0;
  const previewProt = selected ? (selected.proteinGPerServing * servings).toFixed(1) : "0";
  const previewFat = selected ? (selected.fatGPerServing * servings).toFixed(1) : "0";
  const previewCarbs = selected ? (selected.carbsGPerServing * servings).toFixed(1) : "0";

  async function handleAdd() {
    if (!selected || servings <= 0) return;
    setAdding(true);
    try {
      await onAddRecipe(selected, servings);
      setSelected(null);
      setServings(1);
    } finally {
      setAdding(false);
    }
  }

  if (!selected) {
    return (
      <>
        {recipes === undefined && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-3">Cargando recetas...</p>
        )}
        {recipes?.length === 0 && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-3">
            Aún no tienes recetas. Crea una en la sección de Recetas.
          </p>
        )}
        {recipes && recipes.length > 0 && (
          <div className="flex flex-col divide-y divide-[hsl(var(--border))] rounded-md border border-[hsl(var(--border))] overflow-hidden max-h-52 overflow-y-auto">
            {recipes.map((recipe: any) => (
              <button
                key={recipe._id}
                onClick={() => setSelected(recipe)}
                className="flex items-center justify-between px-3 py-2 text-left hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{recipe.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {Math.round(recipe.caloriesPerServing)} kcal/porc · {recipe.servings} porc.
                    {recipe.tags?.length > 0 && ` · ${recipe.tags.slice(0, 2).join(", ")}`}
                  </p>
                </div>
                <Plus className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{selected.name}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {Math.round(selected.caloriesPerServing)} kcal por porción
          </p>
        </div>
        <button
          onClick={() => setSelected(null)}
          className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0.5}
          step={0.5}
          value={servings}
          onChange={(e) => setServings(parseFloat(e.target.value) || 1)}
          className="h-8 text-sm w-24"
        />
        <span className="text-sm text-[hsl(var(--muted-foreground))]">porción(es)</span>
      </div>
      {servings > 0 && (
        <div className="flex gap-3 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded px-2 py-1.5">
          <span className="font-medium text-[hsl(var(--foreground))]">{previewCal} kcal</span>
          <span>P: {previewProt}g</span>
          <span>L: {previewFat}g</span>
          <span>HC: {previewCarbs}g</span>
        </div>
      )}
      <Button
        size="sm"
        disabled={servings <= 0 || adding}
        onClick={handleAdd}
        className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72] h-8 self-end"
      >
        {adding && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
        Agregar al plan
      </Button>
    </div>
  );
}

function PlanDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <Skeleton className="h-8 w-24" />
      <div>
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-36 w-full rounded-xl" />
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}
