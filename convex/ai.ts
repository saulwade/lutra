// @ts-nocheck
import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";

/**
 * generateNutritionPlan — AI Reasoning Layer (Layer 3)
 *
 * Receives pre-computed SMAE equivalents from the clinical engine.
 * The ONLY responsibility of this action is to generate a 2-3 sentence
 * clinical rationale explaining WHY this distribution makes sense for the patient.
 *
 * NO arithmetic. NO calorie decisions. NO macro calculations.
 * All numbers are already correct — the AI explains the clinical logic.
 *
 * The deterministic engine (src/lib/clinical-engine.ts) handles:
 *   - BMR / TDEE calculation
 *   - Macro targets (g/kg-based, AMDR-validated)
 *   - SMAE equivalent distribution (2-pass algorithm)
 *   - Plan validation
 */
export const generateNutritionPlan = action({
  args: {
    // ── Patient context ──
    sex:             v.union(v.literal("male"), v.literal("female")),
    age:             v.number(),
    weightKg:        v.number(),
    heightCm:        v.number(),
    activityLevel:   v.string(),
    goal:            v.string(),
    notes:           v.optional(v.string()),
    allergies:       v.optional(v.array(v.string())),
    foodPreferences: v.optional(v.string()),
    recall24h:       v.optional(v.string()),
    adaptFromRecall: v.optional(v.boolean()),

    // ── Protocol (computed by clinical engine, not by AI) ──
    targetCalories:  v.number(),
    targetProteinG:  v.number(),
    targetFatG:      v.number(),
    targetCarbsG:    v.number(),
    bmr:             v.number(),
    tdee:            v.number(),
    proteinGperKg:   v.number(),
    formula:         v.string(),   // "mifflin" | "harris_benedict"

    // ── Pre-computed SMAE equivalents (from clinical engine) ──
    // The AI receives these as facts — it does NOT modify them.
    equivalents: v.object({
      verduras:         v.number(),
      frutas:           v.number(),
      cerealesSinGrasa: v.number(),
      cerealesConGrasa: v.number(),
      leguminosas:      v.number(),
      aoaMuyBajaGrasa:  v.number(),
      aoaBajaGrasa:     v.number(),
      aoaMedGrasa:      v.number(),
      aoaAltaGrasa:     v.number(),
      lecheDes:         v.number(),
      lecheSemi:        v.number(),
      lecheEntera:      v.number(),
      lecheConAzucar:   v.number(),
      grasasSinProt:    v.number(),
      grasasConProt:    v.number(),
      azucaresSinGrasa: v.number(),
      azucaresConGrasa: v.number(),
    }),
  },

  handler: async (_ctx, args) => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (!process.env.OPENAI_API_KEY) {
      return { reasoning: "" };
    }

    const activityMap: Record<string, string> = {
      sedentary:   "sedentario",
      light:       "actividad ligera (1-3 días/semana)",
      moderate:    "actividad moderada (3-5 días/semana)",
      active:      "activo (6-7 días/semana)",
      very_active: "muy activo (ejercicio intenso + trabajo físico)",
    };
    const goalMap: Record<string, string> = {
      weight_loss:  "pérdida de peso",
      maintenance:  "mantenimiento del peso",
      weight_gain:  "ganancia de peso",
      muscle_gain:  "ganancia de masa muscular",
      health:       "salud general",
    };

    // Format only non-zero equivalents for the prompt
    const SMAE_LABELS: Record<string, string> = {
      verduras: "Verduras", frutas: "Frutas",
      cerealesSinGrasa: "Cereales sin grasa", cerealesConGrasa: "Cereales con grasa",
      leguminosas: "Leguminosas",
      aoaMuyBajaGrasa: "AOA muy baja grasa", aoaBajaGrasa: "AOA baja grasa",
      aoaMedGrasa: "AOA mediana grasa", aoaAltaGrasa: "AOA alta grasa",
      lecheDes: "Leche descremada", lecheSemi: "Leche semidescremada",
      lecheEntera: "Leche entera", lecheConAzucar: "Leche con azúcar",
      grasasSinProt: "Grasas sin proteína", grasasConProt: "Grasas con proteína",
      azucaresSinGrasa: "Azúcares sin grasa", azucaresConGrasa: "Azúcares con grasa",
    };

    const equivLines = (Object.entries(args.equivalents) as [string, number][])
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `  • ${SMAE_LABELS[k] ?? k}: ${n} equiv`)
      .join("\n");

    const formulaLabel = args.formula === "mifflin"
      ? "Mifflin-St Jeor (1990)"
      : "Harris-Benedict revisada (1984)";

    const systemPrompt = `Eres un nutriólogo clínico mexicano experto en el Sistema Mexicano de Alimentos Equivalentes (SMAE).

Se te presenta un plan nutricional cuyos números YA FUERON CALCULADOS por un motor determinista basado en evidencia clínica.

Tu tarea es ÚNICAMENTE escribir 2-3 oraciones de justificación clínica que expliquen POR QUÉ esta distribución es adecuada para el perfil del paciente.

PROHIBIDO:
- Recalcular, cuestionar o modificar cualquier número
- Sugerir cambios en los equivalentes
- Hacer cálculos de calorías o macros
- Usar listas, markdown o encabezados
- Mencionar que los números fueron calculados por un programa

SÍ debes:
- Explicar brevemente la lógica clínica de la distribución en función del objetivo del paciente
- Ser conciso y directo (máximo 3 oraciones)
- Escribir en español clínico, profesional, sin tecnicismos excesivos`;

    const userPrompt = `Paciente: ${args.sex === "male" ? "Masculino" : "Femenino"}, ${args.age} años, ${args.weightKg} kg, ${args.heightCm} cm.
Objetivo clínico: ${goalMap[args.goal] ?? args.goal}
Nivel de actividad: ${activityMap[args.activityLevel] ?? args.activityLevel}
${args.notes ? `Notas clínicas: ${args.notes}` : ""}
${args.allergies?.length ? `Alergias/intolerancias: ${args.allergies.join(", ")}` : ""}
${args.foodPreferences ? `Preferencias alimentarias: ${args.foodPreferences}` : ""}
${args.adaptFromRecall && args.recall24h ? `\nAlimentación habitual del paciente:\n${args.recall24h}\n` : ""}
Protocolo energético (${formulaLabel}):
- TMB: ${args.bmr} kcal | GET: ${args.tdee} kcal | Meta: ${args.targetCalories} kcal/día
- Proteína: ${args.targetProteinG}g (${args.proteinGperKg.toFixed(1)} g/kg) | Grasa: ${args.targetFatG}g | HC: ${args.targetCarbsG}g

Distribución SMAE asignada:
${equivLines}

Escribe la justificación clínica (2-3 oraciones):`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 250,
      });

      const reasoning = response.choices[0].message.content?.trim() ?? "";
      return { reasoning };
    } catch {
      return { reasoning: "" };
    }
  },
});
