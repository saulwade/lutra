// @ts-nocheck
"use client";

import { useState } from "react";
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
  CheckCircle2,
  Info,
  Sun,
  Moon,
  Coffee,
  Utensils,
  Apple,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  SMAE_DATA,
  SMAE_KEYS,
  GOAL_LABELS,
  ACTIVITY_LABELS,
  GOAL_ADJUSTMENTS,
  ACTIVITY_FACTORS,
  calculateProtocol,
  distributeSMAE,
  computeEquivalentTotals,
  validatePlan,
  type ClinicalProtocol,
  type SmaeKey,
  type ValidationReport,
} from "@/lib/clinical-engine";

export const dynamic = "force-dynamic";

// ─── Local constants (only used in this page) ─────────────────────────────────

const ADHERENCE_COLORS: Record<string, string> = {
  alta:  "bg-green-100 text-green-700 border-green-200",
  media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  baja:  "bg-red-100 text-red-700 border-red-200",
};
const ADHERENCE_LABELS: Record<string, string> = {
  alta:  "Adherencia alta",
  media: "Adherencia media",
  baja:  "Adherencia baja",
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIPlanPage() {
  const { toast } = useToast();
  const [search, setSearch]                 = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [step, setStep] = useState<"select" | "setup" | "recall" | "generating" | "review">("select");

  // ── Protocol & setup state ──
  const [protocol, setProtocol]         = useState<ClinicalProtocol | null>(null);
  const [targetKcal, setTargetKcal]     = useState(2000);
  // Advanced macro override (off by default — deterministic values are used)
  const [macroOverride, setMacroOverride] = useState(false);
  const [proteinPct, setProteinPct]     = useState(20);
  const [fatPct, setFatPct]             = useState(30);

  // ── Recall state ──
  const [adaptFromRecall, setAdaptFromRecall] = useState(true);
  const [recall24h, setRecall24h]             = useState("");
  const [recallFields, setRecallFields]       = useState({
    desayuno: "", colAm: "", comida: "", colPm: "", cena: "",
  });

  // ── Review state ──
  const [equivalents, setEquivalents]     = useState<Record<string, number>>({});
  const [reasoning, setReasoning]         = useState("");
  const [validation, setValidation]       = useState<ValidationReport | null>(null);
  const [planTitle, setPlanTitle]         = useState("");
  const [saving, setSaving]               = useState(false);
  const [regenerating, setRegenerating]   = useState(false);
  const [savingRecall, setSavingRecall]   = useState(false);
  const [recallWasEdited, setRecallWasEdited] = useState(false);

  const patients             = useQuery(api.patients.searchPatients, { query: search });
  const generateNutritionPlan = useAction(api.ai.generateNutritionPlan);
  const createPlan           = useMutation(api.plans.createPlan);
  const updatePatient        = useMutation(api.patients.updatePatient);

  // ── Derived macro values ───────────────────────────────────────────────────
  // If macroOverride is off: use protocol values (deterministic)
  // If macroOverride is on:  use the slider percentages
  const carbsPct = Math.max(5, 100 - proteinPct - fatPct);

  const activeProteinG = macroOverride
    ? Math.round((targetKcal * proteinPct) / 100 / 4)
    : protocol?.targetProteinG ?? Math.round((targetKcal * 0.20) / 4);

  const activeFatG = macroOverride
    ? Math.round((targetKcal * fatPct) / 100 / 9)
    : protocol?.targetFatG ?? Math.round((targetKcal * 0.30) / 9);

  const activeCarbsG = Math.round((targetKcal - activeProteinG * 4 - activeFatG * 9) / 4);

  // Display percentages (always show actual %)
  const displayProteinPct = macroOverride
    ? proteinPct
    : protocol?.proteinPct ?? Math.round((activeProteinG * 4 / targetKcal) * 100);
  const displayFatPct = macroOverride
    ? fatPct
    : protocol?.fatPct ?? 30;
  const displayCarbsPct = macroOverride
    ? carbsPct
    : protocol?.carbsPct ?? Math.round((activeCarbsG * 4 / targetKcal) * 100);

  const proteinGkg = selectedPatient
    ? (activeProteinG / selectedPatient.weightKg).toFixed(1)
    : "—";

  // ── Patient selection ──────────────────────────────────────────────────────

  function handleSelectPatient(patient: any) {
    setSelectedPatient(patient);

    // Compute protocol deterministically
    const p = calculateProtocol(
      {
        sex:           patient.sex,
        ageYears:      patient.age ?? 30,
        weightKg:      patient.weightKg,
        heightCm:      patient.heightCm,
        activityLevel: patient.activityLevel,
        goal:          patient.goal,
      },
      "mifflin",
    );
    setProtocol(p);
    setTargetKcal(p.targetCalories);
    // Sliders start at protocol values (used only if override is enabled)
    setProteinPct(p.proteinPct);
    setFatPct(p.fatPct);
    setMacroOverride(false);

    // Pre-fill recall
    const raw = patient.recall24h ?? "";
    setRecall24h(raw);
    setRecallFields(parseRecallFields(raw));
    setAdaptFromRecall(!!(patient.recall24h));
    setRecallWasEdited(false);
    setStep("setup");
  }

  // Recompute protocol when kcal is manually changed
  function handleKcalChange(kcal: number) {
    setTargetKcal(kcal);
    if (!selectedPatient) return;
    const p = calculateProtocol(
      {
        sex:           selectedPatient.sex,
        ageYears:      selectedPatient.age ?? 30,
        weightKg:      selectedPatient.weightKg,
        heightCm:      selectedPatient.heightCm,
        activityLevel: selectedPatient.activityLevel,
        goal:          selectedPatient.goal,
      },
      "mifflin",
      kcal,
    );
    setProtocol(p);
    if (!macroOverride) {
      setProteinPct(p.proteinPct);
      setFatPct(p.fatPct);
    }
  }

  // ── Macro override sliders ──────────────────────────────────────────────────

  function setProtein(val: number) {
    const p = clamp(val, 10, 50);
    const f = clamp(fatPct, 10, 100 - p - 5);
    setProteinPct(p); setFatPct(f);
  }
  function setFat(val: number) {
    const f = clamp(val, 10, 50);
    const p = clamp(proteinPct, 10, 100 - f - 5);
    setProteinPct(p); setFatPct(f);
  }
  function setCarbsManual(val: number) {
    const hc = clamp(val, 5, 70);
    const remaining = 100 - hc;
    const ratio = proteinPct / (proteinPct + fatPct) || 0.4;
    const p = clamp(Math.round(remaining * ratio), 10, 50);
    const f = clamp(remaining - p, 10, 50);
    setProteinPct(p); setFatPct(f);
  }

  // ── Recall helpers ──────────────────────────────────────────────────────────

  function composeRecall(fields: typeof recallFields): string {
    return [
      fields.desayuno && `Desayuno: ${fields.desayuno}`,
      fields.colAm    && `Colación AM: ${fields.colAm}`,
      fields.comida   && `Comida: ${fields.comida}`,
      fields.colPm    && `Colación PM: ${fields.colPm}`,
      fields.cena     && `Cena: ${fields.cena}`,
    ].filter(Boolean).join("\n");
  }

  function parseRecallFields(raw: string): typeof recallFields {
    const fields = { desayuno: "", colAm: "", comida: "", colPm: "", cena: "" };
    if (!raw.trim()) return fields;
    if (/desayuno:/i.test(raw)) {
      fields.desayuno = (raw.match(/desayuno:\s*([^\n]*)/i)?.[1] ?? "").trim();
      fields.colAm    = (raw.match(/colaci[oó]n am:\s*([^\n]*)/i)?.[1] ?? "").trim();
      fields.comida   = (raw.match(/comida:\s*([^\n]*)/i)?.[1] ?? "").trim();
      fields.colPm    = (raw.match(/colaci[oó]n pm:\s*([^\n]*)/i)?.[1] ?? "").trim();
      fields.cena     = (raw.match(/cena:\s*([^\n]*)/i)?.[1] ?? "").trim();
    } else {
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

  // ── Equivalents adjustment (with live re-validation) ───────────────────────

  function adjustEquivalent(key: SmaeKey, delta: number) {
    const newEquivs = { ...equivalents, [key]: Math.max(0, (equivalents[key] ?? 0) + delta) };
    setEquivalents(newEquivs);
    if (selectedPatient && protocol) {
      setValidation(validatePlan(
        newEquivs,
        {
          kcal:     protocol.targetCalories,
          proteinG: activeProteinG,
          fatG:     activeFatG,
          carbsG:   activeCarbsG,
        },
        selectedPatient.weightKg,
      ));
    }
  }

  // ── Generate ────────────────────────────────────────────────────────────────

  async function runGenerate(fromReview = false) {
    if (!selectedPatient || !protocol) return;
    if (fromReview) setRegenerating(true);
    else setStep("generating");

    try {
      // Layer 2 — Deterministic SMAE distribution (no AI)
      const dairyFree  = selectedPatient.allergies?.some((a: string) =>
        /l[aá]cteo|leche|lactosa|dairy/i.test(a));
      const vegetarian = /vegetariana?|vegana?/i.test(selectedPatient.foodPreferences ?? "");

      const dist = distributeSMAE(
        { kcal: targetKcal, proteinG: activeProteinG, fatG: activeFatG },
        { goal: selectedPatient.goal, dairyFree, vegetarian },
      );

      // Layer 4 — Validate immediately
      const val = validatePlan(
        dist.equivalents as Record<string, number>,
        {
          kcal:     targetKcal,
          proteinG: activeProteinG,
          fatG:     activeFatG,
          carbsG:   activeCarbsG,
        },
        selectedPatient.weightKg,
      );

      // Layer 3 — AI generates reasoning text only (equivalents are already fixed)
      const result = await generateNutritionPlan({
        sex:             selectedPatient.sex,
        age:             selectedPatient.age ?? 30,
        weightKg:        selectedPatient.weightKg,
        heightCm:        selectedPatient.heightCm,
        activityLevel:   selectedPatient.activityLevel,
        goal:            selectedPatient.goal,
        notes:           selectedPatient.notes,
        allergies:       selectedPatient.allergies?.length > 0 ? selectedPatient.allergies : undefined,
        foodPreferences: selectedPatient.foodPreferences || undefined,
        recall24h:       adaptFromRecall && recall24h.trim() ? recall24h.trim() : undefined,
        adaptFromRecall: adaptFromRecall && !!recall24h.trim(),
        targetCalories:  targetKcal,
        targetProteinG:  activeProteinG,
        targetFatG:      activeFatG,
        targetCarbsG:    activeCarbsG,
        bmr:             protocol.bmr,
        tdee:            protocol.tdee,
        proteinGperKg:   protocol.proteinGperKg,
        formula:         protocol.formula,
        equivalents: {
          verduras:         dist.equivalents.verduras         ?? 0,
          frutas:           dist.equivalents.frutas           ?? 0,
          cerealesSinGrasa: dist.equivalents.cerealesSinGrasa ?? 0,
          cerealesConGrasa: dist.equivalents.cerealesConGrasa ?? 0,
          leguminosas:      dist.equivalents.leguminosas      ?? 0,
          aoaMuyBajaGrasa:  dist.equivalents.aoaMuyBajaGrasa  ?? 0,
          aoaBajaGrasa:     dist.equivalents.aoaBajaGrasa     ?? 0,
          aoaMedGrasa:      dist.equivalents.aoaMedGrasa      ?? 0,
          aoaAltaGrasa:     dist.equivalents.aoaAltaGrasa     ?? 0,
          lecheDes:         dist.equivalents.lecheDes         ?? 0,
          lecheSemi:        dist.equivalents.lecheSemi        ?? 0,
          lecheEntera:      dist.equivalents.lecheEntera      ?? 0,
          lecheConAzucar:   dist.equivalents.lecheConAzucar   ?? 0,
          grasasSinProt:    dist.equivalents.grasasSinProt    ?? 0,
          grasasConProt:    dist.equivalents.grasasConProt    ?? 0,
          azucaresSinGrasa: dist.equivalents.azucaresSinGrasa ?? 0,
          azucaresConGrasa: dist.equivalents.azucaresConGrasa ?? 0,
        },
      });

      // State from engine (not from AI)
      setEquivalents(dist.equivalents as Record<string, number>);
      setValidation(val);
      setReasoning(result.reasoning ?? "");
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
    if (!selectedPatient || !protocol) return;
    setSaving(true);
    const totals = computeEquivalentTotals(equivalents);

    try {
      const id = await createPlan({
        patientId:       selectedPatient._id,
        title:           planTitle,
        status:          "draft",
        targetCalories:  totals.kcal,
        targetProteinG:  totals.proteinG,
        targetFatG:      totals.fatG,
        targetCarbsG:    totals.carbsG,
        targetProteinPct: totals.kcal > 0 ? Math.round((totals.proteinG * 4 / totals.kcal) * 100) : 0,
        targetFatPct:    totals.kcal > 0 ? Math.round((totals.fatG * 9 / totals.kcal) * 100) : 0,
        targetCarbsPct:  totals.kcal > 0 ? Math.round((totals.carbsG * 4 / totals.kcal) * 100) : 0,
        calculationMethod: `${protocol.formula}_deterministic`,
        calculationFactor: protocol.activityFactor,
        bmr:             protocol.bmr,
        tdee:            protocol.tdee,
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

  const totals = computeEquivalentTotals(equivalents);

  // ── Step labels ─────────────────────────────────────────────────────────────
  const STEP_LABELS = [
    { key: "select", label: "1. Paciente" },
    { key: "setup",  label: "2. Configurar" },
    { key: "recall", label: "3. Alimentación" },
    { key: "review", label: "4. Revisar" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[hsl(var(--primary))]" />
          Plan con IA
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
          Cálculos clínicos deterministas. La IA solo redacta la justificación.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        {STEP_LABELS.map(({ key, label }, i, arr) => {
          const stepOrder = ["select", "setup", "recall", "generating", "review"];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx    = stepOrder.indexOf(key);
          const isDone     = currentIdx > thisIdx;
          const isCurrent  = step === key || (step === "generating" && key === "recall");
          return (
            <div key={key} className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-1 rounded-full font-medium",
                isCurrent
                  ? "bg-[hsl(var(--primary))] text-white"
                  : isDone
                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
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
      {step === "setup" && selectedPatient && protocol && (
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
              <p className="text-xs text-[hsl(var(--muted-foreground))]">TMB ({protocol.formula === "mifflin" ? "Mifflin" : "Harris-B."})</p>
              <p className="font-medium">{protocol.bmr} kcal</p>
            </div>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">GET estimado</p>
              <p className="font-medium">{protocol.tdee} kcal</p>
            </div>
          </div>

          {/* Protocol traceability */}
          <div className="bg-[hsl(var(--accent))]/50 border border-[hsl(var(--border))] rounded-xl p-3 text-xs space-y-1 text-[hsl(var(--muted-foreground))]">
            <p className="font-semibold text-[hsl(var(--foreground))] text-[11px] uppercase tracking-wide mb-1.5">
              Cálculo energético
            </p>
            <p>
              <span className="font-medium text-[hsl(var(--foreground))]">Fórmula:</span>{" "}
              {protocol.formula === "mifflin" ? "Mifflin-St Jeor (1990)" : "Harris-Benedict revisada (1984)"}
            </p>
            <p>
              <span className="font-medium text-[hsl(var(--foreground))]">TMB:</span> {protocol.bmr} kcal{" "}
              × {protocol.activityFactor} ({ACTIVITY_LABELS[selectedPatient.activityLevel] ?? selectedPatient.activityLevel}){" "}
              = <span className="font-medium text-[hsl(var(--foreground))]">{protocol.tdee} kcal GET</span>
            </p>
            <p>
              <span className="font-medium text-[hsl(var(--foreground))]">Ajuste objetivo:</span>{" "}
              {protocol.goalAdjustmentKcal >= 0 ? "+" : ""}{protocol.goalAdjustmentKcal} kcal
              ({GOAL_LABELS[selectedPatient.goal] ?? selectedPatient.goal})
            </p>
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
                  ADHERENCE_COLORS[selectedPatient.adherenceRating],
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
                onChange={(e) => handleKcalChange(Number(e.target.value) || protocol.tdee)}
                className="w-32"
              />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                GET {protocol.tdee} kcal · ajuste {protocol.goalAdjustmentKcal >= 0 ? "+" : ""}{protocol.goalAdjustmentKcal} kcal
              </span>
            </div>
          </div>

          {/* Macro distribution — deterministic by default */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Distribución de macronutrimentos</Label>
              <button
                type="button"
                onClick={() => setMacroOverride(!macroOverride)}
                className="text-xs text-[hsl(var(--primary))] hover:underline"
              >
                {macroOverride ? "Usar valores calculados" : "Ajustar manualmente"}
              </button>
            </div>

            {/* Visual bar */}
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
              <div className="bg-blue-400 transition-all" style={{ width: `${displayProteinPct}%` }} />
              <div className="bg-yellow-400 transition-all" style={{ width: `${displayFatPct}%` }} />
              <div className="bg-[hsl(var(--primary))] transition-all" style={{ width: `${displayCarbsPct}%` }} />
            </div>

            {/* Macro values */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {/* Protein */}
              <div className="bg-[hsl(var(--muted))] rounded-xl p-3 space-y-0.5">
                <p className="text-xs font-semibold text-blue-600">Proteínas</p>
                {macroOverride ? (
                  <div className="flex items-center justify-center gap-1">
                    <button type="button" onClick={() => setProtein(proteinPct - 5)}
                      className="w-6 h-6 rounded bg-white/60 hover:bg-white font-bold text-sm">−</button>
                    <span className="text-sm font-semibold w-8">{proteinPct}%</span>
                    <button type="button" onClick={() => setProtein(proteinPct + 5)}
                      className="w-6 h-6 rounded bg-white/60 hover:bg-white font-bold text-sm">+</button>
                  </div>
                ) : (
                  <p className="text-sm font-bold">{displayProteinPct}%</p>
                )}
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{activeProteinG}g · {proteinGkg} g/kg</p>
                <p className={cn(
                  "text-[10px] font-medium",
                  displayProteinPct >= 10 && displayProteinPct <= 35 ? "text-green-600" : "text-red-600",
                )}>
                  AMDR 10–35% {displayProteinPct >= 10 && displayProteinPct <= 35 ? "✓" : "⚠"}
                </p>
              </div>

              {/* Fat */}
              <div className="bg-[hsl(var(--muted))] rounded-xl p-3 space-y-0.5">
                <p className="text-xs font-semibold text-yellow-600">Grasas</p>
                {macroOverride ? (
                  <div className="flex items-center justify-center gap-1">
                    <button type="button" onClick={() => setFat(fatPct - 5)}
                      className="w-6 h-6 rounded bg-white/60 hover:bg-white font-bold text-sm">−</button>
                    <span className="text-sm font-semibold w-8">{fatPct}%</span>
                    <button type="button" onClick={() => setFat(fatPct + 5)}
                      className="w-6 h-6 rounded bg-white/60 hover:bg-white font-bold text-sm">+</button>
                  </div>
                ) : (
                  <p className="text-sm font-bold">{displayFatPct}%</p>
                )}
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{activeFatG}g</p>
                <p className={cn(
                  "text-[10px] font-medium",
                  displayFatPct >= 20 && displayFatPct <= 35 ? "text-green-600" : "text-red-600",
                )}>
                  AMDR 20–35% {displayFatPct >= 20 && displayFatPct <= 35 ? "✓" : "⚠"}
                </p>
              </div>

              {/* Carbs */}
              <div className="bg-[hsl(var(--muted))] rounded-xl p-3 space-y-0.5">
                <p className="text-xs font-semibold text-[hsl(var(--primary))]">HC</p>
                {macroOverride ? (
                  <div className="flex items-center justify-center gap-1">
                    <button type="button" onClick={() => setCarbsManual(displayCarbsPct - 5)}
                      className="w-6 h-6 rounded bg-white/60 hover:bg-white font-bold text-sm">−</button>
                    <span className="text-sm font-semibold w-8">{displayCarbsPct}%</span>
                    <button type="button" onClick={() => setCarbsManual(displayCarbsPct + 5)}
                      className="w-6 h-6 rounded bg-white/60 hover:bg-white font-bold text-sm">+</button>
                  </div>
                ) : (
                  <p className="text-sm font-bold">{displayCarbsPct}%</p>
                )}
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{activeCarbsG}g</p>
                <p className={cn(
                  "text-[10px] font-medium",
                  displayCarbsPct >= 45 && displayCarbsPct <= 65 ? "text-green-600" : "text-amber-600",
                )}>
                  AMDR 45–65% {displayCarbsPct >= 45 && displayCarbsPct <= 65 ? "✓" : "⚠"}
                </p>
              </div>
            </div>

            {!macroOverride && (
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Proteína calculada a <strong>{protocol.proteinGperKg.toFixed(1)} g/kg</strong> según objetivo.
                Grasa al 30% kcal. HC completa el resto. Basado en AMDR (IOM, 2005).
              </p>
            )}
          </div>

          {/* Clinical warnings from protocol */}
          {protocol.warnings.length > 0 && (
            <div className="flex flex-col gap-1.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Avisos clínicos
              </p>
              {protocol.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-800">• {w}</p>
              ))}
            </div>
          )}

          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={() => { setSelectedPatient(null); setStep("select"); }}>
              ← Cambiar paciente
            </Button>
            <Button
              onClick={() => setStep("recall")}
              className="bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A] gap-1.5"
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
              Opcional. La IA usará esto solo para redactar la justificación clínica — no altera los cálculos.
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
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Incluir hábitos
              <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                Para la justificación
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAdaptFromRecall(false)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-colors",
                !adaptFromRecall
                  ? "border-[hsl(var(--primary))] bg-[hsl(81,10%,96%)] text-[hsl(var(--primary))]"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]",
              )}
            >
              <Sparkles className="w-4 h-4" />
              Omitir
              <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                Sin hábitos previos
              </span>
            </button>
          </div>

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
                    variant="outline" size="sm"
                    onClick={handleSaveRecallToProfile}
                    disabled={savingRecall}
                    className="h-6 text-[10px] px-2 gap-1"
                  >
                    {savingRecall && <Loader2 className="w-3 h-3 animate-spin" />}
                    Guardar en perfil
                  </Button>
                )}
              </div>

              {([
                { key: "desayuno" as const, icon: Sun,      label: "Desayuno",    placeholder: "Ej: 2 huevos, 2 tortillas, café con leche",        accent: "#d97706", bg: "#fef9c3" },
                { key: "colAm"    as const, icon: Coffee,   label: "Colación AM", placeholder: "Ej: fruta, yogurt, nueces",                        accent: "#16a34a", bg: "#dcfce7" },
                { key: "comida"   as const, icon: Utensils, label: "Comida",      placeholder: "Ej: arroz, frijoles, pollo a la plancha",           accent: "#2563eb", bg: "#dbeafe" },
                { key: "colPm"    as const, icon: Apple,    label: "Colación PM", placeholder: "Ej: galletas, fruta",                              accent: "#ea580c", bg: "#ffedd5" },
                { key: "cena"     as const, icon: Moon,     label: "Cena",        placeholder: "Ej: sopa, pan, leche",                             accent: "#7c3aed", bg: "#ede9fe" },
              ] as const).map(({ key, icon: Icon, label, placeholder, accent, bg }) => (
                <div
                  key={key}
                  className="flex gap-2.5 items-start rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2.5 focus-within:border-[hsl(var(--primary))] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: bg }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">{label}</p>
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
            </div>
          )}

          {!adaptFromRecall && (
            <div className="bg-[hsl(var(--muted))] rounded-xl p-4 text-sm text-[hsl(var(--muted-foreground))]">
              Los equivalentes SMAE se calcularán solo con el protocolo energético del paciente.
            </div>
          )}

          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={() => setStep("setup")}>← Ajustar configuración</Button>
            <Button
              onClick={handleGenerate}
              className="bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A] gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generar plan
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
          <p className="text-sm font-semibold">Calculando plan...</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center max-w-sm">
            Motor determinista calculando equivalentes SMAE para{" "}
            <strong>{selectedPatient?.name}</strong>. La IA redactará la justificación.
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      )}

      {/* ── Step 4: Review ── */}
      {step === "review" && (
        <div className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-5 flex flex-col gap-4">

          {/* Validation report */}
          {validation && (
            <div className={cn(
              "rounded-xl p-3 border",
              validation.status === "ok"
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200",
            )}>
              <div className="flex items-center gap-1.5 mb-1.5">
                {validation.status === "ok"
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                <p className={cn(
                  "text-xs font-semibold",
                  validation.status === "ok" ? "text-green-700" : "text-amber-700",
                )}>
                  {validation.status === "ok" ? "Plan validado" : `${validation.issues.length} aviso${validation.issues.length > 1 ? "s" : ""} clínico${validation.issues.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                <span>
                  <strong className={validation.status === "ok" ? "text-green-700" : "text-amber-700"}>
                    {totals.kcal} kcal
                  </strong>{" "}
                  ({validation.kcalDeviationPct >= 0 ? "+" : ""}{validation.kcalDeviationPct}% vs objetivo)
                </span>
                <span>Proteína: {validation.actualProteinPct}%{" "}
                  <span className={validation.proteinInAMDR ? "text-green-600" : "text-red-600"}>
                    {validation.proteinInAMDR ? "✓" : "⚠"} AMDR
                  </span>{" "}
                  · {validation.actualProteinGperKg} g/kg
                </span>
                <span>Grasa: {validation.actualFatPct}%{" "}
                  <span className={validation.fatInAMDR ? "text-green-600" : "text-red-600"}>
                    {validation.fatInAMDR ? "✓" : "⚠"}
                  </span>
                </span>
                <span>HC: {validation.actualCarbsPct}%{" "}
                  <span className={validation.carbsInAMDR ? "text-green-600" : "text-amber-600"}>
                    {validation.carbsInAMDR ? "✓" : "⚠"}
                  </span>
                </span>
              </div>
              {validation.issues.length > 0 && (
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {validation.issues.map((issue, i) => (
                    <p key={i} className="text-[11px] text-amber-800">• {issue}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI reasoning */}
          {reasoning && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Justificación clínica
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">{reasoning}</p>
            </div>
          )}

          {/* Macro totals */}
          <div className="grid grid-cols-4 gap-2 bg-[hsl(var(--muted))] rounded-xl p-3 text-center">
            <div>
              <p className="text-sm font-bold">{totals.kcal}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">kcal total</p>
              {protocol && (
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  (objetivo: {protocol.targetCalories})
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-blue-600">{totals.proteinG}g</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">proteína</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {selectedPatient ? (totals.proteinG / selectedPatient.weightKg).toFixed(1) : "—"} g/kg
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-600">{totals.fatG}g</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">grasa</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[hsl(var(--primary))]">{totals.carbsG}g</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">HC</p>
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
                  const g = SMAE_DATA[key];
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
                            onClick={() => adjustEquivalent(key, -0.5)}
                            className="w-5 h-5 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] font-bold leading-none"
                          >−</button>
                          <button
                            onClick={() => adjustEquivalent(key, 0.5)}
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
                El recordatorio fue editado. ¿Actualizar el perfil del paciente?
              </p>
              <Button
                size="sm" variant="outline"
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
                Recalcular
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !planTitle.trim() || regenerating}
              className="bg-[hsl(var(--cta))] text-white hover:bg-[#757D6A] gap-1.5"
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
