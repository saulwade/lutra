/**
 * SMAE Database Normalization Script
 *
 * Reads the raw smae_database.json, normalizes all fields,
 * converts "ND" values to null, and outputs a clean JSON
 * ready for insertion into Convex.
 *
 * Run: npx ts-node --esm src/scripts/normalize-smae.ts
 * Or:  npx tsx src/scripts/normalize-smae.ts
 */

import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawSMAEEntry {
  Categoria: string;
  Alimento: string;
  "Cantidad sugerida": number | string;
  Unidad: string;
  "Peso bruto (g)": number | string;
  "Peso neto (g)": number | string;
  "Energía (kcal)": number | string;
  "Proteína (g)": number | string;
  "Lípidos (g)": number | string;
  "Hidratos de carbono (g)": number | string;
  "AG saturados (g)": number | string;
  "AG monoinsaturados (g)": number | string;
  "AG poliinsaturados (g)": number | string;
  "Colesterol (mg)": number | string;
  "Azúcar (g)": number | string;
  "Fibra (g)": number | string;
  "Vitamina A (mg RE)": number | string;
  "Ácido ascórbico (mg)": number | string;
  "Acido Fólico (mg)": number | string;
  "Calcio (mg)": number | string;
  "Hierro (mg)": number | string;
  "Potasio (mg)": number | string;
  "Sodio (mg)": number | string;
  "Fósforo (mg)": number | string;
  "Etanol (g)": number | string;
  IG: number | string;
  "Carga glicémica": number | string;
}

export interface NormalizedFood {
  name: string;
  category: string;
  categorySlug: string;
  servingAmount: number;
  servingUnit: string;
  servingWeightG: number;
  grossWeightG: number | null;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number | null;
  saturatedFatG: number | null;
  monounsatFatG: number | null;
  polyunsatFatG: number | null;
  cholesterolMg: number | null;
  sugarG: number | null;
  vitaminAMgRE: number | null;
  vitaminCMg: number | null;
  folicAcidMg: number | null;
  calciumMg: number | null;
  ironMg: number | null;
  potassiumMg: number | null;
  sodiumMg: number | null;
  phosphorusMg: number | null;
  ethanolG: number | null;
  glycemicIndex: number | null;
  glycemicLoad: number | null;
  source: "smae";
  isActive: boolean;
  createdAt: number;
}

export interface FoodGroup {
  name: string;
  slug: string;
  description: string;
  kcalPerEquivalent: number;
  proteinGPerEquivalent: number;
  fatGPerEquivalent: number;
  carbsGPerEquivalent: number;
  color: string;
  order: number;
}

