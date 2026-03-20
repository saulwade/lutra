// @ts-nocheck
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function getAuthenticatedNutritionist(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const nutritionist = await ctx.db
    .query("nutritionists")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  if (!nutritionist) throw new Error("Nutritionist profile not found");
  return nutritionist;
}

const equivalentsPerDayValidator = v.optional(
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
);

const distributionPerMealValidator = v.optional(
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
);

// ─── GET PLANS ────────────────────────────────────────────────────────────────
export const getPlans = query({
  args: {
    patientId: v.id("patients"),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))
    ),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    // Verify ownership of the patient
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.nutritionistId !== nutritionist._id) {
      throw new Error("Unauthorized");
    }

    if (args.status) {
      return ctx.db
        .query("plans")
        .withIndex("by_patient_status", (q: any) =>
          q.eq("patientId", args.patientId).eq("status", args.status)
        )
        .collect();
    }

    return ctx.db
      .query("plans")
      .withIndex("by_patient", (q: any) => q.eq("patientId", args.patientId))
      .collect();
  },
});

// ─── GET PLAN ─────────────────────────────────────────────────────────────────
export const getPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const plan = await ctx.db.get(args.planId);
    if (!plan) return null;
    if (plan.nutritionistId !== nutritionist._id) return null;

    const meals = await ctx.db
      .query("meals")
      .withIndex("by_plan_order", (q: any) => q.eq("planId", args.planId))
      .collect();

    const mealsWithFoods = await Promise.all(
      meals.map(async (meal) => {
        const foods = await ctx.db
          .query("mealFoods")
          .withIndex("by_meal", (q: any) => q.eq("mealId", meal._id))
          .collect();
        return { ...meal, foods: foods.sort((a, b) => a.order - b.order) };
      })
    );

    const patient = plan.patientId ? await ctx.db.get(plan.patientId) : null;

    return { ...plan, meals: mealsWithFoods, patient };
  },
});

// ─── CREATE PLAN ──────────────────────────────────────────────────────────────
export const createPlan = mutation({
  args: {
    patientId: v.id("patients"),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    targetCalories: v.number(),
    targetProteinG: v.number(),
    targetFatG: v.number(),
    targetCarbsG: v.number(),
    targetProteinPct: v.number(),
    targetFatPct: v.number(),
    targetCarbsPct: v.number(),
    calculationMethod: v.string(),
    calculationFactor: v.number(),
    bmr: v.optional(v.number()),
    tdee: v.optional(v.number()),
    equivalentsPerDay: equivalentsPerDayValidator,
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.nutritionistId !== nutritionist._id) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const id = await ctx.db.insert("plans", {
      nutritionistId: nutritionist._id,
      patientId: args.patientId,
      title: args.title,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      targetCalories: args.targetCalories,
      targetProteinG: args.targetProteinG,
      targetFatG: args.targetFatG,
      targetCarbsG: args.targetCarbsG,
      targetProteinPct: args.targetProteinPct,
      targetFatPct: args.targetFatPct,
      targetCarbsPct: args.targetCarbsPct,
      calculationMethod: args.calculationMethod,
      calculationFactor: args.calculationFactor,
      bmr: args.bmr,
      tdee: args.tdee,
      equivalentsPerDay: args.equivalentsPerDay,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// ─── UPDATE PLAN ──────────────────────────────────────────────────────────────
export const updatePlan = mutation({
  args: {
    planId: v.id("plans"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))
    ),
    targetCalories: v.optional(v.number()),
    targetProteinG: v.optional(v.number()),
    targetFatG: v.optional(v.number()),
    targetCarbsG: v.optional(v.number()),
    targetProteinPct: v.optional(v.number()),
    targetFatPct: v.optional(v.number()),
    targetCarbsPct: v.optional(v.number()),
    calculationMethod: v.optional(v.string()),
    calculationFactor: v.optional(v.number()),
    bmr: v.optional(v.number()),
    tdee: v.optional(v.number()),
    equivalentsPerDay: equivalentsPerDayValidator,
    distributionPerMeal: distributionPerMealValidator,
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    const { planId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(planId, updates);
    return planId;
  },
});

// ─── DELETE PLAN ──────────────────────────────────────────────────────────────
export const deletePlan = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    // Delete all meal foods and meals associated with this plan
    const mealFoods = await ctx.db
      .query("mealFoods")
      .withIndex("by_plan", (q: any) => q.eq("planId", args.planId))
      .collect();

    await Promise.all(mealFoods.map((mf) => ctx.db.delete(mf._id)));

    const meals = await ctx.db
      .query("meals")
      .withIndex("by_plan", (q: any) => q.eq("planId", args.planId))
      .collect();

    await Promise.all(meals.map((m) => ctx.db.delete(m._id)));

    await ctx.db.delete(args.planId);
    return args.planId;
  },
});

