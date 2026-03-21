/**
 * food-matcher.ts
 * Normalización, sinónimos y scoring para búsqueda robusta en base SMAE.
 *
 * Pipeline:
 *   input usuario → normalizeQuery → Convex search → scoreFood → sortear/filtrar
 */

// ── 1. PALABRAS DE RUIDO (métodos de cocción / estado / preparación) ──────────
//    Se eliminan antes de buscar para quedarnos solo con el ingrediente base.

const NOISE_WORDS = [
  // Cocción
  "revuelto", "revuelta", "revueltos", "revueltas",
  "cocido", "cocida", "cocidos", "cocidas",
  "cocinado", "cocinada",
  "frito", "frita", "fritos", "fritas",
  "asado", "asada", "asados", "asadas",
  "hervido", "hervida", "hervidos", "hervidas",
  "horneado", "horneada",
  "ahumado", "ahumada",
  "tostado", "tostada",
  "a la plancha", "al vapor", "en agua", "al horno", "en salsa",
  "a la mexicana", "a la veracruzana",
  // Preparación
  "picado", "picada", "molido", "molida",
  "troceado", "troceada", "rebanado", "rebanada",
  "rallado", "rallada", "desmenuzado", "desmenuzada",
  "preparado", "preparada", "procesado", "procesada",
  // Atributos
  "con sal", "sin sal", "light", "natural",
  "bajo en grasa", "bajo en calorias",
  // Estado (solo cuando no son parte del nombre SMAE)
  "crudo", "cruda", "crudos", "crudas",
];

// ── 2. SINÓNIMOS: input normalizado → término de búsqueda SMAE ────────────────
//    Mapeo de expresiones comunes a la forma canónica en la base.
//    Ordenados de más específico a más genérico (la función usa el más largo que coincida).

const SYNONYMS: Record<string, string> = {
  // ── Huevo ──────────────────────────────────────────────────────────────────
  "huevo revuelto": "huevo",
  "huevos revueltos": "huevo",
  "huevo cocido": "huevo",
  "huevos cocidos": "huevo",
  "huevo duro": "huevo",
  "huevo frito": "huevo",
  "huevos fritos": "huevo",
  "huevo tibio": "huevo",
  "huevo estrellado": "huevo",
  "huevo pochado": "huevo",
  "huevo pasado": "huevo",
  "huevo al plato": "huevo",
  "omelette": "huevo",
  "omelet": "huevo",

  // ── Tortilla ───────────────────────────────────────────────────────────────
  "tortilla de maiz": "tortilla",
  "tortilla de maíz": "tortilla",
  "tortilla de harina": "tortilla de harina",
  "tortillas de maiz": "tortilla",
  "tortillas": "tortilla",

  // ── Pollo ──────────────────────────────────────────────────────────────────
  "pechuga de pollo": "pollo",
  "muslo de pollo": "pollo",
  "pollo asado": "pollo",
  "pollo cocido": "pollo",
  "pollo frito": "pollo",
  "pollo a la plancha": "pollo",
  "pollo rostizado": "pollo",

  // ── Carne de res ───────────────────────────────────────────────────────────
  "carne molida": "carne",
  "carne asada": "res",
  "carne de res": "res",
  "bistec": "bistec",
  "milanesa de res": "res",

  // ── Leche ──────────────────────────────────────────────────────────────────
  "leche light": "leche descremada",
  "leche sin grasa": "leche descremada",
  "leche baja en grasa": "leche semidescremada",

  // ── Arroz ──────────────────────────────────────────────────────────────────
  "arroz blanco": "arroz",
  "arroz cocido": "arroz",
  "arroz hervido": "arroz",

  // ── Frijol ────────────────────────────────────────────────────────────────
  "frijoles negros": "frijol",
  "frijoles refritos": "frijol",
  "frijoles de olla": "frijol",
  "frijoles bayos": "frijol",
  "frijol negro": "frijol",
  "frijol bayo": "frijol",

  // ── Atún ──────────────────────────────────────────────────────────────────
  "atun en lata": "atun",
  "atun en agua": "atun",
  "atun en aceite": "atun",

  // ── Verduras comunes ───────────────────────────────────────────────────────
  "tomate rojo": "jitomate",
  "jitomate bola": "jitomate",
  "jitomate guaje": "jitomate",
  "tomate verde": "tomate verde",
  "cebolla blanca": "cebolla",
  "chile verde": "chile",
  "chile jalapeno": "chile jalapeno",
  "chile serrano": "chile serrano",

  // ── Pan ────────────────────────────────────────────────────────────────────
  "pan blanco": "pan",
  "pan tostado": "pan",
  "pan integral": "pan integral",
  "pan de caja": "pan",

  // ── Lácteos ────────────────────────────────────────────────────────────────
  "queso oaxaca": "queso",
  "queso manchego": "queso",
  "queso panela": "queso panela",
  "queso fresco": "queso fresco",
  "queso cotija": "queso",
  "queso chihuahua": "queso",

  // ── Bebidas ────────────────────────────────────────────────────────────────
  "cafe con leche": "leche",
  "yogurt natural": "yogurt",
  "yogur natural": "yogurt",
};

// ── Alimentos inherentemente bajos en calorías (< 10 kcal es normal) ─────────
const LOW_CAL_KEYWORDS = [
  "agua", "gelatina", "caldo", "te ", "cafe ", "infusion",
  "lechuga", "apio", "pepino", "cilantro", "perejil",
  "jitomate cherry", "nopal", "espinaca",
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────────────────────

/** Quita tildes / diacríticos. */
export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. NORMALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convierte el input del usuario al término de búsqueda óptimo para SMAE.
 *
 * Pasos:
 *  a) minúsculas + quitar acentos
 *  b) buscar en sinónimos (más largo primero)
 *  c) eliminar palabras de ruido
 *  d) limpiar espacios
 */
