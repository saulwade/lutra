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

export const getByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    try {
      await getAuthenticatedNutritionist(ctx);
    } catch {
      return null;
    }
    return await ctx.db
      .query("patientPathologies")
      .withIndex("by_patient", (q: any) => q.eq("patientId", patientId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    patientId: v.id("patients"),
    conditions: v.array(v.string()),
    supplements: v.optional(v.string()),
    clinicalRecommendations: v.optional(v.string()),
    glycemicControl: v.optional(v.boolean()),
    dietType: v.optional(v.string()),
  },
  handler: async (ctx, { patientId, ...rest }) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    if (!nutritionist) throw new Error("No autenticado");
    const existing = await ctx.db
      .query("patientPathologies")
      .withIndex("by_patient", (q) => q.eq("patientId", patientId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...rest, updatedAt: Date.now() });
      return existing._id;
    }
    return await ctx.db.insert("patientPathologies", {
      patientId,
      nutritionistId: nutritionist._id,
      updatedAt: Date.now(),
      ...rest,
    });
  },
});
