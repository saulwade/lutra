/**
 * SMAE Seed Script for Convex
 *
 * Reads the normalized SMAE data and inserts it into Convex
 * using the internal bulkInsert mutations.
 *
 * Usage:
 *   1. Make sure CONVEX_URL is set (or run `npx convex dev` first)
 *   2. npx tsx src/scripts/seed-smae.ts
 *
 * This script uses the Convex HTTP client to call internal mutations.
 * For production, use: npx convex run foods:bulkInsertFoods --file=src/data/smae-normalized.json
 */

import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import type { NormalizedFood, FoodGroup } from "./normalize-smae";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL || CONVEX_URL.includes("placeholder")) {
  console.error("❌ CONVEX_URL not configured.");
  console.error("   Set NEXT_PUBLIC_CONVEX_URL in .env.local");
  console.error("   Then run: npx convex dev (to get your URL)");
  process.exit(1);
}

const rootDir = path.resolve(process.cwd());
const foodsPath = path.join(rootDir, "src", "data", "smae-normalized.json");
const groupsPath = path.join(rootDir, "src", "data", "smae-groups.json");

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL!);

  console.log("🚀 Starting SMAE seed...");
  console.log(`   Convex URL: ${CONVEX_URL}`);

  // Load normalized data
  const foods: NormalizedFood[] = JSON.parse(fs.readFileSync(foodsPath, "utf-8"));
  const groups: FoodGroup[] = JSON.parse(fs.readFileSync(groupsPath, "utf-8"));

  // Seed food groups first
  console.log(`\n📦 Seeding ${groups.length} food groups...`);
  try {
    await (client as any).mutation("foods:bulkInsertFoodGroups", { groups });
    console.log("   ✅ Food groups inserted");
  } catch (err) {
    console.error("   ❌ Error inserting food groups:", err);
  }

  // Seed foods in batches (Convex has limits on mutation size)
  const BATCH_SIZE = 100;
  const batches = Math.ceil(foods.length / BATCH_SIZE);
  console.log(`\n🥦 Seeding ${foods.length} foods in ${batches} batches...`);

  // Strip null values and extra fields not accepted by the validator
  const cleanFood = (obj: any) =>
    Object.fromEntries(
      Object.entries(obj).filter(([k, v]) => v !== null && k !== "createdAt")
    );

  let inserted = 0;
  for (let i = 0; i < batches; i++) {
    const batch = foods.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE).map(cleanFood);
    try {
      await (client as any).mutation("foods:bulkInsertFoods", { foods: batch });
      inserted += batch.length;
      process.stdout.write(`\r   Progress: ${inserted}/${foods.length} (${Math.round((inserted/foods.length)*100)}%)`);
    } catch (err) {
      console.error(`\n   ❌ Error on batch ${i + 1}:`, err);
    }
  }

  console.log(`\n\n✅ Seed complete! Inserted ${inserted} foods.`);
}

main().catch(console.error);
