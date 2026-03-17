/**
 * Nutrition Calculator
 *
 * Implements common energy requirement formulas for the Lutra SaaS.
 * All formulas are based on published, peer-reviewed equations.
 *
 * Decision log:
 * - Primary method: Mifflin-St Jeor (1990) — most accurate for general population
 * - Fallback: Harris-Benedict (1984 revision) — widely used, good for comparison
 * - Activity factors: FAO/WHO/UNU 2004 physical activity levels
 * - Macro distribution: configurable with sensible defaults per goal
 */

export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"       // 1.2  — desk job, no exercise
  | "light"           // 1.375 — light exercise 1-3 days/week
  | "moderate"        // 1.55  — moderate exercise 3-5 days/week
  | "active"          // 1.725 — hard exercise 6-7 days/week
  | "very_active";    // 1.9   — very hard exercise + physical job

export type Goal =
  | "weight_loss"
  | "maintenance"
  | "weight_gain"
  | "muscle_gain"
  | "health";

export type FormulaType = "mifflin" | "harris_benedict" | "who_fao";

export interface PatientData {
  sex: Sex;
  ageYears: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  bodyFatPct?: number;    // optional, enables Katch-McArdle if provided
}

export interface EnergyResult {
  bmr: number;            // Basal Metabolic Rate (kcal)
  tdee: number;           // Total Daily Energy Expenditure (kcal)
  targetCalories: number; // After goal adjustment
  activityFactor: number;
  goalAdjustmentKcal: number;
  formula: FormulaType;
}

export interface MacroResult {
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinKcal: number;
  fatKcal: number;
  carbsKcal: number;
  proteinPct: number;
  fatPct: number;
  carbsPct: number;
}

// ─── Activity Factors ────────────────────────────────────────────────────────

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentario (sin ejercicio)",
  light: "Ligero (ejercicio 1-3 días/semana)",
  moderate: "Moderado (ejercicio 3-5 días/semana)",
  active: "Activo (ejercicio 6-7 días/semana)",
  very_active: "Muy activo (ejercicio intenso + trabajo físico)",
};

// ─── Goal Adjustments ────────────────────────────────────────────────────────
// Decision: simple caloric adjustment (±500 kcal) for MVP
// This is a common clinical starting point and easy to customize per patient

export const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  weight_loss: -500,     // ~0.5 kg/week deficit
  maintenance: 0,
  weight_gain: 300,      // moderate surplus
  muscle_gain: 300,      // same as weight gain but macro-optimized
  health: 0,
};

export const GOAL_LABELS: Record<Goal, string> = {
  weight_loss: "Pérdida de peso",
  maintenance: "Mantenimiento",
  weight_gain: "Aumento de peso",
  muscle_gain: "Aumento de masa muscular",
  health: "Salud general",
};

// ─── Formulas ────────────────────────────────────────────────────────────────

/**
 * Mifflin-St Jeor (1990)
 * Most accurate for general population per Academy of Nutrition & Dietetics
 */
export function mifflinStJeor(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: Sex
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === "male" ? base + 5 : base - 161;
}

/**
 * Harris-Benedict revised (Roza & Shizgal, 1984)
 */
