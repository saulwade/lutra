// @ts-nocheck
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

const BRAND       = "#8D957E";
const BRAND_LIGHT = "#F0F1EC";
const GRAY        = "#6B7280";
const DARK        = "#111827";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },

  // Header band
  header: {
    backgroundColor: BRAND,
    paddingHorizontal: 36,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: "flex-end" },
  clinicName: { color: "rgba(255,255,255,0.75)", fontSize: 8, marginBottom: 4 },
  planTitle: { color: "white", fontSize: 17, fontFamily: "Helvetica-Bold" },
  planSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 8, marginTop: 3 },
  nutritionistName: { color: "white", fontSize: 9, fontFamily: "Helvetica-Bold" },
  nutritionistDetail: { color: "rgba(255,255,255,0.7)", fontSize: 8, marginTop: 2 },

  // Patient band
  patientBand: {
    backgroundColor: BRAND_LIGHT,
    paddingHorizontal: 36,
    paddingVertical: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  patientLabel: { fontSize: 7, color: GRAY, marginBottom: 2 },
  patientValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },

  // Body
  body: { paddingHorizontal: 36, paddingTop: 14 },

  // Section title
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
  },

  // Meta calórica
  metaBox: {
    backgroundColor: BRAND_LIGHT,
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaKcal: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  metaKcalLabel: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },
  metaSep: {
    width: 1,
    height: 30,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 12,
  },
  metaMacro: {
    flex: 1,
    alignItems: "center",
  },
  metaMacroVal: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  metaMacroLabel: {
    fontSize: 7,
    color: GRAY,
    marginTop: 2,
  },

  // Meal header
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BRAND,
  },
  mealName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND },
  mealKcal: { fontSize: 8, color: BRAND },

  // Food table (simplified - no P/L/HC)
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  colName:   { flex: 5, fontSize: 8 },
  colAmount: { flex: 2, fontSize: 8, textAlign: "right" },
  colKcal:   { flex: 2, fontSize: 8, textAlign: "right", color: "#D97706" },
  tableHeaderText: { fontSize: 7, color: GRAY, fontFamily: "Helvetica-Bold" },

  // Meal total row
  mealTotalRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  mealTotalLabel: { flex: 7, fontSize: 7, color: GRAY, fontFamily: "Helvetica-Bold" },
  emptyMeal: { fontSize: 8, color: GRAY, fontStyle: "italic", paddingBottom: 10 },

  // Divider
  divider: { height: 1, backgroundColor: "#E5E7EB", marginTop: 6, marginBottom: 12 },

  // Two column layout
  twoCol: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },

  // Exchange list (guide)
  exchangeGroup: { marginBottom: 10 },
  exchangeGroupTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 2,
  },
  exchangePortionNote: {
    fontSize: 7,
    color: GRAY,
    marginBottom: 2,
    fontStyle: "italic",
  },
  exchangeText: { fontSize: 8, color: DARK, lineHeight: 1.5 },

  // Shopping list
  shopItem: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  shopBullet: { fontSize: 8, color: BRAND, marginRight: 6, width: 8 },
  shopText: { flex: 1, fontSize: 8 },
  shopQty: { fontSize: 8, color: GRAY },

  // Generic grid table
  gridTable: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 4, marginBottom: 12 },

  // Recommendations
  recItem: { flexDirection: "row", marginBottom: 5, alignItems: "flex-start" },
  recBullet: { fontSize: 8, color: BRAND, marginRight: 6, marginTop: 1 },
  recText: { flex: 1, fontSize: 8, lineHeight: 1.5 },

  // Notes box
  notesBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 10,
    minHeight: 60,
  },
  notesText: { fontSize: 8, color: DARK, lineHeight: 1.6 },

  // Page label
  pageLabel: {
    backgroundColor: BRAND_LIGHT,
    paddingHorizontal: 36,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  pageLabelText: { fontSize: 8, color: BRAND, fontFamily: "Helvetica-Bold" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 14,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 7,
  },
  footerText: { fontSize: 7, color: GRAY },

  // Tip box
  tipBox: {
    borderLeftWidth: 3,
    borderLeftColor: BRAND,
    backgroundColor: BRAND_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
    marginBottom: 10,
  },
  tipText: { fontSize: 8, color: DARK, lineHeight: 1.5 },
});

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  weight_loss:  "Bajar de peso",
  maintenance:  "Mantener mi peso",
  weight_gain:  "Subir de peso",
  muscle_gain:  "Ganar masa muscular",
  health:       "Salud general",
};

