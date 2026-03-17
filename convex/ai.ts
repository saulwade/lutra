// @ts-nocheck
import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";

// ─── SMAE groups: kcal / protein / fat / carbs per equivalent ─────────────────

const SMAE = {
  verduras:         { kcal: 25,  p: 2, l: 0, hc: 4,  label: "Verduras" },
  frutas:           { kcal: 60,  p: 0, l: 0, hc: 15, label: "Frutas" },
  cerealesSinGrasa: { kcal: 70,  p: 2, l: 0, hc: 15, label: "Cereales sin grasa" },
  cerealesConGrasa: { kcal: 115, p: 2, l: 4, hc: 15, label: "Cereales con grasa" },
  leguminosas:      { kcal: 120, p: 8, l: 1, hc: 20, label: "Leguminosas" },
  aoaMuyBajaGrasa:  { kcal: 40,  p: 7, l: 1, hc: 0,  label: "AOA muy baja grasa" },
  aoaBajaGrasa:     { kcal: 55,  p: 7, l: 3, hc: 0,  label: "AOA baja grasa" },
  aoaMedGrasa:      { kcal: 75,  p: 7, l: 5, hc: 0,  label: "AOA mediana grasa" },
  aoaAltaGrasa:     { kcal: 100, p: 7, l: 8, hc: 0,  label: "AOA alta grasa" },
  lecheDes:         { kcal: 95,  p: 9, l: 2, hc: 12, label: "Leche descremada" },
  lecheSemi:        { kcal: 110, p: 9, l: 4, hc: 12, label: "Leche semidescremada" },
  lecheEntera:      { kcal: 150, p: 9, l: 8, hc: 12, label: "Leche entera" },
  lecheConAzucar:   { kcal: 200, p: 8, l: 5, hc: 30, label: "Leche con azúcar" },
  grasasSinProt:    { kcal: 45,  p: 0, l: 5, hc: 0,  label: "Grasas sin proteína" },
  grasasConProt:    { kcal: 70,  p: 3, l: 5, hc: 3,  label: "Grasas con proteína" },
  azucaresSinGrasa: { kcal: 40,  p: 0, l: 0, hc: 10, label: "Azúcares sin grasa" },
  azucaresConGrasa: { kcal: 85,  p: 0, l: 4, hc: 10, label: "Azúcares con grasa" },
} as const;

export type SmaeKey = keyof typeof SMAE;
export const SMAE_KEYS = Object.keys(SMAE) as SmaeKey[];

// ─── generateNutritionPlan ────────────────────────────────────────────────────

