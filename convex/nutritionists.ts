// @ts-nocheck
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── GET CURRENT NUTRITIONIST ─────────────────────────────────────────────────
export const getCurrentNutritionist = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const nutritionist = await ctx.db
      .query("nutritionists")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return nutritionist;
  },
});

// ─── CREATE NUTRITIONIST ───────────────────────────────────────────────────────
export const createNutritionist = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    cedula: v.optional(v.string()),
    specialty: v.optional(v.string()),
    phone: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    clinicName: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Return existing record if already created
    const existing = await ctx.db
      .query("nutritionists")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existing) return existing._id;

    const now = Date.now();
    const id = await ctx.db.insert("nutritionists", {
      clerkId: identity.subject,
      name: args.name,
      email: args.email,
      cedula: args.cedula,
      specialty: args.specialty,
      phone: args.phone,
      logoUrl: args.logoUrl,
      clinicName: args.clinicName,
      address: args.address,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// ─── UPDATE NUTRITIONIST ───────────────────────────────────────────────────────
export const updateNutritionist = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    cedula: v.optional(v.string()),
    specialty: v.optional(v.string()),
    phone: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    clinicName: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const nutritionist = await ctx.db
      .query("nutritionists")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!nutritionist) throw new Error("Nutritionist profile not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.cedula !== undefined) updates.cedula = args.cedula;
    if (args.specialty !== undefined) updates.specialty = args.specialty;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.logoUrl !== undefined) updates.logoUrl = args.logoUrl;
    if (args.clinicName !== undefined) updates.clinicName = args.clinicName;
    if (args.address !== undefined) updates.address = args.address;

    await ctx.db.patch(nutritionist._id, updates);
    return nutritionist._id;
  },
});
