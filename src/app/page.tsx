import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  Users,
  ClipboardList,
  Apple,
  ChefHat,
  BarChart3,
  Shield,
  ArrowRight,
  Check,
  X,
  ChevronDown,
  Zap,
  Clock,
  Star,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavAuthButtons, HeroAuthButtons } from "@/components/landing/auth-buttons";
import { cn } from "@/lib/utils";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRUST_BADGES = [
  { icon: Apple, text: "2,870+ alimentos SMAE integrados" },
  { icon: Layers, text: "Hecho para nutriólogos en México" },
  { icon: Clock, text: "Planes listos en minutos" },
  { icon: Shield, text: "Datos seguros y protegidos" },
];

const PAIN_POINTS = [
  "Armas planes en Excel o Word manualmente",
  "Calculas equivalentes SMAE a mano o en papel",
  "Usas WhatsApp, PDF y hojas de cálculo por separado",
  "Tardas horas en ajustar un plan cuando cambia el paciente",
  "Tus materiales no se ven tan profesionales como quisieras",
  "No tienes un historial claro de cada paciente",
];

const BENEFITS = [
  {
    icon: Clock,
    title: "Recupera horas cada semana",
    desc: "Lo que hoy te toma 2 horas, con Lutra lo tienes en 20 minutos. Cálculos automáticos, base SMAE lista, sin trabajo repetitivo.",
    color: "text-[hsl(81,10%,54%)]",
    bg: "bg-[hsl(81,10%,94%)]",
  },
  {
    icon: Layers,
    title: "Todo en un solo lugar",
    desc: "Pacientes, planes, recetas, cálculos y seguimiento. Sin Excel, sin Word, sin PDFs por separado. Un sistema, todo integrado.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Star,
    title: "Entrega más profesional",
    desc: "Presenta planes limpios, claros y completos. Tus pacientes notarán la diferencia y tu práctica ganará credibilidad.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Zap,
    title: "Base SMAE completamente integrada",
    desc: "Más de 2,870 alimentos con calorías, macros y micronutrientes listos. Busca, filtra y agrega a cualquier plan en segundos.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: BarChart3,
    title: "Análisis nutricional automático",
    desc: "Visualiza macros, micronutrientes y cumplimiento de objetivos sin hacer una sola suma. Los números se calculan solos.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: Users,
    title: "Historial de cada paciente",
    desc: "Registra evolución, cambios de plan y notas. Ten todo el contexto disponible antes de cada consulta, sin buscar en papeles.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Registra a tu paciente",
    desc: "Ingresa datos antropométricos, objetivos y nivel de actividad. Lutra calcula automáticamente el GET con la fórmula que elijas.",
  },
  {
    n: "02",
    title: "Define requerimientos",
    desc: "Elige la distribución de macronutrimentos y obtén los equivalentes SMAE por tiempo de comida. Sin cálculos manuales.",
  },
  {
    n: "03",
    title: "Arma el plan y las recetas",
    desc: "Busca alimentos en la base SMAE, arma recetas con cálculo automático de macros y construye el plan completo en minutos.",
  },
  {
    n: "04",
    title: "Entrega un plan profesional",
    desc: "Comparte o imprime un plan limpio, completo y con la información nutricional exacta. Una experiencia que tus pacientes recordarán.",
  },
];

const FEATURES = [
  {
    icon: Users,
    title: "Gestión de pacientes",
    desc: "Expediente completo, historial clínico, evolución y seguimiento en un solo lugar.",
  },
  {
    icon: ClipboardList,
    title: "Planes alimenticios",
    desc: "Crea planes por tiempos de comida con distribución de equivalentes SMAE y cálculo automático.",
  },
  {
    icon: Apple,
    title: "Base SMAE completa",
    desc: "2,870+ alimentos con macros, micronutrientes, vitaminas y minerales. Filtrable por categoría.",
  },
  {
    icon: ChefHat,
    title: "Recetas inteligentes",
    desc: "Crea recetas con ingredientes SMAE. Los macros se calculan solos al agregar o modificar ingredientes.",
  },
  {
    icon: BarChart3,
    title: "Análisis nutricional",
    desc: "Visualiza distribución de macros y cumplimiento de objetivos con reportes visuales y claros.",
  },
  {
    icon: Shield,
    title: "Seguro y en la nube",
    desc: "Accede desde cualquier dispositivo. Tus datos y los de tus pacientes están protegidos y respaldados.",
  },
];

