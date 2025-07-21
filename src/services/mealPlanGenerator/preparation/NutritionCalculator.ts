// src/services/mealPlanGenerator/preparation/NutritionCalculator.ts
// 🔧 PHASE 1.1: ENHANCED with Portion Sizes Integration & Tolerance Checking

import { User } from '../../../stores/userStore';
import { Recipe, Food } from '../../../stores/recipeStore';
import { Meal } from '../../../types/meal';

export interface NutritionalTargets {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  // Percentage targets
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
}

export interface MealNutritionalTargets {
  mealType: string;
  position?: string;
  targets: NutritionalTargets;
  portionMultiplier: number; // From user's portion sizes
  priority: 'high' | 'medium' | 'low'; // For constraint satisfaction
  tolerances: {
    protein: number; // ±10% (highest priority)
    fat: number; // ±20% (medium priority)
    carbs: number; // ±25% (lowest priority)
    caloriesMeal: number; // ±3% for individual meals (rounding tolerance)
  };
}

export interface NutritionalAnalysis {
  current: NutritionalTargets;
  target: NutritionalTargets;
  deviation: {
    calories: number; // % deviation
    protein: number;
    carbs: number;
    fat: number;
    overall: number; // Combined score
  };
  compliance: 'excellent' | 'good' | 'acceptable' | 'poor';
  withinTolerance: {
    protein: boolean;
    fat: boolean;
    carbs: boolean;
    calories: boolean; // Based on ±3% for individual meals (rounding tolerance)
    overall: boolean;
  };
}

export interface RecipeScalingResult {
  originalRecipe: Recipe | any;
  scalingFactor: number;
  scaledNutrition: NutritionalTargets;
  displayPortion: string; // e.g., "1.5x portion"
  withinTolerance: boolean;
  priorityScore: number; // Higher is better for constraint satisfaction
}

/**
 * Enhanced nutrition calculator with portion sizes integration and tolerance checking
 * Implements requirements from PHASE 1: tolerance checking, priority system, recipe scaling
 */
export class NutritionCalculator {
  
  // ✅ TOLERANCE CONSTANTS (Phase 1 Requirements)
  static readonly TOLERANCES = {
    PROTEIN: 0.10,                    // ±10% (Priority #1)
    FAT: 0.20,                        // ±20% (Priority #2) 
    CARBS: 0.25,                      // ±25% (Priority #3)
    CALORIES_DAILY_ABSOLUTE: 100,     // ±100 calories for TOTAL DAILY calories (HARD LIMIT)
    CALORIES_MEAL_PERCENTAGE: 0.03    // ±3% for individual meals (for rounding/technical precision)
  };

  /**
   * Calculate daily nutritional targets for user
   * ✅ ENHANCED: Uses existing TDCI and macro calculation logic from PortionSizesModal
   */
  static calculateDailyTargets(user: User): NutritionalTargets {
    // Use existing TDCI calculation
    const adjustedTDCI = user.tdci?.adjustedTDCI || this.calculateTDCI(user);
    
    // Use existing macro calculation from PortionSizesModal logic
    const macros = this.calculateDailyMacros(user, adjustedTDCI);
    
    return {
      calories: adjustedTDCI,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      proteinPercentage: macros.proteinPercentage,
      carbsPercentage: macros.carbsPercentage,
      fatPercentage: macros.fatPercentage
    };
  }

