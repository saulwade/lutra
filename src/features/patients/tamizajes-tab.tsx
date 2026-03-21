// @ts-nocheck
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
} from "lucide-react";

// ─── Score helpers ────────────────────────────────────────────────────────────

function nrsScore(data: {
  lowBmi: boolean;
  weightLoss: boolean;
  reducedIntake: boolean;
  severeIllness: boolean;
  age70: boolean;
}): { score: number; risk: string } {
  let s =
    (data.lowBmi ? 1 : 0) +
    (data.weightLoss ? 1 : 0) +
    (data.reducedIntake ? 1 : 0) +
    (data.severeIllness ? 1 : 0) +
    (data.age70 ? 1 : 0);
  return { score: s, risk: s >= 3 ? "alto" : s >= 1 ? "medio" : "bajo" };
}

function mustScore(bmiScore: number, wlScore: number, acuteScore: number): { score: number; risk: string } {
  const s = bmiScore + wlScore + acuteScore;
  return { score: s, risk: s >= 2 ? "alto" : s === 1 ? "medio" : "bajo" };
}

function conutScore(albumin: number, lymph: number, chol: number): { score: number; risk: string } {
  let s = 0;
  if (albumin >= 3.5) s += 0;
  else if (albumin >= 3.0) s += 2;
  else if (albumin >= 2.5) s += 4;
  else s += 6;

  if (lymph >= 1600) s += 0;
  else if (lymph >= 1200) s += 1;
  else if (lymph >= 800) s += 2;
  else s += 3;

  if (chol >= 180) s += 0;
  else if (chol >= 140) s += 1;
  else if (chol >= 100) s += 2;
  else s += 3;

  const risk = s <= 1 ? "bajo" : s <= 4 ? "medio" : s <= 8 ? "alto" : "severo";
  return { score: s, risk };
}

