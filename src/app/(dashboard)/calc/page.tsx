// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/../convex/_generated/api";
import {
  Calculator,
  User,
  Zap,
  PieChart,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowRight,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ─── Brand color ──────────────────────────────────────────────────────────────
const ACCENT = "#8D957E";

// ─── SMAE food groups (standard Mexican equivalents system) ───────────────────
const SMAE = {
  verduras:    { kcal: 25,  p: 2, l: 0, hc: 4,  color: "#4ade80", label: "Verduras" },
  frutas:      { kcal: 60,  p: 0, l: 0, hc: 15, color: "#fb923c", label: "Frutas" },
  cerealSG:    { kcal: 70,  p: 2, l: 0, hc: 15, color: "#facc15", label: "Cereales S/G" },
  cerealCG:    { kcal: 115, p: 2, l: 4, hc: 15, color: "#a16207", label: "Cereales C/G" },
  leguminosas: { kcal: 120, p: 8, l: 1, hc: 20, color: "#92400e", label: "Leguminosas" },
  aoaMBAG:     { kcal: 40,  p: 7, l: 1, hc: 0,  color: "#93c5fd", label: "AOA M.B.A.G." },
  aoaBAG:      { kcal: 55,  p: 7, l: 3, hc: 0,  color: "#3b82f6", label: "AOA B.A.G." },
  aoaMAG:      { kcal: 75,  p: 7, l: 5, hc: 0,  color: "#1d4ed8", label: "AOA M.A.G." },
  aoaAAG:      { kcal: 100, p: 7, l: 8, hc: 0,  color: "#1e3a8a", label: "AOA A.A.G." },
  lecheDes:    { kcal: 95,  p: 9, l: 2, hc: 12, color: "#bae6fd", label: "Leche desc." },
  lecheSemi:   { kcal: 110, p: 9, l: 4, hc: 12, color: "#38bdf8", label: "Leche semi" },
  lecheEntera: { kcal: 150, p: 9, l: 8, hc: 12, color: "#0369a1", label: "Leche entera" },
  grasaSP:     { kcal: 45,  p: 0, l: 5, hc: 0,  color: "#fbbf24", label: "Grasas S/P" },
  grasaCP:     { kcal: 70,  p: 3, l: 5, hc: 3,  color: "#d97706", label: "Grasas C/P" },
  azucarSG:    { kcal: 40,  p: 0, l: 0, hc: 10, color: "#fb7185", label: "Azúcares S/G" },
  azucarCG:    { kcal: 85,  p: 0, l: 4, hc: 10, color: "#e11d48", label: "Azúcares C/G" },
} as const;

type EquivKey = keyof typeof SMAE;
type Equivs = Record<EquivKey, number>;

// ─── Activity & goal lookup tables ────────────────────────────────────────────
const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentario — 1.2",
  light: "Ligero — 1.375",
  moderate: "Moderado — 1.55",
  active: "Activo — 1.725",
  very_active: "Muy activo — 1.9",
};

const GOAL_DELTA: Record<string, number> = {
  weight_loss: -500,
  maintenance: 0,
  weight_gain: 500,
  muscle_gain: 300,
  health: 0,
};

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Pérdida de peso (−500 kcal)",
  maintenance: "Mantenimiento",
  weight_gain: "Aumento de peso (+500 kcal)",
  muscle_gain: "Masa muscular (+300 kcal)",
  health: "Salud general",
};

const KCAL_KG_OPTIONS = [20, 25, 30, 35, 40];

// ─── Calculation functions ────────────────────────────────────────────────────
function mifflinBMR(w: number, h: number, a: number, sex: string) {
  return sex === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
}

function harrisBMR(w: number, h: number, a: number, sex: string) {
  return sex === "male"
    ? 13.397 * w + 4.799 * h - 5.677 * a + 88.362
    : 9.247 * w + 3.098 * h - 4.330 * a + 447.593;
}