export const generateNutritionPlan = action({
  args: {
    sex:           v.union(v.literal("male"), v.literal("female")),
    age:           v.number(),
    weightKg:      v.number(),
    heightCm:      v.number(),
    activityLevel: v.string(),
    goal:          v.string(),
    notes:           v.optional(v.string()),
    targetCalories:  v.number(),
    targetProteinG:  v.number(),
    targetFatG:      v.number(),
    targetCarbsG:    v.number(),
    allergies:       v.optional(v.array(v.string())),
    foodPreferences: v.optional(v.string()),
    recall24h:       v.optional(v.string()),
    adaptFromRecall: v.optional(v.boolean()),
  },
  handler: async (_ctx, args) => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const smaeTable = (Object.entries(SMAE) as [string, typeof SMAE[SmaeKey]][])
      .map(([k, v]) => `  "${k}" (${v.label}): ${v.kcal} kcal | ${v.p}g P | ${v.l}g L | ${v.hc}g HC`)
      .join("\n");

    const activityMap: Record<string, string> = {
      sedentary:  "sedentario (sin ejercicio)",
      light:      "actividad ligera (1-3 días/semana)",
      moderate:   "actividad moderada (3-5 días/semana)",
      active:     "activo (6-7 días/semana)",
      very_active: "muy activo (ejercicio intenso diario)",
    };
    const goalMap: Record<string, string> = {
      weight_loss:  "pérdida de peso",
      maintenance:  "mantenimiento del peso",
      weight_gain:  "ganancia de peso",
      muscle_gain:  "ganancia de masa muscular",
      health:       "salud general",
    };

    const approxCereales = Math.round(args.targetCalories / 2000 * 8);
    const approxAoa      = Math.round(args.targetCalories / 2000 * 5);
    const approxVerd     = Math.round(args.targetCalories / 2000 * 4);
    const approxFrutas   = Math.round(args.targetCalories / 2000 * 2);
    const approxLeg      = Math.round(args.targetCalories / 2000 * 1.5);
    const approxLeche    = Math.round(args.targetCalories / 2000 * 1.5);
    const approxGrasas   = Math.round(args.targetCalories / 2000 * 4);

    const systemPrompt = `Eres nutriólogo clínico experto en el Sistema Mexicano de Alimentos Equivalentes (SMAE). Tu tarea es asignar el NÚMERO DE EQUIVALENTES diarios necesarios para que la suma total de calorías alcance EXACTAMENTE el objetivo del paciente.

GRUPOS SMAE (kcal por equivalente):
${smaeTable}

REGLAS CRÍTICAS — debes cumplirlas todas:
1. SUMA DE CALORÍAS: La suma de (equivalentes × kcal por equivalente) de todos los grupos DEBE ser ≥ 95% del objetivo calórico.
2. Para alcanzar ${args.targetCalories} kcal necesitarás APROXIMADAMENTE: ~${approxCereales} cereales sin grasa (${approxCereales * 70} kcal), ~${approxAoa} AOA baja grasa (${approxAoa * 55} kcal), ~${approxVerd} verduras, ~${approxFrutas} frutas, ~${approxLeg} leguminosas, ~${approxLeche} leches, ~${approxGrasas} grasas. Ajusta para sumar ${args.targetCalories} kcal.
3. Proteínas dentro de ±10g del objetivo. Grasas dentro de ±10g. HC dentro de ±20g.
4. Usa decimales de 0.5 en 0.5 (ej: 0.5, 1.0, 1.5, 2.0...).
5. Para pérdida de peso: sin azúcares, preferir AOA baja grasa, más verduras.
6. Para masa muscular: más AOA y leguminosas.
${args.allergies?.length ? `7. ALERGIAS/INTOLERANCIAS: El paciente NO puede consumir grupos que contengan: ${args.allergies.join(", ")}. Sustituye completamente esos alimentos por alternativas seguras.` : ""}
${args.foodPreferences ? `8. PREFERENCIAS: Respeta estas preferencias alimentarias: ${args.foodPreferences}.` : ""}
${args.adaptFromRecall && args.recall24h ? `9. ADAPTACIÓN GRADUAL: Basa la distribución en los hábitos del recordatorio 24hr, pero ajusta cantidades/grupos para alcanzar los objetivos nutricionales. Favorece cambios graduales para mejorar adherencia.` : ""}
Responde ÚNICAMENTE con JSON válido. Sin texto adicional, sin markdown.`;

    const userPrompt = `Paciente:
- Sexo: ${args.sex === "male" ? "masculino" : "femenino"}
- Edad: ${args.age} años
- Peso: ${args.weightKg} kg | Talla: ${args.heightCm} cm
- Actividad: ${activityMap[args.activityLevel] ?? args.activityLevel}
- Objetivo: ${goalMap[args.goal] ?? args.goal}
${args.notes ? `- Notas: ${args.notes}` : ""}

OBJETIVOS DIARIOS OBLIGATORIOS:
- Energía total: ${args.targetCalories} kcal  ← LA SUMA DE TODOS LOS EQUIVALENTES DEBE LLEGAR A ESTE NÚMERO
- Proteínas: ${args.targetProteinG} g
- Grasas: ${args.targetFatG} g
- HC: ${args.targetCarbsG} g

${args.allergies?.length ? `\nALERGIAS A EVITAR: ${args.allergies.join(", ")} — elimina o sustituye cualquier grupo que las contenga.` : ""}
${args.foodPreferences ? `\nPREFERENCIAS DEL PACIENTE: ${args.foodPreferences}` : ""}
${args.adaptFromRecall && args.recall24h ? `\nALIMENTACIÓN HABITUAL DEL PACIENTE (recordatorio 24hr):\n${args.recall24h}\n\nAdapta gradualmente estos hábitos hacia los objetivos nutricionales para mejorar la adherencia.` : ""}
Recuerda: para ${args.targetCalories} kcal necesitas muchos equivalentes (no solo 2 o 3 por grupo). Verifica mentalmente que sumen ${args.targetCalories} kcal antes de responder.

Devuelve este JSON (todos los campos son obligatorios):
{
  "equivalents": {
    "verduras": 0,
    "frutas": 0,
    "cerealesSinGrasa": 0,
    "cerealesConGrasa": 0,
    "leguminosas": 0,
    "aoaMuyBajaGrasa": 0,
    "aoaBajaGrasa": 0,
    "aoaMedGrasa": 0,
    "aoaAltaGrasa": 0,
    "lecheDes": 0,
    "lecheSemi": 0,
    "lecheEntera": 0,
    "lecheConAzucar": 0,
    "grasasSinProt": 0,
    "grasasConProt": 0,
    "azucaresSinGrasa": 0,
    "azucaresConGrasa": 0
  },
  "reasoning": "Explicación clínica breve (2-3 líneas) de la distribución elegida.",
  "totalKcal": 0,
  "totalProteinG": 0,
  "totalFatG": 0,
  "totalCarbsG": 0
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(content);

    // Normalize: ensure all keys exist and are non-negative
    const equivalents: Record<string, number> = {};
    for (const key of SMAE_KEYS) {
      const raw = parsed.equivalents?.[key] ?? 0;
      // Round to nearest 0.5
      equivalents[key] = Math.max(0, Math.round(raw * 2) / 2);
    }

    // Recalculate totals from final equivalents (source of truth)
    let totalKcal = 0, totalProteinG = 0, totalFatG = 0, totalCarbsG = 0;
    function recalcTotals() {
      totalKcal = 0; totalProteinG = 0; totalFatG = 0; totalCarbsG = 0;
      for (const key of SMAE_KEYS) {
        const n = equivalents[key];
        const g = SMAE[key as SmaeKey];
        totalKcal    += n * g.kcal;
        totalProteinG += n * g.p;
        totalFatG    += n * g.l;
        totalCarbsG  += n * g.hc;
      }
    }
    recalcTotals();

    // Post-process: if the AI ignored the calorie target, scale up proportionally
    const minKcal = args.targetCalories * 0.90;
    if (totalKcal > 0 && totalKcal < minKcal) {
      const scaleFactor = args.targetCalories / totalKcal;
      for (const key of SMAE_KEYS) {
        // Scale and round to nearest 0.5
        equivalents[key] = Math.round(equivalents[key] * scaleFactor * 2) / 2;
      }
      recalcTotals();

      // Fine-tune with cerealesSinGrasa (70 kcal each) to close any remaining gap
      const remaining = args.targetCalories - totalKcal;
      if (remaining >= 35) {
        const extra = Math.round(remaining / 70 * 2) / 2; // round to 0.5
        equivalents["cerealesSinGrasa"] = (equivalents["cerealesSinGrasa"] ?? 0) + extra;
        recalcTotals();
      }
    }

    return {
      equivalents,
      reasoning:    parsed.reasoning ?? "",
      totalKcal:    Math.round(totalKcal),
      totalProteinG: Math.round(totalProteinG * 10) / 10,
      totalFatG:    Math.round(totalFatG * 10) / 10,
      totalCarbsG:  Math.round(totalCarbsG * 10) / 10,
    };
  },
});
