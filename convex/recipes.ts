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

async function recalculateRecipeMacros(ctx: any, recipeId: string) {
  const recipe = await ctx.db.get(recipeId);
  if (!recipe) return;

  const ingredients = await ctx.db
    .query("recipeFoods")
    .withIndex("by_recipe", (q: any) => q.eq("recipeId", recipeId))
    .collect();

  const totalCalories = ingredients.reduce((s: number, i: any) => s + i.calories, 0);
  const totalProteinG = ingredients.reduce((s: number, i: any) => s + i.proteinG, 0);
  const totalFatG = ingredients.reduce((s: number, i: any) => s + i.fatG, 0);
  const totalCarbsG = ingredients.reduce((s: number, i: any) => s + i.carbsG, 0);

  const servings = recipe.servings || 1;

  await ctx.db.patch(recipeId, {
    caloriesPerServing: totalCalories / servings,
    proteinGPerServing: totalProteinG / servings,
    fatGPerServing: totalFatG / servings,
    carbsGPerServing: totalCarbsG / servings,
    updatedAt: Date.now(),
  });
}

// ─── GENERATE UPLOAD URL ──────────────────────────────────────────────────────
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// ─── SAVE RECIPE IMAGE ────────────────────────────────────────────────────────
export const saveRecipeImage = mutation({
  args: { recipeId: v.id("recipes"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    // Delete old image if exists
    if (recipe.imageStorageId) {
      await ctx.storage.delete(recipe.imageStorageId);
    }

    await ctx.db.patch(args.recipeId, {
      imageStorageId: args.storageId,
      updatedAt: Date.now(),
    });
  },
});

// ─── REMOVE RECIPE IMAGE ──────────────────────────────────────────────────────
export const removeRecipeImage = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    if (recipe.imageStorageId) {
      await ctx.storage.delete(recipe.imageStorageId);
    }

    await ctx.db.patch(args.recipeId, { imageStorageId: undefined, updatedAt: Date.now() });
  },
});

// ─── MATCH INGREDIENTS (for recipe import) ────────────────────────────────────
// Takes up to 12 ingredient name strings and returns top SMAE matches for each
export const matchIngredients = query({
  args: { names: v.array(v.string()) },
  handler: async (ctx, args) => {
    const names = args.names.slice(0, 12);
    const results = await Promise.all(
      names.map(async (name) => {
        const foods = await ctx.db
          .query("foods")
          .withSearchIndex("search_name", (q: any) => q.search("name", name))
          .filter((q: any) => q.eq(q.field("isActive"), true))
          .take(4);
        return { name, matches: foods };
      })
    );
    return results;
  },
});

// ─── GET RECIPES ──────────────────────────────────────────────────────────────
export const getRecipes = query({
  args: {
    includePublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const ownRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_nutritionist", (q: any) =>
        q.eq("nutritionistId", nutritionist._id)
      )
      .collect();

    // Attach imageUrl for each recipe
    const withImages = await Promise.all(
      ownRecipes.map(async (r) => ({
        ...r,
        imageUrl: r.imageStorageId ? await ctx.storage.getUrl(r.imageStorageId) : null,
      }))
    );

    if (!args.includePublic) return withImages;

    const allRecipes = await ctx.db.query("recipes").collect();
    const publicFromOthers = allRecipes.filter(
      (r) => r.isPublic && r.nutritionistId !== nutritionist._id
    );

    const publicWithImages = await Promise.all(
      publicFromOthers.map(async (r) => ({
        ...r,
        imageUrl: r.imageStorageId ? await ctx.storage.getUrl(r.imageStorageId) : null,
      }))
    );

    return [...withImages, ...publicWithImages];
  },
});