// Patient-friendly group names (no "AOA", no abbreviations)
const EXCHANGE_LIST = [
  {
    group: "Verduras",
    portion: "1 porción = ½ taza cocida o 1 taza cruda",
    examples: "Brócoli, espinacas, calabaza, ejotes, zanahoria, pepino, betabel, chayote, nopal, jitomate, pimiento, lechuga.",
  },
  {
    group: "Frutas",
    portion: "1 porción = 1 pieza mediana o ½ taza picada",
    examples: "1 pieza: manzana, naranja, mandarina, pera, durazno. ½ taza: mango, papaya, fresas. ¼ taza: melón o sandía. 17 uvas.",
  },
  {
    group: "Cereales y tortillas",
    portion: "1 porción = 1 tortilla, ⅓ taza arroz/pasta o 1 rebanada pan integral",
    examples: "1 tortilla de maíz (30 g) · ⅓ taza arroz o pasta cocida · ½ taza avena cocida · 1 rebanada pan integral · ¾ taza cereal integral sin azúcar · 3 tazas palomitas naturales.",
  },
  {
    group: "Pan, galletas y harinas",
    portion: "1 porción = 1 rebanada pan blanco o 15 galletas saladas",
    examples: "1 rebanada pan de caja blanco · 15 galletas saladas · 1 pan dulce pequeño (50 g) · 4 galletas tipo María.",
  },
  {
    group: "Leguminosas (frijoles, lentejas, garbanzos)",
    portion: "1 porción = ½ taza cocida",
    examples: "Frijoles negros, pintos o bayos · lentejas · garbanzos · habas · soya texturizada.",
  },
  {
    group: "Carnes y huevo (muy magros)",
    portion: "1 porción = 90 g de carne cocida o 3 claras de huevo",
    examples: "3 claras de huevo · 90 g atún en agua escurrido · 90 g pechuga de pollo sin piel · 90 g pechuga de pavo.",
  },
  {
    group: "Carnes y huevo (magros)",
    portion: "1 porción = 30 g de carne o 1 huevo entero",
    examples: "1 huevo entero · 30 g pavo o res magra · 30 g queso panela o requesón · 90 g mojarra o pescado blanco.",
  },
  {
    group: "Carnes y quesos (grasa media)",
    portion: "1 porción = 30 g de carne o queso",
    examples: "30 g pollo con piel · 30 g carne molida magra · 30 g queso fresco o Oaxaca · ½ taza queso cottage.",
  },
  {
    group: "Carnes procesadas y quesos maduros",
    portion: "1 porción = 30 g",
    examples: "30 g salchicha o chorizo · 30 g queso amarillo o manchego · 30 g sardina en aceite · 1 rebanada mortadela. Consumir ocasionalmente.",
  },
  {
    group: "Leche descremada o de soya",
    portion: "1 porción = 1 vaso (240 ml) o ¾ taza yogur natural",
    examples: "Leche descremada · leche de soya sin azúcar · yogur natural descremado (sin azúcar).",
  },
  {
    group: "Leche semidescremada o light",
    portion: "1 porción = 1 vaso (240 ml)",
    examples: "Leche light o semidescremada · yogur natural semidescremado.",
  },
  {
    group: "Leche entera",
    portion: "1 porción = 1 vaso (240 ml)",
    examples: "Leche entera · yogur natural entero.",
  },
  {
    group: "Grasas saludables",
    portion: "1 porción = 1 cdita aceite o ⅛ aguacate",
    examples: "1 cdita aceite de oliva o vegetal · 1 cdita mantequilla · ⅛ aguacate (30 g) · 10 aceitunas · 2 cdas crema ácida.",
  },
  {
    group: "Nueces, semillas y mantequillas de nuez",
    portion: "1 porción = 15 g (1 cucharada)",
    examples: "15 g nueces, almendras, pistaches o cacahuates · 2 cdas mantequilla de cacahuate o almendra · 30 g semillas de girasol o calabaza.",
  },
  {
    group: "Azúcares y dulces",
    portion: "1 porción = 1 cucharada",
    examples: "1 cda azúcar, miel o mermelada · 1 sobre azúcar morena · ½ taza gelatina con azúcar. Consumir con moderación.",
  },
];

