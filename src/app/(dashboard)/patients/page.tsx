// @ts-nocheck
"use client"

import { useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Plus,
  Users,
  ChevronRight,
  Loader2,
  Trash2,
  FileUp,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
  Sun,
  Moon,
  Coffee,
  Utensils,
  Apple,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ─── Schema ───────────────────────────────────────────────────────────────────

const patientSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  age: z.coerce.number().min(1).max(120).optional(),
  sex: z.enum(["male", "female"]),
  heightCm: z.coerce.number().min(50, "Altura requerida").max(250),
  weightKg: z.coerce.number().min(10, "Peso requerido").max(500),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  goal: z.enum([
    "weight_loss",
    "maintenance",
    "weight_gain",
    "muscle_gain",
    "health",
  ]),
  notes: z.string().optional(),
  foodPreferences: z.string().optional(),
  adherenceRating: z.enum(["alta", "media", "baja"]).optional(),
  recall24h: z.string().optional(),
});

const COMMON_ALLERGIES = [
  "Lactosa", "Gluten", "Mariscos", "Frutos secos", "Cacahuate",
  "Huevo", "Soya", "Trigo", "Fructosa", "Sorbitol", "Sulfitos",
];

const ADHERENCE_LABELS: Record<string, string> = {
  alta: "Alta — sigue el plan con facilidad",
  media: "Media — tiene recaídas ocasionales",
  baja: "Baja — le cuesta mantener el plan",
};

type PatientForm = z.infer<typeof patientSchema>;

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

