// @ts-nocheck
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

// ─── GET ──────────────────────────────────────────────────────────────────────
export const getClinicalHistory = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.nutritionistId !== nutritionist._id) return null;

    return await ctx.db
      .query("clinicalHistory")
      .withIndex("by_patient", (q: any) => q.eq("patientId", args.patientId))
      .first();
  },
});

// ─── UPSERT ───────────────────────────────────────────────────────────────────
export const upsertClinicalHistory = mutation({
  args: {
    patientId: v.id("patients"),
    personalPathological: v.optional(v.string()),
    familyHistory: v.optional(v.string()),
    personalNonPathological: v.optional(v.string()),
    substances: v.optional(v.string()),
    alcoholUse: v.optional(v.string()),
    physicalActivity: v.optional(v.string()),
    mealsPerDay: v.optional(v.number()),
    eatsOutFrequency: v.optional(v.string()),
    foodPreparator: v.optional(v.string()),
    foodRelationship: v.optional(v.string()),
    sleepHours: v.optional(v.number()),
    sleepQuality: v.optional(v.string()),
    supplements: v.optional(v.string()),
    foodLikes: v.optional(v.string()),
    foodDislikes: v.optional(v.string()),
    allergiesDetail: v.optional(v.string()),
    commitmentLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.nutritionistId !== nutritionist._id) {
      throw new Error("Patient not found");
    }

    const existing = await ctx.db
      .query("clinicalHistory")
      .withIndex("by_patient", (q: any) => q.eq("patientId", args.patientId))
      .first();

    const { patientId, ...fields } = args;
    const data = { ...fields, updatedAt: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("clinicalHistory", {
        patientId,
        nutritionistId: nutritionist._id,
        ...data,
      });
    }
  },
});
