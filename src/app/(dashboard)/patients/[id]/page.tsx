// @ts-nocheck
"use client"

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import {
  ArrowLeft,
  User,
  ClipboardList,
  Activity,
  Plus,
  Pencil,
  Loader2,
  Trash2,
  Scale,
  TrendingUp,
  Stethoscope,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Leaf,
  X,
  RefreshCw,
  Sun,
  Moon,
  Coffee,
  Utensils,
  Apple,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { HistoriaClinicaTab } from "@/features/patients/historia-clinica-tab";
import { SeguimientoTab } from "@/features/patients/seguimiento-tab";
import { TamizajesTab } from "@/features/patients/tamizajes-tab";
import { PatologiasTab } from "@/features/patients/patologias-tab";

const COMMON_ALLERGIES = [
  "Lactosa", "Gluten", "Mariscos", "Frutos secos", "Cacahuate",
  "Huevo", "Soya", "Trigo", "Fructosa", "Sorbitol", "Sulfitos",
];

const ADHERENCE_LABELS: Record<string, string> = {
  alta: "Alta — sigue el plan con facilidad",
  media: "Media — tiene recaídas ocasionales",
  baja: "Baja — le cuesta mantener el plan",
};

const ADHERENCE_COLORS: Record<string, string> = {
  alta: "bg-green-100 text-green-700 border-green-200",
  media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  baja: "bg-red-100 text-red-700 border-red-200",
};

export const dynamic = "force-dynamic";

// ─── Labels ───────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  maintenance: "Mantenimiento",
  weight_gain: "Ganancia de peso",
  muscle_gain: "Masa muscular",
  health: "Salud general",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentario",
  light: "Ligero",
  moderate: "Moderado",
  active: "Activo",
  very_active: "Muy activo",
};

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const patientId = id as Id<"patients">;
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editAllergies, setEditAllergies] = useState<string[]>([]);
  const [editRecallFields, setEditRecallFields] = useState({
    desayuno: "", colAm: "", comida: "", colPm: "", cena: "",
  });
  const [editAllergyInput, setEditAllergyInput] = useState("");

  // Measurements state
  const today = new Date().toISOString().slice(0, 10);
  const [mForm, setMForm] = useState({
    date: today, weightKg: "", bodyFatPct: "", muscleMassKg: "",
    waistCm: "", hipCm: "", neckCm: "", notes: "",
  });
  const [mSubmitting, setMSubmitting] = useState(false);

  // AI plan dialog
  const [aiPlanOpen, setAiPlanOpen] = useState(false);

  // Consultations state
  const [cForm, setCForm] = useState({
    date: today, reason: "", notes: "", weightKg: "", bloodPressure: "", nextAppointment: "",
  });
  const [cSubmitting, setCSubmitting] = useState(false);

  const patient = useQuery(api.patients.getPatient, { patientId });
  const plans = useQuery(api.plans.getPlans, { patientId });
  const measurements = useQuery(api.measurements.getMeasurements, { patientId });
  const consultations = useQuery(api.consultations.getConsultations, { patientId });
  const updatePatient = useMutation(api.patients.updatePatient);
  const addMeasurement = useMutation(api.measurements.addMeasurement);
  const deleteMeasurement = useMutation(api.measurements.deleteMeasurement);
  const addConsultation = useMutation(api.consultations.addConsultation);
  const deleteConsultation = useMutation(api.consultations.deleteConsultation);

  if (patient === undefined) {
    return <PatientDetailSkeleton />;
  }

  if (patient === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-[hsl(var(--muted-foreground))]">Paciente no encontrado</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/patients">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Link>
        </Button>
      </div>
    );
  }

  function parseRecallFields(raw: string) {
    const f = { desayuno: "", colAm: "", comida: "", colPm: "", cena: "" };
    if (!raw.trim()) return f;
    if (/desayuno:/i.test(raw)) {
      f.desayuno = (raw.match(/desayuno:\s*([^\n]*)/i)?.[1] ?? "").trim();
      f.colAm    = (raw.match(/colaci[oó]n am:\s*([^\n]*)/i)?.[1] ?? "").trim();
      f.comida   = (raw.match(/comida:\s*([^\n]*)/i)?.[1] ?? "").trim();
      f.colPm    = (raw.match(/colaci[oó]n pm:\s*([^\n]*)/i)?.[1] ?? "").trim();
      f.cena     = (raw.match(/cena:\s*([^\n]*)/i)?.[1] ?? "").trim();
    } else {
      f.desayuno = raw.trim();
    }
    return f;
  }

  function composeRecall(f: typeof editRecallFields): string {
    return [
      f.desayuno && `Desayuno: ${f.desayuno}`,
      f.colAm    && `Colación AM: ${f.colAm}`,
      f.comida   && `Comida: ${f.comida}`,
      f.colPm    && `Colación PM: ${f.colPm}`,
      f.cena     && `Cena: ${f.cena}`,
    ].filter(Boolean).join("\n");
  }

  function updateEditRecallField(key: keyof typeof editRecallFields, value: string) {
    const next = { ...editRecallFields, [key]: value };
    setEditRecallFields(next);
    setEditForm((prev: any) => ({ ...prev, recall24h: composeRecall(next) }));
  }

  function openEdit() {
    const raw = patient.recall24h ?? "";
    setEditRecallFields(parseRecallFields(raw));
    setEditForm({
      name: patient.name,
      email: patient.email ?? "",
      phone: patient.phone ?? "",
      age: patient.age ?? "",
      sex: patient.sex,
      heightCm: patient.heightCm,
      weightKg: patient.weightKg,
      activityLevel: patient.activityLevel,
      goal: patient.goal,
      notes: patient.notes ?? "",
      foodPreferences: patient.foodPreferences ?? "",
      adherenceRating: patient.adherenceRating ?? "",
      recall24h: raw,
    });
    setEditAllergies(patient.allergies ?? []);
    setEditAllergyInput("");
    setEditOpen(true);
  }

  function addEditAllergy(val: string) {
    const trimmed = val.trim();
    if (trimmed && !editAllergies.includes(trimmed)) {
      setEditAllergies([...editAllergies, trimmed]);
    }
    setEditAllergyInput("");
  }

  function removeEditAllergy(val: string) {
    setEditAllergies(editAllergies.filter((a) => a !== val));
  }

  async function handleEdit() {
    if (!editForm) return;
    setEditSubmitting(true);
    try {
      await updatePatient({
        patientId,
        name: editForm.name,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        age: editForm.age ? Number(editForm.age) : undefined,
        sex: editForm.sex,
        heightCm: Number(editForm.heightCm),
        weightKg: Number(editForm.weightKg),
        activityLevel: editForm.activityLevel,
        goal: editForm.goal,
        notes: editForm.notes || undefined,
        allergies: editAllergies.length > 0 ? editAllergies : undefined,
        foodPreferences: editForm.foodPreferences || undefined,
        adherenceRating: editForm.adherenceRating || undefined,
        recall24h: editForm.recall24h || undefined,
      });
      toast({ title: "Paciente actualizado" });
      setEditOpen(false);
    } catch {
      toast({ title: "Error al actualizar paciente", variant: "destructive" });
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleAddMeasurement() {
    if (!mForm.date) return;
    setMSubmitting(true);
    try {
      await addMeasurement({
        patientId,
        date: mForm.date,
        weightKg: mForm.weightKg ? Number(mForm.weightKg) : undefined,
        bodyFatPct: mForm.bodyFatPct ? Number(mForm.bodyFatPct) : undefined,
        muscleMassKg: mForm.muscleMassKg ? Number(mForm.muscleMassKg) : undefined,
        waistCm: mForm.waistCm ? Number(mForm.waistCm) : undefined,
        hipCm: mForm.hipCm ? Number(mForm.hipCm) : undefined,
        neckCm: mForm.neckCm ? Number(mForm.neckCm) : undefined,
        notes: mForm.notes || undefined,
      });
      toast({ title: "Medición registrada" });
      setMForm({ date: today, weightKg: "", bodyFatPct: "", muscleMassKg: "", waistCm: "", hipCm: "", neckCm: "", notes: "" });
    } catch {
      toast({ title: "Error al guardar medición", variant: "destructive" });
    } finally {
      setMSubmitting(false);
    }
  }

  async function handleDeleteMeasurement(measurementId: any) {
    if (!confirm("¿Eliminar esta medición?")) return;
    try {
      await deleteMeasurement({ measurementId });
      toast({ title: "Medición eliminada" });
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  }

  async function handleAddConsultation() {
    if (!cForm.date) return;
    setCSubmitting(true);
    try {
      await addConsultation({
        patientId,
        date: cForm.date,
        reason: cForm.reason || undefined,
        notes: cForm.notes || undefined,
        weightKg: cForm.weightKg ? Number(cForm.weightKg) : undefined,
        bloodPressure: cForm.bloodPressure || undefined,
        nextAppointment: cForm.nextAppointment || undefined,
      });
      toast({ title: "Consulta registrada" });
      setCForm({ date: today, reason: "", notes: "", weightKg: "", bloodPressure: "", nextAppointment: "" });
    } catch {
      toast({ title: "Error al guardar consulta", variant: "destructive" });
    } finally {
      setCSubmitting(false);
    }
  }

  async function handleDeleteConsultation(consultationId: any) {
    if (!confirm("¿Eliminar esta consulta?")) return;
    try {
      await deleteConsultation({ consultationId });
      toast({ title: "Consulta eliminada" });
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  }

  const bmi = patient.weightKg / Math.pow(patient.heightCm / 100, 2);
  const bmiCategory =
    bmi < 18.5
      ? "Bajo peso"
      : bmi < 25
        ? "Normal"
        : bmi < 30
          ? "Sobrepeso"
          : "Obesidad";

  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 text-[hsl(var(--muted-foreground))]">
        <Link href="/patients">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Pacientes
        </Link>
      </Button>

      {/* Patient header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[hsl(var(--accent))] ring-2 ring-[hsl(var(--border))] flex items-center justify-center shrink-0">
          <span className="text-[hsl(var(--primary))] text-lg font-bold">{initials}</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">{patient.name}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {patient.age ? `${patient.age} años · ` : ""}
            {patient.sex === "male" ? "Masculino" : "Femenino"}
            {patient.email ? ` · ${patient.email}` : ""}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button asChild size="sm" className="bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A]">
            <Link href={`/plans?patientId=${patient._id}`}>
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Plan
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="seguimiento" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="seguimiento" className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Seguimiento
            {consultations && consultations.length > 0 && (
              <span className="ml-1 text-xs bg-[hsl(var(--muted))] px-1.5 rounded-full">
                {consultations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historia" className="flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5" />
            Historia Clínica
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            Planes
            {plans !== undefined && (
              <span className="ml-1 text-xs bg-[hsl(var(--muted))] px-1.5 rounded-full">
                {plans.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tamizajes" className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Tamizajes
          </TabsTrigger>
          <TabsTrigger value="patologias" className="flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5" />
            Patologías
          </TabsTrigger>
        </TabsList>

        {/* Seguimiento Tab */}
        <TabsContent value="seguimiento">
          <SeguimientoTab patientId={patientId} patientWeightKg={patient.weightKg} />
        </TabsContent>

        {/* Historia Clínica Tab */}
        <TabsContent value="historia">
          <HistoriaClinicaTab patientId={patientId} />
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Anthropometrics */}
            <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  Datos Antropométricos
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 grid grid-cols-2 gap-3">
                <DataItem label="Peso" value={`${patient.weightKg} kg`} />
                <DataItem label="Talla" value={`${patient.heightCm} cm`} />
                <DataItem
                  label="IMC"
                  value={`${bmi.toFixed(1)} (${bmiCategory})`}
                  highlight={
                    bmi < 18.5 || bmi >= 25
                      ? bmi >= 30
                        ? "red"
                        : "yellow"
                      : "green"
                  }
                />
                {patient.waistCm && (
                  <DataItem label="Cintura" value={`${patient.waistCm} cm`} />
                )}
                {patient.hipCm && (
                  <DataItem label="Cadera" value={`${patient.hipCm} cm`} />
                )}
                {patient.neckCm && (
                  <DataItem label="Cuello" value={`${patient.neckCm} cm`} />
                )}
                {patient.bodyFatPct && (
                  <DataItem label="% Grasa" value={`${patient.bodyFatPct}%`} />
                )}
                {patient.muscleMassKg && (
                  <DataItem label="Masa muscular" value={`${patient.muscleMassKg} kg`} />
                )}
              </CardContent>
            </Card>

            {/* Activity & Goal */}
            <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  Actividad y Objetivo
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 flex flex-col gap-3">
                <DataItem
                  label="Nivel de actividad"
                  value={ACTIVITY_LABELS[patient.activityLevel] ?? patient.activityLevel}
                />
                <DataItem
                  label="Objetivo"
                  value={GOAL_LABELS[patient.goal] ?? patient.goal}
                />
                {patient.adherenceRating && (
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Adherencia estimada</p>
                    <span className={cn(
                      "text-xs px-2.5 py-0.5 rounded-full border font-medium",
                      ADHERENCE_COLORS[patient.adherenceRating]
                    )}>
                      {ADHERENCE_LABELS[patient.adherenceRating]}
                    </span>
                  </div>
                )}
                {patient.notes && (
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Notas clínicas</p>
                    <p className="text-sm text-[hsl(var(--foreground))]">{patient.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Clinical context card — allergies, preferences, recall */}
          {(patient.allergies?.length > 0 || patient.foodPreferences || patient.recall24h) && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {(patient.allergies?.length > 0 || patient.foodPreferences) && (
                <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                      Alergias y Preferencias
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-4 flex flex-col gap-3">
                    {patient.allergies?.length > 0 && (
                      <div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          Alergias / intolerancias
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {patient.allergies.map((a: string) => (
                            <span key={a} className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-full">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {patient.foodPreferences && (
                      <div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1 flex items-center gap-1">
                          <Leaf className="w-3 h-3 text-green-600" />
                          Preferencias alimentarias
                        </p>
                        <p className="text-sm">{patient.foodPreferences}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {patient.recall24h && (() => {
                const MEAL_CONFIG = [
                  { key: "desayuno", icon: Sun,      label: "Desayuno",    accent: "#d97706", bg: "#fef9c3" },
                  { key: "colAm",    icon: Coffee,   label: "Colación AM", accent: "#16a34a", bg: "#dcfce7" },
                  { key: "comida",   icon: Utensils, label: "Comida",      accent: "#2563eb", bg: "#dbeafe" },
                  { key: "colPm",    icon: Apple,    label: "Colación PM", accent: "#ea580c", bg: "#ffedd5" },
                  { key: "cena",     icon: Moon,     label: "Cena",        accent: "#7c3aed", bg: "#ede9fe" },
                ];
                const raw = patient.recall24h;
                const parsed: Record<string, string> = {};
                if (/desayuno:/i.test(raw)) {
                  parsed.desayuno = (raw.match(/desayuno:\s*([^\n]*)/i)?.[1] ?? "").trim();
                  parsed.colAm    = (raw.match(/colaci[oó]n am:\s*([^\n]*)/i)?.[1] ?? "").trim();
                  parsed.comida   = (raw.match(/comida:\s*([^\n]*)/i)?.[1] ?? "").trim();
                  parsed.colPm    = (raw.match(/colaci[oó]n pm:\s*([^\n]*)/i)?.[1] ?? "").trim();
                  parsed.cena     = (raw.match(/cena:\s*([^\n]*)/i)?.[1] ?? "").trim();
                } else {
                  parsed.desayuno = raw.trim();
                }
                const hasMeals = MEAL_CONFIG.some(m => parsed[m.key]);
                return (
                  <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                        Recordatorio 24hr
                      </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-3 pb-3 flex flex-col gap-1.5">
                      {hasMeals
                        ? MEAL_CONFIG.filter(m => parsed[m.key]).map(({ key, icon: Icon, label, accent, bg }) => (
                          <div key={key} className="flex gap-2.5 items-start py-1">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: bg }}>
                              <Icon className="w-3 h-3" style={{ color: accent }} />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{label}</p>
                              <p className="text-sm text-[hsl(var(--foreground))] leading-snug">{parsed[key]}</p>
                            </div>
                          </div>
                        ))
                        : <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">{raw}</p>
                      }
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <div className="flex justify-end mb-3 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAiPlanOpen(true)}
              className="border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Generar plan con IA
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A]"
            >
              <Link href={`/plans?patientId=${patient._id}`}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Plan manual
              </Link>
            </Button>
          </div>
          {plans === undefined ? (
            <div className="grid gap-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))]">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
              </div>
              <p className="text-sm font-medium">Sin planes aún</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Crea el primer plan alimenticio para este paciente
              </p>
              <Button
                asChild
                size="sm"
                className="bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A] mt-1"
              >
                <Link href={`/plans?patientId=${patient._id}`}>
                  <Plus className="w-4 h-4 mr-1" />
                  Nuevo Plan
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {plans.map((plan) => (
                <Link
                  key={plan._id}
                  href={`/plans/${plan._id}`}
                  className="flex items-center gap-4 p-4 bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--accent))] flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plan.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {plan.targetCalories} kcal ·{" "}
                      {plan.startDate ? plan.startDate : "Sin fecha"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                      STATUS_STYLES[plan.status] ?? "bg-gray-100 text-gray-600"
                    )}
                  >
                    {STATUS_LABELS[plan.status] ?? plan.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tamizajes Tab */}
        <TabsContent value="tamizajes">
          <TamizajesTab patientId={patientId} />
        </TabsContent>

        {/* Patologías Tab */}
        <TabsContent value="patologias">
          <PatologiasTab patientId={patientId} />
        </TabsContent>

        {/* Legacy: hidden, replaced by SeguimientoTab */}
        <TabsContent value="history">
          <div className="flex flex-col gap-4">

            {/* Add measurement form */}
            <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-5">
              <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4 text-[hsl(var(--primary))]" />
                Registrar medición
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label className="text-xs">Fecha</Label>
                  <Input type="date" value={mForm.date} onChange={(e) => setMForm({ ...mForm, date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Peso (kg)</Label>
                  <Input type="number" step="0.1" placeholder="65.0" value={mForm.weightKg} onChange={(e) => setMForm({ ...mForm, weightKg: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">% Grasa</Label>
                  <Input type="number" step="0.1" placeholder="22.0" value={mForm.bodyFatPct} onChange={(e) => setMForm({ ...mForm, bodyFatPct: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Masa muscular (kg)</Label>
                  <Input type="number" step="0.1" placeholder="42.0" value={mForm.muscleMassKg} onChange={(e) => setMForm({ ...mForm, muscleMassKg: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cintura (cm)</Label>
                  <Input type="number" step="0.5" placeholder="82" value={mForm.waistCm} onChange={(e) => setMForm({ ...mForm, waistCm: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cadera (cm)</Label>
                  <Input type="number" step="0.5" placeholder="96" value={mForm.hipCm} onChange={(e) => setMForm({ ...mForm, hipCm: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cuello (cm)</Label>
                  <Input type="number" step="0.5" placeholder="35" value={mForm.neckCm} onChange={(e) => setMForm({ ...mForm, neckCm: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-2">
                  <Label className="text-xs">Notas</Label>
                  <Input placeholder="Observaciones..." value={mForm.notes} onChange={(e) => setMForm({ ...mForm, notes: e.target.value })} className="h-8 text-sm" />
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleAddMeasurement}
                disabled={mSubmitting || !mForm.date}
                className="mt-4 bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A]"
              >
                {mSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Guardar medición
              </Button>
            </div>

            {/* Weight chart */}
            {measurements && measurements.length >= 2 && (
              <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-5">
                <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" />
                  Evolución del peso
                </p>
                <WeightChart measurements={measurements} />
              </div>
            )}

            {/* Measurements table */}
            <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
              <div className="px-5 py-3 border-b border-[hsl(var(--border))] text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] grid grid-cols-[100px_70px_60px_70px_65px_65px_1fr_32px] gap-2">
                <span>Fecha</span><span>Peso</span><span>%Grasa</span><span>Músculo</span><span>Cintura</span><span>Cadera</span><span>Notas</span><span />
              </div>
              {measurements === undefined ? (
                <div className="px-5 py-4 flex flex-col gap-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : measurements.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  Aún no hay mediciones registradas. ¡Agrega la primera arriba!
                </div>
              ) : (
                <div className="divide-y divide-[hsl(var(--border))]">
                  {measurements.map((m: any) => (
                    <div key={m._id} className="group px-5 py-2.5 grid grid-cols-[100px_70px_60px_70px_65px_65px_1fr_32px] gap-2 items-center text-sm hover:bg-[hsl(var(--muted)/0.4)]">
                      <span className="font-medium text-xs">{m.date}</span>
                      <span>{m.weightKg != null ? `${m.weightKg} kg` : "—"}</span>
                      <span>{m.bodyFatPct != null ? `${m.bodyFatPct}%` : "—"}</span>
                      <span>{m.muscleMassKg != null ? `${m.muscleMassKg} kg` : "—"}</span>
                      <span>{m.waistCm != null ? `${m.waistCm} cm` : "—"}</span>
                      <span>{m.hipCm != null ? `${m.hipCm} cm` : "—"}</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">{m.notes ?? ""}</span>
                      <button
                        onClick={() => handleDeleteMeasurement(m._id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Legacy: hidden, replaced by SeguimientoTab */}
        <TabsContent value="consultations_legacy">
          <div className="flex flex-col gap-4">
            {/* Add consultation form */}
            <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-5">
              <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[hsl(var(--primary))]" />
                Registrar consulta
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Fecha *</Label>
                  <Input type="date" value={cForm.date} onChange={(e) => setCForm({ ...cForm, date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Peso en consulta (kg)</Label>
                  <Input type="number" step="0.1" placeholder="65.0" value={cForm.weightKg} onChange={(e) => setCForm({ ...cForm, weightKg: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Presión arterial</Label>
                  <Input placeholder="120/80" value={cForm.bloodPressure} onChange={(e) => setCForm({ ...cForm, bloodPressure: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-3">
                  <Label className="text-xs">Motivo de consulta</Label>
                  <Input placeholder="Control de peso, seguimiento..." value={cForm.reason} onChange={(e) => setCForm({ ...cForm, reason: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-3">
                  <Label className="text-xs">Notas clínicas</Label>
                  <textarea
                    rows={3}
                    placeholder="Observaciones, indicaciones, cambios en el plan..."
                    value={cForm.notes}
                    onChange={(e) => setCForm({ ...cForm, notes: e.target.value })}
                    className="w-full text-sm rounded-md border border-[hsl(var(--border))] bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Próxima cita</Label>
                  <Input type="date" value={cForm.nextAppointment} onChange={(e) => setCForm({ ...cForm, nextAppointment: e.target.value })} className="h-8 text-sm" />
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleAddConsultation}
                disabled={cSubmitting || !cForm.date}
                className="mt-4 bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A]"
              >
                {cSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Guardar consulta
              </Button>
            </div>

            {/* Consultations list */}
            <div className="flex flex-col gap-3">
              {consultations === undefined ? (
                [...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
              ) : consultations.length === 0 ? (
                <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  Aún no hay consultas registradas. ¡Agrega la primera arriba!
                </div>
              ) : (
                consultations.map((c: any) => (
                  <div key={c._id} className="group bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{c.date}</span>
                        {c.weightKg && (
                          <span className="text-xs bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full">
                            {c.weightKg} kg
                          </span>
                        )}
                        {c.bloodPressure && (
                          <span className="text-xs bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full">
                            {c.bloodPressure} mmHg
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteConsultation(c._id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {c.reason && (
                      <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                        Motivo: {c.reason}
                      </p>
                    )}
                    {c.notes && (
                      <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">{c.notes}</p>
                    )}
                    {c.nextAppointment && (
                      <p className="text-xs text-[hsl(var(--primary))] font-medium">
                        Próxima cita: {c.nextAppointment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Patient Dialog */}
      {editForm && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Paciente</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div className="space-y-1.5">
                <Label>Nombre completo *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Ana García López"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="ana@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="55 1234 5678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Edad</Label>
                  <Input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sexo</Label>
                  <Select value={editForm.sex} onValueChange={(v) => setEditForm({ ...editForm, sex: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Femenino</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Talla (cm)</Label>
                  <Input
                    type="number"
                    value={editForm.heightCm}
                    onChange={(e) => setEditForm({ ...editForm, heightCm: e.target.value })}
                    placeholder="165"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editForm.weightKg}
                    onChange={(e) => setEditForm({ ...editForm, weightKg: e.target.value })}
                    placeholder="65"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nivel de actividad</Label>
                <Select value={editForm.activityLevel} onValueChange={(v) => setEditForm({ ...editForm, activityLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Objetivo</Label>
                <Select value={editForm.goal} onValueChange={(v) => setEditForm({ ...editForm, goal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GOAL_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notas clínicas</Label>
                <Input
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Observaciones adicionales..."
                />
              </div>

              {/* Allergies */}
              <div className="space-y-1.5">
                <Label>Alergias e intolerancias</Label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {editAllergies.map((a) => (
                    <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-full">
                      {a}
                      <button type="button" onClick={() => removeEditAllergy(a)} className="hover:text-red-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe una alergia y presiona Enter"
                    value={editAllergyInput}
                    onChange={(e) => setEditAllergyInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEditAllergy(editAllergyInput); } }}
                    className="text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => addEditAllergy(editAllergyInput)}>+</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {COMMON_ALLERGIES.filter((a) => !editAllergies.includes(a)).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => addEditAllergy(a)}
                      className="px-2 py-0.5 bg-[hsl(var(--muted))] hover:bg-red-50 hover:border-red-200 hover:text-red-700 border border-[hsl(var(--border))] text-xs rounded-full transition-colors"
                    >
                      + {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food preferences */}
              <div className="space-y-1.5">
                <Label>Preferencias alimentarias</Label>
                <Input
                  value={editForm.foodPreferences}
                  onChange={(e) => setEditForm({ ...editForm, foodPreferences: e.target.value })}
                  placeholder="Ej: vegetariana, sin cerdo, halal..."
                />
              </div>

              {/* Adherence */}
              <div className="space-y-1.5">
                <Label>Adherencia estimada</Label>
                <Select
                  value={editForm.adherenceRating}
                  onValueChange={(v) => setEditForm({ ...editForm, adherenceRating: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="¿Cómo sigue el paciente su plan?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta — sigue el plan con facilidad</SelectItem>
                    <SelectItem value="media">Media — tiene recaídas ocasionales</SelectItem>
                    <SelectItem value="baja">Baja — le cuesta mantener el plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 24hr recall — estructurado por tiempo de comida */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Recordatorio alimentario 24hr</Label>
                {([
                  { key: "desayuno" as const, icon: Sun,      label: "Desayuno",     placeholder: "Ej: 2 huevos, 2 tortillas, café",             accent: "#d97706", bg: "#fef9c3" },
                  { key: "colAm"    as const, icon: Coffee,   label: "Colación AM",  placeholder: "Ej: 1 fruta, yogurt",                         accent: "#16a34a", bg: "#dcfce7" },
                  { key: "comida"   as const, icon: Utensils, label: "Comida",       placeholder: "Ej: arroz, frijoles, pollo, agua de sabor",   accent: "#2563eb", bg: "#dbeafe" },
                  { key: "colPm"    as const, icon: Apple,    label: "Colación PM",  placeholder: "Ej: galletas, fruta",                         accent: "#ea580c", bg: "#ffedd5" },
                  { key: "cena"     as const, icon: Moon,     label: "Cena",         placeholder: "Ej: sopa, pan, leche",                        accent: "#7c3aed", bg: "#ede9fe" },
                ] as const).map(({ key, icon: Icon, label, placeholder, accent, bg }) => (
                  <div
                    key={key}
                    className="flex gap-2 items-start rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 focus-within:border-[hsl(var(--primary))] transition-colors"
                  >
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: bg }}>
                      <Icon className="w-3 h-3" style={{ color: accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-0.5">{label}</p>
                      <textarea
                        rows={1}
                        value={editRecallFields[key]}
                        onChange={(e) => updateEditRecallField(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full resize-none bg-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/50 outline-none leading-snug"
                        style={{ minHeight: "1.3rem" }}
                        onInput={(e) => {
                          const el = e.currentTarget;
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleEdit}
                disabled={!editForm.name?.trim() || editSubmitting}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A]"
              >
                {editSubmitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Plan Dialog */}
      {aiPlanOpen && (
        <AIPlanDialog
          patient={patient}
          open={aiPlanOpen}
          onClose={() => setAiPlanOpen(false)}
        />
      )}
    </div>
  );
}

// ─── AIPlanDialog ──────────────────────────────────────────────────────────────

const SMAE_META = {
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
} as const;

type SmaeKey = keyof typeof SMAE_META;
const SMAE_KEYS = Object.keys(SMAE_META) as SmaeKey[];

const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};
const GOAL_DELTA: Record<string, number> = {
  weight_loss: -500, maintenance: 0, weight_gain: 500, muscle_gain: 300, health: 0,
};

function mifflinBMR(w: number, h: number, a: number, sex: string) {
  return sex === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
}

function computeEquivTotals(equivs: Record<string, number>) {
  let kcal = 0, p = 0, l = 0, hc = 0;
  for (const key of SMAE_KEYS) {
    const n = equivs[key] ?? 0;
    const g = SMAE_META[key];
    kcal += n * g.kcal; p += n * g.p; l += n * g.l; hc += n * g.hc;
  }
  return { kcal: Math.round(kcal), p: Math.round(p * 10) / 10, l: Math.round(l * 10) / 10, hc: Math.round(hc * 10) / 10 };
}

function AIPlanDialog({ patient, open, onClose }: { patient: any; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const generateNutritionPlan = useAction(api.ai.generateNutritionPlan);
  const createPlan = useMutation(api.plans.createPlan);

  type Step = "setup" | "generating" | "review";
  const [step, setStep] = useState<Step>("setup");

  // Step 1: derived from patient
  const age = patient.age ?? 30;
  const bmr = mifflinBMR(patient.weightKg, patient.heightCm, age, patient.sex);
  const actFactor = ACTIVITY_FACTORS[patient.activityLevel] ?? 1.55;
  const tdeeBase = Math.round(bmr * actFactor);
  const goalDelta = GOAL_DELTA[patient.goal] ?? 0;

  const [targetKcal, setTargetKcal] = useState(tdeeBase + goalDelta);
  const [proteinPct, setProteinPct] = useState(20);
  const [fatPct, setFatPct] = useState(30);
  const carbsPct = Math.max(5, 100 - proteinPct - fatPct);
  const proteinG = Math.round((targetKcal * proteinPct) / 100 / 4);
  const fatG = Math.round((targetKcal * fatPct) / 100 / 9);
  const carbsG = Math.round((targetKcal * carbsPct) / 100 / 4);

  // Step 2: AI result
  const [equivalents, setEquivalents] = useState<Record<string, number>>({});
  const [reasoning, setReasoning] = useState("");

  // Step 3: plan name + save
  const [planTitle, setPlanTitle] = useState(`Plan Nutricional – ${patient.name}`);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    setStep("generating");
    try {
      const result = await generateNutritionPlan({
        sex: patient.sex,
        age,
        weightKg: patient.weightKg,
        heightCm: patient.heightCm,
        activityLevel: patient.activityLevel,
        goal: patient.goal,
        notes: patient.notes,
        targetCalories: targetKcal,
        targetProteinG: proteinG,
        targetFatG: fatG,
        targetCarbsG: carbsG,
      });
      setEquivalents(result.equivalents as Record<string, number>);
      setReasoning(result.reasoning);
      setStep("review");
    } catch (e: any) {
      toast({
        title: "Error al generar plan",
        description: e?.message ?? "Verifica la clave OPENAI_API_KEY en Convex",
        variant: "destructive",
      });
      setStep("setup");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const totals = computeEquivTotals(equivalents);
      const id = await createPlan({
        patientId: patient._id,
        title: planTitle,
        status: "draft",
        targetCalories: totals.kcal,
        targetProteinG: totals.p,
        targetFatG: totals.l,
        targetCarbsG: totals.hc,
        targetProteinPct: totals.kcal > 0 ? Math.round((totals.p * 4 / totals.kcal) * 100) : 0,
        targetFatPct: totals.kcal > 0 ? Math.round((totals.l * 9 / totals.kcal) * 100) : 0,
        targetCarbsPct: totals.kcal > 0 ? Math.round((totals.hc * 4 / totals.kcal) * 100) : 0,
        calculationMethod: "mifflin_ai",
        calculationFactor: actFactor,
        bmr: Math.round(bmr),
        tdee: tdeeBase,
        equivalentsPerDay: {
          verduras:         equivalents.verduras         ?? 0,
          frutas:           equivalents.frutas           ?? 0,
          cerealesSinGrasa: equivalents.cerealesSinGrasa ?? 0,
          cerealesConGrasa: equivalents.cerealesConGrasa ?? 0,
          leguminosas:      equivalents.leguminosas      ?? 0,
          aoaMuyBajaGrasa:  equivalents.aoaMuyBajaGrasa  ?? 0,
          aoaBajaGrasa:     equivalents.aoaBajaGrasa     ?? 0,
          aoaMedGrasa:      equivalents.aoaMedGrasa      ?? 0,
          aoaAltaGrasa:     equivalents.aoaAltaGrasa     ?? 0,
          lecheDes:         equivalents.lecheDes         ?? 0,
          lecheSemi:        equivalents.lecheSemi        ?? 0,
          lecheEntera:      equivalents.lecheEntera      ?? 0,
          lecheConAzucar:   equivalents.lecheConAzucar   ?? 0,
          grasasSinProt:    equivalents.grasasSinProt    ?? 0,
          grasasConProt:    equivalents.grasasConProt    ?? 0,
          azucaresSinGrasa: equivalents.azucaresSinGrasa ?? 0,
          azucaresConGrasa: equivalents.azucaresConGrasa ?? 0,
        },
      });
      toast({ title: "Plan creado", description: "Ahora puedes agregar alimentos al plan" });
      onClose();
      window.location.href = `/plans/${id}`;
    } catch {
      toast({ title: "Error al guardar plan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const totals = computeEquivTotals(equivalents);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[hsl(var(--primary))]" />
            Generar plan con IA
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Setup ── */}
        {step === "setup" && (
          <div className="flex flex-col gap-5 mt-2">
            {/* Patient summary card */}
            <div className="bg-[hsl(var(--muted))] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Paciente</p>
                <p className="font-medium truncate">{patient.name}</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Peso / Talla</p>
                <p className="font-medium">{patient.weightKg} kg · {patient.heightCm} cm</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">BMR (Mifflin)</p>
                <p className="font-medium">{Math.round(bmr)} kcal</p>
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">TDEE estimado</p>
                <p className="font-medium">{tdeeBase} kcal</p>
              </div>
            </div>

            {/* Target kcal */}
            <div className="space-y-1.5">
              <Label>Objetivo calórico diario (kcal)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={targetKcal}
                  onChange={(e) => setTargetKcal(Number(e.target.value) || tdeeBase)}
                  className="w-32"
                />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  TDEE {tdeeBase} kcal · ajuste objetivo: {goalDelta >= 0 ? "+" : ""}{goalDelta} kcal
                </span>
              </div>
            </div>

            {/* Macro % sliders */}
            <div className="space-y-3">
              <Label>Distribución de macronutrimentos</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-blue-600 font-medium">Proteínas {proteinPct}% — {proteinG}g</p>
                  <input type="range" min={10} max={40} step={5} value={proteinPct}
                    onChange={(e) => setProteinPct(Math.min(+e.target.value, 100 - fatPct - 5))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-yellow-600 font-medium">Grasas {fatPct}% — {fatG}g</p>
                  <input type="range" min={15} max={45} step={5} value={fatPct}
                    onChange={(e) => setFatPct(Math.min(+e.target.value, 100 - proteinPct - 5))}
                    className="w-full accent-yellow-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-[hsl(var(--primary))] font-medium">HC {carbsPct}% — {carbsG}g</p>
                  <div className="w-full h-2 rounded bg-[hsl(81,10%,85%)] mt-2.5" />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button
                onClick={handleGenerate}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A] gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generar con IA
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Step 2: Generating ── */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[hsl(var(--primary))] animate-pulse" />
            </div>
            <p className="text-sm font-medium">Generando plan con IA...</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] text-center max-w-xs">
              Calculando la distribución óptima de equivalentes SMAE para {patient.name}.
            </p>
            <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--muted-foreground))]" />
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === "review" && (
          <div className="flex flex-col gap-4 mt-2">
            {/* AI reasoning */}
            {reasoning && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Razonamiento clínico
                </p>
                <p className="text-xs text-blue-800 leading-relaxed">{reasoning}</p>
              </div>
            )}

            {/* Macro totals */}
            <div className="grid grid-cols-4 gap-2 bg-[hsl(var(--muted))] rounded-xl p-3 text-center">
              <div><p className="text-sm font-bold">{totals.kcal}</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">kcal</p></div>
              <div><p className="text-sm font-bold text-blue-600">{totals.p}g</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">proteína</p></div>
              <div><p className="text-sm font-bold text-yellow-600">{totals.l}g</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">grasa</p></div>
              <div><p className="text-sm font-bold text-[hsl(var(--primary))]">{totals.hc}g</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">HC</p></div>
            </div>

            {/* Equivalents table with +/− controls */}
            <div className="border border-[hsl(var(--border))] rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-left">
                    <th className="px-3 py-2 font-medium">Grupo SMAE</th>
                    <th className="px-3 py-2 font-medium text-center">Equiv.</th>
                    <th className="px-3 py-2 font-medium text-center">kcal</th>
                    <th className="px-3 py-2 font-medium text-center">P / L / HC</th>
                    <th className="px-2 py-2 font-medium text-center">±</th>
                  </tr>
                </thead>
                <tbody>
                  {SMAE_KEYS.filter((k) => (equivalents[k] ?? 0) > 0).map((key) => {
                    const n = equivalents[key] ?? 0;
                    const g = SMAE_META[key];
                    return (
                      <tr key={key} className="border-t border-[hsl(var(--border))]">
                        <td className="px-3 py-2 font-medium">{g.label}</td>
                        <td className="px-3 py-2 text-center font-semibold">{n}</td>
                        <td className="px-3 py-2 text-center text-[hsl(var(--muted-foreground))]">{Math.round(n * g.kcal)}</td>
                        <td className="px-3 py-2 text-center text-[hsl(var(--muted-foreground))]">
                          {(n * g.p).toFixed(1)} / {(n * g.l).toFixed(1)} / {(n * g.hc).toFixed(1)}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEquivalents({ ...equivalents, [key]: Math.max(0, n - 0.5) })}
                              className="w-5 h-5 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] font-bold leading-none"
                            >−</button>
                            <button
                              onClick={() => setEquivalents({ ...equivalents, [key]: n + 0.5 })}
                              className="w-5 h-5 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] font-bold leading-none"
                            >+</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Plan name */}
            <div className="space-y-1.5">
              <Label>Nombre del plan</Label>
              <Input value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("setup")}>← Ajustar</Button>
              <Button
                onClick={handleSave}
                disabled={saving || !planTitle.trim()}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A]"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Guardar plan
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function DataItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "green" | "yellow" | "red";
}) {
  return (
    <div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">{label}</p>
      <p
        className={cn(
          "text-sm font-medium",
          highlight === "green" && "text-green-600",
          highlight === "yellow" && "text-yellow-600",
          highlight === "red" && "text-red-600"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function WeightChart({ measurements }: { measurements: any[] }) {
  const withWeight = [...measurements]
    .filter((m) => m.weightKg != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (withWeight.length < 2) return null;

  const W = 560, H = 160, PAD = { top: 12, right: 16, bottom: 24, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const weights = withWeight.map((m) => m.weightKg);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;

  const xScale = (i: number) => PAD.left + (i / (withWeight.length - 1)) * innerW;
  const yScale = (w: number) => PAD.top + innerH - ((w - minW) / (maxW - minW)) * innerH;

  const points = withWeight.map((m, i) => `${xScale(i)},${yScale(m.weightKg)}`).join(" ");
  const areaPoints = [
    `${xScale(0)},${PAD.top + innerH}`,
    ...withWeight.map((m, i) => `${xScale(i)},${yScale(m.weightKg)}`),
    `${xScale(withWeight.length - 1)},${PAD.top + innerH}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD.top + innerH * (1 - t);
        const val = (minW + (maxW - minW) * t).toFixed(1);
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#E5E7EB" strokeWidth={1} />
            <text x={PAD.left - 4} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">{val}</text>
          </g>
        );
      })}
      {/* Area fill */}
      <polygon points={areaPoints} fill="#8D957E" fillOpacity={0.1} />
      {/* Line */}
      <polyline points={points} fill="none" stroke="#8D957E" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots + labels */}
      {withWeight.map((m, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(m.weightKg)} r={4} fill="#8D957E" stroke="white" strokeWidth={1.5} />
          {i === 0 || i === withWeight.length - 1 || withWeight.length <= 6 ? (
            <text x={xScale(i)} y={PAD.top + innerH + 14} fontSize={8} fill="#6B7280" textAnchor="middle">
              {m.date.slice(5)}
            </text>
          ) : null}
          <title>{m.date}: {m.weightKg} kg</title>
        </g>
      ))}
    </svg>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <Skeleton className="h-8 w-24" />
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div>
          <Skeleton className="h-6 w-40 mb-1" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
