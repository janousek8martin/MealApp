// src/services/mealPlanGenerator/preparation/MealStructureBuilder.ts
// 🔧 PHASE 1.1: ENHANCED with Better Portion Sizes Support & Calorie Distribution

import { User } from '../../../stores/userStore';
import { Meal, MealPlan } from '../../../types/meal';

export interface MealStructure {
  mealType: string;
  position: string;
  order: number;
  isRequired: boolean;
  isSnack: boolean;
  timeSlot?: string;
  portionMultiplier: number;
  calorieTarget: number; // ✅ NEW: Direct calorie target for this meal
  priority: 'high' | 'medium' | 'low'; // ✅ NEW: Priority for constraint satisfaction
}

export interface DayStructure {
  date: string;
  meals: MealStructure[];
  totalMeals: number;
  snackCount: number;
  mainMealCount: number;
  totalCalorieTarget: number; // ✅ NEW: Total daily calories
  distributionAnalysis: { // ✅ NEW: Analysis of calorie distribution
    mainMealsCalories: number;
    snacksCalories: number;
    isBalanced: boolean;
  };
}

/**
 * ✅ ENHANCED: Meal structure builder with portion sizes integration
 * Leverages existing meal structure logic but adds better portion size support
 */
export class MealStructureBuilder {
  
  /**
   * ✅ ENHANCED: Build complete day structure with calorie targeting
   * Now uses portion sizes for accurate calorie distribution
   */
  static buildDayStructure(user: User, date: string): DayStructure {
    if (!user.mealPreferences) {
      throw new Error('User meal preferences not configured');
    }

    if (!user.tdci?.adjustedTDCI) {
      throw new Error('User TDCI not calculated - cannot determine calorie targets');
    }

    console.log('🏗️ Building day structure with portion sizes integration');

    const totalCalorieTarget = user.tdci.adjustedTDCI;
    const meals: MealStructure[] = [];
    let order = 0;

    // ✅ 1. Add main meals with portion-based calorie targets
    const mainMeals = this.getMainMealsWithTargets(user, totalCalorieTarget);
    meals.push(...mainMeals.map(meal => ({ ...meal, order: order++ })));

    // ✅ 2. Add snacks with portion-based calorie targets  
    const snacks = this.getSnackMealsWithTargets(user, totalCalorieTarget);
    meals.push(...snacks.map(snack => ({ ...snack, order: order++ })));

    // ✅ 3. Sort by logical meal order (breakfast -> lunch -> dinner with snacks interspersed)
    const sortedMeals = this.sortMealsByTimeOrder(meals);

    // ✅ 4. Analyze calorie distribution
    const distributionAnalysis = this.analyzeCalorieDistribution(sortedMeals);

    console.log('🏗️ Day structure built:', {
      totalMeals: sortedMeals.length,
      mainMeals: sortedMeals.filter(m => !m.isSnack).length,
      snacks: sortedMeals.filter(m => m.isSnack).length,
      totalCalorieTarget,
      distributionAnalysis
    });

    return {
      date,
      meals: sortedMeals,
      totalMeals: sortedMeals.length,
      snackCount: sortedMeals.filter(m => m.isSnack).length,
      mainMealCount: sortedMeals.filter(m => !m.isSnack).length,
      totalCalorieTarget,
      distributionAnalysis
    };
  }

  /**
   * ✅ ENHANCED: Get main meals with accurate calorie targets from portion sizes
   */
  private static getMainMealsWithTargets(user: User, totalCalories: number): Omit<MealStructure, 'order'>[] {
    const portionSizes = user.portionSizes || this.calculateDefaultPortionSizes(user.mealPreferences!);
    
    return [
      {
        mealType: 'Breakfast',
        position: 'Breakfast',
        isRequired: true,
        isSnack: false,
        timeSlot: 'morning',
        portionMultiplier: this.getPortionMultiplier(user, 'Breakfast'),
        calorieTarget: Math.round(totalCalories * (portionSizes.Breakfast || portionSizes.breakfast || 0.25)),
        priority: 'high' // Main meals are high priority
      },
      {
        mealType: 'Lunch',
        position: 'Lunch',
        isRequired: true,
        isSnack: false,
        timeSlot: 'midday',
        portionMultiplier: this.getPortionMultiplier(user, 'Lunch'),
        calorieTarget: Math.round(totalCalories * (portionSizes.Lunch || portionSizes.lunch || 0.35)),
        priority: 'high'
      },
      {
        mealType: 'Dinner',
        position: 'Dinner',
        isRequired: true,
        isSnack: false,
        timeSlot: 'evening',
        portionMultiplier: this.getPortionMultiplier(user, 'Dinner'),
        calorieTarget: Math.round(totalCalories * (portionSizes.Dinner || portionSizes.dinner || 0.30)),
        priority: 'high'
      }
    ];
  }

