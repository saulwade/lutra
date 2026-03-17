// @ts-nocheck
import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// ─── GET FOODS ────────────────────────────────────────────────────────────────
export const getFoods = query({
  args: {
    category: v.optional(v.string()),
    page: v.optional(v.number()),     // 1-based, default 1
    pageSize: v.optional(v.number()), // default 25
  },
  handler: async (ctx, args) => {
    const pageSize = args.pageSize ?? 25;
    const page = Math.max(1, args.page ?? 1);

    let foodsQuery;
    if (args.category) {
      foodsQuery = ctx.db
        .query("foods")
        .withIndex("by_category", (q: any) => q.eq("category", args.category));
    } else {
      foodsQuery = ctx.db.query("foods");
    }

    const all = await foodsQuery.collect();
    const active = all.filter((f) => f.isActive);

    const totalCount = active.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const foods = active.slice(start, start + pageSize);

    return { foods, totalCount, totalPages, page: safePage };
  },
});

// ─── SEARCH FOODS ─────────────────────────────────────────────────────────────
export const searchFoods = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const limit = args.limit ?? 100;

    let results;
    if (args.category) {
      results = await ctx.db
        .query("foods")
        .withSearchIndex("search_name", (q: any) =>
          q.search("name", args.query).eq("category", args.category).eq("isActive", true)
        )
        .take(limit);
    } else {
      results = await ctx.db
        .query("foods")
        .withSearchIndex("search_name", (q: any) =>
          q.search("name", args.query).eq("isActive", true)
        )
        .take(limit);
    }

    return results;
  },
});

// ─── GET FOOD ─────────────────────────────────────────────────────────────────
export const getFood = query({
  args: { foodId: v.id("foods") },
  handler: async (ctx, args) => {
    const food = await ctx.db.get(args.foodId);
    if (!food) throw new Error("Food not found");
    return food;
  },
});

// ─── GET FOOD GROUPS ──────────────────────────────────────────────────────────
export const getFoodGroups = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db.query("foodGroups").collect();
    // Deduplicate by name (seed may have run multiple times)
    const seen = new Set<string>();
    const unique = groups.filter((g) => {
      if (seen.has(g.name)) return false;
      seen.add(g.name);
      return true;
    });
    return unique.sort((a, b) => a.order - b.order);
  },
});

// ─── BULK INSERT FOODS (internal – seeding only) ──────────────────────────────
export const bulkInsertFoods = mutation({
  args: {
    foods: v.array(
      v.object({
        name: v.string(),
        category: v.string(),
        categorySlug: v.string(),
        servingAmount: v.number(),
        servingUnit: v.string(),
        servingWeightG: v.number(),
        grossWeightG: v.optional(v.number()),
        calories: v.number(),
        proteinG: v.number(),
        fatG: v.number(),
        carbsG: v.number(),
        fiberG: v.optional(v.number()),
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
        source: v.union(v.literal("smae"), v.literal("custom"), v.literal("external")),
        isActive: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = await Promise.all(
      args.foods.map((food) =>
        ctx.db.insert("foods", { ...food, createdAt: now })
      )
    );
    return ids;
  },
});

// ─── BULK INSERT FOOD GROUPS (internal – seeding only) ────────────────────────
export const bulkInsertFoodGroups = mutation({
  args: {
    groups: v.array(
      v.object({
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        kcalPerEquivalent: v.number(),
        proteinGPerEquivalent: v.number(),
        fatGPerEquivalent: v.number(),
        carbsGPerEquivalent: v.number(),
        color: v.optional(v.string()),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("foodGroups").collect();
    const existingNames = new Set(existing.map((g) => g.name));
    const toInsert = args.groups.filter((g) => !existingNames.has(g.name));
    const ids = await Promise.all(
      toInsert.map((group) => ctx.db.insert("foodGroups", group))
    );
    return ids;
  },
});
