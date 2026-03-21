/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as clinicalHistory from "../clinicalHistory.js";
import type * as consultations from "../consultations.js";
import type * as foods from "../foods.js";
import type * as meals from "../meals.js";
import type * as measurements from "../measurements.js";
import type * as nutritionists from "../nutritionists.js";
import type * as patientPathologies from "../patientPathologies.js";
import type * as patients from "../patients.js";
import type * as planVersions from "../planVersions.js";
import type * as plans from "../plans.js";
import type * as recipes from "../recipes.js";
import type * as screenings from "../screenings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  clinicalHistory: typeof clinicalHistory;
  consultations: typeof consultations;
  foods: typeof foods;
  meals: typeof meals;
  measurements: typeof measurements;
  nutritionists: typeof nutritionists;
  patientPathologies: typeof patientPathologies;
  patients: typeof patients;
  planVersions: typeof planVersions;
  plans: typeof plans;
  recipes: typeof recipes;
  screenings: typeof screenings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