export function normalizeQuery(input: string): string {
  const cleaned = stripAccents(input.toLowerCase().trim());

  // a) Coincidencia exacta en sinónimos
  if (SYNONYMS[cleaned]) return SYNONYMS[cleaned];

  // b) Coincidencia parcial — busca la clave más larga que esté contenida
  const sortedKeys = Object.keys(SYNONYMS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (cleaned.includes(key)) return SYNONYMS[key];
  }

  // c) Eliminar palabras de ruido
  let result = cleaned;
  for (const word of NOISE_WORDS) {
    const pattern = stripAccents(word);
    result = result.replace(new RegExp(`\\b${pattern}\\b`, "g"), "").trim();
  }

  // d) Colapsar espacios múltiples
  const final = result.replace(/\s+/g, " ").trim();
  return final || cleaned; // fallback al original si quedó vacío
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SCORING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Puntúa qué tan bien un alimento de SMAE coincide con la búsqueda.
 * Mayor puntuación = mejor match.
 *
 * @param originalInput  Lo que escribió el usuario ("huevo revuelto")
 * @param normalizedInput  Término normalizado ("huevo")
 * @param food  Resultado de Convex
 */
export function scoreFood(
  originalInput: string,
  normalizedInput: string,
  food: { name: string; calories: number; servingWeightG: number }
): number {
  const foodName = stripAccents(food.name.toLowerCase());
  const norm = stripAccents(normalizedInput.toLowerCase());
  const orig = stripAccents(originalInput.toLowerCase());

  let score = 0;

  // ── Coincidencia de nombre ─────────────────────────────────────────────────
  if (foodName === norm) {
    score += 200; // Coincidencia exacta
  } else if (foodName.startsWith(norm + ",") || foodName.startsWith(norm + " ")) {
    score += 120; // Nombre empieza con el término (ej. "huevo, entero, crudo")
  } else if (foodName.startsWith(norm)) {
    score += 100;
  } else if (foodName.includes(norm)) {
    score += 60;  // Contiene el término como subcadena
  } else {
    // Coincidencia por palabras individuales del input original
    const words = orig.split(/\s+/).filter((w) => w.length > 2);
    for (const word of words) {
      if (foodName.includes(word)) score += 15;
    }
  }

  // ── Preferencias para queries genéricos (1 palabra) ───────────────────────
  const isGenericQuery = !norm.includes(" ");
  if (isGenericQuery) {
    // Preferir variantes "entero" / "completo" → representan el alimento completo
    if (foodName.includes("entero") || foodName.includes("completo")) score += 15;
    // Penalizar partes del alimento cuando la query es genérica
    if (foodName.includes("clara") || foodName.includes("yema")) score -= 25;
    // Penalizar subproductos (polvo, extracto, jugo) para queries simples
    if (foodName.includes("polvo") || foodName.includes("extracto") || foodName.includes("jugo")) score -= 10;
  }

  // ── Validación de calorías (penalizar resultados absurdos) ────────────────
  if (food.calories < 5 && !isInherentlyLowCalorie(foodName)) {
    score -= 500; // Penalización masiva — casi imposible que gane
  }
  // Si kcal/100g es < 2 y el alimento no es agua/caldo, es sospechoso
  const kcalPer100g =
    food.servingWeightG > 0 ? (food.calories / food.servingWeightG) * 100 : 0;
  if (kcalPer100g < 2 && food.servingWeightG > 10 && !isInherentlyLowCalorie(foodName)) {
    score -= 200;
  }

  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. VALIDACIÓN DE RESULTADO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna false si el resultado parece absurdo para el término buscado.
 * (ej. 2 kcal para "huevo").
 */
export function isPlausibleResult(food: {
  name: string;
  calories: number;
  servingWeightG: number;
}): boolean {
  if (food.calories < 5 && !isInherentlyLowCalorie(food.name.toLowerCase())) {
    return false;
  }
  return true;
}

function isInherentlyLowCalorie(name: string): boolean {
  return LOW_CAL_KEYWORDS.some((kw) => name.includes(kw));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PIPELINE COMPLETO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aplica normalización + scoring + filtrado a un array de resultados de Convex.
 * Devuelve los resultados reordenados, con los más plausibles primero.
 */
export function rankFoodResults<T extends { name: string; calories: number; servingWeightG: number }>(
  originalInput: string,
  results: T[]
): T[] {
  const normalized = normalizeQuery(originalInput);

  // Filtrar resultados absurdos y luego ordenar por score desc
  return results
    .filter(isPlausibleResult)
    .map((food) => ({ food, score: scoreFood(originalInput, normalized, food) }))
    .sort((a, b) => b.score - a.score)
    .map(({ food }) => food);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DEBUG (solo en desarrollo)
// ─────────────────────────────────────────────────────────────────────────────

export function debugMatch(
  input: string,
  results: Array<{ name: string; calories: number; servingWeightG: number }>
): void {
  if (process.env.NODE_ENV !== "development") return;
  const normalized = normalizeQuery(input);
  console.group(`[FoodMatcher] "${input}" → normalizado: "${normalized}"`);
  results.slice(0, 8).forEach((f, i) => {
    const s = scoreFood(input, normalized, f);
    const flag = !isPlausibleResult(f) ? " ⚠️ FILTRADO" : "";
    console.log(`  ${i + 1}. score:${s.toString().padStart(4)} | ${f.calories} kcal | ${f.name}${flag}`);
  });
  console.groupEnd();
}
