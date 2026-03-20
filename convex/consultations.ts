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

// ─── GET CONSULTATIONS ────────────────────────────────────────────────────────
export const getConsultations = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.nutritionistId !== nutritionist._id) return [];

    const consultations = await ctx.db
      .query("consultations")
      .withIndex("by_patient", (q: any) => q.eq("patientId", args.patientId))
      .collect();

    return consultations.sort((a: any, b: any) => b.date.localeCompare(a.date));
  },
});

// ─── ADD CONSULTATION ─────────────────────────────────────────────────────────
export const addConsultation = mutation({
  args: {
    patientId: v.id("patients"),
    date: v.string(),
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    weightKg: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    muscleMassKg: v.optional(v.number()),
    waistCm: v.optional(v.number()),
    bloodPressure: v.optional(v.string()),
    adherenceScore: v.optional(v.number()),
    feelingScore: v.optional(v.number()),
    seesPhysicalChanges: v.optional(v.boolean()),
    seesMentalChanges: v.optional(v.boolean()),
    nextAppointment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.nutritionistId !== nutritionist._id) {
      throw new Error("Patient not found");
    }

    return await ctx.db.insert("consultations", {
      ...args,
      nutritionistId: nutritionist._id,
      createdAt: Date.now(),
    });
  },
});

// ─── UPDATE CONSULTATION ──────────────────────────────────────────────────────
export const updateConsultation = mutation({
  args: {
    consultationId: v.id("consultations"),
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    weightKg: v.optional(v.number()),
    bloodPressure: v.optional(v.string()),
    nextAppointment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const c = await ctx.db.get(args.consultationId);
    if (!c || c.nutritionistId !== nutritionist._id) throw new Error("Not found");
    const { consultationId, ...fields } = args;
    await ctx.db.patch(consultationId, fields);
    return consultationId;
  },
});

// ─── DELETE CONSULTATION ──────────────────────────────────────────────────────
export const deleteConsultation = mutation({
  args: { consultationId: v.id("consultations") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const c = await ctx.db.get(args.consultationId);
    if (!c || c.nutritionistId !== nutritionist._id) throw new Error("Not found");
    await ctx.db.delete(args.consultationId);
  },
});