const GOAL_COLORS: Record<string, string> = {
  weight_loss:  "bg-[hsl(var(--warm-cream))] text-[hsl(var(--terracotta))] border border-[hsl(var(--border))]",
  maintenance:  "bg-[hsl(var(--accent))] text-[hsl(var(--primary))] border border-[hsl(var(--border))]",
  weight_gain:  "bg-[hsl(var(--muted))] text-[hsl(var(--slate-ui))] border border-[hsl(var(--border))]",
  muscle_gain:  "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]",
  health:       "bg-[hsl(var(--accent))] text-[hsl(var(--primary))] border border-[hsl(var(--border))]",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatientsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [newRecallFields, setNewRecallFields] = useState({
    desayuno: "", colAm: "", comida: "", colPm: "", cena: "",
  });

  function updateNewRecallField(key: string, value: string) {
    setNewRecallFields((prev) => ({ ...prev, [key]: value }));
  }

  function composeNewRecall() {
    const { desayuno, colAm, comida, colPm, cena } = newRecallFields;
    const parts = [
      desayuno && `Desayuno: ${desayuno}`,
      colAm && `Colación AM: ${colAm}`,
      comida && `Comida: ${comida}`,
      colPm && `Colación PM: ${colPm}`,
      cena && `Cena: ${cena}`,
    ].filter(Boolean);
    return parts.join("\n");
  }

  const patients = useQuery(api.patients.getPatients);
  const createPatient = useMutation(api.patients.createPatient);
  const deletePatient = useMutation(api.patients.deletePatient);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      sex: "female",
      activityLevel: "moderate",
      goal: "health",
    },
  });

  const filtered = patients?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function onSubmit(data: PatientForm) {
    try {
      await createPatient({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        age: data.age,
        sex: data.sex,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        activityLevel: data.activityLevel,
        goal: data.goal,
        notes: data.notes || undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        foodPreferences: data.foodPreferences || undefined,
        adherenceRating: data.adherenceRating || undefined,
        recall24h: composeNewRecall() || undefined,
      });
      toast({ title: "Paciente registrado exitosamente" });
      setDialogOpen(false);
      reset();
      setAllergies([]);
      setAllergyInput("");
      setNewRecallFields({ desayuno: "", colAm: "", comida: "", colPm: "", cena: "" });
    } catch {
      toast({
        title: "Error al registrar paciente",
        variant: "destructive",
      });
    }
  }

  function addAllergy(val: string) {
    const trimmed = val.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
    }
    setAllergyInput("");
  }

  function removeAllergy(val: string) {
    setAllergies(allergies.filter((a) => a !== val));
  }

  function openDeleteDialog(patientId: string, name: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete({ id: patientId, name });
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deletePatient({ patientId: confirmDelete.id as any });
      toast({ title: "Paciente eliminado" });
      setConfirmDelete(null);
    } catch {
      toast({ title: "Error al eliminar paciente", variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--text-strong))]">Pacientes</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {patients === undefined
              ? "Cargando..."
              : `${patients.length} paciente${patients.length !== 1 ? "s" : ""} registrados`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="w-fit"
          >
            <FileUp className="w-4 h-4 mr-1" />
            Importar CSV
          </Button>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72] w-fit"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Paciente
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <Input
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Patient List */}
      <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        {patients === undefined ? (
          <PatientListSkeleton />
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
              <Users className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
              {search ? "Sin resultados" : "Sin pacientes aún"}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {search
                ? "Intenta con otro término"
                : "Agrega tu primer paciente para comenzar"}
            </p>
            {!search && (
              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72] mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar paciente
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_80px_160px_100px_40px_40px] gap-4 px-4 py-2.5 bg-[hsl(var(--table-header))] text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider border-b border-[hsl(var(--border))]">
              <span>Paciente</span>
              <span>Edad</span>
              <span>Sexo</span>
              <span>Meta</span>
              <span>Peso</span>
              <span />
              <span />
            </div>
            {filtered?.map((p) => {
              const initials = p.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const bmi = p.weightKg / Math.pow(p.heightCm / 100, 2);
              return (
                <Link
                  key={p._id}
                  href={`/patients/${p._id}`}
                  className="grid grid-cols-[1fr_80px_80px_160px_100px_40px_40px] gap-4 px-4 py-3 items-center hover:bg-[hsl(var(--surface-hover))] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center shrink-0 ring-1 ring-[hsl(var(--border))]">
                      <span className="text-[hsl(var(--primary))] text-xs font-semibold">
                        {initials}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        IMC {bmi.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {p.age ?? "—"}
                  </span>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {p.sex === "male" ? "M" : "F"}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium w-fit",
                      GOAL_COLORS[p.goal] ?? "bg-gray-100 text-gray-600"
                    )}
                  >
                    {GOAL_LABELS[p.goal] ?? p.goal}
                  </span>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {p.weightKg} kg
                  </span>
                  <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <button
                    onClick={(e) => openDeleteDialog(p._id, p.name, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Import Patients Dialog */}
      <ImportPatientsDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImported={(count) => {
          toast({ title: `${count} paciente${count !== 1 ? "s" : ""} importado${count !== 1 ? "s" : ""}` });
          setImportDialogOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar paciente
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            ¿Eliminar a <strong className="text-[hsl(var(--foreground))]">{confirmDelete?.name}</strong>?
            Esta acción no se puede deshacer y eliminará todos sus datos.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Patient Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input id="name" {...register("name")} placeholder="Ana García López" />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} placeholder="ana@email.com" />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register("phone")} placeholder="55 1234 5678" />
              </div>
            </div>

            {/* Age + Sex */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="age">Edad</Label>
                <Input id="age" type="number" {...register("age")} placeholder="30" />
                {errors.age && (
                  <p className="text-xs text-red-500">{errors.age.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Sexo *</Label>
                <Select
                  defaultValue="female"
                  onValueChange={(v) => setValue("sex", v as "male" | "female")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Height + Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="heightCm">Talla (cm) *</Label>
                <Input id="heightCm" type="number" {...register("heightCm")} placeholder="165" />
                {errors.heightCm && (
                  <p className="text-xs text-red-500">{errors.heightCm.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weightKg">Peso (kg) *</Label>
                <Input id="weightKg" type="number" step="0.1" {...register("weightKg")} placeholder="65" />
                {errors.weightKg && (
                  <p className="text-xs text-red-500">{errors.weightKg.message}</p>
                )}
              </div>
            </div>

            {/* Activity Level */}
            <div className="space-y-1.5">
              <Label>Nivel de actividad *</Label>
              <Select
                defaultValue="moderate"
                onValueChange={(v) => setValue("activityLevel", v as PatientForm["activityLevel"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Goal */}
            <div className="space-y-1.5">
              <Label>Objetivo *</Label>
              <Select
                defaultValue="health"
                onValueChange={(v) => setValue("goal", v as PatientForm["goal"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Allergies */}
            <div className="space-y-1.5">
              <Label>Alergias e intolerancias</Label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {allergies.map((a) => (
                  <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-full">
                    {a}
                    <button type="button" onClick={() => removeAllergy(a)} className="hover:text-red-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe una alergia y presiona Enter"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAllergy(allergyInput); } }}
                  className="text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => addAllergy(allergyInput)}>
                  +
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_ALLERGIES.filter((a) => !allergies.includes(a)).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => addAllergy(a)}
                    className="px-2 py-0.5 bg-[hsl(var(--muted))] hover:bg-red-50 hover:border-red-200 hover:text-red-700 border border-[hsl(var(--border))] text-xs rounded-full transition-colors"
                  >
                    + {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Food preferences */}
            <div className="space-y-1.5">
              <Label htmlFor="foodPreferences">Preferencias alimentarias</Label>
              <Input
                id="foodPreferences"
                {...register("foodPreferences")}
                placeholder="Ej: vegetariana, sin cerdo, halal..."
              />
            </div>

            {/* Adherence */}
            <div className="space-y-1.5">
              <Label>Adherencia estimada</Label>
              <Select onValueChange={(v) => setValue("adherenceRating", v as "alta" | "media" | "baja")}>
                <SelectTrigger>
                  <SelectValue placeholder="¿Cómo sigue el paciente su plan?" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ADHERENCE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 24hr recall */}
            <div className="space-y-2">
              <div>
                <Label>Recordatorio alimentario 24hr</Label>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  ¿Qué comió ayer? Ayuda a la IA a personalizar el plan nutricional.
                </p>
              </div>
              {[
                { key: "desayuno", label: "Desayuno", icon: Sun, placeholder: "Ej: 2 huevos con tortillas, café..." },
                { key: "colAm", label: "Colación AM", icon: Apple, placeholder: "Ej: fruta, yogurt..." },
                { key: "comida", label: "Comida", icon: Utensils, placeholder: "Ej: arroz, frijoles, pollo, ensalada..." },
                { key: "colPm", label: "Colación PM", icon: Coffee, placeholder: "Ej: galletas, jugo..." },
                { key: "cena", label: "Cena", icon: Moon, placeholder: "Ej: sopa, pan, leche..." },
              ].map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key} className="flex gap-2 items-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--muted))] mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</p>
                    <Textarea
                      rows={1}
                      value={newRecallFields[key as keyof typeof newRecallFields]}
                      onChange={(e) => updateNewRecallField(key, e.target.value)}
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }}
                      placeholder={placeholder}
                      className="text-sm resize-none overflow-hidden min-h-[32px]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas clínicas</Label>
              <Input id="notes" {...register("notes")} placeholder="Observaciones adicionales..." />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDialogOpen(false); reset(); setAllergies([]); setAllergyInput(""); }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72]"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Registrar paciente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  function parseRow(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if ((char === "," || char === ";") && !inQuotes) { result.push(current.trim()); current = ""; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseRow(lines[0]).map((h) => h.replace(/^"/, "").replace(/"$/, "").trim());
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseRow);
  return { headers, rows };
}

const PATIENT_FIELDS = [
  { key: "name", label: "Nombre", required: true },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Teléfono", required: false },
  { key: "age", label: "Edad", required: false },
  { key: "sex", label: "Sexo (male/female o M/F)", required: true },
  { key: "heightCm", label: "Talla (cm)", required: true },
  { key: "weightKg", label: "Peso (kg)", required: true },
  { key: "activityLevel", label: "Nivel actividad", required: false },
  { key: "goal", label: "Objetivo", required: false },
  { key: "notes", label: "Notas", required: false },
];

function normalizeSex(val: string): "male" | "female" {
  const v = val.toLowerCase().trim();
  if (["m", "male", "masculino", "hombre"].includes(v)) return "male";
  return "female";
}

function normalizeActivity(val: string): string {
  const v = val.toLowerCase().trim();
  if (v.includes("sedent")) return "sedentary";
  if (v.includes("liger") || v.includes("light")) return "light";
  if (v.includes("activ") && !v.includes("muy") && !v.includes("very")) return "active";
  if (v.includes("muy") || v.includes("very")) return "very_active";
  return "moderate";
}

function normalizeGoal(val: string): string {
  const v = val.toLowerCase().trim();
  if (v.includes("perdi") || v.includes("loss") || v.includes("baj")) return "weight_loss";
  if (v.includes("ganar") || v.includes("gain") || v.includes("subir") || v.includes("aumentar")) return "weight_gain";
  if (v.includes("musc")) return "muscle_gain";
  if (v.includes("salud") || v.includes("health")) return "health";
  return "maintenance";
}

// ─── Import Patients Dialog ───────────────────────────────────────────────────

function ImportPatientsDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validRows, setValidRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const bulkCreatePatients = useMutation(api.patients.bulkCreatePatients);

  function handleClose() {
    setStep("upload");
    setRawText("");
    setParsed({ headers: [], rows: [] });
    setMapping({});
    setValidRows([]);
    setErrors([]);
    onClose();
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawText(text);
    };
    reader.readAsText(file, "utf-8");
  }

  function handleParse() {
    const result = parseCSV(rawText);
    if (result.headers.length === 0) {
      toast({ title: "No se pudo leer el archivo. Verifica que sea CSV válido.", variant: "destructive" });
      return;
    }
    setParsed(result);

    // Auto-map: try to match headers to fields
    const autoMap: Record<string, string> = {};
    for (const field of PATIENT_FIELDS) {
      const match = result.headers.find((h) => {
        const hl = h.toLowerCase();
        return hl.includes(field.key.toLowerCase()) ||
          (field.key === "name" && (hl.includes("nombre") || hl.includes("paciente"))) ||
          (field.key === "sex" && (hl.includes("sex") || hl.includes("género") || hl.includes("genero"))) ||
          (field.key === "heightCm" && (hl.includes("tall") || hl.includes("altura") || hl.includes("estatura"))) ||
          (field.key === "weightKg" && (hl.includes("peso") || hl.includes("weight"))) ||
          (field.key === "age" && (hl.includes("edad") || hl.includes("age"))) ||
          (field.key === "goal" && (hl.includes("objetivo") || hl.includes("meta") || hl.includes("goal"))) ||
          (field.key === "activityLevel" && (hl.includes("actividad") || hl.includes("activity")));
      });
      if (match) autoMap[field.key] = match;
    }
    setMapping(autoMap);
    setStep("map");
  }

  function handleValidate() {
    const errs: string[] = [];
    const valid: any[] = [];

    parsed.rows.forEach((row, i) => {
      const get = (fieldKey: string) => {
        const col = mapping[fieldKey];
        if (!col) return "";
        const idx = parsed.headers.indexOf(col);
        return idx >= 0 ? (row[idx] ?? "").trim() : "";
      };

      const name = get("name");
      const sexRaw = get("sex");
      const heightRaw = get("heightCm");
      const weightRaw = get("weightKg");

      if (!name) { errs.push(`Fila ${i + 2}: falta nombre`); return; }
      if (!sexRaw) { errs.push(`Fila ${i + 2}: falta sexo`); return; }
      const heightCm = parseFloat(heightRaw);
      const weightKg = parseFloat(weightRaw);
      if (!heightRaw || isNaN(heightCm) || heightCm < 50) { errs.push(`Fila ${i + 2}: talla inválida`); return; }
      if (!weightRaw || isNaN(weightKg) || weightKg < 10) { errs.push(`Fila ${i + 2}: peso inválido`); return; }

      const ageRaw = get("age");
      const age = ageRaw ? parseInt(ageRaw) : undefined;

      valid.push({
        name,
        email: get("email") || undefined,
        phone: get("phone") || undefined,
        age: age && age > 0 && age < 120 ? age : undefined,
        sex: normalizeSex(sexRaw),
        heightCm,
        weightKg,
        activityLevel: get("activityLevel") ? normalizeActivity(get("activityLevel")) : "moderate",
        goal: get("goal") ? normalizeGoal(get("goal")) : "health",
        notes: get("notes") || undefined,
      });
    });

    setValidRows(valid);
    setErrors(errs);
    setStep("preview");
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      // Convex has a 16MB mutation limit — batch in groups of 50
      const BATCH = 50;
      let total = 0;
      for (let i = 0; i < validRows.length; i += BATCH) {
        const batch = validRows.slice(i, i + BATCH);
        const ids = await bulkCreatePatients({ patients: batch });
        total += ids.length;
      }
      onImported(total);
    } catch {
      toast({ title: "Error al importar pacientes", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar pacientes desde CSV</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Sube un archivo CSV o Excel exportado como CSV. El archivo debe tener encabezados en la primera fila.
            </p>

            <div
              className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-[hsl(var(--muted))] transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
            >
              <FileUp className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
              <p className="text-sm font-medium">Arrastra un archivo CSV aquí</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">o haz clic para seleccionar</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>O pega el contenido del CSV directamente:</Label>
              <Textarea
                rows={6}
                placeholder={"nombre,sexo,edad,peso,talla\nAna García,F,32,65,162\nCarlos López,M,45,80,175"}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="bg-[hsl(var(--muted))] rounded-lg p-3 text-xs text-[hsl(var(--muted-foreground))]">
              <p className="font-medium mb-1">Columnas recomendadas:</p>
              <p>nombre, sexo, edad, peso, talla, email, telefono, objetivo, actividad, notas</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72]"
              >
                Continuar →
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "map" && (
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Se encontraron <strong>{parsed.headers.length}</strong> columnas y <strong>{parsed.rows.length}</strong> filas.
              Asigna cada campo del sistema a la columna correspondiente del archivo.
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {PATIENT_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </Label>
                  <select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className="w-full h-8 text-sm rounded-md border border-[hsl(var(--border))] bg-background px-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  >
                    <option value="">— No mapear —</option>
                    {parsed.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview first 3 rows */}
            <div className="overflow-x-auto">
              <p className="text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Vista previa (primeras 3 filas):</p>
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    {parsed.headers.map((h) => (
                      <th key={h} className="border border-[hsl(var(--border))] px-2 py-1 bg-[hsl(var(--muted))] text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 3).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="border border-[hsl(var(--border))] px-2 py-1">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("upload")}>← Volver</Button>
              <Button
                onClick={handleValidate}
                disabled={!mapping["name"] || !mapping["sex"] || !mapping["heightCm"] || !mapping["weightKg"]}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72]"
              >
                Validar datos →
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">{validRows.length} válidos</span>
              </div>
              {errors.length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{errors.length} con errores</span>
                </div>
              )}
            </div>

            {errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                {errors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-700">{e}</p>
                ))}
              </div>
            )}

            {validRows.length > 0 && (
              <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-[hsl(var(--muted))]">
                      <th className="text-left px-3 py-2 font-medium">Nombre</th>
                      <th className="text-left px-3 py-2 font-medium">Sexo</th>
                      <th className="text-left px-3 py-2 font-medium">Edad</th>
                      <th className="text-left px-3 py-2 font-medium">Peso</th>
                      <th className="text-left px-3 py-2 font-medium">Talla</th>
                      <th className="text-left px-3 py-2 font-medium">Objetivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border))]">
                    {validRows.map((p, i) => (
                      <tr key={i} className="hover:bg-[hsl(var(--muted)/0.5)]">
                        <td className="px-3 py-1.5 font-medium">{p.name}</td>
                        <td className="px-3 py-1.5 text-[hsl(var(--muted-foreground))]">{p.sex === "male" ? "M" : "F"}</td>
                        <td className="px-3 py-1.5 text-[hsl(var(--muted-foreground))]">{p.age ?? "—"}</td>
                        <td className="px-3 py-1.5 text-[hsl(var(--muted-foreground))]">{p.weightKg} kg</td>
                        <td className="px-3 py-1.5 text-[hsl(var(--muted-foreground))]">{p.heightCm} cm</td>
                        <td className="px-3 py-1.5 text-[hsl(var(--muted-foreground))]">{p.goal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("map")}>← Volver</Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
                className="bg-[hsl(var(--cta))] text-white hover:bg-[#0a4d72]"
              >
                {importing && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Importar {validRows.length} paciente{validRows.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PatientListSkeleton() {
  return (
    <div className="divide-y divide-[hsl(var(--border))]">
      <div className="grid grid-cols-[1fr_80px_80px_160px_100px_40px_40px] gap-4 px-4 py-2.5 bg-[hsl(var(--muted))]">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_80px_80px_160px_100px_40px_40px] gap-4 px-4 py-3 items-center"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div>
              <Skeleton className="h-3.5 w-32 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          {[...Array(4)].map((_, j) => (
            <Skeleton key={j} className="h-4 w-12" />
          ))}
          <Skeleton className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
}