  /**
   * ✅ NEW: Calculate meal-specific targets based on user's portion sizes and meal preferences
   * Leverages existing portion size logic from PortionSizesModal
   */
  static calculateMealTargets(user: User, dailyTargets: NutritionalTargets): MealNutritionalTargets[] {
    const mealTargets: MealNutritionalTargets[] = [];
    
    // Get meal structure from user preferences
    const mealPreferences = user.mealPreferences;
    if (!mealPreferences) {
      throw new Error('User meal preferences not set');
    }

    // ✅ PORTION SIZES INTEGRATION: Use user.portionSizes instead of hardcoded values
    const portionSizes = user.portionSizes || this.calculateDefaultPortionSizes(mealPreferences);
    
    console.log('🎯 Using portion sizes for meal targets:', portionSizes);

    // Base meals with portion sizes
    const baseMeals = ['Breakfast', 'Lunch', 'Dinner'];
    baseMeals.forEach(mealType => {
      const portionKey = mealType.toLowerCase();
      const portionMultiplier = portionSizes[portionKey] || portionSizes[mealType] || (1/3); // Fallback
      
      const mealTarget: MealNutritionalTargets = {
        mealType,
        targets: this.scaleTargets(dailyTargets, portionMultiplier),
        portionMultiplier,
        priority: 'high', // Main meals are high priority
        tolerances: {
          protein: this.TOLERANCES.PROTEIN,
          fat: this.TOLERANCES.FAT,
          carbs: this.TOLERANCES.CARBS,
          caloriesMeal: this.TOLERANCES.CALORIES_MEAL_PERCENTAGE
        }
      };
      
      mealTargets.push(mealTarget);
    });

    // ✅ SNACK HANDLING: Add snacks based on snackPositions with individual portion sizes
    if (mealPreferences.snackPositions) {
      mealPreferences.snackPositions.forEach((position: string) => {
        // Try to get specific snack portion size, fallback to general snack size
        const snackPortionMultiplier = portionSizes[position] || portionSizes.snack || 0.1;
        
        const snackTarget: MealNutritionalTargets = {
          mealType: 'Snack',
          position,
          targets: this.scaleTargets(dailyTargets, snackPortionMultiplier),
          portionMultiplier: snackPortionMultiplier,
          priority: 'medium', // Snacks are medium priority
          tolerances: {
            protein: this.TOLERANCES.PROTEIN,
            fat: this.TOLERANCES.FAT,
            carbs: this.TOLERANCES.CARBS,
            caloriesMeal: this.TOLERANCES.CALORIES_MEAL_PERCENTAGE
          }
        };
        
        mealTargets.push(snackTarget);
      });
    }

    return mealTargets;
  }

  /**
   * ✅ NEW: Recipe scaling system with tolerance checking (Phase 1 requirement)
   * Implements mathematical scaling: scaleFactor = targetCalories / recipeCalories
   */
  static scaleRecipeToTarget(
    recipe: Recipe | any, 
    targetNutrition: NutritionalTargets,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): RecipeScalingResult {
    console.log('🔧 Scaling recipe to target:', {
      recipe: recipe.name,
      recipeCalories: recipe.calories,
      targetCalories: targetNutrition.calories
    });

    // ✅ CORE SCALING: Pure mathematical scaling
    const scalingFactor = targetNutrition.calories / recipe.calories;
    
    // Scale all macros by same factor
    const scaledNutrition: NutritionalTargets = {
      calories: Math.round(recipe.calories * scalingFactor),
      protein: Math.round(recipe.protein * scalingFactor),
      carbs: Math.round(recipe.carbs * scalingFactor),
      fat: Math.round(recipe.fat * scalingFactor),
      // Percentages stay the same
      proteinPercentage: (recipe.protein * 4) / recipe.calories * 100,
      carbsPercentage: (recipe.carbs * 4) / recipe.calories * 100,
      fatPercentage: (recipe.fat * 9) / recipe.calories * 100
    };

    // ✅ TOLERANCE CHECKING with priority system
    const toleranceCheck = this.checkTolerances(scaledNutrition, targetNutrition, priority);
    
    // ✅ DISPLAY FORMATTING: Round to 1 decimal place
    const displayPortion = `${scalingFactor.toFixed(1)}x portion`;
    
    // ✅ PRIORITY SCORING: Higher score = better for constraint satisfaction
    const priorityScore = this.calculatePriorityScore(scaledNutrition, targetNutrition, priority);

    console.log('🎯 Scaling result:', {
      scalingFactor: scalingFactor.toFixed(2),
      displayPortion,
      withinTolerance: toleranceCheck.overall,
      priorityScore: priorityScore.toFixed(2)
    });

    return {
      originalRecipe: recipe,
      scalingFactor,
      scaledNutrition,
      displayPortion,
      withinTolerance: toleranceCheck.overall,
      priorityScore
    };
  }

