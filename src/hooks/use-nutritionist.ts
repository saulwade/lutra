// @ts-nocheck
"use client"

import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { api } from "@/../convex/_generated/api";

/**
 * Hook that ensures a nutritionist profile exists for the current Clerk user.
 * Creates one automatically on first login.
 */
export function useNutritionist() {
  const { user, isLoaded } = useUser();
  const nutritionist = useQuery(api.nutritionists.getCurrentNutritionist);
  const createNutritionist = useMutation(api.nutritionists.createNutritionist);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (nutritionist === null) {
      // Profile doesn't exist yet — create it
      createNutritionist({
        name: user.fullName || user.firstName || "Nutriólogo",
        email: user.primaryEmailAddress?.emailAddress || "",
      }).catch(console.error);
    }
  }, [isLoaded, user, nutritionist, createNutritionist]);

  return {
    nutritionist,
    isLoading: nutritionist === undefined,
    isReady: nutritionist !== null && nutritionist !== undefined,
  };
}