// ─── SMAE Food Groups with official equivalents ───────────────────────────────
// Source: SMAE 2014 - Sistema Mexicano de Alimentos Equivalentes
export const SMAE_FOOD_GROUPS: FoodGroup[] = [
  {
    name: "Verduras",
    slug: "verduras",
    description: "Verduras y hortalizas. Un equivalente aporta macros mínimos.",
    kcalPerEquivalent: 25,
    proteinGPerEquivalent: 2,
    fatGPerEquivalent: 0,
    carbsGPerEquivalent: 4,
    color: "#22c55e",
    order: 1,
  },
  {
    name: "Frutas",
    slug: "frutas",
    description: "Frutas frescas o en conserva sin azúcar.",
    kcalPerEquivalent: 60,
    proteinGPerEquivalent: 0,
    fatGPerEquivalent: 0,
    carbsGPerEquivalent: 15,
    color: "#f97316",
    order: 2,
  },
  {
    name: "Cereales S/G",
    slug: "cereales-sin-grasa",
    description: "Cereales y tubérculos sin grasa agregada.",
    kcalPerEquivalent: 70,
    proteinGPerEquivalent: 2,
    fatGPerEquivalent: 0,
    carbsGPerEquivalent: 15,
    color: "#eab308",
    order: 3,
  },
  {
    name: "Cereales C/G",
    slug: "cereales-con-grasa",
    description: "Cereales y tubérculos con grasa (tortilla frita, etc.).",
    kcalPerEquivalent: 115,
    proteinGPerEquivalent: 2,
    fatGPerEquivalent: 4,
    carbsGPerEquivalent: 15,
    color: "#ca8a04",
    order: 4,
  },
  {
    name: "Leguminosas",
    slug: "leguminosas",
    description: "Frijoles, lentejas, garbanzo, soya y otras leguminosas.",
    kcalPerEquivalent: 120,
    proteinGPerEquivalent: 8,
    fatGPerEquivalent: 1,
    carbsGPerEquivalent: 20,
    color: "#a16207",
    order: 5,
  },
  {
    name: "AOA MBAG",
    slug: "aoa-muy-bajo-grasa",
    description: "Alimentos de Origen Animal – Muy Bajo Aporte de Grasa.",
    kcalPerEquivalent: 40,
    proteinGPerEquivalent: 7,
    fatGPerEquivalent: 1,
    carbsGPerEquivalent: 0,
    color: "#3b82f6",
    order: 6,
  },
  {
    name: "AOA BAG",
    slug: "aoa-bajo-grasa",
    description: "Alimentos de Origen Animal – Bajo Aporte de Grasa.",
    kcalPerEquivalent: 55,
    proteinGPerEquivalent: 7,
    fatGPerEquivalent: 3,
    carbsGPerEquivalent: 0,
    color: "#2563eb",
    order: 7,
  },
  {
    name: "AOA MAG",
    slug: "aoa-moderado-grasa",
    description: "Alimentos de Origen Animal – Moderado Aporte de Grasa.",
    kcalPerEquivalent: 75,
    proteinGPerEquivalent: 7,
    fatGPerEquivalent: 5,
    carbsGPerEquivalent: 0,
    color: "#1d4ed8",
    order: 8,
  },
  {
    name: "AOA AAG",
    slug: "aoa-alto-grasa",
    description: "Alimentos de Origen Animal – Alto Aporte de Grasa.",
    kcalPerEquivalent: 100,
    proteinGPerEquivalent: 7,
    fatGPerEquivalent: 8,
    carbsGPerEquivalent: 0,
    color: "#1e40af",
    order: 9,
  },
  {
    name: "Leche descremada",
    slug: "leche-descremada",
    description: "Leche y productos lácteos descremados.",
    kcalPerEquivalent: 95,
    proteinGPerEquivalent: 9,
    fatGPerEquivalent: 2,
    carbsGPerEquivalent: 12,
    color: "#e0f2fe",
    order: 10,
  },
  {
    name: "Leche semidescremada",
    slug: "leche-semidescremada",
    description: "Leche y productos lácteos semidescremados.",
    kcalPerEquivalent: 110,
    proteinGPerEquivalent: 9,
    fatGPerEquivalent: 4,
    carbsGPerEquivalent: 12,
    color: "#bae6fd",
    order: 11,
  },
  {
    name: "Leche entera",
    slug: "leche-entera",
    description: "Leche y productos lácteos enteros.",
    kcalPerEquivalent: 150,
    proteinGPerEquivalent: 9,
    fatGPerEquivalent: 8,
    carbsGPerEquivalent: 12,
    color: "#7dd3fc",
    order: 12,
  },
  {
    name: "Leche con azúcar",
    slug: "leche-con-azucar",
    description: "Leche y productos lácteos con azúcar agregada.",
    kcalPerEquivalent: 200,
    proteinGPerEquivalent: 8,
    fatGPerEquivalent: 5,
    carbsGPerEquivalent: 30,
    color: "#38bdf8",
    order: 13,
  },
  {
    name: "Grasas sin proteínas",
    slug: "grasas-sin-proteinas",
    description: "Aceites, mantequillas, cremas y otras grasas puras.",
    kcalPerEquivalent: 45,
    proteinGPerEquivalent: 0,
    fatGPerEquivalent: 5,
    carbsGPerEquivalent: 0,
    color: "#fbbf24",
    order: 14,
  },
  {
    name: "Grasas con proteínas",
    slug: "grasas-con-proteinas",
    description: "Aguacate, nueces, semillas y otras grasas con proteína.",
    kcalPerEquivalent: 70,
    proteinGPerEquivalent: 3,
    fatGPerEquivalent: 5,
    carbsGPerEquivalent: 3,
    color: "#f59e0b",
    order: 15,
  },
  {
    name: "Azucares sin grasa",
    slug: "azucares-sin-grasa",
    description: "Azúcares simples y bebidas azucaradas sin grasa.",
    kcalPerEquivalent: 40,
    proteinGPerEquivalent: 0,
    fatGPerEquivalent: 0,
    carbsGPerEquivalent: 10,
    color: "#f43f5e",
    order: 16,
  },
  {
    name: "Azucares con grasa",
    slug: "azucares-con-grasa",
    description: "Dulces y postres con grasa (chocolates, pasteles, etc.).",
    kcalPerEquivalent: 85,
    proteinGPerEquivalent: 0,
    fatGPerEquivalent: 4,
    carbsGPerEquivalent: 10,
    color: "#e11d48",
    order: 17,
  },
  {
    name: "Alcohol",
    slug: "alcohol",
    description: "Bebidas alcohólicas.",
    kcalPerEquivalent: 90,
    proteinGPerEquivalent: 0,
    fatGPerEquivalent: 0,
    carbsGPerEquivalent: 5,
    color: "#7c3aed",
    order: 18,
  },
  {
    name: "Libres en energía",
    slug: "libres-energia",
    description: "Alimentos con aporte calórico mínimo (< 25 kcal por porción).",
    kcalPerEquivalent: 0,
    proteinGPerEquivalent: 0,
    fatGPerEquivalent: 0,
    carbsGPerEquivalent: 0,
    color: "#6b7280",
    order: 19,
  },
];