// ─── DUPLICATE PLAN ───────────────────────────────────────────────────────────
export const duplicatePlan = mutation({
  args: {
    planId: v.id("plans"),
    newTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    const now = Date.now();

    // Create the new plan
    const { _id, _creationTime, createdAt, updatedAt, ...planData } = plan;
    const newPlanId = await ctx.db.insert("plans", {
      ...planData,
      title: args.newTitle ?? `${plan.title} (copia)`,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    // Duplicate meals
    const meals = await ctx.db
      .query("meals")
      .withIndex("by_plan_order", (q: any) => q.eq("planId", args.planId))
      .collect();

    for (const meal of meals) {
      const { _id: mealId, _creationTime: mct, createdAt: mca, ...mealData } = meal;

      const newMealId = await ctx.db.insert("meals", {
        ...mealData,
        planId: newPlanId,
        createdAt: now,
      });

      // Duplicate meal foods
      const mealFoods = await ctx.db
        .query("mealFoods")
        .withIndex("by_meal", (q: any) => q.eq("mealId", mealId))
        .collect();

      for (const mf of mealFoods) {
        const { _id: mfId, _creationTime: mfct, createdAt: mfca, ...mfData } = mf;
        await ctx.db.insert("mealFoods", {
          ...mfData,
          mealId: newMealId,
          planId: newPlanId,
          createdAt: now,
        });
      }
    }

    return newPlanId;
  },
});

// ─── GET TEMPLATES ────────────────────────────────────────────────────────────
export const getRecentPlans = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const all = await ctx.db
      .query("plans")
      .withIndex("by_nutritionist", (q: any) => q.eq("nutritionistId", nutritionist._id))
      .order("desc")
      .take(args.limit ?? 5);
    return all;
  },
});

export const getTemplates = query({
  args: {},
  handler: async (ctx) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    return ctx.db
      .query("plans")
      .withIndex("by_nutritionist_template", (q: any) =>
        q.eq("nutritionistId", nutritionist._id).eq("isTemplate", true)
      )
      .collect();
  },
});

// ─── SAVE AS TEMPLATE ─────────────────────────────────────────────────────────
// Clones an existing plan as a template (no patient, no dates)
export const saveAsTemplate = mutation({
  args: {
    planId: v.id("plans"),
    templateName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    const now = Date.now();
    const { _id, _creationTime, createdAt, updatedAt, patientId, startDate, endDate, ...planData } = plan;

    const newPlanId = await ctx.db.insert("plans", {
      ...planData,
      title: args.templateName ?? `Plantilla: ${plan.title}`,
      status: "draft",
      isTemplate: true,
      patientId: undefined,
      startDate: undefined,
      endDate: undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Clone meals and foods
    const meals = await ctx.db
      .query("meals")
      .withIndex("by_plan_order", (q: any) => q.eq("planId", args.planId))
      .collect();

    for (const meal of meals) {
      const { _id: mealId, _creationTime: mct, createdAt: mca, ...mealData } = meal;
      const newMealId = await ctx.db.insert("meals", {
        ...mealData,
        planId: newPlanId,
        createdAt: now,
      });

      const mealFoods = await ctx.db
        .query("mealFoods")
        .withIndex("by_meal", (q: any) => q.eq("mealId", mealId))
        .collect();

      for (const mf of mealFoods) {
        const { _id: mfId, _creationTime: mfct, createdAt: mfca, ...mfData } = mf;
        await ctx.db.insert("mealFoods", {
          ...mfData,
          mealId: newMealId,
          planId: newPlanId,
          createdAt: now,
        });
      }
    }

    return newPlanId;
  },
});

// ─── CREATE FROM TEMPLATE ─────────────────────────────────────────────────────
// Clone a template plan to a specific patient
export const createFromTemplate = mutation({
  args: {
    templateId: v.id("plans"),
    patientId: v.id("patients"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");
    if (!template.isTemplate) throw new Error("Plan is not a template");

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    const now = Date.now();
    const { _id, _creationTime, createdAt, updatedAt, isTemplate, ...planData } = template;

    const newPlanId = await ctx.db.insert("plans", {
      ...planData,
      title: args.title ?? template.title.replace(/^Plantilla: /, ""),
      patientId: args.patientId,
      status: "draft",
      isTemplate: false,
      createdAt: now,
      updatedAt: now,
    });

    const meals = await ctx.db
      .query("meals")
      .withIndex("by_plan_order", (q: any) => q.eq("planId", args.templateId))
      .collect();

    for (const meal of meals) {
      const { _id: mealId, _creationTime: mct, createdAt: mca, ...mealData } = meal;
      const newMealId = await ctx.db.insert("meals", {
        ...mealData,
        planId: newPlanId,
        createdAt: now,
      });

      const mealFoods = await ctx.db
        .query("mealFoods")
        .withIndex("by_meal", (q: any) => q.eq("mealId", mealId))
        .collect();

      for (const mf of mealFoods) {
        const { _id: mfId, _creationTime: mfct, createdAt: mfca, ...mfData } = mf;
        await ctx.db.insert("mealFoods", {
          ...mfData,
          mealId: newMealId,
          planId: newPlanId,
          createdAt: now,
        });
      }
    }

    return newPlanId;
  },
});
