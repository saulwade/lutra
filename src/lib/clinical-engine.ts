/**
 * Clinical Engine — Lutra
 *
 * Single source of truth for all numeric decisions in the nutrition plan flow.
 * The AI layer (convex/ai.ts) ONLY generates clinical reasoning text.
 * All arithmetic is handled here, deterministically.
 *
 * Layer 1 — Energy calculation (Mifflin-St Jeor / Harris-Benedict)
 * Layer 2 — Macro targets (g/kg-based, AMDR-validated)
 * Layer 3 — SMAE equivalent distribution (deterministic, 2-pass convergence)
 * Layer 4 — Plan validator (AMDR + deviation check)
 *
 * Sources:
 * - Mifflin-St Jeor (1990) Am J Clin Nutr 51(2):241-7
 * - Harris-Benedict revised (Roza & Shizgal, 1984)
 * - DRI/AMDR: Food and Nutrition Board, IOM (2005)
 * - ISSN Position Stand on protein (Stokes et al., 2018)
 * - SMAE: Pérez Lizaur et al., Sistema Mexicano de Alimentos Equivalentes, 4a ed.
 */

// ─── SMAE Data — single source of truth ──────────────────────────────────────
// All kcal/macro values per 1 equivalent, per SMAE 4a edición

export const SMAE_DATA = {
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

export type SmaeKey = keyof typeof SMAE_DATA;
export const SMAE_KEYS = Object.keys(SMAE_DATA) as SmaeKey[];

// ─── Shared types ─────────────────────────────────────────────────────────────

export type Sex           = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal          = "weight_loss" | "maintenance" | "weight_gain" | "muscle_gain" | "health";
export type FormulaType   = "mifflin" | "harris_benedict";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary:   "Sedentario (sin ejercicio)",
  light:       "Ligero (1-3 días/semana)",
  moderate:    "Moderado (3-5 días/semana)",
  active:      "Activo (6-7 días/semana)",
  very_active: "Muy activo (ejercicio intenso + trabajo físico)",
};

export const GOAL_LABELS: Record<Goal, string> = {
  weight_loss:  "Pérdida de peso",
  maintenance:  "Mantenimiento",
  weight_gain:  "Ganancia de peso",
  muscle_gain:  "Masa muscular",
  health:       "Salud general",
};

// Goal kcal adjustments — starting point, nutritionist can override
// 500 kcal/day deficit → ~0.5 kg/week (Hall et al., 2012)
export const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  weight_loss:  -500,
  maintenance:  0,
  weight_gain:  300,
  muscle_gain:  300,
  health:       0,
};

