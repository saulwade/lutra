// @ts-nocheck
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  Plus,
  Loader2,
  Trash2,
  CalendarClock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Score helpers ─────────────────────────────────────────────────────────────

const SCORE_LABELS: Record<number, string> = {
  1: "Muy bajo",
  2: "Bajo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

const SCORE_COLORS: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-blue-100 text-blue-700",
  5: "bg-green-100 text-green-700",
};

function ScoreBadge({ score }: { score?: number }) {
  if (!score) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", SCORE_COLORS[score])}>
      {score}/5 {SCORE_LABELS[score]}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "w-8 h-8 rounded-lg text-sm font-bold transition-all",
            value === n
              ? "bg-[hsl(81,10%,54%)] text-white"
              : "bg-[hsl(214,32%,96%)] text-[hsl(215,16%,47%)] hover:bg-[hsl(81,10%,88%)]"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ─── SVG Line chart ────────────────────────────────────────────────────────────

function LineChart({
  data,
  color = "#8D957E",
}: {
  data: { date: string; value: number }[];
  color?: string;
}) {
  if (data.length < 2) return (
    <p className="text-xs text-[hsl(var(--muted-foreground))] py-4 text-center">
      Se necesitan al menos 2 registros para mostrar la gráfica
    </p>
  );

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 400;
  const H = 80;
  const PAD = 8;

  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = PAD + ((max - d.value) / range) * (H - PAD * 2);
    return { x, y, value: d.value, date: d.date };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const first = values[0];
  const last = values[values.length - 1];
  const diff = last - first;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold">{last}</span>
        <span className={cn(
          "flex items-center gap-0.5 text-xs font-semibold",
          diff < 0 ? "text-green-600" : diff > 0 ? "text-orange-600" : "text-gray-500"
        )}>
          {diff < 0 ? <TrendingDown className="w-3 h-3" /> : diff > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {diff > 0 ? "+" : ""}{diff.toFixed(1)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
        {/* Grid lines */}
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#E5E7EB" strokeWidth="1" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#E5E7EB" strokeWidth="1" />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Fill area */}
        <polyline
          points={`${pts[0].x},${H - PAD} ${polyline} ${pts[pts.length - 1].x},${H - PAD}`}
          fill={color}
          fillOpacity="0.08"
          stroke="none"
        />
        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="white" strokeWidth="1.5">
            <title>{p.date}: {p.value}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400">{data[0].date}</span>
        <span className="text-[10px] text-gray-400">{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  weightKg: "",
  bodyFatPct: "",
  muscleMassKg: "",
  waistCm: "",
  bloodPressure: "",
  adherenceScore: 0,
  feelingScore: 0,
  seesPhysicalChanges: false,
  seesMentalChanges: false,
  nextAppointment: "",
  reason: "",
  notes: "",
};

interface Props {
  patientId: any;
  patientWeightKg: number;
}

export function SeguimientoTab({ patientId, patientWeightKg }: Props) {
  const { toast } = useToast();
  const consultations = useQuery(api.consultations.getConsultations, { patientId });
  const addConsultation = useMutation(api.consultations.addConsultation);
  const deleteConsultation = useMutation(api.consultations.deleteConsultation);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function setF(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.date) return;
    setSubmitting(true);
    try {
      await addConsultation({
        patientId,
        date: form.date,
        reason: form.reason || undefined,
        notes: form.notes || undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        bodyFatPct: form.bodyFatPct ? Number(form.bodyFatPct) : undefined,
        muscleMassKg: form.muscleMassKg ? Number(form.muscleMassKg) : undefined,
        waistCm: form.waistCm ? Number(form.waistCm) : undefined,
        bloodPressure: form.bloodPressure || undefined,
        adherenceScore: form.adherenceScore || undefined,
        feelingScore: form.feelingScore || undefined,
        seesPhysicalChanges: form.seesPhysicalChanges || undefined,
        seesMentalChanges: form.seesMentalChanges || undefined,
        nextAppointment: form.nextAppointment || undefined,
      });
      toast({ title: "Visita registrada" });
      setOpen(false);
      setForm({ ...EMPTY_FORM });
    } catch {
      toast({ title: "Error al guardar visita", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteConsultation({ consultationId: id as any });
      toast({ title: "Visita eliminada" });
      setConfirmDelete(null);
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  }

  if (consultations === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  // ── Reminder: last visit > 30 days ago ──
  const lastVisitDate = consultations[0]?.date;
  const daysSinceLast = lastVisitDate
    ? Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / 86400000)
    : null;
  const showReminder = daysSinceLast !== null && daysSinceLast > 30;
  const nextAppointments = consultations.filter((c) => c.nextAppointment).slice(0, 3);

  // ── Chart data (ascending) ──
  const sorted = [...consultations].sort((a, b) => a.date.localeCompare(b.date));
  const weightData = sorted.filter((c) => c.weightKg).map((c) => ({ date: c.date, value: c.weightKg }));
  const fatData    = sorted.filter((c) => c.bodyFatPct).map((c) => ({ date: c.date, value: c.bodyFatPct }));
  const muscleData = sorted.filter((c) => c.muscleMassKg).map((c) => ({ date: c.date, value: c.muscleMassKg }));

  return (
    <div className="flex flex-col gap-5">

      {/* ── Reminder banner ── */}
      {showReminder && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              Han pasado {daysSinceLast} días desde la última visita
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Considera agendar un seguimiento con este paciente.
            </p>
          </div>
        </div>
      )}

      {/* ── Next appointments ── */}
      {nextAppointments.length > 0 && (
        <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[hsl(var(--primary))]" />
              Próximas citas registradas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {nextAppointments.map((c) => (
              <div key={c._id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.nextAppointment}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Registrado en consulta del {c.date}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {consultations.length} {consultations.length === 1 ? "visita registrada" : "visitas registradas"}
        </p>
        <Button
          size="sm"
          className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(81,10%,44%)]"
          onClick={() => { setForm({ ...EMPTY_FORM }); setOpen(true); }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Nueva visita
        </Button>
      </div>

      {/* ── Comparative summary ── */}
      {consultations.length >= 2 && (() => {
        const first = sorted[0];
        const last  = sorted[sorted.length - 1];
        const metrics: { label: string; firstVal?: number; lastVal?: number; unit: string; lowerIsBetter: boolean }[] = [
          { label: "Peso",           firstVal: first.weightKg,    lastVal: last.weightKg,    unit: "kg", lowerIsBetter: true },
          { label: "Grasa corporal", firstVal: first.bodyFatPct,  lastVal: last.bodyFatPct,  unit: "%",  lowerIsBetter: true },
          { label: "Masa muscular",  firstVal: first.muscleMassKg,lastVal: last.muscleMassKg,unit: "kg", lowerIsBetter: false },
          { label: "Cintura",        firstVal: first.waistCm,     lastVal: last.waistCm,     unit: "cm", lowerIsBetter: true },
        ].filter((m) => m.firstVal != null && m.lastVal != null);
        if (metrics.length === 0) return null;
        return (
          <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" />
                Comparativo: primera vs última consulta
                <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                  ({first.date} → {last.date})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {metrics.map((m) => {
                  const delta = (m.lastVal! - m.firstVal!);
                  const pct   = m.firstVal! > 0 ? ((delta / m.firstVal!) * 100) : 0;
                  const improved = m.lowerIsBetter ? delta < 0 : delta > 0;
                  const neutral  = Math.abs(delta) < 0.05;
                  return (
                    <div key={m.label} className="rounded-xl border border-[hsl(var(--border))] p-3 space-y-1">
                      <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">{m.label}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold tabular-nums">{m.lastVal}{m.unit}</span>
                      </div>
                      <div className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                        neutral ? "bg-gray-100 text-gray-600"
                          : improved ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}>
                        {!neutral && (delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)}{m.unit}
                        <span className="opacity-70">({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)</span>
                      </div>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        Inicio: {m.firstVal}{m.unit}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ── Charts ── */}
      {consultations.length >= 2 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Peso (kg)</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={weightData} color="#8D957E" />
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Grasa corporal (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={fatData} color="#F59E0B" />
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Masa muscular (kg)</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={muscleData} color="#6366F1" />
            </CardContent>
          </Card>
          {(() => {
            const waistData = sorted.filter((c) => c.waistCm).map((c) => ({ date: c.date, value: c.waistCm }));
            if (waistData.length < 2) return null;
            return (
              <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Cintura (cm)</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart data={waistData} color="#EC4899" />
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* ── Progress table ── */}
      {consultations.length > 0 ? (
        <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Historial de visitas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-[hsl(214,32%,98%)]">
                    {["Fecha", "Peso", "Grasa%", "Músculo", "Adherencia", "Bienestar", "Cambios", "Siguiente cita"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((c, i) => (
                    <tr key={c._id} className={cn("border-b border-[hsl(var(--border))]", i % 2 === 0 ? "bg-[hsl(var(--surface))]" : "bg-[hsl(214,32%,99%)]")}>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{c.date}</td>
                      <td className="px-4 py-3 text-center">{c.weightKg ?? "—"}</td>
                      <td className="px-4 py-3 text-center">{c.bodyFatPct ? `${c.bodyFatPct}%` : "—"}</td>
                      <td className="px-4 py-3 text-center">{c.muscleMassKg ?? "—"}</td>
                      <td className="px-4 py-3">
                        <ScoreBadge score={c.adherenceScore} />
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBadge score={c.feelingScore} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {c.seesPhysicalChanges && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Físicos</span>}
                          {c.seesMentalChanges && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Emocionales</span>}
                          {!c.seesPhysicalChanges && !c.seesMentalChanges && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                        {c.nextAppointment ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                          onClick={() => setConfirmDelete(c._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expanded notes */}
            {consultations.some((c) => c.notes || c.reason) && (
              <div className="p-4 flex flex-col gap-3">
                <Separator />
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Notas por visita</p>
                {consultations.filter((c) => c.notes || c.reason).map((c) => (
                  <div key={c._id} className="text-sm">
                    <span className="font-medium">{c.date}</span>
                    {c.reason && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Motivo: {c.reason}</p>}
                    {c.notes && <p className="text-xs mt-0.5 whitespace-pre-wrap">{c.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
          <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
            <TrendingUp className="w-10 h-10 text-[hsl(var(--muted-foreground))] opacity-30" />
            <p className="text-sm font-medium">Sin visitas registradas</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Registra la primera visita para comenzar el seguimiento del paciente.
            </p>
            <Button
              size="sm"
              className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(81,10%,44%)] mt-1"
              onClick={() => { setForm({ ...EMPTY_FORM }); setOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Registrar primera visita
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Nueva visita dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar visita</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            {/* Fecha */}
            <div className="flex flex-col gap-1.5">
              <Label>Fecha de la visita</Label>
              <Input type="date" value={form.date} onChange={(e) => setF("date", e.target.value)} />
            </div>

            {/* Medidas */}
            <div>
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">Medidas antropométricas</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { field: "weightKg", label: "Peso (kg)" },
                  { field: "bodyFatPct", label: "Grasa corporal (%)" },
                  { field: "muscleMassKg", label: "Masa muscular (kg)" },
                  { field: "waistCm", label: "Cintura (cm)" },
                ].map(({ field, label }) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form[field]}
                      onChange={(e) => setF(field, e.target.value)}
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Seguimiento cualitativo */}
            <div>
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">Seguimiento cualitativo</p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm">¿Qué tanto siguió el plan? (adherencia)</Label>
                  <StarPicker value={form.adherenceScore} onChange={(v) => setF("adherenceScore", v)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm">¿Cómo se siente en general?</Label>
                  <StarPicker value={form.feelingScore} onChange={(v) => setF("feelingScore", v)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.seesPhysicalChanges}
                      onChange={(e) => setF("seesPhysicalChanges", e.target.checked)}
                      className="w-4 h-4 rounded accent-[hsl(81,10%,54%)]"
                    />
                    <span className="text-sm">Ve cambios físicos</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.seesMentalChanges}
                      onChange={(e) => setF("seesMentalChanges", e.target.checked)}
                      className="w-4 h-4 rounded accent-[hsl(81,10%,54%)]"
                    />
                    <span className="text-sm">Ve cambios emocionales / mentales</span>
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notas */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Motivo / observación breve</Label>
                <Input
                  value={form.reason}
                  onChange={(e) => setF("reason", e.target.value)}
                  placeholder="Ej. Seguimiento mensual, revisión por estancamiento…"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Notas clínicas</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setF("notes", e.target.value)}
                  placeholder="Observaciones, ajustes al plan, indicaciones…"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Próxima cita</Label>
                <Input
                  type="date"
                  value={form.nextAppointment}
                  onChange={(e) => setF("nextAppointment", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(81,10%,44%)]"
              onClick={handleSubmit}
              disabled={submitting || !form.date}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Guardar visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm delete dialog ── */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar esta visita?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