// ─── GET RECIPE ───────────────────────────────────────────────────────────────
export const getRecipe = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");

    // Allow access if owner OR if public
    if (recipe.nutritionistId !== nutritionist._id && !recipe.isPublic) {
      throw new Error("Unauthorized");
    }

    const ingredients = await ctx.db
      .query("recipeFoods")
      .withIndex("by_recipe", (q: any) => q.eq("recipeId", args.recipeId))
      .collect();

    const ingredientsWithFood = await Promise.all(
      ingredients.map(async (ing) => {
        const food = await ctx.db.get(ing.foodId);
        return { ...ing, food };
      })
    );

    const imageUrl = recipe.imageStorageId
      ? await ctx.storage.getUrl(recipe.imageStorageId)
      : null;

    return {
      ...recipe,
      imageUrl,
      ingredients: ingredientsWithFood.sort((a, b) => a.order - b.order),
    };
  },
});

// ─── CREATE RECIPE ────────────────────────────────────────────────────────────
export const createRecipe = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    prepTimeMin: v.optional(v.number()),
    cookTimeMin: v.optional(v.number()),
    servings: v.number(),
    tags: v.optional(v.array(v.string())),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const now = Date.now();

    const id = await ctx.db.insert("recipes", {
      nutritionistId: nutritionist._id,
      name: args.name,
      description: args.description,
      instructions: args.instructions,
      prepTimeMin: args.prepTimeMin,
      cookTimeMin: args.cookTimeMin,
      servings: args.servings,
      caloriesPerServing: 0,
      proteinGPerServing: 0,
      fatGPerServing: 0,
      carbsGPerServing: 0,
      fiberGPerServing: undefined,
      tags: args.tags,
      isPublic: args.isPublic,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// ─── UPDATE RECIPE ────────────────────────────────────────────────────────────
export const updateRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    prepTimeMin: v.optional(v.number()),
    cookTimeMin: v.optional(v.number()),
    servings: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");
    if (recipe.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    const { recipeId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(recipeId, updates);

    // If servings changed, recalculate per-serving macros from stored ingredients
    if (args.servings !== undefined) {
      await recalculateRecipeMacros(ctx, recipeId);
    }

    return recipeId;
  },
});

// ─── DELETE RECIPE ────────────────────────────────────────────────────────────
export const deleteRecipe = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");
    if (recipe.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    // Delete all ingredient rows first
    const ingredients = await ctx.db
      .query("recipeFoods")
      .withIndex("by_recipe", (q: any) => q.eq("recipeId", args.recipeId))
      .collect();

    await Promise.all(ingredients.map((ing) => ctx.db.delete(ing._id)));
    await ctx.db.delete(args.recipeId);

    return args.recipeId;
  },
});

// ─── ADD INGREDIENT ───────────────────────────────────────────────────────────
export const addIngredient = mutation({
  args: {
    recipeId: v.id("recipes"),
    foodId: v.id("foods"),
    quantity: v.number(),
    unit: v.string(),
    weightG: v.number(),
    calories: v.number(),
    proteinG: v.number(),
    fatG: v.number(),
    carbsG: v.number(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");
    if (recipe.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    const id = await ctx.db.insert("recipeFoods", {
      recipeId: args.recipeId,
      foodId: args.foodId,
      quantity: args.quantity,
      unit: args.unit,
      weightG: args.weightG,
      calories: args.calories,
      proteinG: args.proteinG,
      fatG: args.fatG,
      carbsG: args.carbsG,
      order: args.order,
    });

    // Recalculate recipe per-serving macros
    await recalculateRecipeMacros(ctx, args.recipeId);

    return id;
  },
});

// ─── REMOVE INGREDIENT ────────────────────────────────────────────────────────
export const removeIngredient = mutation({
  args: { recipeFoodId: v.id("recipeFoods") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const recipeFood = await ctx.db.get(args.recipeFoodId);
    if (!recipeFood) throw new Error("Ingredient not found");

    const recipe = await ctx.db.get(recipeFood.recipeId);
    if (!recipe) throw new Error("Recipe not found");
    if (recipe.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.recipeFoodId);

    // Recalculate recipe per-serving macros
    await recalculateRecipeMacros(ctx, recipeFood.recipeId);

    return args.recipeFoodId;
  },
});
