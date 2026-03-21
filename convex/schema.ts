import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── NUTRITIONISTS ──────────────────────────────────────────────
  nutritionists: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    cedula: v.optional(v.string()),        // Professional license
    specialty: v.optional(v.string()),
    phone: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    clinicName: v.optional(v.string()),
    address: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // ─── PATIENTS ────────────────────────────────────────────────────
  patients: defineTable({
    nutritionistId: v.id("nutritionists"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.string()),     // ISO date string
    age: v.optional(v.number()),
    sex: v.union(v.literal("male"), v.literal("female")),
    // Anthropometrics
    heightCm: v.number(),
    weightKg: v.number(),
    waistCm: v.optional(v.number()),
    hipCm: v.optional(v.number()),
    neckCm: v.optional(v.number()),
    // Composition
    bodyFatPct: v.optional(v.number()),
    muscleMassKg: v.optional(v.number()),
    // Activity & goal
    activityLevel: v.union(
      v.literal("sedentary"),
      v.literal("light"),
      v.literal("moderate"),
      v.literal("active"),
      v.literal("very_active")
    ),
    goal: v.union(
      v.literal("weight_loss"),
      v.literal("maintenance"),
      v.literal("weight_gain"),
      v.literal("muscle_gain"),
      v.literal("health")
    ),
    notes: v.optional(v.string()),
    // Clinical context
    allergies: v.optional(v.array(v.string())),       // e.g. ["Lactosa", "Gluten"]
    foodPreferences: v.optional(v.string()),           // "Vegetariana, sin cerdo"
    adherenceRating: v.optional(v.union(
      v.literal("alta"),
      v.literal("media"),
      v.literal("baja")
    )),
    recall24h: v.optional(v.string()),                // Recordatorio alimentario 24hr
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_nutritionist", ["nutritionistId"])
    .index("by_nutritionist_active", ["nutritionistId", "isActive"]),

  // ─── NUTRITION PLANS ─────────────────────────────────────────────
  plans: defineTable({
    nutritionistId: v.id("nutritionists"),
    patientId: v.optional(v.id("patients")),  // optional for templates
    isTemplate: v.optional(v.boolean()),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived")
    ),
    // Calculated targets
    targetCalories: v.number(),
    targetProteinG: v.number(),
    targetFatG: v.number(),
    targetCarbsG: v.number(),
    targetProteinPct: v.number(),
    targetFatPct: v.number(),
    targetCarbsPct: v.number(),
    // Calculation metadata
    calculationMethod: v.string(),        // e.g. "harris_benedict", "mifflin"
    calculationFactor: v.number(),        // activity multiplier
    bmr: v.optional(v.number()),
    tdee: v.optional(v.number()),
    // SMAE equivalents totals per day
    equivalentsPerDay: v.optional(
      v.object({
        verduras: v.number(),
        frutas: v.number(),
        cerealesSinGrasa: v.number(),
        cerealesConGrasa: v.number(),
        leguminosas: v.number(),
        aoaMuyBajaGrasa: v.number(),
        aoaBajaGrasa: v.number(),
        aoaMedGrasa: v.number(),
        aoaAltaGrasa: v.number(),
        lecheDes: v.number(),
        lecheSemi: v.number(),
        lecheEntera: v.number(),
        lecheConAzucar: v.number(),
        grasasSinProt: v.number(),
        grasasConProt: v.number(),
        azucaresSinGrasa: v.number(),
        azucaresConGrasa: v.number(),
      })
    ),
    // Per-meal distribution (8 groups × 5 meal times: [Desayuno, Col.AM, Comida, Col.PM, Cena])
    distributionPerMeal: v.optional(
      v.object({
        verduras:    v.array(v.number()),
        frutas:      v.array(v.number()),
        cereales:    v.array(v.number()),
        aoa:         v.array(v.number()),
        leche:       v.array(v.number()),
        grasas:      v.array(v.number()),
        leguminosas: v.array(v.number()),
        azucares:    v.array(v.number()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_nutritionist", ["nutritionistId"])
    .index("by_patient", ["patientId"])
    .index("by_patient_status", ["patientId", "status"])
    .index("by_nutritionist_template", ["nutritionistId", "isTemplate"]),

  // ─── MEALS (times of day within a plan) ──────────────────────────
  meals: defineTable({
    planId: v.id("plans"),
    name: v.string(),                     // "Desayuno", "Colación", etc.
    time: v.optional(v.string()),         // "08:00"
    order: v.number(),                    // for sorting
    notes: v.optional(v.string()),
    // Calculated totals (denormalized for performance)
    totalCalories: v.optional(v.number()),
    totalProteinG: v.optional(v.number()),
    totalFatG: v.optional(v.number()),
    totalCarbsG: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_plan_order", ["planId", "order"]),

  // ─── MEAL FOODS ───────────────────────────────────────────────────
  mealFoods: defineTable({
    mealId: v.id("meals"),
    planId: v.id("plans"),               // denorm for easier queries
    foodId: v.optional(v.id("foods")),   // null if custom entry
    recipeId: v.optional(v.id("recipes")),
    // What's shown to user
    name: v.string(),
    // Portion
    quantity: v.number(),
    unit: v.string(),                    // "g", "taza", "pieza", etc.
    weightG: v.number(),                 // actual grams
    // Macros (calculated at add-time from food/recipe)
    calories: v.number(),
    proteinG: v.number(),
    fatG: v.number(),
    carbsG: v.number(),
    fiberG: v.optional(v.number()),
    // SMAE info
    smaeCategory: v.optional(v.string()),
    smaeEquivalents: v.optional(v.number()),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_meal", ["mealId"])
    .index("by_plan", ["planId"]),

  // ─── MEASUREMENTS (anthropometric history) ───────────────────────
  measurements: defineTable({
    patientId: v.id("patients"),
    nutritionistId: v.id("nutritionists"),
    date: v.string(),                      // "2024-03-15"
    weightKg: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    muscleMassKg: v.optional(v.number()),
    waistCm: v.optional(v.number()),
    hipCm: v.optional(v.number()),
    neckCm: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_patient_date", ["patientId", "date"]),

  // ─── CONSULTATIONS (visit notes + follow-up) ─────────────────────
  consultations: defineTable({
    patientId: v.id("patients"),
    nutritionistId: v.id("nutritionists"),
    date: v.string(),                      // "2024-03-15"
    reason: v.optional(v.string()),        // motivo de consulta
    notes: v.optional(v.string()),         // notas clínicas
    weightKg: v.optional(v.number()),      // peso en consulta
    bodyFatPct: v.optional(v.number()),    // % grasa corporal
    muscleMassKg: v.optional(v.number()),  // masa muscular kg
    waistCm: v.optional(v.number()),       // cintura cm
    bloodPressure: v.optional(v.string()), // "120/80"
    // Seguimiento cualitativo
    adherenceScore: v.optional(v.number()),      // 1–5: qué tanto siguió el plan
    feelingScore: v.optional(v.number()),         // 1–5: cómo se siente
    seesPhysicalChanges: v.optional(v.boolean()),
    seesMentalChanges: v.optional(v.boolean()),
    nextAppointment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_patient_date", ["patientId", "date"]),

  // ─── CLINICAL HISTORY (one per patient) ──────────────────────────
  clinicalHistory: defineTable({
    patientId: v.id("patients"),
    nutritionistId: v.id("nutritionists"),
    // Antecedentes
    personalPathological: v.optional(v.string()),   // Diabetes, HTA, etc.
    familyHistory: v.optional(v.string()),           // Heredofamiliares
    personalNonPathological: v.optional(v.string()), // Ocupación, escolaridad
    substances: v.optional(v.string()),              // Toxicomanías
    alcoholUse: v.optional(v.string()),              // Consumo de alcohol
    // Hábitos alimentarios
    physicalActivity: v.optional(v.string()),
    mealsPerDay: v.optional(v.number()),
    eatsOutFrequency: v.optional(v.string()),        // "nunca"|"1-2x/sem"|"3-4x/sem"|"diario"
    foodPreparator: v.optional(v.string()),          // quién prepara alimentos
    foodRelationship: v.optional(v.string()),        // relación con la comida
    // Otros hábitos
    sleepHours: v.optional(v.number()),
    sleepQuality: v.optional(v.string()),            // "buena"|"regular"|"mala"
    supplements: v.optional(v.string()),
    // Gustos y restricciones
    foodLikes: v.optional(v.string()),
    foodDislikes: v.optional(v.string()),
    allergiesDetail: v.optional(v.string()),         // descripción ampliada
    commitmentLevel: v.optional(v.string()),         // percepción inicial
    updatedAt: v.number(),
  })
    .index("by_patient", ["patientId"]),

  // ─── FOOD DATABASE (SMAE) ─────────────────────────────────────────
  foods: defineTable({
    name: v.string(),
    category: v.string(),               // SMAE category
    categorySlug: v.string(),
    // Serving info
    servingAmount: v.number(),
    servingUnit: v.string(),
    servingWeightG: v.number(),         // peso neto in grams
    grossWeightG: v.optional(v.number()),
    // Core macros per serving
    calories: v.number(),
    proteinG: v.number(),
    fatG: v.number(),
    carbsG: v.number(),
    fiberG: v.optional(v.number()),
    // Extended nutrition (optional, null = not determined)
    saturatedFatG: v.optional(v.number()),
    monounsatFatG: v.optional(v.number()),
    polyunsatFatG: v.optional(v.number()),
    cholesterolMg: v.optional(v.number()),
    sugarG: v.optional(v.number()),
    vitaminAMgRE: v.optional(v.number()),
    vitaminCMg: v.optional(v.number()),
    folicAcidMg: v.optional(v.number()),
    calciumMg: v.optional(v.number()),
    ironMg: v.optional(v.number()),
    potassiumMg: v.optional(v.number()),
    sodiumMg: v.optional(v.number()),
    phosphorusMg: v.optional(v.number()),
    ethanolG: v.optional(v.number()),
    glycemicIndex: v.optional(v.number()),
    glycemicLoad: v.optional(v.number()),
    // Source
    source: v.union(v.literal("smae"), v.literal("custom"), v.literal("external")),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_category_slug", ["categorySlug"])
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "isActive"],
    }),

  // ─── FOOD GROUPS (SMAE categories metadata) ──────────────────────
  foodGroups: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    // Typical macros per equivalent
    kcalPerEquivalent: v.number(),
    proteinGPerEquivalent: v.number(),
    fatGPerEquivalent: v.number(),
    carbsGPerEquivalent: v.number(),
    color: v.optional(v.string()),       // for UI
    order: v.number(),
  })
    .index("by_slug", ["slug"]),

  // ─── RECIPES ──────────────────────────────────────────────────────
  recipes: defineTable({
    nutritionistId: v.id("nutritionists"),
    name: v.string(),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    prepTimeMin: v.optional(v.number()),
    cookTimeMin: v.optional(v.number()),
    servings: v.number(),
    // Calculated per serving
    caloriesPerServing: v.number(),
    proteinGPerServing: v.number(),
    fatGPerServing: v.number(),
    carbsGPerServing: v.number(),
    fiberGPerServing: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    isPublic: v.boolean(),
    imageStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_nutritionist", ["nutritionistId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["nutritionistId", "isPublic"],
    }),

  // ─── RECIPE FOODS ─────────────────────────────────────────────────
  recipeFoods: defineTable({
    recipeId: v.id("recipes"),
    foodId: v.id("foods"),
    quantity: v.number(),
    unit: v.string(),
    weightG: v.number(),
    // Cached macros contribution
    calories: v.number(),
    proteinG: v.number(),
    fatG: v.number(),
    carbsG: v.number(),
    order: v.number(),
  })
    .index("by_recipe", ["recipeId"]),

  // ─── NUTRITIONAL SCREENINGS (NRS, MUST, CONUT, GLIM) ─────────────
  screenings: defineTable({
    patientId: v.id("patients"),
    nutritionistId: v.id("nutritionists"),
    date: v.string(),                      // "2024-03-15"
    tool: v.union(
      v.literal("NRS2002"),
      v.literal("MUST"),
      v.literal("CONUT"),
      v.literal("GLIM")
    ),
    score: v.optional(v.number()),
    risk: v.optional(v.string()),          // "bajo"|"medio"|"alto"|"desnutricion"
    // NRS-2002 fields
    nrs_lowBmi: v.optional(v.boolean()),
    nrs_weightLoss: v.optional(v.boolean()),
    nrs_reducedIntake: v.optional(v.boolean()),
    nrs_severeIllness: v.optional(v.boolean()),
    nrs_age70: v.optional(v.boolean()),
    // MUST fields
    must_bmiScore: v.optional(v.number()),       // 0, 1, 2
    must_weightLossScore: v.optional(v.number()),// 0, 1, 2
    must_acuteScore: v.optional(v.number()),     // 0 or 2
    // CONUT fields (lab values)
    conut_albumin: v.optional(v.number()),       // g/dL
    conut_lymphocytes: v.optional(v.number()),   // cells/mm³
    conut_cholesterol: v.optional(v.number()),   // mg/dL
    // GLIM fields
    glim_weightLoss: v.optional(v.boolean()),    // phenotypic
    glim_lowBmi: v.optional(v.boolean()),        // phenotypic
    glim_lowMuscle: v.optional(v.boolean()),     // phenotypic
    glim_reducedIntake: v.optional(v.boolean()), // etiologic
    glim_inflammation: v.optional(v.boolean()),  // etiologic
    glim_severity: v.optional(v.string()),       // "moderada"|"severa"
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_patient_date", ["patientId", "date"])
    .index("by_patient_tool", ["patientId", "tool"]),

  // ─── PLAN VERSIONS (snapshots) ────────────────────────────────────
  planVersions: defineTable({
    planId: v.id("plans"),
    patientId: v.optional(v.id("patients")),
    nutritionistId: v.id("nutritionists"),
    date: v.string(),                      // "2024-03-15"
    label: v.optional(v.string()),         // "Semana 3 revisión"
    // Snapshot of plan targets at save time
    targetCalories: v.number(),
    targetProteinG: v.number(),
    targetFatG: v.number(),
    targetCarbsG: v.number(),
    equivalentsSnapshot: v.optional(v.any()),
    distributionSnapshot: v.optional(v.any()),
    // Nutritional adequacy summary at save time
    actualCalories: v.optional(v.number()),
    actualProteinG: v.optional(v.number()),
    actualFatG: v.optional(v.number()),
    actualCarbsG: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_patient", ["patientId"]),

  // ─── PATHOLOGIES & RECOMMENDATIONS ───────────────────────────────
  patientPathologies: defineTable({
    patientId: v.id("patients"),
    nutritionistId: v.id("nutritionists"),
    conditions: v.array(v.string()),       // ["Diabetes T2", "HTA", "Dislipidemia"]
    supplements: v.optional(v.string()),   // Indicaciones de suplementos
    clinicalRecommendations: v.optional(v.string()),
    glycemicControl: v.optional(v.boolean()),  // activar lógica glucémica
    dietType: v.optional(v.string()),      // "hiposódica"|"hipolipídica"|"diabética"|etc
    updatedAt: v.number(),
  })
    .index("by_patient", ["patientId"]),

  // ─── FOOD SEARCH CACHE (for future external API integration) ──────
  foodSearchCache: defineTable({
    query: v.string(),
    source: v.string(),                  // "fatsecret", "usda", etc.
    results: v.array(v.any()),
    fetchedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_query_source", ["query", "source"]),
});