function computeBMR(formula: string, w: number, h: number, a: number, sex: string, kkFactor: number) {
  if (formula === "mifflin") return mifflinBMR(w, h, a, sex);
  if (formula === "harris") return harrisBMR(w, h, a, sex);
  if (formula === "kcalkg") return w * kkFactor;
  return 0; // manual
}

function r(n: number) { return Math.round(n); }
function r1(n: number) { return Math.round(n * 10) / 10; }

function autoDistribute(targetKcal: number, proteinG: number, fatG: number, carbsG: number): Equivs {
  const base: Equivs = {
    verduras: 3, frutas: 2, cerealSG: 0, cerealCG: 0,
    leguminosas: 1, aoaMBAG: 0, aoaBAG: 0, aoaMAG: 0, aoaAAG: 0,
    lecheDes: 1, lecheSemi: 0, lecheEntera: 0,
    grasaSP: 0, grasaCP: 0, azucarSG: 0, azucarCG: 0,
  };

  // Baseline macros
  let remP = proteinG - (3 * 2 + 1 * 8 + 1 * 9);      // verduras + leguminosas + lecheDes protein
  let remL = fatG - (1 * 2);                             // lecheDes fat
  let remHC = carbsG - (3 * 4 + 2 * 15 + 1 * 20 + 1 * 12); // verduras + frutas + leguminosas + lecheDes HC

  remP = Math.max(0, remP);
  remL = Math.max(0, remL);
  remHC = Math.max(0, remHC);

  // AOA B.A.G. (7P, 3L, 55 kcal) — main protein source
  const aoaBAG = Math.min(8, Math.max(1, r(remP / 7)));
  remP -= aoaBAG * 7;
  remL -= aoaBAG * 3;

  // Cereales S/G (2P, 0L, 15HC, 70 kcal) — main carb source
  const cerealSG = Math.min(14, Math.max(2, r(remHC / 15)));
  remHC -= cerealSG * 15;
  remP -= cerealSG * 2;

  // Grasas S/P (0P, 5L, 45 kcal)
  const grasaSP = Math.max(0, Math.min(10, r(Math.max(0, remL) / 5)));

  // Azúcares from any remaining HC
  const azucarSG = Math.max(0, Math.min(3, r(remHC / 10)));

  return { ...base, aoaBAG, cerealSG, grasaSP, azucarSG };
}

