// src/services/mealPlanGenerator/index.ts
// 🎯 MAIN API EXPORT - Complete Hybrid Meal Plan Generator

import { HybridMealPlanGenerator, GenerationOptions, GenerationResult, QualityMetrics } from './HybridMealPlanGenerator';
import { NutritionCalculator, NutritionalTargets, MealNutritionalTargets } from './preparation/NutritionCalculator';
import { RecipeFilteringEngine, FilterCriteria, FilterResults } from './preparation/RecipeFiltering';
import { MultiDimensionalKnapsack, KnapsackItem, KnapsackConstraints, KnapsackSolution } from './optimization/MultiDimensionalKnapsack'; // ✅ OPRAVA: KnapsackSolution místo OptimizationResult

// ===== MAIN API FUNCTIONS =====

/**
 * Generate optimized meal plan using hybrid algorithm
 * This is the main entry point for meal plan generation
 */
export async function generateMealPlan(options: GenerationOptions): Promise<GenerationResult> {
  console.log('🎯 Starting hybrid meal plan generation with options:', options);
  
  try {
    // Validate options
    validateGenerationOptions(options);
    
    // ✅ OPRAVA: Použít static metodu místo instance
    const result = await HybridMealPlanGenerator.generate([], [], options); // Empty arrays - will be populated from stores
    
    console.log('✅ Generation completed successfully:', {
      success: result.success,
      quality: result.quality.overall,
      time: result.generationTime
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
    
    return {
      success: false,
      quality: createEmptyQualityMetrics(),
      generationTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      // ✅ OPRAVA: Přidat povinné metadata property
      metadata: {
        algorithmsUsed: [],
        iterationsCompleted: 0,
        recipesConsidered: 0,
        finalOptimality: 0
      }
    };
  }
}

/**
 * Quick presets for common generation scenarios
 */
export const quickPresets = {
  /**
   * Fast generation for immediate use
   */
  quick: (user: any, date: string): GenerationOptions => ({
    user,
    date,
    mode: 'speed',
    preferences: {
      varietyLevel: 'medium',
      maxPrepTime: 30
    }
  }),
  
  /**
   * Balanced generation for daily use
   */
  balanced: (user: any, date: string): GenerationOptions => ({
    user,
    date,
    mode: 'balanced',
    preferences: {
      varietyLevel: 'medium',
      maxPrepTime: 45
    }
  }),
  
  /**
   * High-quality generation for special occasions
   */
  premium: (user: any, date: string): GenerationOptions => ({
    user,
    date,
    mode: 'quality',
    preferences: {
      varietyLevel: 'high',
      maxPrepTime: 60
    }
  }),
  
  /**
   * Week-long meal planning
   */
  weekPlan: (user: any, startDate: string): GenerationOptions => ({
    user,
    date: startDate,
    mode: 'quality',
    weekPlan: true,
    preferences: {
      varietyLevel: 'high',
      maxPrepTime: 45
    }
  }),
  
  /**
   * Workout-optimized meal plan
   */
  workout: (user: any, date: string): GenerationOptions => ({
    user,
    date,
    mode: 'balanced',
    preferences: {
      varietyLevel: 'medium',
      minProtein: user.tdci?.adjustedTDCI ? user.tdci.adjustedTDCI * 0.3 / 4 : 150, // 30% protein
      maxPrepTime: 30
    }
  })
};

/**
 * Estimate generation time based on options
 */
export function estimateGenerationTime(options: GenerationOptions): number {
  const baseTime = 2000; // 2 seconds base
  
  let multiplier = 1;
  
  // Mode multiplier
  switch (options.mode) {
    case 'speed': multiplier *= 0.5; break;
    case 'balanced': multiplier *= 1; break;
    case 'quality': multiplier *= 2; break;
  }
  
  // Week plan multiplier
  if (options.weekPlan) {
    multiplier *= 7;
  }
  
  // Variety level multiplier
  switch (options.preferences?.varietyLevel) {
    case 'low': multiplier *= 0.8; break;
    case 'medium': multiplier *= 1; break;
    case 'high': multiplier *= 1.5; break;
  }
  
  return Math.round(baseTime * multiplier);
}

/**
 * Validate generation options
 */
function validateGenerationOptions(options: GenerationOptions): void {
  if (!options.user) {
    throw new Error('User is required for meal plan generation');
  }
  
  if (!options.user.tdci?.adjustedTDCI) {
    throw new Error('User must have completed TDCI calculation');
  }
  
  if (!options.user.mealPreferences) {
    throw new Error('User must have set meal preferences');
  }
  
  if (!options.date) {
    throw new Error('Date is required for meal plan generation');
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(options.date)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }
}

/**
 * Create empty quality metrics for error cases
 */
function createEmptyQualityMetrics(): QualityMetrics {
  return {
    overall: 0,
    nutritionalAccuracy: 0,
    varietyScore: 0,
    constraintCompliance: 0,
    userPreferenceAlignment: 0,
    breakdown: {
      macroAccuracy: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      constraints: {
        satisfied: 0,
        total: 0,
        critical: 0
      },
      variety: {
        ingredientDiversity: 0,
        recipeRepetition: 0,
        categoryBalance: 0
      }
    }
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Calculate nutritional targets for user
 */
export function calculateNutritionalTargets(user: any): NutritionalTargets {
  return NutritionCalculator.calculateDailyTargets(user);
}

/**
 * Calculate meal-specific targets
 */
export function calculateMealTargets(user: any, dailyTargets: NutritionalTargets): MealNutritionalTargets[] {
  return NutritionCalculator.calculateMealTargets(user, dailyTargets);
}

/**
 * Filter recipes for specific meal
 */
export function filterRecipesForMeal(
  recipes: any[],
  foods: any[],
  criteria: FilterCriteria
): FilterResults {
  return RecipeFilteringEngine.filterForMeal(recipes, foods, criteria);
}

/**
 * Optimize meal selection using knapsack algorithm
 */
export function optimizeMealSelection(
  items: KnapsackItem[],
  constraints: KnapsackConstraints,
  mode: 'speed' | 'balanced' | 'quality' = 'balanced'
): KnapsackSolution { // ✅ OPRAVA: KnapsackSolution místo OptimizationResult
  return MultiDimensionalKnapsack.solve(items, constraints, { // ✅ OPRAVA: solve místo optimize
    algorithm: mode === 'speed' ? 'greedy' : mode === 'balanced' ? 'hybrid' : 'dynamic',
    timeLimit: mode === 'speed' ? 2000 : mode === 'balanced' ? 5000 : 10000
  });
}

// ===== TYPE EXPORTS =====
export type {
  GenerationOptions,
  GenerationResult,
  QualityMetrics,
  NutritionalTargets,
  MealNutritionalTargets,
  FilterCriteria,
  FilterResults,
  KnapsackItem,
  KnapsackConstraints,
  KnapsackSolution // ✅ OPRAVA: KnapsackSolution místo OptimizationResult
};

// ===== CLASS EXPORTS =====
export {
  HybridMealPlanGenerator,
  NutritionCalculator,
  RecipeFilteringEngine,
  MultiDimensionalKnapsack
};