export function harrisBenedict(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: Sex
): number {
  if (sex === "male") {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears;
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;
}

/**
 * Katch-McArdle (requires lean body mass)
 * More accurate for very muscular or obese patients
 */
export function katchMcArdle(weightKg: number, bodyFatPct: number): number {
  const leanMassKg = weightKg * (1 - bodyFatPct / 100);
  return 370 + 21.6 * leanMassKg;
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export function calculateEnergy(
  patient: PatientData,
  formula: FormulaType = "mifflin"
): EnergyResult {
  let bmr: number;

  if (formula === "mifflin") {
    bmr = mifflinStJeor(
      patient.weightKg,
      patient.heightCm,
      patient.ageYears,
      patient.sex
    );
  } else if (formula === "harris_benedict") {
    bmr = harrisBenedict(
      patient.weightKg,
      patient.heightCm,
      patient.ageYears,
      patient.sex
    );
  } else {
    // WHO/FAO: use Mifflin as approximation (they use similar base)
    bmr = mifflinStJeor(
      patient.weightKg,
      patient.heightCm,
      patient.ageYears,
      patient.sex
    );
  }

  // If body fat % is available, average with Katch-McArdle for accuracy
  if (patient.bodyFatPct !== undefined && patient.bodyFatPct > 0) {
    const kmBmr = katchMcArdle(patient.weightKg, patient.bodyFatPct);
    bmr = (bmr + kmBmr) / 2;
  }

  const activityFactor = ACTIVITY_FACTORS[patient.activityLevel];
  const tdee = Math.round(bmr * activityFactor);
  const goalAdjustmentKcal = GOAL_ADJUSTMENTS[patient.goal];
  const targetCalories = Math.round(tdee + goalAdjustmentKcal);

  return {
    bmr: Math.round(bmr),
    tdee,
    targetCalories: Math.max(targetCalories, 1200), // Safety floor
    activityFactor,
    goalAdjustmentKcal,
    formula,
  };
}

// ─── Macro Distribution ──────────────────────────────────────────────────────

export interface MacroDistribution {
  proteinPct: number;
  fatPct: number;
  carbsPct: number;
}

// Recommended macro ranges per goal (AMDR-based + clinical practice)
export const DEFAULT_MACRO_DISTRIBUTION: Record<Goal, MacroDistribution> = {
  weight_loss: { proteinPct: 30, fatPct: 30, carbsPct: 40 },
  maintenance: { proteinPct: 20, fatPct: 30, carbsPct: 50 },
  weight_gain: { proteinPct: 20, fatPct: 30, carbsPct: 50 },
  muscle_gain: { proteinPct: 30, fatPct: 25, carbsPct: 45 },
  health: { proteinPct: 20, fatPct: 30, carbsPct: 50 },
};

export function calculateMacros(
  targetCalories: number,
  distribution: MacroDistribution
): MacroResult {
  const { proteinPct, fatPct, carbsPct } = distribution;

  const proteinKcal = (targetCalories * proteinPct) / 100;
  const fatKcal = (targetCalories * fatPct) / 100;
  const carbsKcal = (targetCalories * carbsPct) / 100;

  return {
    proteinG: Math.round(proteinKcal / 4),
    fatG: Math.round(fatKcal / 9),
    carbsG: Math.round(carbsKcal / 4),
    proteinKcal: Math.round(proteinKcal),
    fatKcal: Math.round(fatKcal),
    carbsKcal: Math.round(carbsKcal),
    proteinPct,
    fatPct,
    carbsPct,
  };
}

// ─── BMI ──────────────────────────────────────────────────────────────────────

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Bajo peso", color: "text-blue-600" };
  if (bmi < 25) return { label: "Peso normal", color: "text-green-600" };
  if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-600" };
  if (bmi < 35) return { label: "Obesidad I", color: "text-orange-600" };
  if (bmi < 40) return { label: "Obesidad II", color: "text-red-600" };
  return { label: "Obesidad III", color: "text-red-800" };
}

// ─── SMAE Equivalents Calculator ─────────────────────────────────────────────
// Maps macros/calories to SMAE equivalent groups
// Decision: simplified distribution for MVP — clinician can adjust manually

export interface SMaeEquivalentsInput {
  targetCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  goal: Goal;
}

export interface SMaeEquivalents {
  verduras: number;
  frutas: number;
  cerealesSinGrasa: number;
  leguminosas: number;
  aoaMuyBajaGrasa: number;
  grasasSinProt: number;
  azucaresSinGrasa: number;
}

/**
 * Simplified SMAE equivalents distribution.
 * This is a starting point — clinicians customize in the plan editor.
 *
 * Algorithm:
 * 1. Fix non-negotiable groups (verduras, leche)
 * 2. Distribute protein across AOA + leguminosas
 * 3. Fill remaining calories with cereales and grasas
 * 4. Add fruit based on carb remaining
 */
export function calculateSMAEEquivalents(
  input: SMaeEquivalentsInput
): SMaeEquivalents {
  const { targetCalories } = input;

  // Base verduras: 3 equivalentes (recommended minimum)
  const verduras = 3;
  const verduraKcal = verduras * 25;

  // AOA (protein)
  const aoaMuyBajaGrasa = Math.round(input.proteinG / 7); // ~7g protein each

  // Leguminosas: 1 equivalent for health
  const leguminosas = input.goal === "weight_loss" ? 1 : 1;
  const leguminosasKcal = leguminosas * 120;

  // Grasas
  const grasasSinProt = Math.round(input.fatG / 5); // ~5g fat each

  // Remaining calories for cereales
  const usedKcal =
    verduraKcal +
    aoaMuyBajaGrasa * 40 +
    leguminosasKcal +
    grasasSinProt * 45;
  const remainingKcal = Math.max(targetCalories - usedKcal, 0);

  // Frutas: fixed 3 for most goals
  const frutas = 3;
  const frutasKcal = frutas * 60;

  // Cereales with remaining
  const cerealesKcal = remainingKcal - frutasKcal;
  const cerealesSinGrasa = Math.max(Math.round(cerealesKcal / 70), 2);

  // Azúcares: minimal, only for weight gain
  const azucaresSinGrasa = input.goal === "weight_gain" ? 2 : 0;

  return {
    verduras,
    frutas,
    cerealesSinGrasa,
    leguminosas,
    aoaMuyBajaGrasa,
    grasasSinProt,
    azucaresSinGrasa,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function calculateIdealWeight(heightCm: number, sex: Sex): number {
  // Devine formula
  const heightIn = heightCm / 2.54;
  const baseIn = 60; // 5 feet
  const extra = Math.max(0, heightIn - baseIn);
  if (sex === "male") {
    return Math.round(50 + 2.3 * extra);
  }
  return Math.round(45.5 + 2.3 * extra);
}

export function macrosFromFood(
  food: {
    calories: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
    servingWeightG: number;
  },
  quantityG: number
): { calories: number; proteinG: number; fatG: number; carbsG: number } {
  const ratio = quantityG / food.servingWeightG;
  return {
    calories: Math.round(food.calories * ratio * 10) / 10,
    proteinG: Math.round(food.proteinG * ratio * 10) / 10,
    fatG: Math.round(food.fatG * ratio * 10) / 10,
    carbsG: Math.round(food.carbsG * ratio * 10) / 10,
  };
}