  /**
   * ✅ ENHANCED: Get snack meals with individual calorie targets
   */
  private static getSnackMealsWithTargets(user: User, totalCalories: number): Omit<MealStructure, 'order'>[] {
    const mealPreferences = user.mealPreferences!;
    const portionSizes = user.portionSizes || this.calculateDefaultPortionSizes(mealPreferences);
    
    if (!mealPreferences.snackPositions || mealPreferences.snackPositions.length === 0) {
      return [];
    }

    return mealPreferences.snackPositions.map((position, index) => {
      // ✅ INDIVIDUAL SNACK TARGETING: Try position-specific portion size first
      let snackCalorieTarget: number;
      
      if (portionSizes[position] !== undefined) {
        // Use position-specific portion size
        snackCalorieTarget = Math.round(totalCalories * portionSizes[position]);
      } else if (portionSizes.snack !== undefined) {
        // Use general snack portion size
        snackCalorieTarget = Math.round(totalCalories * portionSizes.snack);
      } else {
        // Default fallback
        snackCalorieTarget = Math.round(totalCalories * 0.10);
      }

      console.log(`🍎 Snack ${position} calorie target: ${snackCalorieTarget}`);

      return {
        mealType: 'Snack',
        position,
        isRequired: false,
        isSnack: true,
        timeSlot: this.getTimeSlotForSnack(position),
        portionMultiplier: this.getPortionMultiplier(user, 'Snack'),
        calorieTarget: snackCalorieTarget,
        priority: 'medium' // Snacks are medium priority
      };
    });
  }

  /**
   * ✅ ENHANCED: Get portion multiplier with better fallback logic
   */
  private static getPortionMultiplier(user: User, mealType: string): number {
    if (!user.portionSizes) {
      console.log(`⚠️ No portion sizes configured for ${mealType}, using defaults`);
      return 1.0; // Default multiplier
    }

    const portionSizes = user.portionSizes;

    switch (mealType) {
      case 'Breakfast':
        return portionSizes.Breakfast || portionSizes.breakfast || 1.0;
      case 'Lunch':
        return portionSizes.Lunch || portionSizes.lunch || 1.0;
      case 'Dinner':
        return portionSizes.Dinner || portionSizes.dinner || 1.0;
      case 'Snack':
        return portionSizes.snack || 0.5; // Snacks typically smaller
      default:
        return 1.0;
    }
  }

  /**
   * Determine time slot for snack position (existing logic)
   */
  private static getTimeSlotForSnack(position: string): string {
    const positionLower = position.toLowerCase();
    
    if (positionLower.includes('morning') || positionLower.includes('breakfast')) {
      return 'morning';
    } else if (positionLower.includes('lunch') || positionLower.includes('midday')) {
      return 'midday';
    } else if (positionLower.includes('afternoon')) {
      return 'afternoon';
    } else if (positionLower.includes('evening') || positionLower.includes('dinner')) {
      return 'evening';
    } else {
      return 'flexible';
    }
  }

  /**
   * Sort meals by logical time order throughout the day (existing logic)
   */
  private static sortMealsByTimeOrder(meals: MealStructure[]): MealStructure[] {
    const timeOrder = {
      'morning': 1,
      'midday': 3,
      'afternoon': 4,
      'evening': 6,
      'flexible': 5
    };

    const mealTypeOrder = {
      'Breakfast': 2,
      'Lunch': 3,
      'Dinner': 6,
      'Snack': 0 // Will be overridden by timeSlot
    };

    return meals.sort((a, b) => {
      const aTime = timeOrder[a.timeSlot as keyof typeof timeOrder] || 5;
      const bTime = timeOrder[b.timeSlot as keyof typeof timeOrder] || 5;
      
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      
      // If same time slot, prioritize main meals
      const aMealOrder = mealTypeOrder[a.mealType as keyof typeof mealTypeOrder] || 5;
      const bMealOrder = mealTypeOrder[b.mealType as keyof typeof mealTypeOrder] || 5;
      
      return aMealOrder - bMealOrder;
    }).map((meal, index) => ({ ...meal, order: index }));
  }

