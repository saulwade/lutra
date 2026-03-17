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

async function verifyPlanOwnership(ctx: any, planId: string, nutritionistId: string) {
  const plan = await ctx.db.get(planId);
  if (!plan) throw new Error("Plan not found");
  if (plan.nutritionistId !== nutritionistId) throw new Error("Unauthorized");
  return plan;
}

async function recalculateMealTotals(ctx: any, mealId: string) {
  const foods = await ctx.db
    .query("mealFoods")
    .withIndex("by_meal", (q: any) => q.eq("mealId", mealId))
    .collect();

  const totalCalories = foods.reduce((sum: number, f: any) => sum + f.calories, 0);
  const totalProteinG = foods.reduce((sum: number, f: any) => sum + f.proteinG, 0);
  const totalFatG = foods.reduce((sum: number, f: any) => sum + f.fatG, 0);
  const totalCarbsG = foods.reduce((sum: number, f: any) => sum + f.carbsG, 0);

  await ctx.db.patch(mealId, {
    totalCalories,
    totalProteinG,
    totalFatG,
    totalCarbsG,
  });
}

// ─── GET MEALS ────────────────────────────────────────────────────────────────
export const getMeals = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    await verifyPlanOwnership(ctx, args.planId, nutritionist._id);

    const meals = await ctx.db
      .query("meals")
      .withIndex("by_plan_order", (q: any) => q.eq("planId", args.planId))
      .collect();

    return meals.sort((a, b) => a.order - b.order);
  },
});

// ─── CREATE MEAL ──────────────────────────────────────────────────────────────
export const createMeal = mutation({
  args: {
    planId: v.id("plans"),
    name: v.string(),
    time: v.optional(v.string()),
    order: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    await verifyPlanOwnership(ctx, args.planId, nutritionist._id);

    const now = Date.now();
    const id = await ctx.db.insert("meals", {
      planId: args.planId,
      name: args.name,
      time: args.time,
      order: args.order,
      notes: args.notes,
      totalCalories: 0,
      totalProteinG: 0,
      totalFatG: 0,
      totalCarbsG: 0,
      createdAt: now,
    });

    return id;
  },
});

// ─── UPDATE MEAL ──────────────────────────────────────────────────────────────
export const updateMeal = mutation({
  args: {
    mealId: v.id("meals"),
    name: v.optional(v.string()),
    time: v.optional(v.string()),
    order: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const meal = await ctx.db.get(args.mealId);
    if (!meal) throw new Error("Meal not found");
    await verifyPlanOwnership(ctx, meal.planId, nutritionist._id);

    const { mealId, ...fields } = args;
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(mealId, updates);
    return mealId;
  },
});

// ─── DELETE MEAL ──────────────────────────────────────────────────────────────
export const deleteMeal = mutation({
  args: { mealId: v.id("meals") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const meal = await ctx.db.get(args.mealId);
    if (!meal) throw new Error("Meal not found");
    await verifyPlanOwnership(ctx, meal.planId, nutritionist._id);

    // Remove all meal foods first
    const mealFoods = await ctx.db
      .query("mealFoods")
      .withIndex("by_meal", (q: any) => q.eq("mealId", args.mealId))
      .collect();

    await Promise.all(mealFoods.map((mf) => ctx.db.delete(mf._id)));
    await ctx.db.delete(args.mealId);

    return args.mealId;
  },
});

// ─── REORDER MEALS ────────────────────────────────────────────────────────────
export const reorderMeals = mutation({
  args: {
    planId: v.id("plans"),
    // Array of { mealId, order } pairs
    orderedMealIds: v.array(v.object({ mealId: v.id("meals"), order: v.number() })),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    await verifyPlanOwnership(ctx, args.planId, nutritionist._id);

    await Promise.all(
      args.orderedMealIds.map(({ mealId, order }) => ctx.db.patch(mealId, { order }))
    );

    return true;
  },
});

// ─── GET MEAL FOODS ───────────────────────────────────────────────────────────
export const getMealFoods = query({
  args: { mealId: v.id("meals") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const meal = await ctx.db.get(args.mealId);
    if (!meal) throw new Error("Meal not found");
    await verifyPlanOwnership(ctx, meal.planId, nutritionist._id);

    const foods = await ctx.db
      .query("mealFoods")
      .withIndex("by_meal", (q: any) => q.eq("mealId", args.mealId))
      .collect();

    return foods.sort((a, b) => a.order - b.order);
  },
});