const RECOMMENDATIONS: Record<string, string[]> = {
  weight_loss: [
    "Incluye una fuente de proteína en cada tiempo de comida para sentirte satisfecho más tiempo.",
    "Llena la mitad de tu plato con verduras: aportan fibra, vitaminas y pocas calorías.",
    "Toma agua natural durante el día; evita refrescos, jugos y bebidas azucaradas.",
    "Come sin distracciones (sin celular ni tele) y mastica despacio para notar la saciedad.",
    "No te saltes comidas: saltarlas puede provocar más hambre y antojos después.",
    "Realiza actividad física que disfrutes al menos 30 minutos al día.",
  ],
  muscle_gain: [
    "Distribuye tu proteína en todas las comidas del día — no la concentres en una sola.",
    "Come carbohidratos (tortilla, arroz, avena) antes y después de entrenar para tener energía.",
    "Toma al menos 2.5 litros de agua al día; más si haces ejercicio intenso.",
    "El descanso es parte del entrenamiento: duerme 7–9 horas para que el músculo crezca.",
    "El aumento de peso saludable es gradual; no te desesperes si no ves cambios inmediatos.",
    "No te saltes ninguna comida — el cuerpo necesita energía constante para ganar músculo.",
  ],
  maintenance: [
    "Mantén horarios regulares de comida para que tu metabolismo funcione mejor.",
    "Varía los alimentos que consumes para obtener todos los nutrientes que necesitas.",
    "Modera el consumo de sal, azúcar y alimentos ultraprocesados.",
    "Toma al menos 2 litros de agua natural al día.",
    "Combina una alimentación balanceada con actividad física regular (150 min/semana).",
    "Visualiza tu plato: ½ verduras, ¼ proteína (carne/huevo/leguminosas), ¼ cereales.",
  ],
  weight_gain: [
    "Aumenta el tamaño de tus porciones de forma gradual para que tu cuerpo se adapte.",
    "Agrega colaciones nutritivas entre comidas: nueces, fruta con yogur, pan con aguacate.",
    "Elige alimentos que den mucha energía en poco volumen: aguacate, nueces, aceite de oliva, leguminosas.",
    "Acompaña el aumento de peso con ejercicio de fuerza para que ganes músculo, no grasa.",
    "Pésate una vez por semana, siempre en las mismas condiciones (mañana, en ayunas).",
    "Si tienes poco apetito, come porciones pequeñas pero frecuentes (cada 2–3 horas).",
  ],
  health: [
    "Llena la mitad de tu plato con verduras y frutas de colores variados.",
    "Prefiere cereales integrales: tortilla de maíz, avena, arroz integral, pan integral.",
    "Limita la sal, el azúcar añadida y los alimentos de paquete o ultraprocesados.",
    "Come al menos 5 porciones de frutas y verduras diferentes al día.",
    "Toma agua como tu bebida principal; reduce o elimina refrescos y jugos.",
    "El ejercicio y la buena alimentación van de la mano — ¡los dos son importantes!",
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function r(n: number) { return Math.round(n); }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meal {
  _id: string;
  name: string;
  time?: string;
  foods: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    proteinG: number;
    fatG: number;
    carbsG: number;
    smaeCategory?: string;
  }[];
}

interface PlanPDFDocumentProps {
  plan: {
    title: string;
    description?: string;
    targetCalories: number;
    targetProteinG: number;
    targetFatG: number;
    targetCarbsG: number;
    targetProteinPct: number;
    targetFatPct: number;
    targetCarbsPct: number;
    startDate?: string;
    endDate?: string;
    equivalentsPerDay?: Record<string, number>;
    distributionPerMeal?: Record<string, number[]>;
  };
  patient: {
    name: string;
    age?: number;
    sex: string;
    weightKg: number;
    heightCm: number;
    goal: string;
  };
  nutritionist: {
    name: string;
    cedula?: string;
    clinicName?: string;
    email: string;
  };
  meals: Meal[];
}

// ─── Shared subcomponents ─────────────────────────────────────────────────────

function PageHeader({ nutritionist, plan }: { nutritionist: PlanPDFDocumentProps["nutritionist"]; plan: PlanPDFDocumentProps["plan"] }) {
  return (
    <View style={[styles.header, { paddingVertical: 12 }]}>
      <View style={styles.headerLeft}>
        <Text style={styles.clinicName}>{nutritionist.clinicName || "Lutra"}</Text>
        <Text style={[styles.planTitle, { fontSize: 12 }]}>{plan.title}</Text>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.nutritionistName}>{nutritionist.name}</Text>
        <Text style={styles.nutritionistDetail}>{nutritionist.email}</Text>
      </View>
    </View>
  );
}