  /**
   * ✅ NEW: Analyze calorie distribution across meals
   */
  private static analyzeCalorieDistribution(meals: MealStructure[]): {
    mainMealsCalories: number;
    snacksCalories: number;
    isBalanced: boolean;
  } {
    const mainMealsCalories = meals
      .filter(meal => !meal.isSnack)
      .reduce((sum, meal) => sum + meal.calorieTarget, 0);
    
    const snacksCalories = meals
      .filter(meal => meal.isSnack)
      .reduce((sum, meal) => sum + meal.calorieTarget, 0);

    const totalCalories = mainMealsCalories + snacksCalories;
    const mainMealPercentage = totalCalories > 0 ? mainMealsCalories / totalCalories : 0;

    // Main meals should typically be 60-85% of total intake
    const isBalanced = mainMealPercentage >= 0.6 && mainMealPercentage <= 0.85;

    return {
      mainMealsCalories,
      snacksCalories,
      isBalanced
    };
  }

  /**
   * ✅ ENHANCED: Create empty meal plan structure for generation with calorie targets
   */
  static createEmptyMealPlan(user: User, date: string): MealPlan {
    const dayStructure = this.buildDayStructure(user, date);
    
    const meals: Meal[] = dayStructure.meals.map((mealStructure, index) => ({
      id: `${mealStructure.mealType.toLowerCase()}-${date}-${index}`,
      userId: user.id,
      date,
      type: mealStructure.mealType as any,
      name: mealStructure.isSnack ? 'Snack' : '',
      position: mealStructure.position,
      recipes: [],
      foods: [],
      calories: 0, // Will be filled during generation
      protein: 0,
      carbs: 0,
      fat: 0,
      // ✅ ADD: Store target calories for reference
      targetCalories: mealStructure.calorieTarget
    }));

    return {
      id: `${user.id}-${date}`,
      userId: user.id,
      date,
      meals
    };
  }

  /**
   * ✅ ENHANCED: Validate meal structure with portion sizes analysis
   */
  static validateMealStructure(structure: DayStructure, user: User): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check minimum meal requirements
    if (structure.mainMealCount < 3) {
      errors.push('Must have at least 3 main meals (Breakfast, Lunch, Dinner)');
    }

    // Check maximum meals per day
    if (structure.totalMeals > 8) {
      warnings.push('More than 8 meals per day may be difficult to manage');
    }

    // Check snack positions make sense
    const hasBreakfast = structure.meals.some(m => m.mealType === 'Breakfast');
    const hasLunch = structure.meals.some(m => m.mealType === 'Lunch');
    const hasDinner = structure.meals.some(m => m.mealType === 'Dinner');

    if (!hasBreakfast) errors.push('Missing breakfast meal');
    if (!hasLunch) errors.push('Missing lunch meal');
    if (!hasDinner) errors.push('Missing dinner meal');

    // ✅ ENHANCED: Validate portion multipliers and calorie targets
    structure.meals.forEach(meal => {
      if (meal.portionMultiplier <= 0) {
        errors.push(`Invalid portion multiplier for ${meal.mealType}: ${meal.portionMultiplier}`);
      }
      if (meal.portionMultiplier > 3) {
        warnings.push(`Very large portion size for ${meal.mealType}: ${meal.portionMultiplier}x`);
      }
      if (meal.calorieTarget <= 0) {
        errors.push(`Invalid calorie target for ${meal.mealType}: ${meal.calorieTarget}`);
      }
      if (!meal.isSnack && meal.calorieTarget < 200) {
        warnings.push(`Very low calorie target for ${meal.mealType}: ${meal.calorieTarget} kcal`);
      }
      if (meal.calorieTarget > structure.totalCalorieTarget * 0.6) {
        warnings.push(`Very high calorie target for ${meal.mealType}: ${meal.calorieTarget} kcal`);
      }
    });

    // ✅ NEW: Validate calorie distribution
    if (!structure.distributionAnalysis.isBalanced) {
      warnings.push('Meal calorie distribution may be unbalanced');
    }

    // Check total calorie target accuracy
    const totalMealCalories = structure.meals.reduce((sum, meal) => sum + meal.calorieTarget, 0);
    const calorieDeviation = Math.abs(totalMealCalories - structure.totalCalorieTarget) / structure.totalCalorieTarget;
    