// ─── Category slug mapping ────────────────────────────────────────────────────
const CATEGORY_SLUG_MAP: Record<string, string> = {
  Verduras: "verduras",
  Frutas: "frutas",
  "Cereales S/G": "cereales-sin-grasa",
  "Cereales C/G": "cereales-con-grasa",
  Leguminosas: "leguminosas",
  "AOA MBAG": "aoa-muy-bajo-grasa",
  "AOA BAG": "aoa-bajo-grasa",
  "AOA MAG": "aoa-moderado-grasa",
  "AOA AAG": "aoa-alto-grasa",
  "Leche descremada": "leche-descremada",
  "Leche semidescremada": "leche-semidescremada",
  "Leche entera": "leche-entera",
  "Leche con azúcar": "leche-con-azucar",
  "Grasas sin proteínas": "grasas-sin-proteinas",
  "Grasas con proteínas": "grasas-con-proteinas",
  "Azucares sin grasa": "azucares-sin-grasa",
  "Azucares con grasa": "azucares-con-grasa",
  Alcohol: "alcohol",
  "Libres en energía": "libres-energia",
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function toNullableNumber(value: unknown): number | null {
  if (value === "ND" || value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function toRequiredNumber(value: unknown, fallback = 0): number {
  const result = toNullableNumber(value);
  return result !== null ? result : fallback;
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function normalizeFoodName(name: string): string {
  // Capitalize first letter, preserve rest
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ─── Main normalization ───────────────────────────────────────────────────────

function normalizeEntry(raw: RawSMAEEntry, createdAt: number): NormalizedFood {
  const category = raw.Categoria?.trim() || "Desconocido";
  const categorySlug = CATEGORY_SLUG_MAP[category] || "otros";

  return {
    name: normalizeFoodName(raw.Alimento?.trim() || ""),
    category,
    categorySlug,
    servingAmount: toRequiredNumber(raw["Cantidad sugerida"], 1),
    servingUnit: raw.Unidad?.trim() || "g",
    servingWeightG: toRequiredNumber(raw["Peso neto (g)"], 0),
    grossWeightG: toNullableNumber(raw["Peso bruto (g)"]),
    calories: toRequiredNumber(raw["Energía (kcal)"], 0),
    proteinG: toRequiredNumber(raw["Proteína (g)"], 0),
    fatG: toRequiredNumber(raw["Lípidos (g)"], 0),
    carbsG: toRequiredNumber(raw["Hidratos de carbono (g)"], 0),
    fiberG: toNullableNumber(raw["Fibra (g)"]),
    saturatedFatG: toNullableNumber(raw["AG saturados (g)"]),
    monounsatFatG: toNullableNumber(raw["AG monoinsaturados (g)"]),
    polyunsatFatG: toNullableNumber(raw["AG poliinsaturados (g)"]),
    cholesterolMg: toNullableNumber(raw["Colesterol (mg)"]),
    sugarG: toNullableNumber(raw["Azúcar (g)"]),
    vitaminAMgRE: toNullableNumber(raw["Vitamina A (mg RE)"]),
    vitaminCMg: toNullableNumber(raw["Ácido ascórbico (mg)"]),
    folicAcidMg: toNullableNumber(raw["Acido Fólico (mg)"]),
    calciumMg: toNullableNumber(raw["Calcio (mg)"]),
    ironMg: toNullableNumber(raw["Hierro (mg)"]),
    potassiumMg: toNullableNumber(raw["Potasio (mg)"]),
    sodiumMg: toNullableNumber(raw["Sodio (mg)"]),
    phosphorusMg: toNullableNumber(raw["Fósforo (mg)"]),
    ethanolG: toNullableNumber(raw["Etanol (g)"]),
    glycemicIndex: toNullableNumber(raw["IG"]),
    glycemicLoad: toNullableNumber(raw["Carga glicémica"]),
    source: "smae",
    isActive: true,
    createdAt,
  };
}

// ─── Execution ────────────────────────────────────────────────────────────────

function main() {
  const rootDir = path.resolve(process.cwd());
  const inputPath = path.join(rootDir, "smae_database.json");
  const outputFoodsPath = path.join(rootDir, "src", "data", "smae-normalized.json");
  const outputGroupsPath = path.join(rootDir, "src", "data", "smae-groups.json");

  console.log("📂 Reading SMAE database...");
  const raw: RawSMAEEntry[] = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  console.log(`   Found ${raw.length} raw entries`);

  const createdAt = Date.now();
  const normalized: NormalizedFood[] = raw.map((entry) =>
    normalizeEntry(entry, createdAt)
  );

  // Stats
  const categories = new Set(normalized.map((f) => f.category));
  const invalidCalories = normalized.filter((f) => f.calories === 0 && f.category !== "Libres en energía");
  console.log(`✅ Normalized ${normalized.length} foods`);
  console.log(`   Categories: ${categories.size}`);
  console.log(`   Foods with 0 calories (non-free): ${invalidCalories.length}`);

  // Write output
  fs.mkdirSync(path.dirname(outputFoodsPath), { recursive: true });
  fs.writeFileSync(outputFoodsPath, JSON.stringify(normalized, null, 2));
  fs.writeFileSync(outputGroupsPath, JSON.stringify(SMAE_FOOD_GROUPS, null, 2));

  console.log(`\n✅ Written to:`);
  console.log(`   ${outputFoodsPath}`);
  console.log(`   ${outputGroupsPath}`);
  console.log(`\n📋 Category breakdown:`);
  for (const cat of Array.from(categories).sort()) {
    const count = normalized.filter((f) => f.category === cat).length;
    console.log(`   ${cat}: ${count}`);
  }
}

main();