function PageFooter({ nutritionist, today }: { nutritionist: PlanPDFDocumentProps["nutritionist"]; today: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        Plan elaborado por {nutritionist.name}  ·  {nutritionist.email}
      </Text>
      <Text style={styles.footerText}>Generado con Lutra  ·  {today}</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlanPDFDocument({ plan, patient, nutritionist, meals }: PlanPDFDocumentProps) {
  const today = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

  const totalKcal = meals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + f.calories, 0), 0);

  // ── Shopping list ─────────────────────────────────────────────────────────
  const shopMap: Record<string, { qty: number; unit: string }[]> = {};
  for (const meal of meals) {
    for (const food of meal.foods) {
      if (!shopMap[food.name]) shopMap[food.name] = [];
      shopMap[food.name].push({ qty: food.quantity, unit: food.unit });
    }
  }
  const shopItems = Object.entries(shopMap).map(([name, entries]) => {
    const byUnit: Record<string, number> = {};
    for (const e of entries) {
      byUnit[e.unit] = (byUnit[e.unit] ?? 0) + e.qty;
    }
    const qtyStr = Object.entries(byUnit)
      .map(([unit, qty]) => `${Math.round(qty * 10) / 10} ${unit}`)
      .join(" + ");
    return { name, qty: qtyStr };
  });
  const hasShopItems = shopItems.length > 0;

  // ── Recommendations ───────────────────────────────────────────────────────
  const recs = RECOMMENDATIONS[patient.goal] ?? RECOMMENDATIONS.health;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Document title={plan.title} author={nutritionist.name}>

      {/* ════════════════ PÁGINA 1 — Tu plan del día ════════════════ */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.clinicName}>{nutritionist.clinicName || "Lutra"}</Text>
            <Text style={styles.planTitle}>{plan.title}</Text>
            <Text style={styles.planSubtitle}>Plan alimenticio personalizado</Text>
            {(plan.startDate || plan.endDate) && (
              <Text style={[styles.planSubtitle, { marginTop: 5 }]}>
                {plan.startDate && `Inicio: ${plan.startDate}`}
                {plan.startDate && plan.endDate && "  ·  "}
                {plan.endDate && `Fin: ${plan.endDate}`}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.nutritionistName}>{nutritionist.name}</Text>
            {nutritionist.cedula && (
              <Text style={styles.nutritionistDetail}>Cédula: {nutritionist.cedula}</Text>
            )}
            <Text style={styles.nutritionistDetail}>{nutritionist.email}</Text>
          </View>
        </View>

        {/* Patient band */}
        <View style={styles.patientBand}>
          {[
            { label: "Paciente",  value: patient.name },
            patient.age ? { label: "Edad", value: `${patient.age} años` } : null,
            { label: "Objetivo",  value: GOAL_LABELS[patient.goal] ?? patient.goal },
          ].filter(Boolean).map((f, i) => (
            <View key={i}>
              <Text style={styles.patientLabel}>{f.label}</Text>
              <Text style={styles.patientValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* Body */}
        <View style={styles.body}>

          {/* Meta calórica — simple y clara */}
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Tu meta diaria</Text>
          <View style={styles.metaBox}>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.metaKcal}>{r(plan.targetCalories)}</Text>
              <Text style={styles.metaKcalLabel}>calorías al día</Text>
            </View>
            <View style={styles.metaSep} />
            <View style={styles.metaMacro}>
              <Text style={[styles.metaMacroVal, { color: "#2563EB" }]}>{r(plan.targetProteinG)} g</Text>
              <Text style={styles.metaMacroLabel}>Proteína</Text>
            </View>
            <View style={styles.metaMacro}>
              <Text style={[styles.metaMacroVal, { color: "#CA8A04" }]}>{r(plan.targetFatG)} g</Text>
              <Text style={styles.metaMacroLabel}>Grasas</Text>
            </View>
            <View style={styles.metaMacro}>
              <Text style={[styles.metaMacroVal, { color: BRAND }]}>{r(plan.targetCarbsG)} g</Text>
              <Text style={styles.metaMacroLabel}>Carbohidratos</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Tiempos de comida */}
          <Text style={styles.sectionTitle}>Tus comidas del día</Text>

          {meals.length === 0 && (
            <Text style={{ fontSize: 8, color: GRAY, fontStyle: "italic" }}>
              Aún no se han asignado alimentos a este plan.
            </Text>
          )}

          {meals.map((meal) => {
            const mealKcal = meal.foods.reduce((s, f) => s + f.calories, 0);
            return (
              <View key={meal._id} wrap={false}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName}>
                    {meal.name}{meal.time ? `  ·  ${meal.time}` : ""}
                  </Text>
                  <Text style={styles.mealKcal}>{r(mealKcal)} cal</Text>
                </View>
                {meal.foods.length === 0 ? (
                  <Text style={styles.emptyMeal}>Sin alimentos asignados</Text>
                ) : (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.colName,   styles.tableHeaderText]}>Alimento</Text>
                      <Text style={[styles.colAmount, styles.tableHeaderText]}>Cantidad</Text>
                      <Text style={[styles.colKcal,   styles.tableHeaderText]}>Calorías</Text>
                    </View>
                    {meal.foods.map((food, idx) => (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={styles.colName}>{food.name}</Text>
                        <Text style={styles.colAmount}>{food.quantity} {food.unit}</Text>
                        <Text style={styles.colKcal}>{r(food.calories)}</Text>
                      </View>
                    ))}
                    <View style={styles.mealTotalRow}>
                      <Text style={styles.mealTotalLabel}>Total de esta comida</Text>
                      <Text style={[styles.colKcal, styles.tableHeaderText]}>{r(mealKcal)} cal</Text>
                    </View>
                  </>
                )}
              </View>
            );
          })}

          {/* Día total */}
          {meals.length > 0 && totalKcal > 0 && (
            <>
              <View style={styles.divider} />
              <View style={[styles.metaBox, { marginBottom: 0 }]}>
                <Text style={{ fontSize: 8, color: GRAY, flex: 1 }}>Total del día</Text>
                <Text style={[styles.metaKcal, { fontSize: 16 }]}>{r(totalKcal)}</Text>
                <Text style={{ fontSize: 9, color: GRAY, marginLeft: 4, alignSelf: "flex-end", marginBottom: 2 }}>cal</Text>
              </View>
            </>
          )}
        </View>

        <PageFooter nutritionist={nutritionist} today={today} />
      </Page>

      {/* ════════════════ PÁGINA 2 — Guía de porciones ════════════════ */}
      <Page size="A4" style={styles.page}>
        <PageHeader nutritionist={nutritionist} plan={plan} />

        <View style={styles.pageLabel}>
          <Text style={styles.pageLabelText}>Guía de Porciones — ¿Cuánto es una porción de cada alimento?</Text>
        </View>

        <View style={styles.body}>
          <View style={[styles.tipBox, { marginTop: 10 }]}>
            <Text style={styles.tipText}>
              Cada opción dentro del mismo grupo tiene un aporte calórico similar, así que puedes intercambiarlas según lo que tengas disponible o lo que más te guste.
            </Text>
          </View>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              {EXCHANGE_LIST.slice(0, Math.ceil(EXCHANGE_LIST.length / 2)).map((item, idx) => (
                <View key={idx} style={styles.exchangeGroup}>
                  <Text style={styles.exchangeGroupTitle}>{item.group}</Text>
                  <Text style={styles.exchangePortionNote}>{item.portion}</Text>
                  <Text style={styles.exchangeText}>{item.examples}</Text>
                </View>
              ))}
            </View>
            <View style={styles.col}>
              {EXCHANGE_LIST.slice(Math.ceil(EXCHANGE_LIST.length / 2)).map((item, idx) => (
                <View key={idx} style={styles.exchangeGroup}>
                  <Text style={styles.exchangeGroupTitle}>{item.group}</Text>
                  <Text style={styles.exchangePortionNote}>{item.portion}</Text>
                  <Text style={styles.exchangeText}>{item.examples}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <PageFooter nutritionist={nutritionist} today={today} />
      </Page>

      {/* ════════════════ PÁGINA 3 — Lista del súper + Consejos + Notas ════════════════ */}
      <Page size="A4" style={styles.page}>
        <PageHeader nutritionist={nutritionist} plan={plan} />

        <View style={styles.pageLabel}>
          <Text style={styles.pageLabelText}>Lista del Súper · Consejos · Notas de tu Nutriólogo</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.twoCol}>

            {/* Lista del súper */}
            <View style={styles.col}>
              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Lista del súper</Text>
              {hasShopItems ? (
                <View style={[styles.gridTable, { marginBottom: 0 }]}>
                  {shopItems.map((item, idx) => (
                    <View key={idx} style={[styles.shopItem, idx === shopItems.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                      <Text style={styles.shopBullet}>•</Text>
                      <Text style={styles.shopText}>{item.name}</Text>
                      <Text style={styles.shopQty}>{item.qty}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 8, color: GRAY, fontStyle: "italic" }}>
                  Agrega alimentos a los tiempos de comida para generar la lista automáticamente.
                </Text>
              )}
            </View>

            {/* Consejos personalizados */}
            <View style={styles.col}>
              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
                Consejos para: {GOAL_LABELS[patient.goal] ?? patient.goal}
              </Text>
              {recs.map((rec, idx) => (
                <View key={idx} style={styles.recItem}>
                  <Text style={styles.recBullet}>›</Text>
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Notas del nutriólogo */}
          <Text style={styles.sectionTitle}>Notas de tu nutriólogo</Text>
          <View style={styles.notesBox}>
            {plan.description ? (
              <Text style={styles.notesText}>{plan.description}</Text>
            ) : (
              <Text style={[styles.notesText, { color: GRAY, fontStyle: "italic" }]}>
                Sin notas adicionales.
              </Text>
            )}
          </View>
        </View>

        <PageFooter nutritionist={nutritionist} today={today} />
      </Page>
    </Document>
  );
}
