import { z } from "zod";

// ─── Patient Schema ────────────────────────────────────────────────────────────

export const patientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  age: z.number().min(1).max(120).optional(),
  sex: z.enum(["male", "female"] as const, { message: "Selecciona el sexo" }),
  heightCm: z.number().min(50, "Estatura mínima 50 cm").max(250, "Estatura máxima 250 cm"),
  weightKg: z.number().min(1, "Peso mínimo 1 kg").max(500, "Peso máximo 500 kg"),
  waistCm: z.number().min(30).max(300).optional(),
  hipCm: z.number().min(30).max(300).optional(),
  neckCm: z.number().min(20).max(100).optional(),
  bodyFatPct: z.number().min(1).max(70).optional(),
  muscleMassKg: z.number().min(1).max(200).optional(),
  activityLevel: z.enum(
    ["sedentary", "light", "moderate", "active", "very_active"] as const,
    { message: "Selecciona el nivel de actividad" }
  ),
  goal: z.enum(
    ["weight_loss", "maintenance", "weight_gain", "muscle_gain", "health"] as const,
    { message: "Selecciona el objetivo" }
  ),
  notes: z.string().max(1000).optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;

// ─── Plan Schema ───────────────────────────────────────────────────────────────

export const planSchema = z.object({
  title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  calculationMethod: z.enum(["mifflin", "harris_benedict", "who_fao"] as const).default("mifflin"),
  targetCalories: z.number().min(500).max(10000),
  targetProteinPct: z.number().min(5).max(60),
  targetFatPct: z.number().min(10).max(60),
  targetCarbsPct: z.number().min(10).max(70),
  status: z.enum(["draft", "active", "archived"] as const).default("draft"),
});

export type PlanFormData = z.infer<typeof planSchema>;

// ─── Meal Schema ───────────────────────────────────────────────────────────────

export const mealSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  time: z.string().optional(),
  notes: z.string().optional(),
});

export type MealFormData = z.infer<typeof mealSchema>;

// ─── Recipe Schema ─────────────────────────────────────────────────────────────

export const recipeSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prepTimeMin: z.number().min(0).max(600).optional(),
  cookTimeMin: z.number().min(0).max(600).optional(),
  servings: z.number().min(1).max(100).default(1),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;

// ─── Nutritionist Profile Schema ───────────────────────────────────────────────

export const nutritionistSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  cedula: z.string().optional(),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  clinicName: z.string().optional(),
  address: z.string().optional(),
});

export type NutritionistFormData = z.infer<typeof nutritionistSchema>;
