// src/services/mealPlanGenerator/index.ts
import { HybridMealPlanGenerator, GenerationOptions, GenerationResult, QualityMetrics } from './HybridMealPlanGenerator';
import { useRecipeStore } from '../../stores/recipeStore';

/**
 * Main API for meal plan generation
 * This is the primary interface used by React components
 */

// Re-export types for easy importing
export type { GenerationOptions, GenerationResult, QualityMetrics };

/**
 * Generate a meal plan using the hybrid algorithm
 */
export const generateMealPlan = async (options: GenerationOptions): Promise<GenerationResult> => {
  console.log('🍽️ Starting meal plan generation via main API');
  
  // Get recipes and foods from store
  const recipeStore = useRecipeStore.getState();
  const recipes = recipeStore.recipes;
  const foods = recipeStore.foods;
  
  if (recipes.length === 0 && foods.length === 0) {
    return {
      success: false,
      error: 'No recipes or foods available for meal planning',
      quality: {
        overall: 0,
        nutritionalAccuracy: 0,
        varietyScore: 0,
        constraintCompliance: 0,
        userPreferenceAlignment: 0,
        breakdown: {
          macroAccuracy: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          constraints: { satisfied: 0, total: 0, critical: 0 },
          variety: { ingredientDiversity: 0, recipeRepetition: 0, categoryBalance: 0 }
        }
      },
      generationTime: 0,
      metadata: {
        algorithmsUsed: [],
        iterationsCompleted: 0,
        recipesConsidered: 0,
        finalOptimality: 0
      }
    };
  }
  
  // Generate meal plan using hybrid algorithm
  return HybridMealPlanGenerator.generate(recipes, foods, options);
};

/**
 * Validate generation options
 */
export const validateGenerationOptions = (options: GenerationOptions): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!options.user) {
    errors.push('User is required');
  } else {
    if (!options.user.id) errors.push('User ID is required');
    if (!options.user.tdci?.adjustedTDCI) errors.push('User TDCI must be calculated');
    if (!options.user.mealPreferences) errors.push('User meal preferences must be set');
    
    // Warnings for missing optional data
    if (!options.user.avoidMeals || options.user.avoidMeals.length === 0) {
      warnings.push('No avoid meals specified - all recipes will be considered');
    }
    if (!options.user.workoutDays || options.user.workoutDays.length === 0) {
      warnings.push('No workout days specified - general nutrition targets will be used');
    }
  }
  
  if (!options.date) {
    errors.push('Date is required');
  } else {
    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(options.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }
  }
  
  if (!['speed', 'balanced', 'quality'].includes(options.mode)) {
    errors.push('Mode must be one of: speed, balanced, quality');
  }
  
  // Validate preferences if provided
  if (options.preferences) {
    if (options.preferences.maxPrepTime && options.preferences.maxPrepTime < 5) {
      warnings.push('Very low max prep time may severely limit recipe options');
    }
    if (options.preferences.varietyLevel && !['low', 'medium', 'high'].includes(options.preferences.varietyLevel)) {
      errors.push('Variety level must be one of: low, medium, high');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get recommended generation mode based on user preferences and context
 */
export const getRecommendedMode = (options: Partial<GenerationOptions>): 'speed' | 'balanced' | 'quality' => {
  // If user has complex preferences, recommend quality mode
  if (options.user?.avoidMeals && options.user.avoidMeals.length > 5) {
    return 'quality';
  }
  
  // If generating for multiple days, recommend balanced
  if (options.weekPlan) {
    return 'balanced';
  }
  
  // Default to balanced for most cases
  return 'balanced';
};

/**
 * Estimate generation time based on options
 */
export const estimateGenerationTime = (options: GenerationOptions): {
  estimatedSeconds: number;
  factors: string[];
} => {
  let baseTime = 2; // Base 2 seconds
  const factors: string[] = [];
  
  // Mode factor
  switch (options.mode) {
    case 'speed':
      baseTime *= 0.5;
      factors.push('Speed mode: faster generation');
      break;
    case 'quality':
      baseTime *= 2;
      factors.push('Quality mode: thorough optimization');
      break;
    case 'balanced':
    default:
      factors.push('Balanced mode: moderate optimization');
      break;
  }
  
  // Week plan factor
  if (options.weekPlan) {
    baseTime *= 5;
    factors.push('Week plan: multiple days');
  }
  
  // User complexity factor
  const avoidCount = options.user.avoidMeals?.length || 0;
  if (avoidCount > 3) {
    baseTime *= 1.2;
    factors.push(`Many avoided items: ${avoidCount} restrictions`);
  }
  
  // Preference complexity
  if (options.preferences?.maxPrepTime && options.preferences.maxPrepTime < 20) {
    baseTime *= 1.3;
    factors.push('Strict time constraints');
  }
  
  return {
    estimatedSeconds: Math.round(baseTime),
    factors
  };
};

/**
 * Quick generation preset for common use cases
 */
export const quickPresets = {
  /**
   * Fast generation for busy days
   */
  quickAndEasy: (user: any, date: string): GenerationOptions => ({
    user,
    date,
    mode: 'speed',
    preferences: {
      maxPrepTime: 20,
      varietyLevel: 'low'
    }
  }),
  
  /**
   * High-quality generation for special occasions
   */
  gourmet: (user: any, date: string): GenerationOptions => ({
    user,
    date,
    mode: 'quality',
    preferences: {
      maxPrepTime: 90,
      varietyLevel: 'high'
    }
  }),
  
  /**
   * Week meal prep
   */
  mealPrep: (user: any, startDate: string): GenerationOptions => ({
    user,
    date: startDate,
    mode: 'balanced',
    weekPlan: true,
    preferences: {
      maxPrepTime: 60,
      varietyLevel: 'medium'
    }
  }),
  
  /**
   * High-protein for workout days
   */
  highProtein: (user: any, date: string): GenerationOptions => ({
    user,
    date,
    mode: 'balanced',
    preferences: {
      minProtein: (user.tdci?.adjustedTDCI || 2000) * 0.25 / 4, // 25% of calories from protein
      maxPrepTime: 45,
      varietyLevel: 'medium'
    }
  })
};

// Export main class for advanced usage
export { HybridMealPlanGenerator };

// Export utility classes
export { NutritionCalculator } from './preparation/NutritionCalculator';
export { RecipeFilteringEngine } from './preparation/RecipeFiltering';
export { MultiDimensionalKnapsack } from './optimization/MultiDimensionalKnapsack';

export default {
  generateMealPlan,
  validateGenerationOptions,
  getRecommendedMode,
  estimateGenerationTime,
  quickPresets
};