  /**
   * ✅ FINAL: Tolerance checking with precise calorie control
   * Priority: Protein ±10% > Fat ±20% > Carbs ±25%
   * Calories: ±3% for individual meals (rounding/technical tolerance only)
   * Daily Total: ±100 calories absolute (HARD LIMIT)
   */
  static checkTolerances(
    current: NutritionalTargets, 
    target: NutritionalTargets,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): NutritionalAnalysis['withinTolerance'] & { overall: boolean } {
    
    const proteinWithinTolerance = this.isWithinTolerance(current.protein, target.protein, this.TOLERANCES.PROTEIN);
    const fatWithinTolerance = this.isWithinTolerance(current.fat, target.fat, this.TOLERANCES.FAT);
    const carbsWithinTolerance = this.isWithinTolerance(current.carbs, target.carbs, this.TOLERANCES.CARBS);
    
    // ✅ PRECISE: Use 3% tolerance for individual meal calories (technical rounding only)
    const caloriesWithinTolerance = this.isWithinTolerance(
      current.calories, 
      target.calories, 
      this.TOLERANCES.CALORIES_MEAL_PERCENTAGE
    );

    console.log('🎯 Tolerance check results (individual meal):', {
      protein: `${proteinWithinTolerance} (${current.protein}g vs ${target.protein}g ±10%)`,
      fat: `${fatWithinTolerance} (${current.fat}g vs ${target.fat}g ±20%)`,
      carbs: `${carbsWithinTolerance} (${current.carbs}g vs ${target.carbs}g ±25%)`,
      calories: `${caloriesWithinTolerance} (${current.calories} vs ${target.calories} ±3% rounding)`
    });

    // ✅ PRIORITY LOGIC: Protein must be within tolerance for high priority meals
    let overall = false;
    if (priority === 'high') {
      overall = proteinWithinTolerance && caloriesWithinTolerance; // Protein + calories critical
    } else if (priority === 'medium') {
      overall = proteinWithinTolerance && (fatWithinTolerance || caloriesWithinTolerance);
    } else {
      overall = caloriesWithinTolerance; // Low priority just needs calories close
    }

    return {
      protein: proteinWithinTolerance,
      fat: fatWithinTolerance,
      carbs: carbsWithinTolerance,
      calories: caloriesWithinTolerance,
      overall
    };
  }

  /**
   * ✅ NEW: Check daily calorie tolerance (±100 calories absolute - HARD LIMIT)
   * This is for validating TOTAL daily calories, not individual meals
   * This is the PRIMARY constraint that must always be met
   */
  static checkDailyCaloriesTolerance(totalDailyCalories: number, targetDailyCalories: number): {
    withinTolerance: boolean;
    deviation: number;
    deviationAbsolute: number;
    isHardLimit: boolean; // Always true - this is the critical constraint
  } {
    const absoluteDeviation = Math.abs(totalDailyCalories - targetDailyCalories);
    const withinTolerance = absoluteDeviation <= this.TOLERANCES.CALORIES_DAILY_ABSOLUTE;
    const percentageDeviation = targetDailyCalories > 0 ? absoluteDeviation / targetDailyCalories : 0;

    console.log('🎯 Daily calorie tolerance check (HARD LIMIT):', {
      total: totalDailyCalories,
      target: targetDailyCalories,
      deviation: `±${absoluteDeviation.toFixed(0)} calories`,
      withinTolerance: `${withinTolerance} (±100 cal HARD LIMIT)`,
      percentage: `${(percentageDeviation * 100).toFixed(1)}%`,
      status: withinTolerance ? '✅ PASS' : '❌ FAIL'
    });

    return {
      withinTolerance,
      deviation: percentageDeviation,
      deviationAbsolute: absoluteDeviation,
      isHardLimit: true
    };
  }

  /**
   * ✅ NEW: Priority scoring for recipe selection
   * Higher score = better fit for constraint satisfaction
   */
  private static calculatePriorityScore(
    current: NutritionalTargets,
    target: NutritionalTargets,
    priority: 'high' | 'medium' | 'low'
  ): number {
    // Calculate deviations (lower is better)
    const proteinDev = this.calculateDeviation(current.protein, target.protein);
    const fatDev = this.calculateDeviation(current.fat, target.fat);
    const carbsDev = this.calculateDeviation(current.carbs, target.carbs);
    const caloriesDev = this.calculateDeviation(current.calories, target.calories);

    // ✅ WEIGHTED SCORING based on priority
    let score = 0;
    
    if (priority === 'high') {
      // Protein gets 50% weight, calories 30%, fat 20%
      score = (1 - proteinDev) * 0.5 + (1 - caloriesDev) * 0.3 + (1 - fatDev) * 0.2;
    } else if (priority === 'medium') {
      // More balanced weighting
      score = (1 - proteinDev) * 0.3 + (1 - caloriesDev) * 0.3 + (1 - fatDev) * 0.2 + (1 - carbsDev) * 0.2;
    } else {
      // Low priority: calories matter most
      score = (1 - caloriesDev) * 0.6 + (1 - proteinDev) * 0.4;
    }

    return Math.max(0, Math.min(1, score)) * 100; // 0-100 scale
  }

