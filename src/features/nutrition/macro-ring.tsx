"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MacroTarget {
  proteinG: number;
  fatG: number;
  carbsG: number;
}

interface MacroRingProps {
  proteinG: number;
  fatG: number;
  carbsG: number;
  totalCalories?: number;
  targets?: MacroTarget;
  size?: number;
  showLabels?: boolean;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  protein: { stroke: "#3b82f6", bg: "bg-blue-500", text: "text-blue-600", label: "Proteínas" },
  fat: { stroke: "#eab308", bg: "bg-yellow-400", text: "text-yellow-600", label: "Grasas" },
  carbs: { stroke: "#22c55e", bg: "bg-green-500", text: "text-green-600", label: "Carbohidratos" },
};

// ─── SVG Donut ────────────────────────────────────────────────────────────────

function buildSegments(
  proteinKcal: number,
  fatKcal: number,
  carbsKcal: number,
  r: number,
  strokeWidth: number
): Array<{ color: string; dashArray: string; dashOffset: number; key: string }> {
  const total = proteinKcal + fatKcal + carbsKcal;
  if (total === 0) return [];

  const circumference = 2 * Math.PI * r;
  const GAP = circumference * 0.008; // 0.8% gap between segments

  const values = [
    { key: "protein", kcal: proteinKcal, color: COLORS.protein.stroke },
    { key: "fat", kcal: fatKcal, color: COLORS.fat.stroke },
    { key: "carbs", kcal: carbsKcal, color: COLORS.carbs.stroke },
  ];

  const segments: ReturnType<typeof buildSegments> = [];
  let cumulativePct = 0;

  for (const { key, kcal, color } of values) {
    const pct = kcal / total;
    const length = Math.max(circumference * pct - GAP, 0);
    const offset = -circumference * cumulativePct;
    segments.push({
      key,
      color,
      dashArray: `${length} ${circumference - length}`,
      dashOffset: offset,
    });
    cumulativePct += pct;
  }

  return segments;
}

// ─── Macro Legend Row ─────────────────────────────────────────────────────────

function LegendRow({
  color,
  label,
  grams,
  pct,
  targetG,
}: {
  color: (typeof COLORS)[keyof typeof COLORS];
  label: string;
  grams: number;
  pct: number;
  targetG?: number;
}) {
  const progressPct = targetG ? Math.min((grams / targetG) * 100, 100) : pct;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className={cn("h-2.5 w-2.5 rounded-full", color.bg)} />
          <span className="font-medium text-[hsl(var(--foreground))]">{label}</span>
        </div>
        <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
          <span className={cn("font-semibold", color.text)}>{grams}g</span>
          {targetG && (
            <span className="text-[hsl(var(--muted-foreground))]/70">/ {targetG}g</span>
          )}
          <span className="ml-0.5">({pct}%)</span>
        </div>
      </div>
      {/* mini progress */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color.bg)}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MacroRing({
  proteinG,
  fatG,
  carbsG,
  totalCalories,
  targets,
  size = 140,
  showLabels = true,
  className,
}: MacroRingProps) {
  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const carbsKcal = carbsG * 4;
  const totalKcal = proteinKcal + fatKcal + carbsKcal;

  const proteinPct = totalKcal > 0 ? Math.round((proteinKcal / totalKcal) * 100) : 0;
  const fatPct = totalKcal > 0 ? Math.round((fatKcal / totalKcal) * 100) : 0;
  const carbsPct = totalKcal > 0 ? Math.round((carbsKcal / totalKcal) * 100) : 0;

  const STROKE_WIDTH = size * 0.1;
  const R = (size - STROKE_WIDTH) / 2;
  const CENTER = size / 2;

  const segments = buildSegments(proteinKcal, fatKcal, carbsKcal, R, STROKE_WIDTH);

  const displayCalories = totalCalories ?? totalKcal;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* SVG Donut */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Background ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={R}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={STROKE_WIDTH}
          />

          {/* Macro segments */}
          {segments.length > 0 ? (
            segments.map(({ key, color, dashArray, dashOffset }) => (
              <circle
                key={key}
                cx={CENTER}
                cy={CENTER}
                r={R}
                fill="none"
                stroke={color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                  transition: "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease",
                }}
              />
            ))
          ) : (
            <text
              x={CENTER}
              y={CENTER}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={size * 0.1}
              fill="hsl(var(--muted-foreground))"
            >
              Sin datos
            </text>
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {totalKcal > 0 ? (
            <>
              <span
                className="font-bold leading-tight text-[hsl(var(--foreground))]"
                style={{ fontSize: size * 0.13 }}
              >
                {Math.round(displayCalories)}
              </span>
              <span
                className="text-[hsl(var(--muted-foreground))]"
                style={{ fontSize: size * 0.08 }}
              >
                kcal
              </span>
            </>
          ) : (
            <span
              className="text-[hsl(var(--muted-foreground))]"
              style={{ fontSize: size * 0.09 }}
            >
              —
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="w-full max-w-xs space-y-2">
          <LegendRow
            color={COLORS.protein}
            label={COLORS.protein.label}
            grams={proteinG}
            pct={proteinPct}
            targetG={targets?.proteinG}
          />
          <LegendRow
            color={COLORS.fat}
            label={COLORS.fat.label}
            grams={fatG}
            pct={fatPct}
            targetG={targets?.fatG}
          />
          <LegendRow
            color={COLORS.carbs}
            label={COLORS.carbs.label}
            grams={carbsG}
            pct={carbsPct}
            targetG={targets?.carbsG}
          />
        </div>
      )}
    </div>
  );
}
