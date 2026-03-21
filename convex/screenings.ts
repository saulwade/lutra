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

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    try {
      await getAuthenticatedNutritionist(ctx);
    } catch {
      return [];
    }
    return await ctx.db
      .query("screenings")
      .withIndex("by_patient", (q: any) => q.eq("patientId", patientId))
      .order("desc")
      .collect();
  },
});

export const getLatestByTool = query({
  args: {
    patientId: v.id("patients"),
    tool: v.union(
      v.literal("NRS2002"),
      v.literal("MUST"),
      v.literal("CONUT"),
      v.literal("GLIM")
    ),
  },
  handler: async (ctx, { patientId, tool }) => {
    try {
      await getAuthenticatedNutritionist(ctx);
    } catch {
      return null;
    }
    return await ctx.db
      .query("screenings")
      .withIndex("by_patient_tool", (q: any) =>
        q.eq("patientId", patientId).eq("tool", tool)
      )
      .order("desc")
      .first();
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const save = mutation({
  args: {
    patientId: v.id("patients"),
    date: v.string(),
    tool: v.union(
      v.literal("NRS2002"),
      v.literal("MUST"),
      v.literal("CONUT"),
      v.literal("GLIM")
    ),
    score: v.optional(v.number()),
    risk: v.optional(v.string()),
    // NRS-2002
    nrs_lowBmi: v.optional(v.boolean()),
    nrs_weightLoss: v.optional(v.boolean()),
    nrs_reducedIntake: v.optional(v.boolean()),
    nrs_severeIllness: v.optional(v.boolean()),
    nrs_age70: v.optional(v.boolean()),
    // MUST
    must_bmiScore: v.optional(v.number()),
    must_weightLossScore: v.optional(v.number()),
    must_acuteScore: v.optional(v.number()),
    // CONUT
    conut_albumin: v.optional(v.number()),
    conut_lymphocytes: v.optional(v.number()),
    conut_cholesterol: v.optional(v.number()),
    // GLIM
    glim_weightLoss: v.optional(v.boolean()),
    glim_lowBmi: v.optional(v.boolean()),
    glim_lowMuscle: v.optional(v.boolean()),
    glim_reducedIntake: v.optional(v.boolean()),
    glim_inflammation: v.optional(v.boolean()),
    glim_severity: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { patientId, ...rest }) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    if (!nutritionist) throw new Error("No autenticado");
    return await ctx.db.insert("screenings", {
      patientId,
      nutritionistId: nutritionist._id,
      createdAt: Date.now(),
      ...rest,
    });
  },
});

export const remove = mutation({
  args: { screeningId: v.id("screenings") },
  handler: async (ctx, { screeningId }) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    if (!nutritionist) throw new Error("No autenticado");
    await ctx.db.delete(screeningId);
  },
});