const BASIC_FEATURES = [
  "Gestión ilimitada de pacientes",
  "Cálculo de GET (Harris-Benedict, Mifflin, OMS)",
  "Planes alimenticios con equivalentes SMAE",
  "Base SMAE completa (2,870+ alimentos)",
  "Recetas con cálculo automático de macros",
  "Macros y micronutrientes por alimento",
  "Historial y seguimiento de pacientes",
  "Acceso desde cualquier dispositivo",
];

const PRO_EXTRAS = [
  "Todo lo del plan Básico",
  "Asistente IA para generar ideas de recetas",
  "Sugerencias inteligentes de ajuste de plan",
  "Análisis automático de deficiencias nutricionales",
  "Generación de notas de consulta con IA",
  "Acceso anticipado a nuevas funciones IA",
];

const FAQS = [
  {
    q: "¿Está hecho específicamente para nutriólogos en México?",
    a: "Sí. Lutra está diseñado desde cero para nutriólogos en México. Trabajamos con el Sistema Mexicano de Alimentos Equivalentes (SMAE) como base nutricional, las fórmulas más usadas en práctica clínica mexicana y una interfaz en español pensada para el flujo de consulta real.",
  },
  {
    q: "¿Incluye la base de alimentos SMAE completa?",
    a: "Sí. Tenemos más de 2,870 alimentos del SMAE con datos completos: calorías, proteínas, lípidos, carbohidratos, fibra, vitaminas, minerales e índice glucémico. Todo disponible para buscar, filtrar y agregar a tus planes directamente.",
  },
  {
    q: "¿Necesito instalar algo o requiere tarjeta para empezar?",
    a: "No necesitas instalar nada. Lutra es 100% web y funciona en cualquier navegador desde tu computadora, tablet o celular. Puedes crear tu cuenta sin tarjeta de crédito.",
  },
  {
    q: "¿Qué incluye el plan de $499 MXN al mes?",
    a: "Todo: gestión ilimitada de pacientes, planes alimenticios con base SMAE completa, recetas con cálculo automático de macros, calculadora energética, historial de cada paciente y asistente de IA para generar planes. No hay funciones bloqueadas ni niveles de suscripción. Un precio, todo incluido.",
  },
  {
    q: "¿Puedo usar Lutra desde el celular o tableta?",
    a: "Sí. Lutra está diseñado para funcionar bien en cualquier dispositivo. Puedes acceder desde tu computadora en consultorio y desde tu celular entre consultas sin perder nada.",
  },
  {
    q: "¿Mis datos y los de mis pacientes están seguros?",
    a: "Sí. Usamos autenticación segura, cifrado de datos y respaldos automáticos. Tu información y la de tus pacientes está protegida y nunca se comparte con terceros.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-white text-[hsl(222,47%,11%)]">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-[hsl(214,32%,91%)] bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/lutra-logo.svg" alt="Lutra" className="w-8 h-8 rounded-xl shrink-0" />
            <span className="text-lg font-bold tracking-tight">Lutra</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[hsl(215,16%,47%)]">
            <a href="#como-funciona" className="hover:text-[hsl(222,47%,11%)] transition-colors">Cómo funciona</a>
            <a href="#funciones" className="hover:text-[hsl(222,47%,11%)] transition-colors">Funciones</a>
            <a href="#precios" className="hover:text-[hsl(222,47%,11%)] transition-colors">Precios</a>
          </div>
          <div className="flex items-center gap-2">
            <NavAuthButtons />
          </div>
        </div>
      </nav>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[hsl(81,10%,97%)] via-white to-white pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[hsl(81,10%,54%)] opacity-[0.04] translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[hsl(81,10%,54%)] opacity-[0.04] -translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

              {/* Copy */}
              <div className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">

                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-[1.15] tracking-tight mb-5">
                  Deja de armar planes en Excel.{" "}
                  <span className="text-[hsl(81,10%,54%)]">Tu consulta merece herramientas reales.</span>
                </h1>

                <p className="text-lg sm:text-xl text-[hsl(215,16%,47%)] leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                  Lutra centraliza pacientes, planes alimenticios, base SMAE y recetas en un solo lugar. Crea planes profesionales en minutos, no en horas.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                  <HeroAuthButtons />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-5 text-sm text-[hsl(215,16%,47%)]">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[hsl(81,10%,54%)]" />
                    Sin tarjeta de crédito
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[hsl(81,10%,54%)]" />
                    Configuración en 2 minutos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[hsl(81,10%,54%)]" />
                    Base SMAE incluida
                  </span>
                </div>
              </div>

              {/* Product mockup */}
              <div className="flex-1 w-full max-w-xl lg:max-w-none">
                <div className="relative">
                  <div className="rounded-2xl border border-[hsl(214,32%,91%)] shadow-2xl shadow-black/10 overflow-hidden bg-white">
                    {/* Browser bar */}
                    <div className="flex items-center gap-1.5 px-4 py-3 bg-[hsl(214,32%,96%)] border-b border-[hsl(214,32%,91%)]">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <div className="flex-1 mx-4 bg-white rounded-md h-5 flex items-center px-2">
                        <span className="text-[10px] text-[hsl(215,16%,60%)]">nutrivon.app/dashboard</span>
                      </div>
                    </div>
                    {/* Fake dashboard */}
                    <div className="flex h-64 sm:h-80">
                      {/* Sidebar */}
                      <div className="w-14 sm:w-44 bg-[hsl(222,47%,11%)] flex flex-col gap-1 p-2 sm:p-3 shrink-0">
                        <div className="flex items-center gap-2 p-2 mb-3">
                          <img src="/lutra-logo.svg" alt="Lutra" className="w-6 h-6 rounded-md shrink-0" />
                          <span className="text-white text-xs font-bold hidden sm:block">Lutra</span>
                        </div>
                        {[
                          { icon: Users, label: "Pacientes" },
                          { icon: ClipboardList, label: "Planes", active: true },
                          { icon: Apple, label: "Alimentos" },
                          { icon: ChefHat, label: "Recetas" },
                        ].map(({ icon: Icon, label, active }) => (
                          <div
                            key={label}
                            className={cn(
                              "flex items-center gap-2 px-2 py-2 rounded-lg",
                              active ? "bg-[hsl(81,10%,54%)] text-white" : "text-white/50"
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-[10px] hidden sm:block">{label}</span>
                          </div>
                        ))}
                      </div>
                      {/* Main */}
                      <div className="flex-1 p-3 sm:p-4 bg-[hsl(214,32%,97%)] overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex flex-col gap-1">
                            <div className="h-3.5 w-28 bg-[hsl(222,47%,11%)] rounded" />
                            <div className="h-2.5 w-20 bg-[hsl(215,16%,75%)] rounded" />
                          </div>
                          <div className="w-20 h-7 rounded-lg bg-[hsl(81,10%,54%)]" />
                        </div>
                        {/* Macro cards */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {[
                            { label: "Kcal", val: "1,850", color: "text-[hsl(222,47%,11%)]" },
                            { label: "Prot", val: "98g", color: "text-blue-600" },
                            { label: "Lip", val: "62g", color: "text-yellow-600" },
                            { label: "HC", val: "210g", color: "text-[hsl(81,10%,54%)]" },
                          ].map((m) => (
                            <div key={m.label} className="bg-white rounded-lg p-2 text-center border border-[hsl(214,32%,91%)]">
                              <p className={cn("text-xs font-bold", m.color)}>{m.val}</p>
                              <p className="text-[9px] text-[hsl(215,16%,60%)]">{m.label}</p>
                            </div>
                          ))}
                        </div>
                        {/* Plan rows */}
                        <div className="bg-white rounded-xl border border-[hsl(214,32%,91%)] overflow-hidden">
                          {["Desayuno", "Colación AM", "Comida", "Cena"].map((meal, i) => (
                            <div
                              key={meal}
                              className={cn(
                                "flex items-center justify-between px-3 py-2 text-[10px]",
                                i < 3 && "border-b border-[hsl(214,32%,91%)]"
                              )}
                            >
                              <span className="font-medium text-[hsl(222,47%,11%)]">{meal}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-1.5 bg-[hsl(214,32%,91%)] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[hsl(81,10%,54%)] rounded-full"
                                    style={{ width: `${[70, 45, 85, 60][i]}%` }}
                                  />
                                </div>
                                <span className="text-[hsl(215,16%,47%)]">{[460, 150, 720, 520][i]} kcal</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Glow */}
                  <div className="absolute -inset-4 bg-[hsl(81,10%,54%)] opacity-[0.06] rounded-3xl blur-3xl -z-10" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust badges ── */}
        <section className="border-y border-[hsl(214,32%,91%)] py-6 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {TRUST_BADGES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(81,10%,92%)] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[hsl(81,10%,54%)]" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Problem ── */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Before */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(215,16%,47%)] mb-3">
                  Antes de Lutra
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  ¿Te suena familiar esto?
                </h2>
                <div className="flex flex-col gap-3">
                  {PAIN_POINTS.map((p) => (
                    <div key={p} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 text-red-500" />
                      </div>
                      <span className="text-[hsl(215,16%,47%)] text-sm leading-relaxed">{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* After */}
              <div className="bg-[hsl(81,10%,97%)] rounded-2xl p-8 border border-[hsl(81,10%,88%)]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(81,10%,54%)] mb-3">
                  Con Lutra
                </p>
                <h3 className="text-2xl font-bold mb-6">
                  Tu consulta, transformada
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    "Planes armados en minutos con cálculos automáticos",
                    "Base SMAE integrada: busca y agrega en segundos",
                    "Todo centralizado: pacientes, planes y recetas",
                    "Ajusta planes al instante sin recalcular nada",
                    "Materiales profesionales y presentables",
                    "Historial completo de cada paciente, siempre disponible",
                  ].map((p) => (
                    <div key={p} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[hsl(81,10%,54%)] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm leading-relaxed font-medium">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Benefits ── */}
        <section className="py-20 sm:py-28 bg-[hsl(214,32%,98%)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(81,10%,54%)] mb-3">
                Beneficios
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Más tiempo contigo. Menos tiempo en papeles.
              </h2>
              <p className="text-[hsl(215,16%,47%)] text-lg max-w-2xl mx-auto">
                Lutra no solo organiza tu información. Cambia cómo trabajas.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map(({ icon: Icon, title, desc, color, bg }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl border border-[hsl(214,32%,91%)] p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", bg)}>
                    <Icon className={cn("w-5 h-5", color)} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-1.5">{title}</h3>
                    <p className="text-sm text-[hsl(215,16%,47%)] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="como-funciona" className="py-20 sm:py-28 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(81,10%,54%)] mb-3">
                Así funciona
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                De cero a plan completo en una sola sesión
              </h2>
              <p className="text-[hsl(215,16%,47%)] text-lg max-w-xl mx-auto">
                Flujo pensado para que tu consulta fluya, no para que la obstaculice.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map(({ n, title, desc }, i) => (
                <div key={n} className="relative flex flex-col gap-4">
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-[hsl(81,10%,54%)] to-transparent -translate-x-4 z-0" />
                  )}
                  <div className="relative z-10 w-12 h-12 rounded-2xl bg-[hsl(81,10%,92%)] flex items-center justify-center">
                    <span className="text-sm font-extrabold text-[hsl(81,10%,54%)]">{n}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-[hsl(215,16%,47%)] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="funciones" className="py-20 sm:py-28 bg-[hsl(222,47%,11%)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(81,10%,60%)] mb-3">
                Funciones
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Todo lo que necesitas para operar tu práctica
              </h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Diseñado específicamente para nutriólogos que trabajan con el sistema SMAE.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 p-6 bg-white/5 hover:bg-white/8 transition-colors flex gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[hsl(81,10%,54%)] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1.5 text-sm">{title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Lutra ── */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(81,10%,54%)] mb-3">
                  Por qué Lutra
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold mb-5">
                  Hecho para México. No adaptado.
                </h2>
                <p className="text-[hsl(215,16%,47%)] text-base leading-relaxed mb-8">
                  La mayoría de herramientas de nutrición son genéricas o están pensadas para otros países. Lutra nació en México para nutriólogos en México, con los estándares, bases de datos y flujos de trabajo que realmente usas.
                </p>
                <div className="flex flex-col gap-4">
                  {[
                    { title: "Sistema Mexicano de Alimentos Equivalentes (SMAE)", desc: "Base de datos nativa con más de 2,870 alimentos, no un workaround importado." },
                    { title: "Fórmulas clínicas integradas", desc: "Harris-Benedict, Mifflin-St Jeor, OMS y más. Sin buscarlas en otra app." },
                    { title: "Escalable con IA", desc: "El plan Pro ya incluye funciones de IA. Pronto mucho más automatización para tu flujo de consulta." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[hsl(81,10%,54%)] mt-2 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm mb-0.5">{title}</p>
                        <p className="text-sm text-[hsl(215,16%,47%)]">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { val: "2,870+", label: "Alimentos SMAE", sub: "con datos completos" },
                  { val: "< 5 min", label: "Para un plan base", sub: "vs 1–2 horas manual" },
                  { val: "100%", label: "En la nube", sub: "accede desde cualquier lugar" },
                  { val: "0", label: "Herramientas extra", sub: "todo en un solo sistema" },
                ].map(({ val, label, sub }) => (
                  <div
                    key={label}
                    className="bg-[hsl(81,10%,97%)] rounded-2xl p-5 border border-[hsl(81,10%,88%)]"
                  >
                    <p className="text-3xl font-extrabold text-[hsl(81,10%,54%)] mb-1">{val}</p>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-[hsl(215,16%,47%)] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="precios" className="py-20 sm:py-28 bg-[hsl(214,32%,98%)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(81,10%,54%)] mb-3">
                Precios
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Un solo plan. Todo incluido.
              </h2>
              <p className="text-[hsl(215,16%,47%)] text-lg max-w-xl mx-auto">
                Sin niveles. Sin funciones bloqueadas. Sin sorpresas.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="relative bg-[hsl(222,47%,11%)] rounded-2xl p-8 flex flex-col gap-6 overflow-hidden">
                <div className="absolute top-5 right-5">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-[hsl(81,10%,54%)] text-white px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Todo incluido
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">Plan Lutra</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-extrabold text-white">$499</span>
                    <span className="text-white/50 mb-2">MXN / mes</span>
                  </div>
                  <p className="text-sm text-white/60">
                    Todo lo que necesitas para operar tu práctica nutricional, sin pagar de más.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  {BASIC_FEATURES.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[hsl(81,10%,60%)] shrink-0 mt-0.5" />
                      <span className="text-sm text-white">{f}</span>
                    </div>
                  ))}
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[hsl(81,10%,60%)] shrink-0 mt-0.5" />
                    <span className="text-sm text-white">Asistente IA para generar planes alimenticios</span>
                  </div>
                </div>

                <Button
                  asChild
                  className="mt-2 bg-[hsl(81,10%,54%)] text-white hover:bg-[hsl(81,10%,44%)] h-12 text-base font-semibold"
                >
                  <Link href="/signup">
                    Empezar ahora
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>

                <div className="flex justify-center gap-6 text-xs text-white/40">
                  <span>Sin contrato</span>
                  <span>·</span>
                  <span>Cancela cuando quieras</span>
                  <span>·</span>
                  <span>Sin tarjeta para explorar</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-[hsl(81,10%,54%)] mb-3">
                Preguntas frecuentes
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Resolvemos tus dudas
              </h2>
            </div>

            <div className="flex flex-col divide-y divide-[hsl(214,32%,91%)] border border-[hsl(214,32%,91%)] rounded-2xl overflow-hidden">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group">
                  <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-[hsl(214,32%,98%)] transition-colors">
                    <span className="text-sm font-semibold leading-snug">{q}</span>
                    <ChevronDown className="w-4 h-4 text-[hsl(215,16%,47%)] shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-5">
                    <p className="text-sm text-[hsl(215,16%,47%)] leading-relaxed">{a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-20 sm:py-28 bg-[hsl(81,10%,54%)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              Tu práctica merece herramientas a la altura de tu formación.
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Únete a los nutriólogos que ya operan de forma más rápida, más ordenada y más profesional. Empieza hoy sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-white text-[hsl(81,10%,54%)] hover:bg-white/90 h-12 px-10 text-base font-semibold shadow-lg"
              >
                <Link href="/signup">
                  Crear cuenta gratuita
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 h-12 px-8 text-base"
              >
                <Link href="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
            <p className="text-white/60 text-sm mt-6">
              Sin contratos · Sin tarjeta · Cancela cuando quieras
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[hsl(214,32%,91%)] py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/lutra-logo.svg" alt="Lutra" className="w-7 h-7 rounded-lg shrink-0" />
              <span className="font-bold text-sm">Lutra</span>
              <span className="text-xs text-[hsl(215,16%,47%)] ml-2">
                © {new Date().getFullYear()} Todos los derechos reservados.
              </span>
            </div>
            <div className="flex gap-5 text-xs text-[hsl(215,16%,47%)]">
              <a href="#precios" className="hover:text-[hsl(81,10%,54%)] transition-colors">Precios</a>
              <Link href="/login" className="hover:text-[hsl(81,10%,54%)] transition-colors">Iniciar sesión</Link>
              <Link href="/signup" className="hover:text-[hsl(81,10%,54%)] transition-colors">Registrarse</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
