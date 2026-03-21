// @ts-nocheck
"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import {
  ClipboardList,
  Calendar,
  Plus,
  Loader2,
  LayoutTemplate,
  Trash2,
  MoreVertical,
  AlertTriangle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ZERO_EQUIVALENTS = {
  verduras: 0, frutas: 0, cerealesSinGrasa: 0, cerealesConGrasa: 0,
  leguminosas: 0, aoaMuyBajaGrasa: 0, aoaBajaGrasa: 0, aoaMedGrasa: 0,
  aoaAltaGrasa: 0, lecheDes: 0, lecheSemi: 0, lecheEntera: 0,
  lecheConAzucar: 0, grasasSinProt: 0, grasasConProt: 0,
  azucaresSinGrasa: 0, azucaresConGrasa: 0,
};

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

export default function PlansPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [calories, setCalories] = useState<number>(1800);
  const [proteinPct, setProteinPct] = useState<number>(20);
  const [fatPct, setFatPct] = useState<number>(30);
  const [carbsPct, setCarbsPct] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templatePatientId, setTemplatePatientId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);

  const patients = useQuery(api.patients.getPatients);
  const templates = useQuery(api.plans.getTemplates);
  const createPlan = useMutation(api.plans.createPlan);
  const createFromTemplate = useMutation(api.plans.createFromTemplate);

  // Read patientId from URL
  useEffect(() => {
    const pid = searchParams.get("patientId");
    if (pid) {
      setSelectedPatientId(pid);
      setDialogOpen(true);
      router.replace("/plans");
    }
  }, [searchParams, router]);

  const macroSum = proteinPct + fatPct + carbsPct;
  const proteinG = Math.round((calories * (proteinPct / 100)) / 4);
  const fatG = Math.round((calories * (fatPct / 100)) / 9);
  const carbsG = Math.round((calories * (carbsPct / 100)) / 4);

  async function handleCreate() {
    if (!selectedPatientId || !title.trim() || macroSum !== 100) return;
    setSubmitting(true);
    try {
      const id = await createPlan({
        patientId: selectedPatientId as Id<"patients">,
        title: title.trim(),
        status: "draft",
        targetCalories: calories,
        targetProteinG: proteinG,
        targetFatG: fatG,
        targetCarbsG: carbsG,
        targetProteinPct: proteinPct,
        targetFatPct: fatPct,
        targetCarbsPct: carbsPct,
        calculationMethod: "manual",
        calculationFactor: 1,
        equivalentsPerDay: ZERO_EQUIVALENTS,
      });
      toast({ title: "Plan creado" });
      setDialogOpen(false);
      setTitle("");
      setSelectedPatientId("");
      router.push(`/plans/${id}`);
    } catch {
      toast({ title: "Error al crear plan", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateFromTemplate() {
    if (!templatePatientId || !selectedTemplateId) return;
    setCreatingFromTemplate(true);
    try {
      const id = await createFromTemplate({
        templateId: selectedTemplateId as Id<"plans">,
        patientId: templatePatientId as Id<"patients">,
        title: templateTitle.trim() || undefined,
      });
      toast({ title: "Plan creado desde plantilla" });
      setTemplateDialogOpen(false);
      setTemplatePatientId("");
      setSelectedTemplateId("");
      setTemplateTitle("");
      router.push(`/plans/${id}`);
    } catch {
      toast({ title: "Error al crear plan", variant: "destructive" });
    } finally {
      setCreatingFromTemplate(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Planes Alimenticios</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Todos los planes organizados por paciente
          </p>
        </div>
        <div className="flex items-center gap-2">
          {templates && templates.length > 0 && (
            <Button
              onClick={() => setTemplateDialogOpen(true)}
              variant="outline"
              size="sm"
            >
              <LayoutTemplate className="w-4 h-4 mr-1" />
              Desde plantilla
            </Button>
          )}
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Plan
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="archived">Archivados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* From Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear plan desde plantilla</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="space-y-1.5">
              <Label>Plantilla *</Label>
              <Select value={selectedTemplateId} onValueChange={(v) => {
                setSelectedTemplateId(v);
                const t = templates?.find((t) => t._id === v);
                if (t) setTemplateTitle(t.title.replace(/^Plantilla: /, ""));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla..." />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.title} — {t.targetCalories} kcal
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Paciente *</Label>
              <Select value={templatePatientId} onValueChange={setTemplatePatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((p) => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre del plan (opcional)</Label>
              <Input
                placeholder="Se usará el nombre de la plantilla si se deja vacío"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateFromTemplate}
              disabled={!templatePatientId || !selectedTemplateId || creatingFromTemplate}
              className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]"
            >
              {creatingFromTemplate && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Crear plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Plan Alimenticio</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="space-y-1.5">
              <Label>Paciente *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((p) => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre del plan *</Label>
              <Input
                placeholder="Plan semana 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Calorías objetivo (kcal)</Label>
              <Input
                type="number"
                min={500}
                max={5000}
                value={calories}
                onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-blue-600">Proteínas %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={proteinPct}
                  onChange={(e) => setProteinPct(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{proteinG}g</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-yellow-600">Lípidos %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={fatPct}
                  onChange={(e) => setFatPct(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{fatG}g</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[hsl(var(--primary))]">HC %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={carbsPct}
                  onChange={(e) => setCarbsPct(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{carbsG}g</p>
              </div>
            </div>
            {macroSum !== 100 && (
              <p className="text-xs text-red-500">Los porcentajes deben sumar 100% (actual: {macroSum}%)</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedPatientId || !title.trim() || macroSum !== 100 || submitting}
              className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Crear plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {patients === undefined ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))]">
          <div className="w-14 h-14 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
          </div>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Aún no tienes pacientes</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center max-w-xs">
            Los planes se generan por paciente. Registra al primero y usa la IA para crear su plan en segundos.
          </p>
          <div className="flex gap-2 mt-1">
            <Button asChild size="sm" variant="outline">
              <Link href="/patients">Agregar paciente</Link>
            </Button>
            <Button asChild size="sm" className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]">
              <Link href="/ai">Generar plan con IA</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {patients.map((patient) => (
            <PatientPlansSection
              key={patient._id}
              patientId={patient._id}
              patientName={patient.name}
              statusFilter={statusFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Patient section with their plans ─────────────────────────────────────────

function PatientPlansSection({
  patientId,
  patientName,
  statusFilter,
}: {
  patientId: Id<"patients">;
  patientName: string;
  statusFilter: string;
}) {
  const plans = useQuery(api.plans.getPlans, { patientId });
  const { toast } = useToast();
  const deletePlan = useMutation(api.plans.deletePlan);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  function openDeleteDialog(planId: string, planTitle: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete({ id: planId, title: planTitle });
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    setConfirmDelete(null);
    try {
      await deletePlan({ planId: confirmDelete.id as Id<"plans"> });
      toast({ title: "Plan eliminado" });
    } catch {
      toast({ title: "Error al eliminar plan", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  const filtered =
    plans?.filter((p) => statusFilter === "all" || p.status === statusFilter) ??
    [];

  if (plans !== undefined && filtered.length === 0 && statusFilter !== "all") {
    return null; // Hide sections with no matching plans when filter is active
  }

  const initials = patientName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      {/* Patient header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center shrink-0 ring-1 ring-[hsl(var(--border))]">
          <span className="text-[hsl(var(--primary))] text-xs font-semibold">{initials}</span>
        </div>
        <Link
          href={`/patients/${patientId}`}
          className="text-sm font-semibold hover:text-[hsl(var(--primary))] transition-colors"
        >
          {patientName}
        </Link>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {plans === undefined ? "..." : `${filtered.length} plan${filtered.length !== 1 ? "es" : ""}`}
        </span>
      </div>

      {plans === undefined ? (
        <div className="grid md:grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-[hsl(var(--border))] rounded-xl p-4 flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Sin planes para este paciente
          </p>
          <Button asChild size="sm" className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)] ml-auto">
            <Link href="/ai">Generar con IA</Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((plan) => (
            <div key={plan._id} className="group/card bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--warm-cream))] hover:border-[hsl(var(--border))] hover:shadow-sm transition-all">
              <Link
                href={`/plans/${plan._id}`}
                className="flex flex-col gap-3 p-4 block"
              >
                <p className="text-sm font-semibold line-clamp-1">{plan.title}</p>

                {/* Macro targets */}
                <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {plan.targetCalories} kcal
                  </span>
                  <span>P: {plan.targetProteinG}g</span>
                  <span>L: {plan.targetFatG}g</span>
                  <span>HC: {plan.targetCarbsG}g</span>
                </div>

                {/* Date */}
                {(plan.startDate || plan.endDate) && (
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <Calendar className="w-3.5 h-3.5" />
                    {plan.startDate}
                    {plan.endDate ? ` → ${plan.endDate}` : ""}
                  </div>
                )}
              </Link>
              {/* Footer row: status badge + delete button */}
              <div className="flex items-center justify-between px-4 pb-3">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    STATUS_STYLES[plan.status] ?? "bg-gray-100 text-gray-600"
                  )}
                >
                  {STATUS_LABELS[plan.status] ?? plan.status}
                </span>
                <button
                  onClick={(e) => openDeleteDialog(plan._id, plan.title, e)}
                  disabled={deletingId === plan._id}
                  className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                  title="Eliminar plan"
                >
                  {deletingId === plan._id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar plan
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            ¿Estás seguro de que quieres eliminar{" "}
            <strong className="text-[hsl(var(--foreground))]">{confirmDelete?.title}</strong>?{" "}
            Esta acción no se puede deshacer y se borrarán todos los alimentos del plan.
          </p>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