    if (calorieDeviation > 0.15) { // 15% tolerance
      warnings.push(`Meal calorie targets deviate by ${(calorieDeviation * 100).toFixed(1)}% from daily target`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Get meal by position from structure (existing logic)
   */
  static getMealByPosition(structure: DayStructure, position: string): MealStructure | null {
    return structure.meals.find(meal => meal.position === position) || null;
  }

  /**
   * Get all snacks from structure (existing logic)
   */
  static getSnacks(structure: DayStructure): MealStructure[] {
    return structure.meals.filter(meal => meal.isSnack);
  }

  /**
   * Get all main meals from structure (existing logic)
   */
  static getMainMealsFromStructure(structure: DayStructure): MealStructure[] {
    return structure.meals.filter(meal => !meal.isSnack);
  }

  /**
   * ✅ ENHANCED: Calculate total expected calories (now redundant but kept for compatibility)
   */
  static calculateExpectedCalories(structure: DayStructure, user: User): number {
    return structure.totalCalorieTarget;
  }

  /**
   * ✅ ENHANCED: Distribute calories across meals based on portion multipliers
   * Now returns actual calorie targets from structure instead of calculating
   */
  static distributeCaloriesAcrossMeals(
    structure: DayStructure,
    totalCalories: number
  ): Map<string, number> {
    const distribution = new Map<string, number>();
    
    // Use pre-calculated calorie targets from structure
    structure.meals.forEach(meal => {
      distribution.set(meal.position, meal.calorieTarget);
    });

    console.log('📊 Calorie distribution map:', Object.fromEntries(distribution));
    return distribution;
  }

  /**
   * ✅ NEW: Get meal targets for recipe selection
   * Returns structured data for use in recipe selection algorithms
   */
  static getMealTargetsForGeneration(structure: DayStructure): Array<{
    position: string;
    mealType: string;
    calorieTarget: number;
    priority: 'high' | 'medium' | 'low';
    isSnack: boolean;
    timeSlot: string;
  }> {
    return structure.meals.map(meal => ({
      position: meal.position,
      mealType: meal.mealType,
      calorieTarget: meal.calorieTarget,
      priority: meal.priority,
      isSnack: meal.isSnack,
      timeSlot: meal.timeSlot || 'flexible'
    }));
  }

  /**
   * ✅ NEW: Calculate portion sizes from existing meal data (for PortionSizesModal compatibility)
   * Reverse-engineers portion sizes from calorie targets
   */
  static calculatePortionSizesFromStructure(structure: DayStructure): { [key: string]: number } {
    const portionSizes: { [key: string]: number } = {};
    const totalCalories = structure.totalCalorieTarget;

    structure.meals.forEach(meal => {
      const portionDecimal = meal.calorieTarget / totalCalories;
      
      // Map back to expected keys
      if (meal.mealType === 'Breakfast') {
        portionSizes.Breakfast = portionDecimal;
        portionSizes.breakfast = portionDecimal;
      } else if (meal.mealType === 'Lunch') {
        portionSizes.Lunch = portionDecimal;
        portionSizes.lunch = portionDecimal;
      } else if (meal.mealType === 'Dinner') {
        portionSizes.Dinner = portionDecimal;
        portionSizes.dinner = portionDecimal;
      } else if (meal.mealType === 'Snack') {
        // For snacks, use position-specific keys
        portionSizes[meal.position] = portionDecimal;
        
        // Also set general snack portion if not set
        if (!portionSizes.snack) {
          portionSizes.snack = portionDecimal;
        }
      }
    });

    return portionSizes;
  }

  /**
   * ✅ ENHANCED: Calculate default portion sizes with better distribution
   */
  private static calculateDefaultPortionSizes(mealPreferences: any): { [key: string]: number } {
    const snackCount = mealPreferences.snackPositions?.length || 0;
    
    // ✅ SMARTER DEFAULT DISTRIBUTION
    let snackPortionPerSnack: number;
    if (snackCount === 0) {
      snackPortionPerSnack = 0;
    } else if (snackCount === 1) {
      snackPortionPerSnack = 0.15; // Single snack gets 15%
    } else if (snackCount === 2) {
      snackPortionPerSnack = 0.12; // Each snack gets 12% (24% total)
    } else if (snackCount === 3) {
      snackPortionPerSnack = 0.08; // Each snack gets 8% (24% total)
    } else {
      snackPortionPerSnack = 0.06; // Each snack gets 6% (max 30% for 5 snacks)
    }

    const totalSnackPercentage = snackCount * snackPortionPerSnack;
    const remainingPercentage = 1 - totalSnackPercentage;
    
    // ✅ BALANCED MAIN MEAL DISTRIBUTION
    // Lunch typically largest, breakfast and dinner smaller
    const breakfastPortion = remainingPercentage * 0.28; // 28% of remaining
    const lunchPortion = remainingPercentage * 0.38;     // 38% of remaining  
    const dinnerPortion = remainingPercentage * 0.34;    // 34% of remaining

    const portionSizes: { [key: string]: number } = {
      'Breakfast': breakfastPortion,
      'breakfast': breakfastPortion,
      'Lunch': lunchPortion,
      'lunch': lunchPortion,
      'Dinner': dinnerPortion,
      'dinner': dinnerPortion,
      'snack': snackPortionPerSnack
    };

    // Add individual snack portions
    if (mealPreferences.snackPositions) {
      mealPreferences.snackPositions.forEach((position: string) => {
        portionSizes[position] = snackPortionPerSnack;
      });
    }

    console.log('📊 Default portion sizes calculated:', {
      mainMealsTotal: (breakfastPortion + lunchPortion + dinnerPortion).toFixed(2),
      snacksTotal: totalSnackPercentage.toFixed(2),
      snackCount,
      portionSizes
    });

    return portionSizes;
  }

  /**
   * ✅ NEW: Analyze meal timing and spacing
   */
  static analyzeMealTiming(structure: DayStructure): {
    isWellSpaced: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    const mealsByTime = structure.meals.sort((a, b) => a.order - b.order);
    
    // Check for meal clustering
    const timeSlots = mealsByTime.map(m => m.timeSlot);
    const timeSlotCounts = timeSlots.reduce((acc, slot) => {
      acc[slot || 'flexible'] = (acc[slot || 'flexible'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check for too many meals in same time slot
    Object.entries(timeSlotCounts).forEach(([slot, count]) => {
      if (count > 2 && slot !== 'flexible') {
        issues.push(`Too many meals in ${slot} time slot (${count})`);
        recommendations.push(`Consider spacing meals throughout the day`);
      }
    });

    // Check for missing main meal time slots
    const hasMainMealIn = {
      morning: timeSlots.includes('morning'),
      midday: timeSlots.includes('midday'),
      evening: timeSlots.includes('evening')
    };

    if (!hasMainMealIn.morning) {
      issues.push('No morning meal scheduled');
      recommendations.push('Consider adding breakfast');
    }

    if (!hasMainMealIn.midday) {
      issues.push('No midday meal scheduled');
      recommendations.push('Consider adding lunch');
    }

    if (!hasMainMealIn.evening) {
      issues.push('No evening meal scheduled');
      recommendations.push('Consider adding dinner');
    }

    const isWellSpaced = issues.length === 0;

    return {
      isWellSpaced,
      issues,
      recommendations
    };
  }

  /**
   * ✅ NEW: Get summary statistics for the meal structure
   */
  static getStructureSummary(structure: DayStructure): {
    totalMeals: number;
    mainMeals: number;
    snacks: number;
    totalCalories: number;
    averageCaloriesPerMeal: number;
    calorieDistribution: {
      breakfast: number;
      lunch: number;
      dinner: number;
      snacks: number;
    };
    isValid: boolean;
    qualityScore: number; // 0-100
  } {
    const validation = this.validateMealStructure(structure, {} as User);
    
    // Calculate calorie distribution
    const calorieDistribution = {
      breakfast: structure.meals.find(m => m.mealType === 'Breakfast')?.calorieTarget || 0,
      lunch: structure.meals.find(m => m.mealType === 'Lunch')?.calorieTarget || 0,
      dinner: structure.meals.find(m => m.mealType === 'Dinner')?.calorieTarget || 0,
      snacks: structure.meals.filter(m => m.isSnack).reduce((sum, m) => sum + m.calorieTarget, 0)
    };

    // Calculate quality score
    let qualityScore = 100;
    qualityScore -= validation.errors.length * 15;
    qualityScore -= validation.warnings.length * 5;
    
    if (!structure.distributionAnalysis.isBalanced) {
      qualityScore -= 10;
    }

    const timingAnalysis = this.analyzeMealTiming(structure);
    if (!timingAnalysis.isWellSpaced) {
      qualityScore -= timingAnalysis.issues.length * 5;
    }

    qualityScore = Math.max(0, Math.min(100, qualityScore));

    return {
      totalMeals: structure.totalMeals,
      mainMeals: structure.mainMealCount,
      snacks: structure.snackCount,
      totalCalories: structure.totalCalorieTarget,
      averageCaloriesPerMeal: structure.totalCalorieTarget / structure.totalMeals,
      calorieDistribution,
      isValid: validation.isValid,
      qualityScore
    };
  }
}

export default MealStructureBuilder;