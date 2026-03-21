// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Stethoscope,
  X,
  Plus,
  Pill,
  Activity,
  Droplets,
} from "lucide-react";

// ─── Common conditions ────────────────────────────────────────────────────────

const COMMON_CONDITIONS = [
  "Diabetes Mellitus T2",
  "Diabetes Mellitus T1",
  "Hipertensión arterial",
  "Dislipidemia",
  "Obesidad",
  "Sobrepeso",
  "Síndrome metabólico",
  "Hipotiroidismo",
  "Hipertiroidismo",
  "Enfermedad renal crónica",
  "Hígado graso (NAFLD)",
  "Síndrome de intestino irritable",
  "Enfermedad de Crohn",
  "Colitis ulcerosa",
  "Anemia ferropénica",
  "Osteoporosis",
  "Gota / Hiperuricemia",
  "Cáncer (oncología)",
  "VIH/SIDA",
  "Insuficiencia cardíaca",
];

const DIET_TYPES = [
  { val: "normal", label: "Normal equilibrada" },
  { val: "diabetica", label: "Dietoterapia diabética" },
  { val: "hiposodica", label: "Hiposódica" },
  { val: "hipolipidica", label: "Hipolipídica" },
  { val: "renal", label: "Renal (baja en P/K/P)" },
  { val: "hepatica", label: "Hepática" },
  { val: "oncologica", label: "Oncológica" },
  { val: "vegana", label: "Vegana" },
  { val: "vegetariana", label: "Vegetariana" },
  { val: "sin_gluten", label: "Sin gluten" },
  { val: "sin_lactosa", label: "Sin lactosa" },
];

interface Props {
  patientId: Id<"patients">;
}

export function PatologiasTab({ patientId }: Props) {
  const { toast } = useToast();
  const data = useQuery(api.patientPathologies.getByPatient, { patientId });
  const upsert = useMutation(api.patientPathologies.upsert);

  const [conditions, setConditions] = useState<string[]>([]);
  const [supplements, setSupplements] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [glycemicControl, setGlycemicControl] = useState(false);
  const [dietType, setDietType] = useState("normal");
  const [customCondition, setCustomCondition] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Populate from DB on load
  useEffect(() => {
    if (data) {
      setConditions(data.conditions ?? []);
      setSupplements(data.supplements ?? "");
      setRecommendations(data.clinicalRecommendations ?? "");
      setGlycemicControl(data.glycemicControl ?? false);
      setDietType(data.dietType ?? "normal");
      setDirty(false);
    }
  }, [data]);

  function toggleCondition(c: string) {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
    setDirty(true);
  }

  function addCustom() {
    const t = customCondition.trim();
    if (!t) return;
    setConditions((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setCustomCondition("");
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await upsert({
        patientId,
        conditions,
        supplements: supplements || undefined,
        clinicalRecommendations: recommendations || undefined,
        glycemicControl,
        dietType,
      });
      toast({ title: "Patologías actualizadas" });
      setDirty(false);
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const hasDiabetes = conditions.some((c) => c.toLowerCase().includes("diabetes"));

  return (
    <div className="space-y-4">
      {/* Conditions */}
      <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Condiciones clínicas
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {COMMON_CONDITIONS.map((c) => (
              <button
                key={c}
                onClick={() => toggleCondition(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                  conditions.includes(c)
                    ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                    : "bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.5)]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Custom condition */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
              placeholder="Agregar otra condición..."
              className="flex-1 h-8 px-3 text-sm rounded-lg border border-[hsl(var(--border))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] bg-[hsl(var(--surface))]"
            />
            <Button size="sm" variant="outline" onClick={addCustom} className="h-8">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Selected chips */}
          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {conditions.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] rounded-full text-xs font-medium"
                >
                  {c}
                  <button onClick={() => toggleCondition(c)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diet type + Glycemic control */}
      <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Tipo de dieta y contexto clínico
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de dieta indicada</Label>
            <div className="flex flex-wrap gap-2">
              {DIET_TYPES.map((d) => (
                <button
                  key={d.val}
                  onClick={() => { setDietType(d.val); setDirty(true); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    dietType === d.val
                      ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                      : "bg-[hsl(var(--surface))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Glycemic control toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => { setGlycemicControl((v) => !v); setDirty(true); }}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                glycemicControl ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--muted))]"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-[hsl(var(--surface))] rounded-full shadow transition-transform ${
                  glycemicControl ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
            <div>
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                Activar control glucémico (carga glucémica SMAE)
              </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Muestra índice y carga glucémica estimada en el plan nutricional
              </span>
            </div>
          </label>

          {hasDiabetes && !glycemicControl && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <Activity className="w-4 h-4 mt-0.5 shrink-0" />
              Se detectó Diabetes en las condiciones — considera activar el control glucémico.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplements */}
      <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-2">
            <Pill className="w-4 h-4" />
            Suplementación
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-2">
          <Textarea
            value={supplements}
            onChange={(e) => { setSupplements(e.target.value); setDirty(true); }}
            placeholder="Ej: Vitamina D 1000 UI/día, Hierro 80 mg/día, Omega-3 2 g/día..."
            rows={3}
            className="text-sm resize-none"
          />
        </CardContent>
      </Card>

      {/* Clinical recommendations */}
      <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Recomendaciones clínicas
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-2">
          <Textarea
            value={recommendations}
            onChange={(e) => { setRecommendations(e.target.value); setDirty(true); }}
            placeholder="Indicaciones específicas: restricciones de sodio, manejo de porciones, horarios de comida, ejercicio..."
            rows={4}
            className="text-sm resize-none"
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving || !dirty} className="w-full">
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