function computeTotals(equivs: Equivs) {
  let kcal = 0, p = 0, l = 0, hc = 0;
  for (const key of Object.keys(equivs) as EquivKey[]) {
    const n = equivs[key];
    const g = SMAE[key];
    kcal += n * g.kcal; p += n * g.p; l += n * g.l; hc += n * g.hc;
  }
  return { kcal: r(kcal), p: r(p), l: r(l), hc: r(hc) };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, accent = false, children }: { icon: any; title: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden">
      <div
        className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[hsl(var(--border))]"
        style={accent ? { background: `linear-gradient(135deg, ${ACCENT}15, ${ACCENT}08)` } : {}}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ACCENT}20` }}>
          <Icon className="w-4 h-4" style={{ color: ACCENT }} />
        </div>
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function NumInput({
  label, value, onChange, unit, min, max, step = 1, hint, small = false
}: {
  label: string; value: number; onChange: (v: number) => void;
  unit?: string; min?: number; max?: number; step?: number; hint?: string; small?: boolean;
}) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed !== value) setRaw(String(value));
  }, [value]); // eslint-disable-line

  return (
    <div className="space-y-1">
      <Label className="text-xs text-[hsl(var(--muted-foreground))]">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className={cn("text-sm", small ? "h-8 w-24" : "h-9")}
        />
        {unit && <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">{unit}</span>}
      </div>
      {hint && <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{hint}</p>}
    </div>
  );
}

function MacroRow({
  label, color, pct, g, gkg, kcalVal,
  onPctChange, onGkgChange, mode,
  derived = false,
}: {
  label: string; color: string;
  pct: number; g: number; gkg: number; kcalVal: number;
  onPctChange?: (v: number) => void; onGkgChange?: (v: number) => void;
  mode: "pct" | "gkg"; derived?: boolean;
}) {
  const [localPct, setLocalPct] = useState(String(pct));
  const [localGkg, setLocalGkg] = useState(String(gkg));

  useEffect(() => { setLocalPct(String(pct)); }, [pct]); // eslint-disable-line
  useEffect(() => { setLocalGkg(String(gkg)); }, [gkg]); // eslint-disable-line

  return (
    <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr] gap-3 items-center py-2.5 border-b border-[hsl(var(--border))] last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {/* % */}
      <div>
        {mode === "pct" && !derived ? (
          <Input
            type="number" min={0} max={100} step={1}
            value={localPct}
            onChange={(e) => {
              setLocalPct(e.target.value);
              const v = parseInt(e.target.value);
              if (!isNaN(v)) onPctChange?.(v);
            }}
            className="h-8 text-sm text-center"
          />
        ) : (
          <div className="h-8 flex items-center justify-center text-sm font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] rounded-md">
            {pct}%
          </div>
        )}
      </div>
      {/* g/kg */}
      <div>
        {mode === "gkg" && !derived ? (
          <Input
            type="number" min={0} max={10} step={0.1}
            value={localGkg}
            onChange={(e) => {
              setLocalGkg(e.target.value);
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onGkgChange?.(v);
            }}
            className="h-8 text-sm text-center"
          />
        ) : (
          <div className="h-8 flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-md">
            {r1(gkg)} g/kg
          </div>
        )}
      </div>
      {/* g total */}
      <div className="h-8 flex items-center justify-center text-sm font-semibold bg-[hsl(var(--muted))] rounded-md">
        {r(g)} g
      </div>
      {/* kcal */}
      <div className="h-8 flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-md">
        {r(kcalVal)} kcal
      </div>
    </div>
  );
}

function EquivRow({
  groupKey, n, onN,
}: {
  groupKey: EquivKey; n: number; onN: (v: number) => void;
}) {
  const g = SMAE[groupKey];
  const [raw, setRaw] = useState(String(n));

  useEffect(() => { setRaw(String(n)); }, [n]); // eslint-disable-line

  return (
    <div className="grid grid-cols-[180px_60px_60px_50px_50px_50px] gap-2 items-center py-1.5 border-b border-[hsl(var(--border))] last:border-0 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
        <span className="text-xs font-medium">{g.label}</span>
      </div>
      <Input
        type="number" min={0} max={20} step={0.5}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onN(v);
        }}
        className="h-7 text-xs text-center px-1"
      />
      <div className="text-xs text-center text-[hsl(var(--muted-foreground))]">{r(n * g.kcal)}</div>
      <div className="text-xs text-center text-blue-600">{r(n * g.p)}</div>
      <div className="text-xs text-center text-yellow-600">{r(n * g.l)}</div>
      <div className="text-xs text-center text-[hsl(var(--primary))]">{r(n * g.hc)}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalcPage() {
  const router = useRouter();
  const patients = useQuery(api.patients.getPatients);

  // ── Patient data ────────────────────────────────────────────────────────────
  const [patientId, setPatientId] = useState("");
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(165);
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<"male" | "female">("female");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [goal, setGoal] = useState("maintenance");

  const selectedPatient = patients?.find((p) => p._id === patientId);

  useEffect(() => {
    if (!selectedPatient) return;
    setWeight(selectedPatient.weightKg);
    setHeight(selectedPatient.heightCm);
    if (selectedPatient.age) setAge(selectedPatient.age);
    setSex(selectedPatient.sex);
    setActivityLevel(selectedPatient.activityLevel);
    setGoal(selectedPatient.goal);
  }, [selectedPatient]);

  // ── Formula & energy ────────────────────────────────────────────────────────
  const [formula, setFormula] = useState("mifflin");
  const [kcalKgFactor, setKcalKgFactor] = useState(30);
  const [kcalKgRaw, setKcalKgRaw] = useState("30");
  const [manualKcal, setManualKcal] = useState<number | null>(null);
  const [manualInput, setManualInput] = useState("");

  const bmr = useMemo(
    () => r(computeBMR(formula, weight, height, age, sex, kcalKgFactor)),
    [formula, weight, height, age, sex, kcalKgFactor]
  );

  const tdee = useMemo(() => {
    if (formula === "kcalkg" || formula === "manual") return bmr;
    return r(bmr * (ACTIVITY_FACTORS[activityLevel] ?? 1.55));
  }, [bmr, activityLevel, formula]);

  const autoTarget = r(tdee + (GOAL_DELTA[goal] ?? 0));
  const targetKcal = manualKcal !== null ? manualKcal : autoTarget;

  function commitManual() {
    const v = parseInt(manualInput);
    if (!isNaN(v) && v > 0) setManualKcal(v);
  }

  // ── Macros ──────────────────────────────────────────────────────────────────
  const [macroMode, setMacroMode] = useState<"pct" | "gkg">("pct");
  const [proteinPct, setProteinPct] = useState(20);
  const [fatPct, setFatPct] = useState(30);
  const [proteinGkg, setProteinGkg] = useState(1.2);
  const [fatGkg, setFatGkg] = useState(0.8);

  const macros = useMemo(() => {
    if (macroMode === "pct") {
      const carbsPct = Math.max(0, 100 - proteinPct - fatPct);
      const proteinG = r(targetKcal * proteinPct / 100 / 4);
      const fatG = r(targetKcal * fatPct / 100 / 9);
      const carbsG = r(targetKcal * carbsPct / 100 / 4);
      return {
        proteinPct, fatPct, carbsPct,
        proteinG, fatG, carbsG,
        proteinGkg: r1(proteinG / weight),
        fatGkg: r1(fatG / weight),
        carbsGkg: r1(carbsG / weight),
        proteinKcal: r(proteinG * 4),
        fatKcal: r(fatG * 9),
        carbsKcal: r(carbsG * 4),
        sum: proteinPct + fatPct + carbsPct,
      };
    } else {
      const proteinG = r(proteinGkg * weight);
      const fatG = r(fatGkg * weight);
      const proteinKcal = r(proteinG * 4);
      const fatKcal = r(fatG * 9);
      const carbsKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
      const carbsG = r(carbsKcal / 4);
      const carbsGkg = r1(carbsG / weight);
      const pp = targetKcal > 0 ? r(proteinKcal / targetKcal * 100) : 0;
      const fp = targetKcal > 0 ? r(fatKcal / targetKcal * 100) : 0;
      const cp = targetKcal > 0 ? r(carbsKcal / targetKcal * 100) : 0;
      return {
        proteinPct: pp, fatPct: fp, carbsPct: cp,
        proteinG, fatG, carbsG,
        proteinGkg: r1(proteinGkg),
        fatGkg: r1(fatGkg),
        carbsGkg,
        proteinKcal,
        fatKcal,
        carbsKcal: r(carbsKcal),
        sum: pp + fp + cp,
      };
    }
  }, [macroMode, proteinPct, fatPct, proteinGkg, fatGkg, targetKcal, weight]);

  // Sync g/kg inputs when switching to g/kg mode
  useEffect(() => {
    if (macroMode === "gkg") {
      setProteinGkg(macros.proteinGkg || 1.2);
      setFatGkg(macros.fatGkg || 0.8);
    }
  }, [macroMode]); // eslint-disable-line

  // ── Equivalents ─────────────────────────────────────────────────────────────
  const [equivs, setEquivs] = useState<Equivs>({
    verduras: 3, frutas: 2, cerealSG: 5, cerealCG: 0,
    leguminosas: 1, aoaMBAG: 0, aoaBAG: 3, aoaMAG: 0, aoaAAG: 0,
    lecheDes: 1, lecheSemi: 0, lecheEntera: 0,
    grasaSP: 4, grasaCP: 0, azucarSG: 1, azucarCG: 0,
  });

  function setEquiv(key: EquivKey, v: number) {
    setEquivs((prev) => ({ ...prev, [key]: Math.max(0, v) }));
  }

  function handleAutoDistribute() {
    setEquivs(autoDistribute(targetKcal, macros.proteinG, macros.fatG, macros.carbsG));
  }

  const totals = useMemo(() => computeTotals(equivs), [equivs]);
  const diff = {
    kcal: totals.kcal - targetKcal,
    p: totals.p - macros.proteinG,
    l: totals.l - macros.fatG,
    hc: totals.hc - macros.carbsG,
  };

  const pctOk = macros.sum >= 98 && macros.sum <= 102;

  // ── Create plan ─────────────────────────────────────────────────────────────
  function handleGoToPlan() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calcResult", JSON.stringify({
        patientId,
        targetCalories: targetKcal,
        targetProteinG: macros.proteinG,
        targetFatG: macros.fatG,
        targetCarbsG: macros.carbsG,
        targetProteinPct: macros.proteinPct,
        targetFatPct: macros.fatPct,
        targetCarbsPct: macros.carbsPct,
      }));
    }
    router.push(patientId ? `/plans?patientId=${patientId}` : "/plans");
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg"
              style={{ backgroundColor: `${ACCENT}20` }}
            >
              <Calculator className="w-4 h-4" style={{ color: ACCENT }} />
            </span>
            Calculadora Nutricional
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Calcula requerimientos, distribuye macros y convierte a equivalentes SMAE
          </p>
        </div>
        <Button
          onClick={handleGoToPlan}
          className="w-fit text-white"
          style={{ backgroundColor: ACCENT }}
        >
          <ArrowRight className="w-4 h-4 mr-1.5" />
          Usar en plan
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* 1. Patient data */}
          <SectionCard icon={User} title="Datos del Paciente" accent>
            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-[hsl(var(--muted-foreground))]">Cargar paciente (opcional)</Label>
                <Select
                  value={patientId || "__manual__"}
                  onValueChange={(v) => setPatientId(v === "__manual__" ? "" : v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Ingreso manual o selecciona paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__manual__">Ingreso manual</SelectItem>
                    {patients?.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} · {p.weightKg} kg
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Peso" value={weight} onChange={setWeight} unit="kg" min={20} max={300} step={0.5} />
                <NumInput label="Talla" value={height} onChange={setHeight} unit="cm" min={100} max={250} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Edad" value={age} onChange={setAge} unit="años" min={1} max={120} />
                <div className="space-y-1">
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">Sexo</Label>
                  <Select value={sex} onValueChange={(v) => setSex(v as "male" | "female")}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Femenino</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[hsl(var(--muted-foreground))]">Nivel de actividad física</Label>
                <Select value={activityLevel} onValueChange={setActivityLevel}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[hsl(var(--muted-foreground))]">Objetivo</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GOAL_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* 2. Energy calculation */}
          <SectionCard icon={Zap} title="Requerimiento Energético">
            <div className="flex flex-col gap-4">
              {/* Formula selector */}
              <div className="space-y-1.5">
                <Label className="text-xs text-[hsl(var(--muted-foreground))]">Método de cálculo</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "mifflin", label: "Mifflin-St Jeor", tag: "Recomendado" },
                    { value: "harris", label: "Harris-Benedict", tag: "Clásico" },
                    { value: "kcalkg", label: "kcal/kg peso", tag: "Rápido" },
                    { value: "manual", label: "Ingreso manual", tag: "" },
                  ].map(({ value, label, tag }) => (
                    <button
                      key={value}
                      onClick={() => { setFormula(value); setManualKcal(null); setManualInput(""); }}
                      className={cn(
                        "flex flex-col items-start p-2.5 rounded-lg border text-left transition-colors text-sm",
                        formula === value
                          ? "border-2 font-medium"
                          : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                      )}
                      style={formula === value ? { borderColor: ACCENT, backgroundColor: `${ACCENT}10`, color: ACCENT } : {}}
                    >
                      <span>{label}</span>
                      {tag && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded mt-0.5"
                          style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}
                        >
                          {tag}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* kcal/kg factor */}
              {formula === "kcalkg" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">Factor kcal/kg</Label>
                  <div className="flex gap-2 flex-wrap">
                    {KCAL_KG_OPTIONS.map((f) => (
                      <button
                        key={f}
                        onClick={() => { setKcalKgFactor(f); setKcalKgRaw(String(f)); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                          kcalKgFactor === f
                            ? "text-white"
                            : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                        )}
                        style={kcalKgFactor === f ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
                      >
                        {f}
                      </button>
                    ))}
                    <Input
                      type="number" min={10} max={60}
                      value={kcalKgRaw}
                      onChange={(e) => {
                        setKcalKgRaw(e.target.value);
                        const v = parseInt(e.target.value);
                        if (!isNaN(v)) setKcalKgFactor(v);
                      }}
                      className="h-8 w-20 text-sm"
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* Results */}
              {formula !== "manual" && formula !== "kcalkg" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[hsl(var(--muted))] rounded-lg p-3 text-center">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">TMB (BMR)</p>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">{bmr}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">kcal/día</p>
                  </div>
                  <div className="bg-[hsl(var(--muted))] rounded-lg p-3 text-center">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">TDEE</p>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">{tdee}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">kcal/día</p>
                  </div>
                </div>
              )}

              {/* Target kcal */}
              <div
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ backgroundColor: `${ACCENT}12`, border: `1.5px solid ${ACCENT}40` }}
              >
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: ACCENT }}>
                    Calorías Objetivo
                  </p>
                  <p className="text-3xl font-extrabold text-[hsl(var(--foreground))]">{targetKcal}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">kcal/día</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {manualKcal !== null && (
                    <button
                      onClick={() => { setManualKcal(null); setManualInput(""); }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Restablecer auto
                    </button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={500}
                      max={6000}
                      placeholder={String(autoTarget)}
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onBlur={commitManual}
                      onKeyDown={(e) => e.key === "Enter" && commitManual()}
                      className="h-8 w-28 text-sm"
                    />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">kcal</span>
                  </div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Editar objetivo</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* 3. Macro distribution */}
          <SectionCard icon={PieChart} title="Distribución de Macronutrimentos">
            <div className="flex flex-col gap-4">
              {/* Mode toggle */}
              <div className="flex items-center gap-1 p-1 bg-[hsl(var(--muted))] rounded-lg w-fit">
                {(["pct", "gkg"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMacroMode(m)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      macroMode === m ? "bg-white shadow-sm text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"
                    )}
                  >
                    {m === "pct" ? "Por porcentaje" : "Por g/kg peso"}
                  </button>
                ))}
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr] gap-3 text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide px-0">
                <span>Macro</span>
                <span className="text-center">%</span>
                <span className="text-center">g/kg</span>
                <span className="text-center">g totales</span>
                <span className="text-center">kcal</span>
              </div>

              {/* Protein */}
              <MacroRow
                label="Proteína" color="#3b82f6"
                pct={macros.proteinPct} g={macros.proteinG}
                gkg={macros.proteinGkg} kcalVal={macros.proteinKcal}
                mode={macroMode}
                onPctChange={setProteinPct}
                onGkgChange={setProteinGkg}
              />
              {/* Fat */}
              <MacroRow
                label="Lípidos" color="#eab308"
                pct={macros.fatPct} g={macros.fatG}
                gkg={macros.fatGkg} kcalVal={macros.fatKcal}
                mode={macroMode}
                onPctChange={setFatPct}
                onGkgChange={setFatGkg}
              />
              {/* Carbs — always derived */}
              <MacroRow
                label="Hidratos" color="#8D957E"
                pct={macros.carbsPct} g={macros.carbsG}
                gkg={macros.carbsGkg} kcalVal={macros.carbsKcal}
                mode={macroMode}
                derived
              />

              <Separator />

              {/* Validation + summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pctOk ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={cn("text-xs font-medium", pctOk ? "text-green-600" : "text-red-500")}>
                    {pctOk ? "Porcentajes correctos (100%)" : `Suma: ${macros.sum}% — debe ser 100%`}
                  </span>
                </div>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {r(macros.proteinKcal + macros.fatKcal + macros.carbsKcal)} / {targetKcal} kcal
                </span>
              </div>

              {/* Visual macro bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${macros.proteinPct}%` }} />
                <div className="h-full bg-yellow-400 transition-all" style={{ width: `${macros.fatPct}%` }} />
                <div className="h-full transition-all" style={{ width: `${macros.carbsPct}%`, backgroundColor: ACCENT }} />
              </div>
              <div className="flex gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />P {macros.proteinPct}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />L {macros.fatPct}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: ACCENT }} />HC {macros.carbsPct}%</span>
              </div>
            </div>
          </SectionCard>

          {/* IMC & summary mini-card */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "IMC", value: r1(weight / Math.pow(height / 100, 2)), unit: "kg/m²", color: "#6366f1" },
              { label: "Peso ideal ♀", value: r(height - 100 - (height - 150) / 4), unit: "kg", color: "#ec4899" },
              { label: "Peso ideal ♂", value: r(height - 100 - (height - 150) / 2.5), unit: "kg", color: "#06b6d4" },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="bg-white rounded-xl border border-[hsl(var(--border))] p-3 text-center">
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{unit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SMAE Equivalents (full width) ─────────────────────────────────── */}
      <SectionCard icon={Layers} title="Equivalentes SMAE del Día">
        <div className="flex flex-col gap-4">
          {/* Auto-distribute button + info */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Ajusta los equivalentes por grupo. El sistema sugiere una distribución inicial.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoDistribute}
              className="gap-1.5 h-8 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Auto-distribuir
            </Button>
          </div>

          {/* Group equivalents table */}
          <div className="bg-[hsl(var(--muted))/40] rounded-lg overflow-hidden border border-[hsl(var(--border))]">
            {/* Header */}
            <div className="grid grid-cols-[180px_60px_60px_50px_50px_50px] gap-2 px-3 py-2 text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide bg-[hsl(var(--muted))]">
              <span>Grupo</span>
              <span className="text-center">Equiv.</span>
              <span className="text-center">kcal</span>
              <span className="text-center text-blue-600">P</span>
              <span className="text-center text-yellow-600">L</span>
              <span className="text-center" style={{ color: ACCENT }}>HC</span>
            </div>
            <div className="px-3 py-1">
              {/* Vegetables & Fruit */}
              <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] pt-2 pb-1 font-semibold">Vegetales y Frutas</p>
              <EquivRow groupKey="verduras" n={equivs.verduras} onN={(v) => setEquiv("verduras", v)} />
              <EquivRow groupKey="frutas" n={equivs.frutas} onN={(v) => setEquiv("frutas", v)} />

              {/* Cereals */}
              <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] pt-2 pb-1 font-semibold">Cereales</p>
              <EquivRow groupKey="cerealSG" n={equivs.cerealSG} onN={(v) => setEquiv("cerealSG", v)} />
              <EquivRow groupKey="cerealCG" n={equivs.cerealCG} onN={(v) => setEquiv("cerealCG", v)} />
              <EquivRow groupKey="leguminosas" n={equivs.leguminosas} onN={(v) => setEquiv("leguminosas", v)} />

              {/* AOA */}
              <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] pt-2 pb-1 font-semibold">AOA (Alimentos de Origen Animal)</p>
              <EquivRow groupKey="aoaMBAG" n={equivs.aoaMBAG} onN={(v) => setEquiv("aoaMBAG", v)} />
              <EquivRow groupKey="aoaBAG" n={equivs.aoaBAG} onN={(v) => setEquiv("aoaBAG", v)} />
              <EquivRow groupKey="aoaMAG" n={equivs.aoaMAG} onN={(v) => setEquiv("aoaMAG", v)} />
              <EquivRow groupKey="aoaAAG" n={equivs.aoaAAG} onN={(v) => setEquiv("aoaAAG", v)} />

              {/* Dairy */}
              <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] pt-2 pb-1 font-semibold">Lácteos</p>
              <EquivRow groupKey="lecheDes" n={equivs.lecheDes} onN={(v) => setEquiv("lecheDes", v)} />
              <EquivRow groupKey="lecheSemi" n={equivs.lecheSemi} onN={(v) => setEquiv("lecheSemi", v)} />
              <EquivRow groupKey="lecheEntera" n={equivs.lecheEntera} onN={(v) => setEquiv("lecheEntera", v)} />

              {/* Fats & Sugars */}
              <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] pt-2 pb-1 font-semibold">Grasas y Azúcares</p>
              <EquivRow groupKey="grasaSP" n={equivs.grasaSP} onN={(v) => setEquiv("grasaSP", v)} />
              <EquivRow groupKey="grasaCP" n={equivs.grasaCP} onN={(v) => setEquiv("grasaCP", v)} />
              <EquivRow groupKey="azucarSG" n={equivs.azucarSG} onN={(v) => setEquiv("azucarSG", v)} />
              <EquivRow groupKey="azucarCG" n={equivs.azucarCG} onN={(v) => setEquiv("azucarCG", v)} />
            </div>

            {/* Totals row */}
            <div className="grid grid-cols-[180px_60px_60px_50px_50px_50px] gap-2 px-3 py-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] font-semibold text-sm">
              <span className="text-xs">TOTAL</span>
              <span />
              <span className={cn("text-center text-xs", Math.abs(diff.kcal) < 50 ? "text-green-600" : "text-orange-600")}>
                {totals.kcal}
              </span>
              <span className={cn("text-center text-xs", Math.abs(diff.p) < 5 ? "text-blue-600" : "text-orange-600")}>
                {totals.p}
              </span>
              <span className={cn("text-center text-xs", Math.abs(diff.l) < 5 ? "text-yellow-600" : "text-orange-600")}>
                {totals.l}
              </span>
              <span className={cn("text-center text-xs", Math.abs(diff.hc) < 10 ? "" : "text-orange-600")} style={{ color: Math.abs(diff.hc) < 10 ? ACCENT : undefined }}>
                {totals.hc}
              </span>
            </div>
          </div>

          {/* Difference from target */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "kcal", val: diff.kcal, target: targetKcal, tol: 50 },
              { label: "Proteína (g)", val: diff.p, target: macros.proteinG, tol: 5 },
              { label: "Lípidos (g)", val: diff.l, target: macros.fatG, tol: 5 },
              { label: "Hidratos (g)", val: diff.hc, target: macros.carbsG, tol: 10 },
            ].map(({ label, val, target, tol }) => {
              const ok = Math.abs(val) <= tol;
              const sign = val > 0 ? "+" : "";
              return (
                <div key={label} className={cn("rounded-lg p-2.5 text-center border", ok ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50")}>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{label}</p>
                  <p className="text-sm font-bold" style={{ color: ok ? "#16a34a" : "#ea580c" }}>
                    {ok ? "✓" : `${sign}${val}`}
                  </p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">objetivo: {target}</p>
                </div>
              );
            })}
          </div>

          {/* Action */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Esta distribución puede usarse como base para construir el plan alimenticio del paciente.
            </p>
            <Button
              onClick={handleGoToPlan}
              className="text-white gap-1.5"
              style={{ backgroundColor: ACCENT }}
            >
              <ArrowRight className="w-4 h-4" />
              Crear plan con estos datos
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
