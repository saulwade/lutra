// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Save, Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const EATS_OUT_OPTIONS = [
  { value: "nunca", label: "Nunca o muy rara vez" },
  { value: "1-2x/sem", label: "1–2 veces por semana" },
  { value: "3-4x/sem", label: "3–4 veces por semana" },
  { value: "diario", label: "Diario o casi diario" },
];

const SLEEP_QUALITY_OPTIONS = [
  { value: "buena", label: "Buena — descansa bien" },
  { value: "regular", label: "Regular — a veces tiene problemas" },
  { value: "mala", label: "Mala — frecuentemente mal descansado" },
];

const COMMITMENT_OPTIONS = [
  { value: "alta", label: "Alta — está muy motivado" },
  { value: "media", label: "Media — tiene motivación moderada" },
  { value: "baja", label: "Baja — necesita apoyo extra" },
];

interface Props {
  patientId: any;
}

export function HistoriaClinicaTab({ patientId }: Props) {
  const { toast } = useToast();
  const history = useQuery(api.clinicalHistory.getClinicalHistory, { patientId });
  const upsert = useMutation(api.clinicalHistory.upsertClinicalHistory);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [form, setForm] = useState({
    personalPathological: "",
    familyHistory: "",
    personalNonPathological: "",
    substances: "",
    alcoholUse: "",
    physicalActivity: "",
    mealsPerDay: "",
    eatsOutFrequency: "",
    foodPreparator: "",
    foodRelationship: "",
    sleepHours: "",
    sleepQuality: "",
    supplements: "",
    foodLikes: "",
    foodDislikes: "",
    allergiesDetail: "",
    commitmentLevel: "",
  });

  useEffect(() => {
    if (history) {
      setForm({
        personalPathological: history.personalPathological ?? "",
        familyHistory: history.familyHistory ?? "",
        personalNonPathological: history.personalNonPathological ?? "",
        substances: history.substances ?? "",
        alcoholUse: history.alcoholUse ?? "",
        physicalActivity: history.physicalActivity ?? "",
        mealsPerDay: history.mealsPerDay?.toString() ?? "",
        eatsOutFrequency: history.eatsOutFrequency ?? "",
        foodPreparator: history.foodPreparator ?? "",
        foodRelationship: history.foodRelationship ?? "",
        sleepHours: history.sleepHours?.toString() ?? "",
        sleepQuality: history.sleepQuality ?? "",
        supplements: history.supplements ?? "",
        foodLikes: history.foodLikes ?? "",
        foodDislikes: history.foodDislikes ?? "",
        allergiesDetail: history.allergiesDetail ?? "",
        commitmentLevel: history.commitmentLevel ?? "",
      });
      setDirty(false);
    }
  }, [history]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await upsert({
        patientId,
        personalPathological: form.personalPathological || undefined,
        familyHistory: form.familyHistory || undefined,
        personalNonPathological: form.personalNonPathological || undefined,
        substances: form.substances || undefined,
        alcoholUse: form.alcoholUse || undefined,
        physicalActivity: form.physicalActivity || undefined,
        mealsPerDay: form.mealsPerDay ? Number(form.mealsPerDay) : undefined,
        eatsOutFrequency: form.eatsOutFrequency || undefined,
        foodPreparator: form.foodPreparator || undefined,
        foodRelationship: form.foodRelationship || undefined,
        sleepHours: form.sleepHours ? Number(form.sleepHours) : undefined,
        sleepQuality: form.sleepQuality || undefined,
        supplements: form.supplements || undefined,
        foodLikes: form.foodLikes || undefined,
        foodDislikes: form.foodDislikes || undefined,
        allergiesDetail: form.allergiesDetail || undefined,
        commitmentLevel: form.commitmentLevel || undefined,
      });
      toast({ title: "Historia clínica guardada" });
      setDirty(false);
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (history === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Save bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {history?.updatedAt
            ? `Última actualización: ${new Date(history.updatedAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`
            : "Sin datos registrados aún"}
        </p>
        <Button
          size="sm"
          className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(81,10%,44%)]"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>

      {/* ── Antecedentes ── */}
      <Section title="Antecedentes clínicos" icon={<FileText className="w-4 h-4" />}>
        <Field label="Antecedentes personales patológicos" hint="Diagnósticos previos: diabetes, hipertensión, hipotiroidismo, etc.">
          <Textarea
            value={form.personalPathological}
            onChange={(e) => set("personalPathological", e.target.value)}
            placeholder="Ej. Diabetes tipo 2 (diagnóstico 2019), hipertensión en tratamiento con losartán…"
            rows={3}
          />
        </Field>
        <Field label="Antecedentes heredofamiliares" hint="Enfermedades en familiares directos">
          <Textarea
            value={form.familyHistory}
            onChange={(e) => set("familyHistory", e.target.value)}
            placeholder="Ej. Madre con diabetes tipo 2, padre con hipertensión y dislipidemia…"
            rows={2}
          />
        </Field>
        <Field label="Antecedentes personales no patológicos" hint="Ocupación, escolaridad, nivel socioeconómico">
          <Textarea
            value={form.personalNonPathological}
            onChange={(e) => set("personalNonPathological", e.target.value)}
            placeholder="Ej. Oficinista, horario de 9–18h, trabajo con estrés moderado, escolaridad universitaria…"
            rows={2}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Toxicomanías" hint="Tabaco, drogas u otras sustancias">
            <Textarea
              value={form.substances}
              onChange={(e) => set("substances", e.target.value)}
              placeholder="Ej. Fumador activo (10 cig/día), niega drogas…"
              rows={2}
            />
          </Field>
          <Field label="Consumo de alcohol" hint="Frecuencia y cantidad">
            <Textarea
              value={form.alcoholUse}
              onChange={(e) => set("alcoholUse", e.target.value)}
              placeholder="Ej. Consumo social los fines de semana, 2–3 cervezas…"
              rows={2}
            />
          </Field>
        </div>
      </Section>

      {/* ── Hábitos alimentarios ── */}
      <Section title="Hábitos alimentarios">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Comidas al día">
            <Input
              type="number"
              min={1}
              max={10}
              value={form.mealsPerDay}
              onChange={(e) => set("mealsPerDay", e.target.value)}
              placeholder="3"
            />
          </Field>
          <Field label="Come fuera de casa">
            <Select value={form.eatsOutFrequency} onValueChange={(v) => set("eatsOutFrequency", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
              <SelectContent>
                {EATS_OUT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="¿Quién prepara sus alimentos?">
            <Input
              value={form.foodPreparator}
              onChange={(e) => set("foodPreparator", e.target.value)}
              placeholder="Ej. Él mismo, su mamá, servicio de comida…"
            />
          </Field>
        </div>
        <Field label="Relación con la comida" hint="¿Cómo describe su vínculo emocional con los alimentos?">
          <Textarea
            value={form.foodRelationship}
            onChange={(e) => set("foodRelationship", e.target.value)}
            placeholder="Ej. Come por ansiedad, disfruta comer, come por obligación, come rápido…"
            rows={2}
          />
        </Field>
        <Field label="Actividad física" hint="Tipo, frecuencia y duración">
          <Textarea
            value={form.physicalActivity}
            onChange={(e) => set("physicalActivity", e.target.value)}
            placeholder="Ej. Caminata 30 min 3x/semana, gym 5x/semana (pesas + cardio), sedentario…"
            rows={2}
          />
        </Field>
      </Section>

      {/* ── Otros hábitos ── */}
      <Section title="Otros hábitos">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Horas de sueño">
            <Input
              type="number"
              min={1}
              max={24}
              step={0.5}
              value={form.sleepHours}
              onChange={(e) => set("sleepHours", e.target.value)}
              placeholder="7"
            />
          </Field>
          <Field label="Calidad del sueño">
            <Select value={form.sleepQuality} onValueChange={(v) => set("sleepQuality", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
              <SelectContent>
                {SLEEP_QUALITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Suplementación" hint="Vitaminas, proteína en polvo, otros suplementos">
          <Textarea
            value={form.supplements}
            onChange={(e) => set("supplements", e.target.value)}
            placeholder="Ej. Multivitamínico, vitamina D 1000 UI, proteína de suero…"
            rows={2}
          />
        </Field>
      </Section>

      {/* ── Gustos y restricciones ── */}
      <Section title="Gustos, restricciones y compromiso">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Alimentos que le gustan">
            <Textarea
              value={form.foodLikes}
              onChange={(e) => set("foodLikes", e.target.value)}
              placeholder="Ej. Pollo, arroz, frutas, verduras cocidas, tortillas…"
              rows={3}
            />
          </Field>
          <Field label="Alimentos que no le gustan o evita">
            <Textarea
              value={form.foodDislikes}
              onChange={(e) => set("foodDislikes", e.target.value)}
              placeholder="Ej. Hígado, betabel, espinacas, mariscos…"
              rows={3}
            />
          </Field>
        </div>
        <Field label="Alergias e intolerancias (descripción detallada)" hint="Descripción ampliada, síntomas, diagnóstico">
          <Textarea
            value={form.allergiesDetail}
            onChange={(e) => set("allergiesDetail", e.target.value)}
            placeholder="Ej. Intolerancia a la lactosa confirmada con prueba, evita todos los lácteos. Alergia a camarón con reacción cutánea…"
            rows={2}
          />
        </Field>
        <Field label="Nivel de compromiso percibido">
          <Select value={form.commitmentLevel} onValueChange={(v) => set("commitmentLevel", v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
            <SelectContent>
              {COMMITMENT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-[hsl(var(--muted-foreground))] -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}
