// src/services/mealPlanGenerator/preparation/MealStructureBuilder.ts
// 🏗️ MEAL STRUCTURE BUILDER - Wrapper around existing meal structure logic

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
}

export interface DayStructure {
  date: string;
  meals: MealStructure[];
  totalMeals: number;
  snackCount: number;
  mainMealCount: number;
}

/**
 * Wrapper around existing meal structure logic from the app
 * Leverages existing getDefaultMealsForProfile functionality
 */
export class MealStructureBuilder {
  
  /**
   * Build complete day structure based on user preferences
   * Uses existing meal preferences logic
   */
  static buildDayStructure(user: User, date: string): DayStructure {
    if (!user.mealPreferences) {
      throw new Error('User meal preferences not configured');
    }

    const meals: MealStructure[] = [];
    let order = 0;

    // 1. Add main meals (always required)
    const mainMeals = this.getMainMeals(user);
    meals.push(...mainMeals.map(meal => ({ ...meal, order: order++ })));

    // 2. Add snacks based on user preferences
    const snacks = this.getSnackMeals(user);
    meals.push(...snacks.map(snack => ({ ...snack, order: order++ })));

    // 3. Sort by logical meal order (breakfast -> lunch -> dinner with snacks interspersed)
    const sortedMeals = this.sortMealsByTimeOrder(meals);

    return {
      date,
      meals: sortedMeals,
      totalMeals: sortedMeals.length,
      snackCount: sortedMeals.filter(m => m.isSnack).length,
      mainMealCount: sortedMeals.filter(m => !m.isSnack).length
    };
  }

  /**
   * Get main meals structure (leverages existing logic)
   */
  private static getMainMeals(user: User): Omit<MealStructure, 'order'>[] {
    const mealPreferences = user.mealPreferences!;
    
    return [
      {
        mealType: 'Breakfast',
        position: 'Breakfast',
        isRequired: true,
        isSnack: false,
        timeSlot: 'morning',
        portionMultiplier: this.getPortionMultiplier(user, 'Breakfast')
      },
      {
        mealType: 'Lunch',
        position: 'Lunch',
        isRequired: true,
        isSnack: false,
        timeSlot: 'midday',
        portionMultiplier: this.getPortionMultiplier(user, 'Lunch')
      },
      {
        mealType: 'Dinner',
        position: 'Dinner',
        isRequired: true,
        isSnack: false,
        timeSlot: 'evening',
        portionMultiplier: this.getPortionMultiplier(user, 'Dinner')
      }
    ];
  }

  /**
   * Get snack meals structure based on user preferences
   */
  private static getSnackMeals(user: User): Omit<MealStructure, 'order'>[] {
    const mealPreferences = user.mealPreferences!;
    
    if (!mealPreferences.snackPositions || mealPreferences.snackPositions.length === 0) {
      return [];
    }

    return mealPreferences.snackPositions.map((position, index) => ({
      mealType: 'Snack',
      position,
      isRequired: false,
      isSnack: true,
      timeSlot: this.getTimeSlotForSnack(position),
      portionMultiplier: this.getPortionMultiplier(user, 'Snack')
    }));
  }

  /**
   * Get portion multiplier for meal type (uses existing portion size logic)
   */
  private static getPortionMultiplier(user: User, mealType: string): number {
    if (!user.portionSizes) {
      return 1.0; // Default multiplier
    }

    const portionSizes = user.portionSizes;

    switch (mealType) {
      case 'Breakfast':
        return portionSizes.breakfast || 1.0;
      case 'Lunch':
        return portionSizes.lunch || 1.0;
      case 'Dinner':
        return portionSizes.dinner || 1.0;
      case 'Snack':
        return portionSizes.snack || 0.5; // Snacks typically smaller
      default:
        return 1.0;
    }
  }

  /**
   * Determine time slot for snack position
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
   * Sort meals by logical time order throughout the day
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
   * Create empty meal plan structure for generation
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
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }));

    return {
      id: `${user.id}-${date}`,
      userId: user.id,
      date,
      meals
    };
  }

  /**
   * Validate meal structure against user constraints
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

    // Validate portion multipliers
    structure.meals.forEach(meal => {
      if (meal.portionMultiplier <= 0) {
        errors.push(`Invalid portion multiplier for ${meal.mealType}: ${meal.portionMultiplier}`);
      }
      if (meal.portionMultiplier > 3) {
        warnings.push(`Very large portion size for ${meal.mealType}: ${meal.portionMultiplier}x`);
      }
    });

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Get meal by position from structure
   */
  static getMealByPosition(structure: DayStructure, position: string): MealStructure | null {
    return structure.meals.find(meal => meal.position === position) || null;
  }

  /**
   * Get all snacks from structure
   */
  static getSnacks(structure: DayStructure): MealStructure[] {
    return structure.meals.filter(meal => meal.isSnack);
  }

  /**
   * Get all main meals from structure
   */
  static getMainMealsFromStructure(structure: DayStructure): MealStructure[] {
    return structure.meals.filter(meal => !meal.isSnack);
  }

  /**
   * Calculate total expected calories for structure based on user TDCI
   */
  static calculateExpectedCalories(structure: DayStructure, user: User): number {
    if (!user.tdci?.adjustedTDCI) {
      throw new Error('User TDCI not calculated');
    }

    return user.tdci.adjustedTDCI;
  }

  /**
   * Distribute calories across meals based on portion multipliers
   */
  static distributeCaloriesAcrossMeals(
    structure: DayStructure,
    totalCalories: number
  ): Map<string, number> {
    const distribution = new Map<string, number>();
    
    // Calculate total portion weight
    const totalPortionWeight = structure.meals.reduce(
      (sum, meal) => sum + meal.portionMultiplier,
      0
    );

    // Distribute calories proportionally
    structure.meals.forEach(meal => {
      const calorieShare = (meal.portionMultiplier / totalPortionWeight) * totalCalories;
      distribution.set(meal.position, Math.round(calorieShare));
    });

    return distribution;
  }
}

export default MealStructureBuilder;