// Protein targets in g/kg body weight — by goal
// Sources: ISSN (2018), AND/DC/ACSM (2016)
const PROTEIN_G_PER_KG: Record<Goal, number> = {
  weight_loss:  1.3,   // preserves lean mass during caloric deficit
  maintenance:  1.0,   // DRI general adult
  weight_gain:  1.2,   // moderate surplus, lean gain
  muscle_gain:  1.8,   // resistance-training optimization
  health:       1.0,
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PatientInput {
  sex:           Sex;
  ageYears:      number;
  weightKg:      number;
  heightCm:      number;
  activityLevel: ActivityLevel;
  goal:          Goal;
}

/** Full clinical protocol — every number is computed deterministically */
export interface ClinicalProtocol {
  // Energy traceability
  formula:             FormulaType;
  bmr:                 number;
  activityFactor:      number;
  tdee:                number;
  goalAdjustmentKcal:  number;
  targetCalories:      number;
  // Macro targets
  targetProteinG:      number;
  targetFatG:          number;
  targetCarbsG:        number;
  proteinPct:          number;   // % of targetCalories
  fatPct:              number;
  carbsPct:            number;
  proteinGperKg:       number;   // g / kg body weight
  // Clinical warnings (non-blocking)
  warnings:            string[];
}

export interface SmaeDistributionResult {
  equivalents:    Record<SmaeKey, number>;
  actualKcal:     number;
  actualProteinG: number;
  actualFatG:     number;
  actualCarbsG:   number;
}

export interface ValidationReport {
  status:                "ok" | "warning";
  kcalDeviation:         number;    // actual − target (kcal)
  kcalDeviationPct:      number;    // %
  proteinDeviationG:     number;
  fatDeviationG:         number;
  carbsDeviationG:       number;
  actualProteinPct:      number;
  actualFatPct:          number;
  actualCarbsPct:        number;
  proteinInAMDR:         boolean;   // 10–35 %
  fatInAMDR:             boolean;   // 20–35 %
  carbsInAMDR:           boolean;   // 45–65 %
  actualProteinGperKg:   number;
  issues:                string[];
}

export interface DistributionOptions {
  goal:        Goal;
  dairyFree?:  boolean;
  vegetarian?: boolean;
}

// ─── Layer 1: BMR formulas ────────────────────────────────────────────────────

function mifflinStJeor(w: number, h: number, a: number, sex: Sex): number {
  const base = 10 * w + 6.25 * h - 5 * a;
  return sex === "male" ? base + 5 : base - 161;
}

function harrisBenedict(w: number, h: number, a: number, sex: Sex): number {
  return sex === "male"
    ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
    : 447.593 + 9.247 * w + 3.098 * h - 4.33 * a;
}

// ─── Layer 1+2: Full protocol calculation ─────────────────────────────────────

/**
 * Computes the complete clinical protocol for a patient.
 * All values are deterministic — no AI involved.
 *
 * @param patient     Patient demographics
 * @param formula     BMR formula (default: mifflin)
 * @param manualKcal  Optional kcal override from the nutritionist
 */
export function calculateProtocol(
  patient: PatientInput,
  formula: FormulaType = "mifflin",
  manualKcal?: number,
): ClinicalProtocol {
  const warnings: string[] = [];

  // ── Energy ──────────────────────────────────────────────────────────────────
  const bmrRaw = formula === "mifflin"
    ? mifflinStJeor(patient.weightKg, patient.heightCm, patient.ageYears, patient.sex)
    : harrisBenedict(patient.weightKg, patient.heightCm, patient.ageYears, patient.sex);

  const bmr            = Math.round(bmrRaw);
  const activityFactor = ACTIVITY_FACTORS[patient.activityLevel] ?? 1.55;
  const tdee           = Math.round(bmr * activityFactor);
  const goalAdjustmentKcal = GOAL_ADJUSTMENTS[patient.goal] ?? 0;

  let targetCalories = manualKcal ?? (tdee + goalAdjustmentKcal);

  // Clinical floor (men: 1500 kcal, women: 1200 kcal)
  const kcalFloor = patient.sex === "female" ? 1200 : 1500;
  if (targetCalories < kcalFloor) {
    warnings.push(
      `El objetivo calórico (${targetCalories} kcal) está por debajo del mínimo recomendado para consulta ambulatoria (${kcalFloor} kcal). Se ajustó automáticamente.`,
    );
    targetCalories = kcalFloor;
  }

  // ── Protein (g/kg-based, AMDR-clamped) ──────────────────────────────────────
  const proteinTarget_gkg = PROTEIN_G_PER_KG[patient.goal] ?? 1.0;
  let targetProteinG = Math.round(proteinTarget_gkg * patient.weightKg);

  // Clamp to AMDR 10–35 %
  const minProteinG = Math.round((targetCalories * 0.10) / 4);
  const maxProteinG = Math.round((targetCalories * 0.35) / 4);
  if (targetProteinG < minProteinG) {
    warnings.push(
      `Proteína calculada (${targetProteinG}g) inferior al mínimo AMDR. Ajustada a ${minProteinG}g (10% de ${targetCalories} kcal).`,
    );
    targetProteinG = minProteinG;
  }
  if (targetProteinG > maxProteinG) {
    warnings.push(
      `Proteína calculada (${targetProteinG}g) superior al máximo AMDR. Ajustada a ${maxProteinG}g (35% de ${targetCalories} kcal).`,
    );
    targetProteinG = maxProteinG;
  }

  // Elderly flag (≥65 años)
  if (patient.ageYears >= 65 && targetProteinG / patient.weightKg < 1.2) {
    warnings.push(
      `Para adultos ≥65 años se recomienda ≥1.2 g/kg de proteína. Actual: ${(targetProteinG / patient.weightKg).toFixed(1)} g/kg. Considera aumentar proteína manualmente.`,
    );
  }

  // ── Fat (30 % default, AMDR 20–35 %) ────────────────────────────────────────
  const targetFatG = Math.round((targetCalories * 0.30) / 9);

  // ── Carbs (fills remaining kcal) ────────────────────────────────────────────
  const targetCarbsG = Math.max(
    0,
    Math.round((targetCalories - targetProteinG * 4 - targetFatG * 9) / 4),
  );

  // Actual macro percentages
  const proteinPct = Math.round((targetProteinG * 4 / targetCalories) * 100);
  const fatPct     = Math.round((targetFatG * 9 / targetCalories) * 100);
  const carbsPct   = Math.round((targetCarbsG * 4 / targetCalories) * 100);

  if (carbsPct < 45) {
    warnings.push(
      `HC (${carbsPct}%) por debajo del rango AMDR (45–65%). Ajusta proteína o grasa si es necesario.`,
    );
  }

  return {
    formula,
    bmr,
    activityFactor,
    tdee,
    goalAdjustmentKcal,
    targetCalories,
    targetProteinG,
    targetFatG,
    targetCarbsG,
    proteinPct,
    fatPct,
    carbsPct,
    proteinGperKg: Math.round((targetProteinG / patient.weightKg) * 10) / 10,
    warnings,
  };
}

// ─── Layer 3: Deterministic SMAE distributor ─────────────────────────────────

/** Round to nearest 0.5 */
function r05(n: number): number {
  return Math.round(n * 2) / 2;
}

/**
 * Distributes macro targets into SMAE equivalents.
 *
 * Algorithm (2-pass to resolve protein circular dependency):
 *  1. Set anchor groups: verduras, frutas, leguminosas, leche
 *  2. Pass 1 — estimate AOA from protein (ignoring cereales protein contribution)
 *  3. Pass 1 — estimate grasas from fat target
 *  4. Pass 1 — estimate cereales from remaining kcal
 *  5. Pass 2 — subtract cereales protein from AOA need (refinement)
 *  6. Pass 2 — recompute grasas and cereales
 *
 * No AI involved. Deterministic for the same inputs.
 */
export function distributeSMAE(
  targets: { kcal: number; proteinG: number; fatG: number },
  options: DistributionOptions,
): SmaeDistributionResult {
  const { goal, dairyFree = false, vegetarian = false } = options;

  const eq = {} as Record<SmaeKey, number>;
  for (const k of SMAE_KEYS) eq[k] = 0;

  // ── Step 1: Anchor groups (clinical minimums) ──────────────────────────────
  eq.verduras    = goal === "weight_loss" ? 5 : 4;
  eq.frutas      = goal === "weight_loss" ? 2 : 3;
  eq.leguminosas = vegetarian ? 1.5 : 1.0;
  eq.lecheDes    = dairyFree ? 0 : 1.0;

  // Choose AOA type:
  //   muscle_gain → aoaMuyBajaGrasa (7g P, 40 kcal — more protein density)
  //   others      → aoaBajaGrasa (7g P, 55 kcal — standard ambulatory)
  const aoaKey: SmaeKey = goal === "muscle_gain" ? "aoaMuyBajaGrasa" : "aoaBajaGrasa";
  const aoaNutr = SMAE_DATA[aoaKey];

  // Fixed kcal from anchors (doesn't change between passes)
  const kcalFixed =
    eq.verduras    * SMAE_DATA.verduras.kcal +
    eq.frutas      * SMAE_DATA.frutas.kcal +
    eq.leguminosas * SMAE_DATA.leguminosas.kcal +
    eq.lecheDes    * SMAE_DATA.lecheDes.kcal;

  // Fat from fixed anchors
  const lFixed =
    eq.leguminosas * SMAE_DATA.leguminosas.l +
    eq.lecheDes    * SMAE_DATA.lecheDes.l;

  // Protein from fixed anchors
  const pFixed =
    eq.verduras    * SMAE_DATA.verduras.p +
    eq.leguminosas * SMAE_DATA.leguminosas.p +
    eq.lecheDes    * SMAE_DATA.lecheDes.p;

  // ── Pass 1: ignore cereales protein ─────────────────────────────────────────
  let aoaEq   = Math.max(0, r05((targets.proteinG - pFixed) / aoaNutr.p));
  let grasasEq = Math.max(0, r05((targets.fatG - lFixed - aoaEq * aoaNutr.l) / SMAE_DATA.grasasSinProt.l));
  const kcalP1 = kcalFixed + aoaEq * aoaNutr.kcal + grasasEq * SMAE_DATA.grasasSinProt.kcal;
  let cerealesEq = Math.max(2, r05((targets.kcal - kcalP1) / SMAE_DATA.cerealesSinGrasa.kcal));

  // ── Pass 2: subtract cereales protein contribution ───────────────────────────
  const pFromCereales = cerealesEq * SMAE_DATA.cerealesSinGrasa.p;
  aoaEq    = Math.max(0, r05((targets.proteinG - pFixed - pFromCereales) / aoaNutr.p));
  grasasEq = Math.max(0, r05((targets.fatG - lFixed - aoaEq * aoaNutr.l) / SMAE_DATA.grasasSinProt.l));
  const kcalP2 = kcalFixed + aoaEq * aoaNutr.kcal + grasasEq * SMAE_DATA.grasasSinProt.kcal;
  cerealesEq = Math.max(2, r05((targets.kcal - kcalP2) / SMAE_DATA.cerealesSinGrasa.kcal));

  // ── Assign ──────────────────────────────────────────────────────────────────
  eq[aoaKey]          = aoaEq;
  eq.grasasSinProt    = grasasEq;
  eq.cerealesSinGrasa = cerealesEq;

  // ── Compute actual totals ────────────────────────────────────────────────────
  let actualKcal = 0, actualProteinG = 0, actualFatG = 0, actualCarbsG = 0;
  for (const k of SMAE_KEYS) {
    const n = eq[k];
    const d = SMAE_DATA[k];
    actualKcal     += n * d.kcal;
    actualProteinG += n * d.p;
    actualFatG     += n * d.l;
    actualCarbsG   += n * d.hc;
  }

  return {
    equivalents:    eq,
    actualKcal:     Math.round(actualKcal),
    actualProteinG: Math.round(actualProteinG * 10) / 10,
    actualFatG:     Math.round(actualFatG * 10) / 10,
    actualCarbsG:   Math.round(actualCarbsG * 10) / 10,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function computeEquivalentTotals(equivalents: Record<string, number>): {
  kcal: number; proteinG: number; fatG: number; carbsG: number;
} {
  let kcal = 0, proteinG = 0, fatG = 0, carbsG = 0;
  for (const k of SMAE_KEYS) {
    const n = equivalents[k] ?? 0;
    const d = SMAE_DATA[k];
    kcal     += n * d.kcal;
    proteinG += n * d.p;
    fatG     += n * d.l;
    carbsG   += n * d.hc;
  }
  return {
    kcal:     Math.round(kcal),
    proteinG: Math.round(proteinG * 10) / 10,
    fatG:     Math.round(fatG * 10) / 10,
    carbsG:   Math.round(carbsG * 10) / 10,
  };
}

// ─── Layer 4: Plan validator ──────────────────────────────────────────────────

/**
 * Validates the final equivalents against clinical targets and AMDR ranges.
 * Called after generation AND after every manual ±0.5 adjustment in review.
 */
export function validatePlan(
  equivalents: Record<string, number>,
  targets: { kcal: number; proteinG: number; fatG: number; carbsG: number },
  weightKg: number,
): ValidationReport {
  const actual = computeEquivalentTotals(equivalents);
  const issues: string[] = [];

  const kcalDeviation     = actual.kcal - targets.kcal;
  const kcalDeviationPct  = targets.kcal > 0 ? Math.round((kcalDeviation / targets.kcal) * 100) : 0;
  const proteinDeviationG = Math.round((actual.proteinG - targets.proteinG) * 10) / 10;
  const fatDeviationG     = Math.round((actual.fatG - targets.fatG) * 10) / 10;
  const carbsDeviationG   = Math.round((actual.carbsG - targets.carbsG) * 10) / 10;

  const actualProteinPct = actual.kcal > 0 ? Math.round((actual.proteinG * 4 / actual.kcal) * 100) : 0;
  const actualFatPct     = actual.kcal > 0 ? Math.round((actual.fatG * 9 / actual.kcal) * 100) : 0;
  const actualCarbsPct   = actual.kcal > 0 ? Math.round((actual.carbsG * 4 / actual.kcal) * 100) : 0;
  const actualProteinGperKg = weightKg > 0 ? Math.round((actual.proteinG / weightKg) * 10) / 10 : 0;

  // AMDR: Dietary Reference Intakes, Food and Nutrition Board, IOM (2005)
  const proteinInAMDR = actualProteinPct >= 10 && actualProteinPct <= 35;
  const fatInAMDR     = actualFatPct >= 20 && actualFatPct <= 35;
  const carbsInAMDR   = actualCarbsPct >= 45 && actualCarbsPct <= 65;

  if (Math.abs(kcalDeviationPct) > 10) {
    issues.push(
      `Calorías ${kcalDeviation > 0 ? "exceden" : "están por debajo de"} el objetivo en ${Math.abs(kcalDeviationPct)}% (${kcalDeviation > 0 ? "+" : ""}${kcalDeviation} kcal).`,
    );
  }
  if (Math.abs(proteinDeviationG) > 15) {
    issues.push(
      `Proteína ${proteinDeviationG > 0 ? "sobre" : "bajo"} el objetivo en ${Math.abs(proteinDeviationG)}g.`,
    );
  }
  if (!proteinInAMDR) issues.push(`Proteína fuera de AMDR: ${actualProteinPct}% (rango: 10–35%).`);
  if (!fatInAMDR)     issues.push(`Grasa fuera de AMDR: ${actualFatPct}% (rango: 20–35%).`);
  if (!carbsInAMDR)   issues.push(`HC fuera de AMDR: ${actualCarbsPct}% (rango: 45–65%).`);

  return {
    status:               issues.length === 0 ? "ok" : "warning",
    kcalDeviation,
    kcalDeviationPct,
    proteinDeviationG,
    fatDeviationG,
    carbsDeviationG,
    actualProteinPct,
    actualFatPct,
    actualCarbsPct,
    proteinInAMDR,
    fatInAMDR,
    carbsInAMDR,
    actualProteinGperKg,
    issues,
  };
}
