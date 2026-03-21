// @ts-nocheck
"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Sparkles,
  Search,
  Loader2,
  ChevronRight,
  User,
  AlertTriangle,
  RefreshCw,
  Leaf,
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ─── SMAE reference data ──────────────────────────────────────────────────────

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
const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Pérdida de peso", maintenance: "Mantenimiento",
  weight_gain: "Ganancia de peso", muscle_gain: "Masa muscular", health: "Salud general",
};
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentario", light: "Ligero", moderate: "Moderado",
  active: "Activo", very_active: "Muy activo",
};
const ADHERENCE_COLORS: Record<string, string> = {
  alta: "bg-green-100 text-green-700 border-green-200",
  media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  baja: "bg-red-100 text-red-700 border-red-200",
};
const ADHERENCE_LABELS: Record<string, string> = {
  alta: "Adherencia alta",
  media: "Adherencia media",
  baja: "Adherencia baja",
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
  return {
    kcal: Math.round(kcal),
    p: Math.round(p * 10) / 10,
    l: Math.round(l * 10) / 10,
    hc: Math.round(hc * 10) / 10,
  };
}

// Clamp a value between min and max
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIPlanPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [step, setStep] = useState<"select" | "setup" | "recall" | "generating" | "review">("select");

  // ── Setup state ──
  const [targetKcal, setTargetKcal] = useState(2000);
  const [proteinPct, setProteinPct] = useState(20);
  const [fatPct, setFatPct] = useState(30);
  // carbsPct is derived: 100 - protein - fat

  // ── Recall state ──
  const [adaptFromRecall, setAdaptFromRecall] = useState(true);
  const [recall24h, setRecall24h] = useState("");
  const [recallFields, setRecallFields] = useState({
    desayuno: "", colAm: "", comida: "", colPm: "", cena: "",
  });

  // ── Review state ──
  const [equivalents, setEquivalents] = useState<Record<string, number>>({});
  const [reasoning, setReasoning] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [savingRecall, setSavingRecall] = useState(false);
  // Track whether recall was edited from patient's stored value
  const [recallWasEdited, setRecallWasEdited] = useState(false);

  const patients = useQuery(
    api.patients.searchPatients,
    search.trim().length > 0 ? { query: search } : { query: "" }
  );
  const generateNutritionPlan = useAction(api.ai.generateNutritionPlan);
  const createPlan = useMutation(api.plans.createPlan);
  const updatePatient = useMutation(api.patients.updatePatient);

  const carbsPct = Math.max(5, 100 - proteinPct - fatPct);
  const bmr = selectedPatient
    ? mifflinBMR(selectedPatient.weightKg, selectedPatient.heightCm, selectedPatient.age ?? 30, selectedPatient.sex)
    : 0;
  const tdeeBase = selectedPatient
    ? Math.round(bmr * (ACTIVITY_FACTORS[selectedPatient.activityLevel] ?? 1.55))
    : 0;
  const goalDelta = selectedPatient ? (GOAL_DELTA[selectedPatient.goal] ?? 0) : 0;

  const proteinG = Math.round((targetKcal * proteinPct) / 100 / 4);
  const fatG = Math.round((targetKcal * fatPct) / 100 / 9);
  const carbsG = Math.round((targetKcal * carbsPct) / 100 / 4);
  const proteinGkg = selectedPatient ? (proteinG / selectedPatient.weightKg).toFixed(1) : "—";
  const fatGkg = selectedPatient ? (fatG / selectedPatient.weightKg).toFixed(1) : "—";
  const carbsGkg = selectedPatient ? (carbsG / selectedPatient.weightKg).toFixed(1) : "—";

  const macroSum = proteinPct + fatPct + carbsPct;

  function handleSelectPatient(patient: any) {
    setSelectedPatient(patient);
    const age = patient.age ?? 30;
    const bmr = mifflinBMR(patient.weightKg, patient.heightCm, age, patient.sex);
    const actFactor = ACTIVITY_FACTORS[patient.activityLevel] ?? 1.55;
    const tdee = Math.round(bmr * actFactor);
    const delta = GOAL_DELTA[patient.goal] ?? 0;
    setTargetKcal(tdee + delta);
    setProteinPct(20);
    setFatPct(30);
    // Pre-fill recall from patient profile
    const raw = patient.recall24h ?? "";
    setRecall24h(raw);
    setRecallFields(parseRecallFields(raw));
    setAdaptFromRecall(!!(patient.recall24h));
    setRecallWasEdited(false);
    setStep("setup");
  }

  // Adjust macros while keeping sum = 100%
  function setProtein(val: number) {
    const p = clamp(val, 10, 50);
    const f = clamp(fatPct, 10, 100 - p - 5);
    setProteinPct(p);
    setFatPct(f);
  }
  function setFat(val: number) {
    const f = clamp(val, 10, 50);
    const p = clamp(proteinPct, 10, 100 - f - 5);
    setProteinPct(p);
    setFatPct(f);
  }
  function setCarbsManual(val: number) {
    const hc = clamp(val, 5, 70);
    const remaining = 100 - hc;
    // Distribute remaining proportionally between protein and fat
    const ratio = proteinPct / (proteinPct + fatPct) || 0.4;
    const p = clamp(Math.round(remaining * ratio), 10, 50);
    const f = clamp(remaining - p, 10, 50);
    setProteinPct(p);
    setFatPct(f);
  }

  // ── Recall helpers ──────────────────────────────────────────────────────────

  function composeRecall(fields: typeof recallFields): string {
    const lines = [
      fields.desayuno && `Desayuno: ${fields.desayuno}`,
      fields.colAm    && `Colación AM: ${fields.colAm}`,
      fields.comida   && `Comida: ${fields.comida}`,
      fields.colPm    && `Colación PM: ${fields.colPm}`,
      fields.cena     && `Cena: ${fields.cena}`,
    ].filter(Boolean);
    return lines.join("\n");
  }

  function parseRecallFields(raw: string): typeof recallFields {
    const fields = { desayuno: "", colAm: "", comida: "", colPm: "", cena: "" };
    if (!raw.trim()) return fields;
    // Si tiene etiquetas estructuradas, parsearlas
    if (/desayuno:/i.test(raw)) {
      fields.desayuno = (raw.match(/desayuno:\s*([^\n]*)/i)?.[1] ?? "").trim();
      fields.colAm    = (raw.match(/colaci[oó]n am:\s*([^\n]*)/i)?.[1] ?? "").trim();
      fields.comida   = (raw.match(/comida:\s*([^\n]*)/i)?.[1] ?? "").trim();
      fields.colPm    = (raw.match(/colaci[oó]n pm:\s*([^\n]*)/i)?.[1] ?? "").trim();
      fields.cena     = (raw.match(/cena:\s*([^\n]*)/i)?.[1] ?? "").trim();
    } else {
      // Formato libre: poner todo en desayuno como fallback
      fields.desayuno = raw.trim();
    }
    return fields;
  }

  function updateRecallField(key: keyof typeof recallFields, value: string) {
    const next = { ...recallFields, [key]: value };
    setRecallFields(next);
    const composed = composeRecall(next);
    setRecall24h(composed);
    setRecallWasEdited(composed.trim() !== (selectedPatient?.recall24h ?? "").trim());
  }

  async function runGenerate(fromReview = false) {
    if (!selectedPatient) return;
    if (fromReview) setRegenerating(true);
    else setStep("generating");
    try {
      const result = await generateNutritionPlan({
        sex: selectedPatient.sex,
        age: selectedPatient.age ?? 30,
        weightKg: selectedPatient.weightKg,
        heightCm: selectedPatient.heightCm,
        activityLevel: selectedPatient.activityLevel,
        goal: selectedPatient.goal,
        notes: selectedPatient.notes,
        targetCalories: targetKcal,
        targetProteinG: proteinG,
        targetFatG: fatG,
        targetCarbsG: carbsG,
        allergies: selectedPatient.allergies?.length > 0 ? selectedPatient.allergies : undefined,
        foodPreferences: selectedPatient.foodPreferences || undefined,
        recall24h: adaptFromRecall && recall24h.trim() ? recall24h.trim() : undefined,
        adaptFromRecall: adaptFromRecall && !!recall24h.trim(),
      });
      setEquivalents(result.equivalents as Record<string, number>);
      setReasoning(result.reasoning);
      if (!fromReview) setPlanTitle(`Plan Nutricional – ${selectedPatient.name}`);
      setStep("review");
    } catch (e: any) {
      toast({
        title: "Error al generar plan",
        description: e?.message ?? "Verifica la clave OPENAI_API_KEY en Convex",
        variant: "destructive",
      });
      if (!fromReview) setStep("recall");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleGenerate() { await runGenerate(false); }

  async function handleSaveRecallToProfile() {
    if (!selectedPatient || !recall24h.trim()) return;
    setSavingRecall(true);
    try {
      await updatePatient({ patientId: selectedPatient._id, recall24h: recall24h.trim() });
      toast({ title: "Recordatorio guardado en el perfil del paciente" });
      setRecallWasEdited(false);
    } catch {
      toast({ title: "Error al guardar recordatorio", variant: "destructive" });
    } finally {
      setSavingRecall(false);
    }
  }

  async function handleSave() {
    if (!selectedPatient) return;
    setSaving(true);
    const totals = computeEquivTotals(equivalents);
    const age = selectedPatient.age ?? 30;
    const bmr = mifflinBMR(selectedPatient.weightKg, selectedPatient.heightCm, age, selectedPatient.sex);
    const actFactor = ACTIVITY_FACTORS[selectedPatient.activityLevel] ?? 1.55;
    const tdeeBase = Math.round(bmr * actFactor);

    try {
      const id = await createPlan({
        patientId: selectedPatient._id,
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
      toast({ title: "Plan creado", description: "Redirigiendo al constructor de menú..." });
      window.location.href = `/plans/${id}`;
    } catch {
      toast({ title: "Error al guardar plan", variant: "destructive" });
      setSaving(false);
    }
  }

  const totals = computeEquivTotals(equivalents);

  const STEP_LABELS = [
    { key: "select",  label: "1. Paciente" },
    { key: "setup",   label: "2. Configurar" },
    { key: "recall",  label: "3. Alimentación" },
    { key: "review",  label: "4. Revisar" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[hsl(var(--primary))]" />
          Plan con IA
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
          Selecciona un paciente y la IA generará su distribución de equivalentes SMAE automáticamente.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        {STEP_LABELS.map(({ key, label }, i, arr) => {
          const stepOrder = ["select", "setup", "recall", "generating", "review"];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = stepOrder.indexOf(key);
          const isDone = currentIdx > thisIdx;
          const isCurrent = step === key || (step === "generating" && key === "recall");
          return (
            <div key={key} className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-1 rounded-full font-medium",
                isCurrent
                  ? "bg-[hsl(var(--primary))] text-white"
                  : isDone
                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              )}>
                {label}
              </span>
              {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Select patient ── */}
      {step === "select" && (
        <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-5 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Buscar paciente por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {patients === undefined ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : patients.length === 0 ? (
            <p className="text-sm text-center text-[hsl(var(--muted-foreground))] py-6">
              {search ? "Sin resultados" : "Escribe para buscar un paciente"}
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-96 overflow-y-auto">
              {patients.map((patient: any) => (
                <button
                  key={patient._id}
                  onClick={() => handleSelectPatient(patient)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{patient.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {patient.age ? `${patient.age} años · ` : ""}
                      {patient.sex === "male" ? "M" : "F"} · {patient.weightKg} kg · {patient.heightCm} cm ·{" "}
                      {GOAL_LABELS[patient.goal] ?? patient.goal}
                    </p>
                    {patient.allergies?.length > 0 && (
                      <p className="text-xs text-red-600 mt-0.5">
                        Alergias: {patient.allergies.join(", ")}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Setup ── */}
      {step === "setup" && selectedPatient && (
        <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-5 flex flex-col gap-5">
          {/* Patient summary */}
          <div className="bg-[hsl(var(--muted))] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Paciente</p>
              <p className="font-medium truncate">{selectedPatient.name}</p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Objetivo</p>
              <p className="font-medium">{GOAL_LABELS[selectedPatient.goal] ?? selectedPatient.goal}</p>
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

          {/* Allergies / preferences reminder */}
          {(selectedPatient.allergies?.length > 0 || selectedPatient.foodPreferences || selectedPatient.adherenceRating) && (
            <div className="flex flex-wrap gap-2 p-3 bg-orange-50 border border-orange-100 rounded-xl">
              {selectedPatient.allergies?.length > 0 && (
                <div className="flex items-start gap-2 w-full">
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-orange-700">Alergias / intolerancias</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedPatient.allergies.map((a: string) => (
                        <span key={a} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full border border-red-200">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {selectedPatient.foodPreferences && (
                <div className="flex items-center gap-2 w-full">
                  <Leaf className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-xs text-green-800">
                    <span className="font-semibold">Preferencias:</span> {selectedPatient.foodPreferences}
                  </p>
                </div>
              )}
              {selectedPatient.adherenceRating && (
                <span className={cn(
                  "text-xs px-2.5 py-0.5 rounded-full border font-medium",
                  ADHERENCE_COLORS[selectedPatient.adherenceRating]
                )}>
                  {ADHERENCE_LABELS[selectedPatient.adherenceRating]}
                </span>
              )}
            </div>
          )}

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
                TDEE {tdeeBase} kcal · ajuste {goalDelta >= 0 ? "+" : ""}{goalDelta} kcal
              </span>
            </div>
          </div>

          {/* Macro distribution — all 3 editable */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Distribución de macronutrimentos</Label>
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                macroSum === 100
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              )}>
                {macroSum}% {macroSum === 100 ? "✓" : "≠ 100%"}
              </span>
            </div>

            {/* Visual bar */}
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              <div className="bg-blue-400 transition-all" style={{ width: `${proteinPct}%` }} />
              <div className="bg-yellow-400 transition-all" style={{ width: `${fatPct}%` }} />
              <div className="bg-[hsl(var(--primary))] transition-all" style={{ width: `${carbsPct}%` }} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Protein */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-600">Proteínas</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setProtein(proteinPct - 5)}
                    className="w-6 h-6 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] text-sm font-bold"
                  >−</button>
                  <span className="flex-1 text-center text-sm font-semibold">{proteinPct}%</span>
                  <button
                    type="button"
                    onClick={() => setProtein(proteinPct + 5)}
                    className="w-6 h-6 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] text-sm font-bold"
                  >+</button>
                </div>
                <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
                  {proteinG} g · {proteinGkg} g/kg
                </p>
              </div>

              {/* Fat */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-yellow-600">Grasas</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFat(fatPct - 5)}
                    className="w-6 h-6 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] text-sm font-bold"
                  >−</button>
                  <span className="flex-1 text-center text-sm font-semibold">{fatPct}%</span>
                  <button
                    type="button"
                    onClick={() => setFat(fatPct + 5)}
                    className="w-6 h-6 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] text-sm font-bold"
                  >+</button>
                </div>
                <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
                  {fatG} g · {fatGkg} g/kg
                </p>
              </div>

              {/* Carbs */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-[hsl(var(--primary))]">HC</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCarbsManual(carbsPct - 5)}
                    className="w-6 h-6 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] text-sm font-bold"
                  >−</button>
                  <span className="flex-1 text-center text-sm font-semibold">{carbsPct}%</span>
                  <button
                    type="button"
                    onClick={() => setCarbsManual(carbsPct + 5)}
                    className="w-6 h-6 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] text-sm font-bold"
                  >+</button>
                </div>
                <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
                  {carbsG} g · {carbsGkg} g/kg
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={() => { setSelectedPatient(null); setStep("select"); }}>
              ← Cambiar paciente
            </Button>
            <Button
              onClick={() => setStep("recall")}
              className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)] gap-1.5"
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Recall / eating habits ── */}
      {step === "recall" && selectedPatient && (
        <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-5 flex flex-col gap-5">
          <div>
            <h2 className="text-sm font-semibold">Alimentación habitual</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              Indica si la IA debe adaptar el plan a los hábitos del paciente o generar uno desde cero.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdaptFromRecall(true)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-colors",
                adaptFromRecall
                  ? "border-[hsl(var(--primary))] bg-[hsl(81,10%,96%)] text-[hsl(var(--primary))]"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Adaptar dieta habitual
              <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                Mejora adherencia gradualmente
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAdaptFromRecall(false)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-colors",
                !adaptFromRecall
                  ? "border-[hsl(var(--primary))] bg-[hsl(81,10%,96%)] text-[hsl(var(--primary))]"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Empezar desde cero
              <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                Plan nuevo sin restricciones
              </span>
            </button>
          </div>

          {/* Recall estructurado */}
          {adaptFromRecall && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-[hsl(var(--text-strong))]">
                  Recordatorio 24 horas
                  {selectedPatient.recall24h && (
                    <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-normal">
                      cargado del perfil
                    </span>
                  )}
                </Label>
                {recallWasEdited && recall24h.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveRecallToProfile}
                    disabled={savingRecall}
                    className="h-6 text-[10px] px-2 gap-1"
                  >
                    {savingRecall
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : null}
                    Guardar en perfil
                  </Button>
                )}
              </div>

              {/* 5 meal fields */}
              {([
                { key: "desayuno" as const, icon: Sun,      label: "Desayuno",     placeholder: "Ej: 2 huevos revueltos, 2 tortillas, café con leche",        accent: "#d97706", bg: "#fef9c3" },
                { key: "colAm"    as const, icon: Coffee,   label: "Colación AM",  placeholder: "Ej: 1 fruta, yogurt, puñado de nueces",                       accent: "#16a34a", bg: "#dcfce7" },
                { key: "comida"   as const, icon: Utensils, label: "Comida",       placeholder: "Ej: arroz, frijoles, pollo a la plancha, agua de sabor",      accent: "#2563eb", bg: "#dbeafe" },
                { key: "colPm"    as const, icon: Apple,    label: "Colación PM",  placeholder: "Ej: galletas, fruta, agua de sabor",                          accent: "#ea580c", bg: "#ffedd5" },
                { key: "cena"     as const, icon: Moon,     label: "Cena",         placeholder: "Ej: sopa de pasta, pan dulce, leche",                         accent: "#7c3aed", bg: "#ede9fe" },
              ] as const).map(({ key, icon: Icon, label, placeholder, accent, bg }) => (
                <div
                  key={key}
                  className="flex gap-2.5 items-start rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2.5 focus-within:border-[hsl(var(--primary))] transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">
                      {label}
                    </p>
                    <textarea
                      rows={1}
                      value={recallFields[key]}
                      onChange={(e) => updateRecallField(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full resize-none bg-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 outline-none leading-snug"
                      style={{ minHeight: "1.4rem" }}
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }}
                    />
                  </div>
                </div>
              ))}

              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                La IA reconocerá los patrones y ajustará el plan gradualmente hacia los objetivos nutricionales. Puedes dejar vacíos los tiempos que no apliquen.
              </p>
            </div>
          )}

          {!adaptFromRecall && (
            <div className="bg-[hsl(var(--muted))] rounded-xl p-4 text-sm text-[hsl(var(--muted-foreground))]">
              La IA generará un plan completamente nuevo basado en el objetivo calórico y los macros configurados,
              sin considerar los hábitos alimentarios previos del paciente.
            </div>
          )}

          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={() => setStep("setup")}>← Ajustar configuración</Button>
            <Button
              onClick={handleGenerate}
              className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)] gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generar con IA
            </Button>
          </div>
        </div>
      )}

      {/* ── Generating ── */}
      {step === "generating" && (
        <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[hsl(var(--primary))] animate-pulse" />
          </div>
          <p className="text-sm font-semibold">Generando plan con IA...</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center max-w-sm">
            {adaptFromRecall && recall24h
              ? "Analizando hábitos alimentarios y ajustando gradualmente hacia los objetivos nutricionales..."
              : "Calculando la distribución óptima de equivalentes SMAE..."}
            {" "}para <strong>{selectedPatient?.name}</strong>.
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      )}

      {/* ── Step 4: Review ── */}
      {step === "review" && (
        <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-5 flex flex-col gap-4">
          {/* AI reasoning */}
          {reasoning && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Razonamiento clínico de la IA
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">{reasoning}</p>
            </div>
          )}

          {/* Macro totals */}
          <div className="grid grid-cols-4 gap-2 bg-[hsl(var(--muted))] rounded-xl p-3 text-center">
            <div>
              <p className="text-sm font-bold">{totals.kcal}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">kcal total</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                ({Math.round((totals.kcal / targetKcal) * 100)}% objetivo)
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-blue-600">{totals.p}g</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">proteína</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {selectedPatient ? (totals.p / selectedPatient.weightKg).toFixed(1) : "—"} g/kg
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-600">{totals.l}g</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">grasa</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {selectedPatient ? (totals.l / selectedPatient.weightKg).toFixed(1) : "—"} g/kg
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-[hsl(var(--primary))]">{totals.hc}g</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">HC</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {selectedPatient ? (totals.hc / selectedPatient.weightKg).toFixed(1) : "—"} g/kg
              </p>
            </div>
          </div>

          {/* Equivalents table */}
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
                    <tr key={key} className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/40">
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

          {/* Save recall to profile banner */}
          {adaptFromRecall && recallWasEdited && recall24h.trim() && (
            <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-800">
                El recordatorio fue editado. ¿Actualizar el perfil del paciente con esta versión?
              </p>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-blue-700 border-blue-200 hover:bg-blue-100"
                onClick={handleSaveRecallToProfile}
                disabled={savingRecall}
              >
                {savingRecall ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Actualizar perfil"}
              </Button>
            </div>
          )}

          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("recall")}>← Ajustar</Button>
              <Button
                variant="outline"
                onClick={() => runGenerate(true)}
                disabled={regenerating}
                className="gap-1.5"
              >
                {regenerating
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />}
                Regenerar
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !planTitle.trim() || regenerating}
              className="bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)] gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Guardar plan
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