  /**
   * ✅ ENHANCED: Nutritional analysis with tolerance checking
   */
  static analyzeNutrition(current: NutritionalTargets, target: NutritionalTargets): NutritionalAnalysis {
    const deviation = {
      calories: this.calculateDeviation(current.calories, target.calories),
      protein: this.calculateDeviation(current.protein, target.protein),
      carbs: this.calculateDeviation(current.carbs, target.carbs),
      fat: this.calculateDeviation(current.fat, target.fat),
      overall: 0
    };

    // Overall deviation is weighted average (protein most important)
    deviation.overall = (deviation.protein * 0.4 + deviation.calories * 0.3 + 
                       deviation.fat * 0.2 + deviation.carbs * 0.1);

    // Tolerance checking
    const withinTolerance = this.checkTolerances(current, target, 'medium');

    // Compliance rating
    let compliance: 'excellent' | 'good' | 'acceptable' | 'poor';
    if (deviation.overall < 0.05) compliance = 'excellent';
    else if (deviation.overall < 0.15) compliance = 'good';
    else if (deviation.overall < 0.25) compliance = 'acceptable';
    else compliance = 'poor';

    return {
      current,
      target,
      deviation,
      compliance,
      withinTolerance
    };
  }

  /**
   * Helper: Check if value is within tolerance
   */
  private static isWithinTolerance(current: number, target: number, tolerance: number): boolean {
    if (target === 0) return current === 0;
    const deviation = Math.abs(current - target) / target;
    return deviation <= tolerance;
  }

  /**
   * ✅ NEW: Helper: Check if value is within absolute tolerance (for calories)
   */
  private static isWithinAbsoluteTolerance(current: number, target: number, absoluteTolerance: number): boolean {
    const absoluteDeviation = Math.abs(current - target);
    return absoluteDeviation <= absoluteTolerance;
  }

  /**
   * Calculate percentage deviation between current and target values
   */
  private static calculateDeviation(current: number, target: number): number {
    if (target === 0) return current === 0 ? 0 : 1;
    return Math.abs(current - target) / target;
  }

  /**
   * ✅ ENHANCED: Calculate default portion sizes based on meal preferences
   * Uses existing logic from PortionSizesModal but with better snack distribution
   */
  private static calculateDefaultPortionSizes(mealPreferences: any): { [key: string]: number } {
    const snackCount = mealPreferences.snackPositions?.length || 0;
    const totalSnackPercentage = snackCount * 0.1; // Each snack gets 10%
    const remainingPercentage = 1 - totalSnackPercentage;
    const mainMealPercentage = remainingPercentage / 3; // Split among 3 main meals

    const portionSizes: { [key: string]: number } = {
      'Breakfast': mainMealPercentage,
      'breakfast': mainMealPercentage,
      'Lunch': mainMealPercentage,
      'lunch': mainMealPercentage,
      'Dinner': mainMealPercentage,
      'dinner': mainMealPercentage,
      'snack': 0.1
    };

    // Add snack portions
    if (mealPreferences.snackPositions) {
      mealPreferences.snackPositions.forEach((position: string) => {
        portionSizes[position] = 0.1;
      });
    }

    return portionSizes;
  }

  /**
   * Scale nutritional targets by portion multiplier
   */
  private static scaleTargets(targets: NutritionalTargets, multiplier: number): NutritionalTargets {
    return {
      calories: Math.round(targets.calories * multiplier),
      protein: Math.round(targets.protein * multiplier),
      carbs: Math.round(targets.carbs * multiplier),
      fat: Math.round(targets.fat * multiplier),
      proteinPercentage: targets.proteinPercentage, // Percentages stay the same
      carbsPercentage: targets.carbsPercentage,
      fatPercentage: targets.fatPercentage
    };
  }

  /**
   * ✅ COMPATIBILITY: Existing TDCI calculation for backward compatibility
   */
  private static calculateTDCI(user: User): number {
    // This would use existing TDCI calculation logic from userStore
    // For now, return adjustedTDCI or reasonable default
    return user.tdci?.adjustedTDCI || 2000;
  }

