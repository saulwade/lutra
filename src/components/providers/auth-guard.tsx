"use client";

import { useConvexAuth } from "convex/react";
import { useNutritionist } from "@/hooks/use-nutritionist";

function NutritionistInitializer({ children }: { children: React.ReactNode }) {
  const { isReady } = useNutritionist();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[hsl(81,10%,54%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[hsl(81,10%,54%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <NutritionistInitializer>{children}</NutritionistInitializer>;
}
