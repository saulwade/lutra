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

// ─── GET MEASUREMENTS ─────────────────────────────────────────────────────────
export const getMeasurements = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const measurements = await ctx.db
      .query("measurements")
      .withIndex("by_patient", (q: any) => q.eq("patientId", args.patientId))
      .collect();

    // Verify ownership
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.nutritionistId !== nutritionist._id) return [];

    return measurements.sort((a: any, b: any) =>
      b.date.localeCompare(a.date)
    );
  },
});

// ─── ADD MEASUREMENT ──────────────────────────────────────────────────────────
export const addMeasurement = mutation({
  args: {
    patientId: v.id("patients"),
    date: v.string(),
    weightKg: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    muscleMassKg: v.optional(v.number()),
    waistCm: v.optional(v.number()),
    hipCm: v.optional(v.number()),
    neckCm: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.nutritionistId !== nutritionist._id) {
      throw new Error("Patient not found");
    }

    return await ctx.db.insert("measurements", {
      ...args,
      nutritionistId: nutritionist._id,
      createdAt: Date.now(),
    });
  },
});

// ─── DELETE MEASUREMENT ───────────────────────────────────────────────────────
export const deleteMeasurement = mutation({
  args: { measurementId: v.id("measurements") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const m = await ctx.db.get(args.measurementId);
    if (!m || m.nutritionistId !== nutritionist._id) throw new Error("Not found");
    await ctx.db.delete(args.measurementId);
  },
});
