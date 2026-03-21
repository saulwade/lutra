// @ts-nocheck
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const getByPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }) => {
    try {
      await getAuthenticatedNutritionist(ctx);
    } catch {
      return [];
    }
    return await ctx.db
      .query("planVersions")
      .withIndex("by_plan", (q: any) => q.eq("planId", planId))
      .order("desc")
      .collect();
  },
});

export const save = mutation({
  args: {
    planId: v.id("plans"),
    patientId: v.optional(v.id("patients")),
    date: v.string(),
    label: v.optional(v.string()),
    targetCalories: v.number(),
    targetProteinG: v.number(),
    targetFatG: v.number(),
    targetCarbsG: v.number(),
    equivalentsSnapshot: v.optional(v.any()),
    distributionSnapshot: v.optional(v.any()),
    actualCalories: v.optional(v.number()),
    actualProteinG: v.optional(v.number()),
    actualFatG: v.optional(v.number()),
    actualCarbsG: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { planId, ...rest }) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    if (!nutritionist) throw new Error("No autenticado");
    return await ctx.db.insert("planVersions", {
      planId,
      nutritionistId: nutritionist._id,
      createdAt: Date.now(),
      ...rest,
    });
  },
});

export const remove = mutation({
  args: { versionId: v.id("planVersions") },
  handler: async (ctx, { versionId }) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    if (!nutritionist) throw new Error("No autenticado");
    await ctx.db.delete(versionId);
  },
});