// ─── ADD FOOD TO MEAL ─────────────────────────────────────────────────────────
export const addFoodToMeal = mutation({
  args: {
    mealId: v.id("meals"),
    planId: v.id("plans"),
    foodId: v.optional(v.id("foods")),
    recipeId: v.optional(v.id("recipes")),
    name: v.string(),
    quantity: v.number(),
    unit: v.string(),
    weightG: v.number(),
    calories: v.number(),
    proteinG: v.number(),
    fatG: v.number(),
    carbsG: v.number(),
    fiberG: v.optional(v.number()),
    smaeCategory: v.optional(v.string()),
    smaeEquivalents: v.optional(v.number()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    await verifyPlanOwnership(ctx, args.planId, nutritionist._id);

    // Verify meal belongs to plan
    const meal = await ctx.db.get(args.mealId);
    if (!meal || meal.planId !== args.planId) throw new Error("Meal/plan mismatch");

    const now = Date.now();
    const id = await ctx.db.insert("mealFoods", {
      mealId: args.mealId,
      planId: args.planId,
      foodId: args.foodId,
      recipeId: args.recipeId,
      name: args.name,
      quantity: args.quantity,
      unit: args.unit,
      weightG: args.weightG,
      calories: args.calories,
      proteinG: args.proteinG,
      fatG: args.fatG,
      carbsG: args.carbsG,
      fiberG: args.fiberG,
      smaeCategory: args.smaeCategory,
      smaeEquivalents: args.smaeEquivalents,
      order: args.order,
      createdAt: now,
    });

    // Update meal totals
    await recalculateMealTotals(ctx, args.mealId);

    return id;
  },
});

// ─── REMOVE FOOD FROM MEAL ────────────────────────────────────────────────────
export const removeFoodFromMeal = mutation({
  args: { mealFoodId: v.id("mealFoods") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const mealFood = await ctx.db.get(args.mealFoodId);
    if (!mealFood) throw new Error("MealFood not found");
    await verifyPlanOwnership(ctx, mealFood.planId, nutritionist._id);

    const mealId = mealFood.mealId;
    await ctx.db.delete(args.mealFoodId);

    // Update meal totals
    await recalculateMealTotals(ctx, mealId);

    return args.mealFoodId;
  },
});

// ─── UPDATE MEAL FOOD ─────────────────────────────────────────────────────────
export const updateMealFood = mutation({
  args: {
    mealFoodId: v.id("mealFoods"),
    name: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    weightG: v.optional(v.number()),
    calories: v.optional(v.number()),
    proteinG: v.optional(v.number()),
    fatG: v.optional(v.number()),
    carbsG: v.optional(v.number()),
    fiberG: v.optional(v.number()),
    smaeCategory: v.optional(v.string()),
    smaeEquivalents: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const mealFood = await ctx.db.get(args.mealFoodId);
    if (!mealFood) throw new Error("MealFood not found");
    await verifyPlanOwnership(ctx, mealFood.planId, nutritionist._id);

    const { mealFoodId, ...fields } = args;
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(mealFoodId, updates);

    // Recalculate meal totals if macros changed
    const macroFields = ["calories", "proteinG", "fatG", "carbsG"];
    const macrosChanged = macroFields.some((f) => f in updates);
    if (macrosChanged) {
      await recalculateMealTotals(ctx, mealFood.mealId);
    }

    return mealFoodId;
  },
});

// ─── GET ALL MEAL FOODS FOR A PLAN (grouped by mealId) ───────────────────────
// Used by MealBuilder to load all foods for a plan in one query
export const getAllMealFoodsForPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    await verifyPlanOwnership(ctx, args.planId, nutritionist._id);

    const allFoods = await ctx.db
      .query("mealFoods")
      .withIndex("by_plan", (q: any) => q.eq("planId", args.planId))
      .collect();

    // Group by mealId
    const grouped: Record<string, typeof allFoods> = {};
    for (const food of allFoods) {
      if (!grouped[food.mealId]) grouped[food.mealId] = [];
      grouped[food.mealId].push(food);
    }
    // Sort each group by order
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.order - b.order);
    }
    return grouped;
  },
});