function glimResult(
  phenotypic: boolean[],
  etiologic: boolean[]
): { risk: string; severity: string } {
  const hasPhenotypic = phenotypic.some(Boolean);
  const hasEtiologic = etiologic.some(Boolean);
  if (!hasPhenotypic || !hasEtiologic) return { risk: "bajo", severity: "" };
  const severePhenotypic =
    phenotypic.filter(Boolean).length >= 2;
  const severity = severePhenotypic ? "severa" : "moderada";
  return { risk: "desnutricion", severity };
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────

function RiskBadge({ risk }: { risk?: string }) {
  const cfg: Record<string, { label: string; cls: string; icon: any }> = {
    bajo: { label: "Riesgo bajo", cls: "bg-green-100 text-green-700", icon: CheckCircle2 },
    medio: { label: "Riesgo medio", cls: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
    alto: { label: "Riesgo alto", cls: "bg-red-100 text-red-700", icon: AlertCircle },
    severo: { label: "Severo", cls: "bg-red-200 text-red-800", icon: AlertCircle },
    desnutricion: { label: "Desnutrición", cls: "bg-red-200 text-red-800", icon: AlertCircle },
  };
  const c = cfg[risk ?? "bajo"] ?? cfg.bajo;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.cls}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────

function HistoryRow({ s, onDelete }: { s: any; onDelete: () => void }) {
  const toolLabel: Record<string, string> = {
    NRS2002: "NRS-2002",
    MUST: "MUST",
    CONUT: "CONUT",
    GLIM: "GLIM",
  };
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[hsl(var(--muted)/0.5)] text-sm">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">{s.date}</span>
        <span className="font-semibold">{toolLabel[s.tool]}</span>
        {s.score !== undefined && (
          <span className="text-[hsl(var(--muted-foreground))]">Puntuación: {s.score}</span>
        )}
        <RiskBadge risk={s.risk} />
      </div>
      <button
        onClick={onDelete}
        className="text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Checkbox field ───────────────────────────────────────────────────────────

function CheckField({
  label,
  checked,
  onChange,
  desc,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  desc?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
      />
      <span>
        <span className="text-sm font-medium">{label}</span>
        {desc && <span className="block text-xs text-[hsl(var(--muted-foreground))]">{desc}</span>}
      </span>
    </label>
  );
}

// ─── Score select ─────────────────────────────────────────────────────────────

function ScoreSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { val: number; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.val}
            type="button"
            onClick={() => onChange(o.val)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              value === o.val
                ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                : "bg-[hsl(var(--surface))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]"
            }`}
          >
            {o.val} — {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tool = "NRS2002" | "MUST" | "CONUT" | "GLIM";

interface Props {
  patientId: Id<"patients">;
}

export function TamizajesTab({ patientId }: Props) {
  const { toast } = useToast();
  const screenings = useQuery(api.screenings.getByPatient, { patientId }) ?? [];
  const saveScreening = useMutation(api.screenings.save);
  const deleteScreening = useMutation(api.screenings.remove);

  const [activeForm, setActiveForm] = useState<Tool | null>(null);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  // NRS state
  const [nrs, setNrs] = useState({
    lowBmi: false,
    weightLoss: false,
    reducedIntake: false,
    severeIllness: false,
    age70: false,
  });

  // MUST state
  const [must, setMust] = useState({ bmiScore: 0, weightLossScore: 0, acuteScore: 0 });

  // CONUT state
  const [conut, setConut] = useState({ albumin: "", lymphocytes: "", cholesterol: "" });

  // GLIM state
  const [glim, setGlim] = useState({
    weightLoss: false,
    lowBmi: false,
    lowMuscle: false,
    reducedIntake: false,
    inflammation: false,
  });

  function resetForms() {
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setNrs({ lowBmi: false, weightLoss: false, reducedIntake: false, severeIllness: false, age70: false });
    setMust({ bmiScore: 0, weightLossScore: 0, acuteScore: 0 });
    setConut({ albumin: "", lymphocytes: "", cholesterol: "" });
    setGlim({ weightLoss: false, lowBmi: false, lowMuscle: false, reducedIntake: false, inflammation: false });
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (activeForm === "NRS2002") {
        const { score, risk } = nrsScore(nrs);
        await saveScreening({
          patientId,
          date,
          tool: "NRS2002",
          score,
          risk,
          nrs_lowBmi: nrs.lowBmi,
          nrs_weightLoss: nrs.weightLoss,
          nrs_reducedIntake: nrs.reducedIntake,
          nrs_severeIllness: nrs.severeIllness,
          nrs_age70: nrs.age70,
          notes: notes || undefined,
        });
      } else if (activeForm === "MUST") {
        const { score, risk } = mustScore(must.bmiScore, must.weightLossScore, must.acuteScore);
        await saveScreening({
          patientId,
          date,
          tool: "MUST",
          score,
          risk,
          must_bmiScore: must.bmiScore,
          must_weightLossScore: must.weightLossScore,
          must_acuteScore: must.acuteScore,
          notes: notes || undefined,
        });
      } else if (activeForm === "CONUT") {
        const alb = parseFloat(conut.albumin);
        const lym = parseFloat(conut.lymphocytes);
        const cho = parseFloat(conut.cholesterol);
        if (isNaN(alb) || isNaN(lym) || isNaN(cho)) {
          toast({ title: "Completa todos los valores de laboratorio", variant: "destructive" });
          setSaving(false);
          return;
        }
        const { score, risk } = conutScore(alb, lym, cho);
        await saveScreening({
          patientId,
          date,
          tool: "CONUT",
          score,
          risk,
          conut_albumin: alb,
          conut_lymphocytes: lym,
          conut_cholesterol: cho,
          notes: notes || undefined,
        });
      } else if (activeForm === "GLIM") {
        const { risk, severity } = glimResult(
          [glim.weightLoss, glim.lowBmi, glim.lowMuscle],
          [glim.reducedIntake, glim.inflammation]
        );
        await saveScreening({
          patientId,
          date,
          tool: "GLIM",
          risk,
          glim_weightLoss: glim.weightLoss,
          glim_lowBmi: glim.lowBmi,
          glim_lowMuscle: glim.lowMuscle,
          glim_reducedIntake: glim.reducedIntake,
          glim_inflammation: glim.inflammation,
          glim_severity: severity || undefined,
          notes: notes || undefined,
        });
      }
      toast({ title: "Tamizaje guardado" });
      setActiveForm(null);
      resetForms();
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: Id<"screenings">) {
    await deleteScreening({ screeningId: id });
    toast({ title: "Tamizaje eliminado" });
  }

  const toolButtons: { tool: Tool; label: string; desc: string; color: string }[] = [
    {
      tool: "NRS2002",
      label: "NRS-2002",
      desc: "Tamizaje de riesgo nutricional hospitalario",
      color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
    },
    {
      tool: "MUST",
      label: "MUST",
      desc: "Malnutrition Universal Screening Tool",
      color: "border-amber-200 hover:border-amber-400 hover:bg-amber-50",
    },
    {
      tool: "CONUT",
      label: "CONUT",
      desc: "Control Nutricional (datos de laboratorio)",
      color: "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
    },
    {
      tool: "GLIM",
      label: "GLIM",
      desc: "Global Leadership Initiative on Malnutrition",
      color: "border-rose-200 hover:border-rose-400 hover:bg-rose-50",
    },
  ];

  // Live scores for display in forms
  const liveNrs = nrsScore(nrs);
  const liveMust = mustScore(must.bmiScore, must.weightLossScore, must.acuteScore);
  const liveConut = (() => {
    const alb = parseFloat(conut.albumin);
    const lym = parseFloat(conut.lymphocytes);
    const cho = parseFloat(conut.cholesterol);
    if (isNaN(alb) || isNaN(lym) || isNaN(cho)) return null;
    return conutScore(alb, lym, cho);
  })();
  const liveGlim = glimResult(
    [glim.weightLoss, glim.lowBmi, glim.lowMuscle],
    [glim.reducedIntake, glim.inflammation]
  );

  return (
    <div className="space-y-4">
      {/* Tool selector */}
      <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Nuevo tamizaje nutricional
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {toolButtons.map(({ tool, label, desc, color }) => (
              <button
                key={tool}
                onClick={() => setActiveForm(activeForm === tool ? null : tool)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${color} ${
                  activeForm === tool ? "ring-2 ring-offset-1 ring-[hsl(var(--primary)/0.4)]" : ""
                }`}
              >
                <div className="font-bold text-sm">{label}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 leading-tight">{desc}</div>
              </button>
            ))}
          </div>

          {activeForm && (
            <div className="space-y-4 border border-[hsl(var(--border))] rounded-xl p-4 bg-[hsl(var(--muted)/0.3)]">
              {/* Date */}
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Fecha</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-44 h-8 text-sm"
                  />
                </div>
                {activeForm === "NRS2002" && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">Puntuación:</span>
                    <span className="text-2xl font-bold tabular-nums">{liveNrs.score}</span>
                    <RiskBadge risk={liveNrs.risk} />
                  </div>
                )}
                {activeForm === "MUST" && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">Puntuación:</span>
                    <span className="text-2xl font-bold tabular-nums">{liveMust.score}</span>
                    <RiskBadge risk={liveMust.risk} />
                  </div>
                )}
                {activeForm === "CONUT" && liveConut && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">Puntuación:</span>
                    <span className="text-2xl font-bold tabular-nums">{liveConut.score}</span>
                    <RiskBadge risk={liveConut.risk} />
                  </div>
                )}
                {activeForm === "GLIM" && (
                  <div className="ml-auto">
                    <RiskBadge risk={liveGlim.risk} />
                    {liveGlim.severity && (
                      <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">
                        Severidad: {liveGlim.severity}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* NRS-2002 form */}
              {activeForm === "NRS2002" && (
                <div className="space-y-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide">
                    Criterios de cribado (1 punto c/u)
                  </p>
                  <CheckField
                    label="IMC &lt; 20.5 kg/m²"
                    checked={nrs.lowBmi}
                    onChange={(v) => setNrs((p) => ({ ...p, lowBmi: v }))}
                    desc="Índice de masa corporal bajo"
                  />
                  <CheckField
                    label="Pérdida de peso en los últimos 3 meses"
                    checked={nrs.weightLoss}
                    onChange={(v) => setNrs((p) => ({ ...p, weightLoss: v }))}
                  />
                  <CheckField
                    label="Ingesta reducida en la última semana"
                    checked={nrs.reducedIntake}
                    onChange={(v) => setNrs((p) => ({ ...p, reducedIntake: v }))}
                    desc="Menos del 50–75% de requerimiento"
                  />
                  <CheckField
                    label="Enfermedad grave (UCI, cirugía mayor, etc.)"
                    checked={nrs.severeIllness}
                    onChange={(v) => setNrs((p) => ({ ...p, severeIllness: v }))}
                  />
                  <CheckField
                    label="Edad ≥ 70 años"
                    checked={nrs.age70}
                    onChange={(v) => setNrs((p) => ({ ...p, age70: v }))}
                    desc="+1 punto automático si aplica"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Score ≥ 3 = riesgo nutricional presente → iniciar soporte.
                  </p>
                </div>
              )}

              {/* MUST form */}
              {activeForm === "MUST" && (
                <div className="space-y-4">
                  <ScoreSelect
                    label="Puntuación IMC"
                    value={must.bmiScore}
                    onChange={(v) => setMust((p) => ({ ...p, bmiScore: v }))}
                    options={[
                      { val: 0, label: "IMC > 20 (normal)" },
                      { val: 1, label: "IMC 18.5–20" },
                      { val: 2, label: "IMC < 18.5 (bajo)" },
                    ]}
                  />
                  <ScoreSelect
                    label="Puntuación pérdida de peso (últimos 3–6 meses)"
                    value={must.weightLossScore}
                    onChange={(v) => setMust((p) => ({ ...p, weightLossScore: v }))}
                    options={[
                      { val: 0, label: "< 5%" },
                      { val: 1, label: "5–10%" },
                      { val: 2, label: "> 10%" },
                    ]}
                  />
                  <ScoreSelect
                    label="Efecto de enfermedad aguda"
                    value={must.acuteScore}
                    onChange={(v) => setMust((p) => ({ ...p, acuteScore: v }))}
                    options={[
                      { val: 0, label: "Sin efecto agudo" },
                      { val: 2, label: "Ayuno probable ≥ 5 días" },
                    ]}
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    0 = bajo riesgo · 1 = riesgo medio · ≥ 2 = alto riesgo
                  </p>
                </div>
              )}

              {/* CONUT form */}
              {activeForm === "CONUT" && (
                <div className="space-y-4">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide flex items-center gap-1">
                    <FlaskConical className="w-3 h-3" />
                    Valores de laboratorio
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Albúmina (g/dL)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="3.5"
                        value={conut.albumin}
                        onChange={(e) => setConut((p) => ({ ...p, albumin: e.target.value }))}
                        className="h-8 text-sm"
                      />
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Normal: ≥ 3.5</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Linfocitos (cel/mm³)</Label>
                      <Input
                        type="number"
                        placeholder="1600"
                        value={conut.lymphocytes}
                        onChange={(e) => setConut((p) => ({ ...p, lymphocytes: e.target.value }))}
                        className="h-8 text-sm"
                      />
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Normal: ≥ 1600</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Colesterol (mg/dL)</Label>
                      <Input
                        type="number"
                        placeholder="180"
                        value={conut.cholesterol}
                        onChange={(e) => setConut((p) => ({ ...p, cholesterol: e.target.value }))}
                        className="h-8 text-sm"
                      />
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Normal: ≥ 180</p>
                    </div>
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface))] rounded-lg p-2 border border-[hsl(var(--border))]">
                    <span className="font-semibold">Interpretación: </span>
                    0–1 = normal · 2–4 = desnutrición leve · 5–8 = moderada · 9–12 = severa
                  </div>
                </div>
              )}

              {/* GLIM form */}
              {activeForm === "GLIM" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Criterios fenotípicos (≥ 1 requerido)
                    </p>
                    <CheckField
                      label="Pérdida de peso involuntaria"
                      checked={glim.weightLoss}
                      onChange={(v) => setGlim((p) => ({ ...p, weightLoss: v }))}
                      desc="> 5% en 6 meses o > 10% en más de 6 meses"
                    />
                    <CheckField
                      label="IMC bajo"
                      checked={glim.lowBmi}
                      onChange={(v) => setGlim((p) => ({ ...p, lowBmi: v }))}
                      desc="< 18.5 kg/m² si < 70 años · < 22 kg/m² si ≥ 70 años"
                    />
                    <CheckField
                      label="Masa muscular reducida"
                      checked={glim.lowMuscle}
                      onChange={(v) => setGlim((p) => ({ ...p, lowMuscle: v }))}
                      desc="Por DEXA, BIA, dinamometría u otro método validado"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                      Criterios etiológicos (≥ 1 requerido)
                    </p>
                    <CheckField
                      label="Ingesta o absorción reducida"
                      checked={glim.reducedIntake}
                      onChange={(v) => setGlim((p) => ({ ...p, reducedIntake: v }))}
                      desc="≤ 50% requerimientos por > 1 semana, o cualquier reducción por > 2 semanas"
                    />
                    <CheckField
                      label="Inflamación / carga de enfermedad"
                      checked={glim.inflammation}
                      onChange={(v) => setGlim((p) => ({ ...p, inflammation: v }))}
                      desc="Inflamación aguda o crónica, condición oncológica u otra enfermedad grave"
                    />
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Diagnóstico GLIM requiere ≥ 1 criterio fenotípico + ≥ 1 etiológico.
                    Severidad moderada si 1 fenotípico; severa si ≥ 2 fenotípicos.
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-1">
                <Label className="text-xs">Notas clínicas (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones..."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar tamizaje"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveForm(null);
                    resetForms();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {screenings.length > 0 && (
        <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Historial de tamizajes
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-2">
            {screenings.map((s: any) => (
              <HistoryRow
                key={s._id}
                s={s}
                onDelete={() => handleDelete(s._id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {screenings.length === 0 && !activeForm && (
        <div className="text-center py-10 text-[hsl(var(--muted-foreground))] text-sm">
          No hay tamizajes registrados. Selecciona una herramienta para comenzar.
        </div>
      )}
    </div>
  );
}
