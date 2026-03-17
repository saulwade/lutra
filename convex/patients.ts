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

// ─── GET PATIENTS ─────────────────────────────────────────────────────────────
export const getPatients = query({
  args: {},
  handler: async (ctx) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const patients = await ctx.db
      .query("patients")
      .withIndex("by_nutritionist_active", (q: any) =>
        q.eq("nutritionistId", nutritionist._id).eq("isActive", true)
      )
      .collect();

    return patients;
  },
});

// ─── GET PATIENT ──────────────────────────────────────────────────────────────
export const getPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");
    if (patient.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    return patient;
  },
});

// ─── CREATE PATIENT ───────────────────────────────────────────────────────────
export const createPatient = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    age: v.optional(v.number()),
    sex: v.union(v.literal("male"), v.literal("female")),
    heightCm: v.number(),
    weightKg: v.number(),
    waistCm: v.optional(v.number()),
    hipCm: v.optional(v.number()),
    neckCm: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    muscleMassKg: v.optional(v.number()),
    activityLevel: v.union(
      v.literal("sedentary"),
      v.literal("light"),
      v.literal("moderate"),
      v.literal("active"),
      v.literal("very_active")
    ),
    goal: v.union(
      v.literal("weight_loss"),
      v.literal("maintenance"),
      v.literal("weight_gain"),
      v.literal("muscle_gain"),
      v.literal("health")
    ),
    notes: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    foodPreferences: v.optional(v.string()),
    adherenceRating: v.optional(v.union(v.literal("alta"), v.literal("media"), v.literal("baja"))),
    recall24h: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const now = Date.now();

    const id = await ctx.db.insert("patients", {
      nutritionistId: nutritionist._id,
      name: args.name,
      email: args.email,
      phone: args.phone,
      birthDate: args.birthDate,
      age: args.age,
      sex: args.sex,
      heightCm: args.heightCm,
      weightKg: args.weightKg,
      waistCm: args.waistCm,
      hipCm: args.hipCm,
      neckCm: args.neckCm,
      bodyFatPct: args.bodyFatPct,
      muscleMassKg: args.muscleMassKg,
      activityLevel: args.activityLevel,
      goal: args.goal,
      notes: args.notes,
      allergies: args.allergies,
      foodPreferences: args.foodPreferences,
      adherenceRating: args.adherenceRating,
      recall24h: args.recall24h,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// ─── UPDATE PATIENT ───────────────────────────────────────────────────────────
export const updatePatient = mutation({
  args: {
    patientId: v.id("patients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    age: v.optional(v.number()),
    sex: v.optional(v.union(v.literal("male"), v.literal("female"))),
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    waistCm: v.optional(v.number()),
    hipCm: v.optional(v.number()),
    neckCm: v.optional(v.number()),
    bodyFatPct: v.optional(v.number()),
    muscleMassKg: v.optional(v.number()),
    activityLevel: v.optional(
      v.union(
        v.literal("sedentary"),
        v.literal("light"),
        v.literal("moderate"),
        v.literal("active"),
        v.literal("very_active")
      )
    ),
    goal: v.optional(
      v.union(
        v.literal("weight_loss"),
        v.literal("maintenance"),
        v.literal("weight_gain"),
        v.literal("muscle_gain"),
        v.literal("health")
      )
    ),
    notes: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    foodPreferences: v.optional(v.string()),
    adherenceRating: v.optional(v.union(v.literal("alta"), v.literal("media"), v.literal("baja"))),
    recall24h: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");
    if (patient.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    const { patientId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(patientId, updates);
    return patientId;
  },
});

// ─── DELETE PATIENT (soft delete) ─────────────────────────────────────────────
export const deletePatient = mutation({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");
    if (patient.nutritionistId !== nutritionist._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.patientId, { isActive: false, updatedAt: Date.now() });
    return args.patientId;
  },
});

// ─── SEARCH PATIENTS ──────────────────────────────────────────────────────────
export const searchPatients = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);

    if (!args.query.trim()) {
      // Return all active patients when query is empty
      return ctx.db
        .query("patients")
        .withIndex("by_nutritionist_active", (q: any) =>
          q.eq("nutritionistId", nutritionist._id).eq("isActive", true)
        )
        .collect();
    }

    const allPatients = await ctx.db
      .query("patients")
      .withIndex("by_nutritionist_active", (q: any) =>
        q.eq("nutritionistId", nutritionist._id).eq("isActive", true)
      )
      .collect();

    const lowerQuery = args.query.toLowerCase();
    return allPatients.filter((p) => p.name.toLowerCase().includes(lowerQuery));
  },
});

// ─── BULK CREATE PATIENTS (CSV import) ────────────────────────────────────────
export const bulkCreatePatients = mutation({
  args: {
    patients: v.array(
      v.object({
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        age: v.optional(v.number()),
        sex: v.union(v.literal("male"), v.literal("female")),
        heightCm: v.number(),
        weightKg: v.number(),
        activityLevel: v.union(
          v.literal("sedentary"),
          v.literal("light"),
          v.literal("moderate"),
          v.literal("active"),
          v.literal("very_active")
        ),
        goal: v.union(
          v.literal("weight_loss"),
          v.literal("maintenance"),
          v.literal("weight_gain"),
          v.literal("muscle_gain"),
          v.literal("health")
        ),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const nutritionist = await getAuthenticatedNutritionist(ctx);
    const now = Date.now();
    const ids = [];

    for (const p of args.patients) {
      const id = await ctx.db.insert("patients", {
        ...p,
        nutritionistId: nutritionist._id,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }

    return ids;
  },
});