  /**
   * ✅ COMPATIBILITY: Daily macro calculation using existing PortionSizesModal logic
   */
  private static calculateDailyMacros(user: User, adjustedTDCI: number): {
    protein: number;
    fat: number;
    carbs: number;
    proteinPercentage: number;
    fatPercentage: number;
    carbsPercentage: number;
  } {
    // ✅ FIXED: Safe parsing with fallbacks for string | undefined types
    const bodyFat = parseFloat(user?.bodyFat || '15');
    const gender = user?.gender || 'Male';
    const weight = parseFloat(user?.weight || '70');

    // Validate parsed values
    const safeBodyFat = isNaN(bodyFat) ? 15 : bodyFat;
    const safeWeight = isNaN(weight) ? 70 : weight;

    console.log('🧮 Daily macro calculation inputs:', {
      bodyFat: safeBodyFat,
      gender,
      weight: safeWeight,
      adjustedTDCI
    });

    // LBM calculation
    const lbm = safeWeight * (1 - safeBodyFat / 100);
    
    // Protein calculation (existing logic)
    const proteinMultiplier = this.calculateProteinMultiplier(safeBodyFat, gender);
    const protein = Math.round(lbm * proteinMultiplier);
    
    // Fat percentage calculation (existing logic)
    const fatPercentage = Math.round(this.calculateFatPercentage(safeBodyFat, gender));
    const fat = Math.round((adjustedTDCI * fatPercentage / 100) / 9);
    
    // Carbs from remaining calories
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const carbsCalories = adjustedTDCI - proteinCalories - fatCalories;
    const carbs = Math.round(carbsCalories / 4);

    const proteinPercentage = Math.round((proteinCalories / adjustedTDCI) * 100);
    const carbsPercentage = 100 - proteinPercentage - fatPercentage;

    console.log('🧮 Daily macro calculation results:', {
      protein: `${protein}g (${proteinPercentage}%)`,
      fat: `${fat}g (${fatPercentage}%)`,
      carbs: `${carbs}g (${carbsPercentage}%)`,
      totalCalories: proteinCalories + fatCalories + (carbs * 4)
    });

    return {
      protein,
      fat,
      carbs,
      proteinPercentage,
      fatPercentage,
      carbsPercentage
    };
  }

  /**
   * Helper: Calculate protein multiplier (from PortionSizesModal)
   */
  private static calculateProteinMultiplier(bodyFat: number, gender: string): number {
    const thresholds = gender === 'Male' 
      ? [8, 12, 15, 20, 25, 30, 35]
      : [15, 20, 25, 30, 35, 40, 45];
    const multipliers = [3.55, 3.40, 3.25, 3.1, 2.95, 2.8, 2.65];
    
    for (let i = 0; i < thresholds.length; i++) {
      if (bodyFat <= thresholds[i]) {
        return multipliers[i];
      }
    }
    return multipliers[multipliers.length - 1];
  }

  /**
   * Helper: Calculate fat percentage (from PortionSizesModal)
   */
  private static calculateFatPercentage(bodyFat: number, gender: string): number {
    const maxBodyFat = gender === 'Male' ? 35 : 45;
    const minBodyFat = gender === 'Male' ? 8 : 15;
    const fatRange = maxBodyFat - minBodyFat;
    const userRange = bodyFat - minBodyFat;
    const fatPercentage = 20 + (userRange / fatRange) * 15;
    return Math.min(35, Math.max(20, fatPercentage));
  }

  /**
   * ✅ NEW: Select best recipe from candidates using scaling and tolerance checking
   */
  static selectBestRecipe(
    candidates: (Recipe | any)[],
    target: NutritionalTargets,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): RecipeScalingResult | null {
    if (candidates.length === 0) return null;

    const scaledCandidates = candidates.map(recipe => 
      this.scaleRecipeToTarget(recipe, target, priority)
    );

    // Sort by priority score (highest first), then by tolerance compliance
    scaledCandidates.sort((a, b) => {
      if (a.withinTolerance && !b.withinTolerance) return -1;
      if (!a.withinTolerance && b.withinTolerance) return 1;
      return b.priorityScore - a.priorityScore;
    });

    return scaledCandidates[0];
  }

  /**
   * ✅ NEW: Validate portion sizes configuration
   */
  static validatePortionSizes(portionSizes: { [key: string]: number }): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for required main meals
    const requiredMeals = ['Breakfast', 'Lunch', 'Dinner'];
    requiredMeals.forEach(meal => {
      const key = meal.toLowerCase();
      if (!portionSizes[meal] && !portionSizes[key]) {
        warnings.push(`Missing portion size for ${meal}`);
      }
    });

    // Check for reasonable portion sizes
    Object.entries(portionSizes).forEach(([meal, portion]) => {
      if (portion < 0.05) {
        warnings.push(`Very small portion size for ${meal}: ${portion}`);
      }
      if (portion > 2.0) {
        warnings.push(`Very large portion size for ${meal}: ${portion}`);
      }
      if (portion <= 0) {
        errors.push(`Invalid portion size for ${meal}: ${portion}`);
      }
    });

    // Check total doesn't exceed reasonable limits
    const total = Object.values(portionSizes).reduce((sum, p) => sum + p, 0);
    if (total > 2.0) {
      warnings.push(`Total portion sizes seem high: ${total.toFixed(2)}`);
    }
    if (total < 0.5) {
      warnings.push(`Total portion sizes seem low: ${total.toFixed(2)}`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}