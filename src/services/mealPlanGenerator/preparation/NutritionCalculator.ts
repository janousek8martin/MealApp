// src/services/mealPlanGenerator/preparation/NutritionCalculator.ts
// 🔧 PHASE 1.2: ENHANCED with Recipe Scaling Implementation
// ✅ Fixed TypeScript errors with User interface and parsing

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

// ✅ NEW: Safe parsing helpers for User properties
interface SafeUserData {
  weight: number;
  height: number;
  age: number;
  bodyFat: number;
  gender: 'Male' | 'Female';
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active';
  adjustedTDCI: number;
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
   * ✅ FIXED: Safe user data extraction with proper type handling
   */
  private static extractSafeUserData(user: any): SafeUserData {
    return {
      weight: this.safeParseFloat(user.weight, 70),
      height: this.safeParseFloat(user.height, 175),
      age: this.safeParseFloat(user.age, 30),
      bodyFat: this.safeParseFloat(user.bodyFat, 15),
      gender: (user.gender === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
      activityLevel: this.safeActivityLevel(user.activityLevel),
      adjustedTDCI: user.tdci?.adjustedTDCI || 0
    };
  }

  /**
   * ✅ FIXED: Safe float parsing helper
   */
  private static safeParseFloat(value: any, fallback: number): number {
    if (typeof value === 'number') return isNaN(value) ? fallback : value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  }

  /**
   * ✅ FIXED: Safe activity level validation
   */
  private static safeActivityLevel(value: any): 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active' {
    const validLevels = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];
    return validLevels.includes(value) ? value : 'Moderate';
  }

  /**
   * Calculate daily nutritional targets for user
   * ✅ ENHANCED: Uses existing TDCI and macro calculation logic from PortionSizesModal
   */
  static calculateDailyTargets(user: any): NutritionalTargets {
    const safeUser = this.extractSafeUserData(user);
    
    // Use existing TDCI calculation
    const adjustedTDCI = safeUser.adjustedTDCI || this.calculateTDCI(safeUser);
    
    // Use existing macro calculation from PortionSizesModal logic
    const macros = this.calculateDailyMacros(safeUser, adjustedTDCI);
    
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
  static calculateMealTargets(user: any, dailyTargets: NutritionalTargets): MealNutritionalTargets[] {
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

    // Add snack targets if configured
    if (mealPreferences.snackPositions) {
      mealPreferences.snackPositions.forEach((position: string) => {
        const snackPortionMultiplier = portionSizes[position] || portionSizes.snack || 0.1;
        
        const snackTarget: MealNutritionalTargets = {
          mealType: 'Snack',
          position,
          targets: this.scaleTargets(dailyTargets, snackPortionMultiplier),
          portionMultiplier: snackPortionMultiplier,
          priority: 'medium', // Snacks are medium priority
          tolerances: {
            protein: this.TOLERANCES.PROTEIN * 1.5, // More relaxed for snacks
            fat: this.TOLERANCES.FAT * 1.2,
            carbs: this.TOLERANCES.CARBS * 1.2,
            caloriesMeal: this.TOLERANCES.CALORIES_MEAL_PERCENTAGE * 2
          }
        };
        
        mealTargets.push(snackTarget);
      });
    }

    return mealTargets;
  }

  /**
   * ✅ NEW: Scale nutritional targets by portion multiplier
   */
  private static scaleTargets(dailyTargets: NutritionalTargets, multiplier: number): NutritionalTargets {
    return {
      calories: dailyTargets.calories * multiplier,
      protein: dailyTargets.protein * multiplier,
      carbs: dailyTargets.carbs * multiplier,
      fat: dailyTargets.fat * multiplier,
      proteinPercentage: dailyTargets.proteinPercentage, // Percentages stay the same
      carbsPercentage: dailyTargets.carbsPercentage,
      fatPercentage: dailyTargets.fatPercentage
    };
  }

  /**
   * ✅ NEW: MISSING METHOD - Scale recipe to match target nutrition values
   * This is the key method that was missing from the original implementation
   */
  static scaleRecipeToTarget(
    recipe: Recipe | any,
    target: NutritionalTargets,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): RecipeScalingResult {
    // Extract nutrition from recipe (handle both Recipe and converted formats)
    const originalNutrition = {
      calories: this.safeParseFloat(recipe.calories, 0),
      protein: this.safeParseFloat(recipe.protein, 0),
      carbs: this.safeParseFloat(recipe.carbs, 0),
      fat: this.safeParseFloat(recipe.fat, 0)
    };

    // Calculate scaling factor based on calories (primary constraint)
    const scalingFactor = originalNutrition.calories > 0 ? target.calories / originalNutrition.calories : 1;
    
    // Scale all nutrition values
    const scaledNutrition: NutritionalTargets = {
      calories: Math.round(originalNutrition.calories * scalingFactor),
      protein: Math.round(originalNutrition.protein * scalingFactor * 10) / 10, // 1 decimal place
      carbs: Math.round(originalNutrition.carbs * scalingFactor * 10) / 10,
      fat: Math.round(originalNutrition.fat * scalingFactor * 10) / 10,
      proteinPercentage: target.proteinPercentage,
      carbsPercentage: target.carbsPercentage,
      fatPercentage: target.fatPercentage
    };

    // Check tolerance compliance
    const toleranceCheck = this.checkTolerances(scaledNutrition, target, priority);
    
    // Calculate priority score
    const priorityScore = this.calculatePriorityScore(scaledNutrition, target, priority);
    
    // Format display portion
    const displayPortion = this.formatScalingFactor(scalingFactor);

    console.log('🔧 Scaling recipe to target:', {
      recipe: recipe.name,
      recipeCalories: originalNutrition.calories,
      targetCalories: target.calories
    });

    console.log('🎯 Tolerance check results (individual meal):', {
      calories: `${toleranceCheck.calories} (${scaledNutrition.calories} vs ${target.calories} ±3% rounding)`,
      carbs: `${toleranceCheck.carbs} (${scaledNutrition.carbs}g vs ${target.carbs}g ±25%)`,
      fat: `${toleranceCheck.fat} (${scaledNutrition.fat}g vs ${target.fat}g ±20%)`,
      protein: `${toleranceCheck.protein} (${scaledNutrition.protein}g vs ${target.protein}g ±10%)`
    });

    console.log('🎯 Scaling result:', {
      displayPortion,
      priorityScore: priorityScore.toFixed(2),
      scalingFactor: scalingFactor.toFixed(2),
      withinTolerance: toleranceCheck.overall
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
   * ✅ NEW: Check if scaled nutrition meets tolerance requirements
   */
  private static checkTolerances(
    current: NutritionalTargets,
    target: NutritionalTargets,
    priority: 'high' | 'medium' | 'low'
  ): { protein: boolean; fat: boolean; carbs: boolean; calories: boolean; overall: boolean } {
    const proteinWithin = this.isWithinTolerance(current.protein, target.protein, this.TOLERANCES.PROTEIN);
    const fatWithin = this.isWithinTolerance(current.fat, target.fat, this.TOLERANCES.FAT);
    const carbsWithin = this.isWithinTolerance(current.carbs, target.carbs, this.TOLERANCES.CARBS);
    const caloriesWithin = this.isWithinTolerance(current.calories, target.calories, this.TOLERANCES.CALORIES_MEAL_PERCENTAGE);

    // Overall tolerance based on priority
    let overall = false;
    if (priority === 'high') {
      // High priority: protein must be within tolerance, calories should be close
      overall = proteinWithin && caloriesWithin;
    } else if (priority === 'medium') {
      // Medium priority: protein OR (fat AND carbs) should be within tolerance
      overall = proteinWithin || (fatWithin && carbsWithin);
    } else {
      // Low priority: calories within tolerance is sufficient
      overall = caloriesWithin;
    }

    return {
      protein: proteinWithin,
      fat: fatWithin,
      carbs: carbsWithin,
      calories: caloriesWithin,
      overall
    };
  }

  /**
   * ✅ NEW: Format scaling factor for display
   */
  private static formatScalingFactor(scalingFactor: number): string {
    if (scalingFactor === 1) return "1x portion";
    return `${Math.round(scalingFactor * 10) / 10}x portion`;
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
   * Calculate percentage deviation between current and target values
   */
  private static calculateDeviation(current: number, target: number): number {
    if (target === 0) return current === 0 ? 0 : 1;
    return Math.abs(current - target) / target;
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
    const withinTolerance = {
      protein: this.isWithinTolerance(current.protein, target.protein, this.TOLERANCES.PROTEIN),
      fat: this.isWithinTolerance(current.fat, target.fat, this.TOLERANCES.FAT),
      carbs: this.isWithinTolerance(current.carbs, target.carbs, this.TOLERANCES.CARBS),
      calories: this.isWithinTolerance(current.calories, target.calories, this.TOLERANCES.CALORIES_MEAL_PERCENTAGE),
      overall: false
    };

    withinTolerance.overall = withinTolerance.protein && withinTolerance.calories;

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
   * ✅ NEW: Check daily calorie tolerance (HARD LIMIT)
   * This is the strictest tolerance check for total daily intake
   */
  static checkDailyCalorieTolerance(
    totalDailyCalories: number,
    targetDailyCalories: number
  ): {
    withinTolerance: boolean;
    deviation: number;
    deviationAbsolute: number;
    isHardLimit: boolean;
  } {
    const absoluteDeviation = Math.abs(totalDailyCalories - targetDailyCalories);
    const withinTolerance = absoluteDeviation <= this.TOLERANCES.CALORIES_DAILY_ABSOLUTE;
    const percentageDeviation = targetDailyCalories > 0 ? 
      absoluteDeviation / targetDailyCalories : 0;

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
   * ✅ LEGACY COMPATIBILITY: Calculate TDCI using existing formulas
   */
  private static calculateTDCI(safeUser: SafeUserData): number {
    // Use Mifflin-St Jeor equation for BMR
    let bmr: number;
    if (safeUser.gender === 'Male') {
      bmr = 10 * safeUser.weight + 6.25 * safeUser.height - 5 * safeUser.age + 5;
    } else {
      bmr = 10 * safeUser.weight + 6.25 * safeUser.height - 5 * safeUser.age - 161;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      'Sedentary': 1.2,
      'Light': 1.375,
      'Moderate': 1.55,
      'Active': 1.725,
      'Very Active': 1.9
    };

    const activityMultiplier = activityMultipliers[safeUser.activityLevel] || 1.55;
    const tdee = bmr * activityMultiplier;

    // Body fat adjustment (simplified)
    const bodyFatMultiplier = this.getBodyFatMultiplier(safeUser.bodyFat, safeUser.gender);
    
    return Math.round(tdee * bodyFatMultiplier);
  }

  /**
   * ✅ LEGACY COMPATIBILITY: Calculate daily macros
   */
  private static calculateDailyMacros(safeUser: SafeUserData, adjustedTDCI: number) {
    // Calculate protein target (based on lean body mass)
    const leanBodyMass = safeUser.weight * (1 - safeUser.bodyFat / 100);
    const proteinGrams = leanBodyMass * this.getProteinMultiplier(safeUser.bodyFat, safeUser.gender);
    const proteinCalories = proteinGrams * 4;
    const proteinPercentage = (proteinCalories / adjustedTDCI) * 100;

    // Calculate fat percentage (based on body fat)
    const fatPercentage = this.calculateFatPercentage(safeUser.bodyFat, safeUser.gender);
    const fatCalories = adjustedTDCI * (fatPercentage / 100);
    const fatGrams = fatCalories / 9;

    // Remaining calories go to carbs
    const carbsCalories = adjustedTDCI - proteinCalories - fatCalories;
    const carbsGrams = carbsCalories / 4;
    const carbsPercentage = (carbsCalories / adjustedTDCI) * 100;

    console.log('🧮 Daily macro calculation inputs:', {
      adjustedTDCI,
      bodyFat: safeUser.bodyFat,
      gender: safeUser.gender,
      weight: safeUser.weight
    });

    console.log('🧮 Daily macro calculation results:', {
      protein: `${Math.round(proteinGrams)}g (${Math.round(proteinPercentage)}%)`,
      carbs: `${Math.round(carbsGrams)}g (${Math.round(carbsPercentage)}%)`,
      fat: `${Math.round(fatGrams)}g (${Math.round(fatPercentage)}%)`,
      totalCalories: Math.round(proteinCalories + carbsCalories + fatCalories)
    });

    return {
      protein: Math.round(proteinGrams),
      carbs: Math.round(carbsGrams),
      fat: Math.round(fatGrams),
      proteinPercentage: Math.round(proteinPercentage),
      carbsPercentage: Math.round(carbsPercentage),
      fatPercentage: Math.round(fatPercentage)
    };
  }

  /**
   * Helper: Get protein multiplier based on body fat and gender
   */
  private static getProteinMultiplier(bodyFat: number, gender: string): number {
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
   * Helper: Get body fat multiplier
   */
  private static getBodyFatMultiplier(bodyFat: number, gender: string): number {
    if (gender === 'Male') {
      if (bodyFat <= 10) return 1.05;
      if (bodyFat <= 15) return 1.02;
      if (bodyFat <= 20) return 1.0;
      if (bodyFat <= 25) return 0.98;
      return 0.95;
    } else {
      if (bodyFat <= 16) return 1.05;
      if (bodyFat <= 20) return 1.02;
      if (bodyFat <= 25) return 1.0;
      if (bodyFat <= 30) return 0.98;
      return 0.95;
    }
  }

  /**
   * ✅ NEW: Calculate default portion sizes based on meal preferences
   */
  private static calculateDefaultPortionSizes(mealPreferences: any): any {
    const snackCount = mealPreferences.snackPositions?.length || 0;
    const mainMealPortion = (1 - snackCount * 0.1) / 3; // Reserve 10% per snack
    
    return {
      Breakfast: mainMealPortion,
      Lunch: mainMealPortion, 
      Dinner: mainMealPortion,
      snack: 0.1 // 10% per snack
    };
  }

  /**
   * ✅ ENHANCED: Calculate meal nutrition from ingredients
   * Supports both individual foods and complete recipes
   */
  static calculateMealNutrition(items: Array<Food | Recipe | Meal>): NutritionalTargets {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    items.forEach(item => {
      // Handle different item types with safe parsing
      const calories = this.safeParseFloat(item.calories, 0);
      const protein = this.safeParseFloat(item.protein, 0);
      const carbs = this.safeParseFloat(item.carbs, 0);
      const fat = this.safeParseFloat(item.fat, 0);

      totalCalories += calories;
      totalProtein += protein;
      totalCarbs += carbs;
      totalFat += fat;
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      proteinPercentage: totalCalories > 0 ? (totalProtein * 4 / totalCalories) * 100 : 0,
      carbsPercentage: totalCalories > 0 ? (totalCarbs * 4 / totalCalories) * 100 : 0,
      fatPercentage: totalCalories > 0 ? (totalFat * 9 / totalCalories) * 100 : 0
    };
  }

  /**
   * ✅ ENHANCED: Calculate nutritional density score
   * Higher score = more nutritionally dense (more nutrients per calorie)
   */
  static calculateNutritionalDensity(nutrition: NutritionalTargets): number {
    if (nutrition.calories === 0) return 0;
    
    // Protein and micronutrients contribute positively to density
    const proteinScore = (nutrition.protein * 4) / nutrition.calories; // Protein percentage
    const balanceScore = Math.min(
      nutrition.proteinPercentage / 100,
      nutrition.carbsPercentage / 100,
      nutrition.fatPercentage / 100
    ); // Balanced macros score higher
    
    return (proteinScore * 0.7 + balanceScore * 0.3) * 100; // 0-100 scale
  }

  /**
   * ✅ ENHANCED: Recommend nutrition adjustments
   */
  static recommendAdjustments(
    current: NutritionalTargets,
    target: NutritionalTargets
  ): string[] {
    const recommendations: string[] = [];
    
    const proteinDiff = current.protein - target.protein;
    const carbsDiff = current.carbs - target.carbs;
    const fatDiff = current.fat - target.fat;
    const caloriesDiff = current.calories - target.calories;

    // Calorie recommendations
    if (Math.abs(caloriesDiff) > target.calories * 0.05) {
      if (caloriesDiff > 0) {
        recommendations.push(`Reduce calories by ${Math.round(caloriesDiff)} kcal`);
      } else {
        recommendations.push(`Increase calories by ${Math.round(Math.abs(caloriesDiff))} kcal`);
      }
    }

    // Protein recommendations
    if (Math.abs(proteinDiff) > target.protein * 0.1) {
      if (proteinDiff > 0) {
        recommendations.push(`Reduce protein by ${Math.round(proteinDiff)}g`);
      } else {
        recommendations.push(`Increase protein by ${Math.round(Math.abs(proteinDiff))}g`);
      }
    }

    // Carb recommendations
    if (Math.abs(carbsDiff) > target.carbs * 0.15) {
      if (carbsDiff > 0) {
        recommendations.push(`Reduce carbs by ${Math.round(carbsDiff)}g`);
      } else {
        recommendations.push(`Increase carbs by ${Math.round(Math.abs(carbsDiff))}g`);
      }
    }

    // Fat recommendations
    if (Math.abs(fatDiff) > target.fat * 0.15) {
      if (fatDiff > 0) {
        recommendations.push(`Reduce fat by ${Math.round(fatDiff)}g`);
      } else {
        recommendations.push(`Increase fat by ${Math.round(Math.abs(fatDiff))}g`);
      }
    }

    return recommendations;
  }

  /**
   * ✅ ENHANCED: Generate nutrition summary report
   */
  static generateNutritionReport(
    meals: Meal[],
    dailyTargets: NutritionalTargets
  ): {
    summary: NutritionalTargets;
    analysis: NutritionalAnalysis;
    mealBreakdown: Array<{
      meal: Meal;
      nutrition: NutritionalTargets;
      percentageOfTarget: number;
    }>;
    recommendations: string[];
    qualityScore: number;
  } {
    // Calculate total nutrition
    const summary = this.calculateMealNutrition(meals);
    
    // Analyze against targets
    const analysis = this.analyzeNutrition(summary, dailyTargets);
    
    // Meal breakdown
    const mealBreakdown = meals.map(meal => {
      const mealNutrition = this.calculateMealNutrition([meal]);
      return {
        meal,
        nutrition: mealNutrition,
        percentageOfTarget: (mealNutrition.calories / dailyTargets.calories) * 100
      };
    });
    
    // Generate recommendations
    const recommendations = this.recommendAdjustments(summary, dailyTargets);
    
    // Calculate overall quality score
    const qualityScore = this.calculateNutritionalDensity(summary);
    
    return {
      summary,
      analysis,
      mealBreakdown,
      recommendations,
      qualityScore
    };
  }
}