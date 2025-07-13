// src/services/mealPlanGenerator/preparation/NutritionCalculator.ts
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
}

/**
 * Wrapper around existing sophisticated macro calculation logic
 * from PortionSizesModal and userStore
 */
export class NutritionCalculator {
  /**
   * Calculate daily nutritional targets for user
   * Uses existing TDCI and macro calculation logic
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
   * Calculate meal-specific targets based on user's portion sizes and meal preferences
   * Leverages existing portion size logic from PortionSizesModal
   */
  static calculateMealTargets(user: User, dailyTargets: NutritionalTargets): MealNutritionalTargets[] {
    const mealTargets: MealNutritionalTargets[] = [];
    
    // Get meal structure from user preferences
    const mealPreferences = user.mealPreferences;
    if (!mealPreferences) {
      throw new Error('User meal preferences not set');
    }

    // Base meals
    const baseMeals = ['Breakfast', 'Lunch', 'Dinner'];
    
    // Calculate default percentages if no custom portion sizes
    const portionSizes = user.portionSizes || this.calculateDefaultPortionSizes(mealPreferences);
    
    // Create targets for main meals
    baseMeals.forEach(mealType => {
      const portionMultiplier = portionSizes[mealType] || 0.33; // Default 33% for main meals
      
      mealTargets.push({
        mealType,
        targets: this.scaleTargets(dailyTargets, portionMultiplier),
        portionMultiplier,
        priority: 'high' // Main meals are high priority
      });
    });

    // Create targets for snacks
    if (mealPreferences.snackPositions) {
      mealPreferences.snackPositions.forEach(position => {
        const portionMultiplier = portionSizes[position] || 0.1; // Default 10% for snacks
        
        mealTargets.push({
          mealType: 'Snack',
          position,
          targets: this.scaleTargets(dailyTargets, portionMultiplier),
          portionMultiplier,
          priority: 'medium' // Snacks are medium priority
        });
      });
    }

    return mealTargets;
  }

  /**
   * Analyze nutritional content of a recipe/food
   */
  static analyzeRecipe(recipe: Recipe): NutritionalTargets {
    return {
      calories: parseFloat(recipe.calories) || 0,
      protein: parseFloat(recipe.protein) || 0,
      carbs: parseFloat(recipe.carbs) || 0,
      fat: parseFloat(recipe.fat) || 0,
      proteinPercentage: 0, // Will be calculated based on calories
      carbsPercentage: 0,
      fatPercentage: 0
    };
  }

  static analyzeFood(food: Food): NutritionalTargets {
    return {
      calories: parseFloat(food.calories) || 0,
      protein: parseFloat(food.protein) || 0,
      carbs: parseFloat(food.carbs) || 0,
      fat: parseFloat(food.fat) || 0,
      proteinPercentage: 0,
      carbsPercentage: 0,
      fatPercentage: 0
    };
  }

  /**
   * Calculate how well a meal plan meets nutritional targets
   */
  static analyzeMealPlanCompliance(
    meals: Meal[],
    recipes: Recipe[],
    foods: Food[],
    targets: NutritionalTargets
  ): NutritionalAnalysis {
    // Calculate current nutritional content
    let currentNutrition: NutritionalTargets = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      proteinPercentage: 0,
      carbsPercentage: 0,
      fatPercentage: 0
    };

    meals.forEach(meal => {
      // Find recipe or food data
      const recipe = recipes.find(r => r.name === meal.name);
      const food = foods.find(f => f.name === meal.name);
      
      if (recipe) {
        const nutrition = this.analyzeRecipe(recipe);
        currentNutrition.calories += nutrition.calories;
        currentNutrition.protein += nutrition.protein;
        currentNutrition.carbs += nutrition.carbs;
        currentNutrition.fat += nutrition.fat;
      } else if (food) {
        const nutrition = this.analyzeFood(food);
        currentNutrition.calories += nutrition.calories;
        currentNutrition.protein += nutrition.protein;
        currentNutrition.carbs += nutrition.carbs;
        currentNutrition.fat += nutrition.fat;
      }
    });

    // Calculate percentages
    if (currentNutrition.calories > 0) {
      currentNutrition.proteinPercentage = (currentNutrition.protein * 4 / currentNutrition.calories) * 100;
      currentNutrition.carbsPercentage = (currentNutrition.carbs * 4 / currentNutrition.calories) * 100;
      currentNutrition.fatPercentage = (currentNutrition.fat * 9 / currentNutrition.calories) * 100;
    }

    // Calculate deviations
    const deviation = {
      calories: this.calculateDeviation(currentNutrition.calories, targets.calories),
      protein: this.calculateDeviation(currentNutrition.protein, targets.protein),
      carbs: this.calculateDeviation(currentNutrition.carbs, targets.carbs),
      fat: this.calculateDeviation(currentNutrition.fat, targets.fat),
      overall: 0
    };

    // Calculate overall deviation (weighted average)
    deviation.overall = (
      Math.abs(deviation.calories) * 0.4 +
      Math.abs(deviation.protein) * 0.2 +
      Math.abs(deviation.carbs) * 0.2 +
      Math.abs(deviation.fat) * 0.2
    );

    // Determine compliance level
    let compliance: 'excellent' | 'good' | 'acceptable' | 'poor';
    if (deviation.overall <= 5) compliance = 'excellent';
    else if (deviation.overall <= 10) compliance = 'good';
    else if (deviation.overall <= 20) compliance = 'acceptable';
    else compliance = 'poor';

    return {
      current: currentNutrition,
      target: targets,
      deviation,
      compliance
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Calculate TDCI using existing logic from userStore
   */
  private static calculateTDCI(user: User): number {
    // Replicate BMR calculation logic from ProfileSettingsScreen
    if (!user.age || !user.gender || !user.weight) return 2000; // Default fallback
    
    const age = parseInt(user.age);
    const weight = parseFloat(user.weight);
    let height = 0;
    
    if (user.heightUnit === 'cm' && user.height) {
      height = parseFloat(user.height);
    } else if (user.heightUnit === 'ft' && user.heightFeet && user.heightInches) {
      const feet = parseFloat(user.heightFeet);
      const inches = parseFloat(user.heightInches);
      height = (feet * 12 + inches) * 2.54;
    }
    
    // Mifflin-St Jeor equation
    let bmr: number;
    if (user.gender === 'Male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    
    // Apply activity multiplier
    const activityMultiplier = user.activityMultiplier || 1.2;
    let tdee = bmr * activityMultiplier;
    
    // Apply fitness goal adjustment
    const calorieAdjustment = user.fitnessGoal?.calorieValue ? parseFloat(user.fitnessGoal.calorieValue) : 0;
    if (calorieAdjustment !== 0) {
      tdee = tdee * (1 + calorieAdjustment / 100);
    }
    
    return Math.round(tdee);
  }

  /**
   * Calculate daily macros using existing PortionSizesModal logic
   */
  private static calculateDailyMacros(user: User, adjustedTDCI: number): {
    protein: number;
    fat: number;
    carbs: number;
    proteinPercentage: number;
    fatPercentage: number;
    carbsPercentage: number;
  } {
    // Replicate sophisticated macro calculation from PortionSizesModal
    const bodyFat = parseFloat(user.bodyFat || '15');
    const gender = user.gender || 'Male';

    // Calculate Lean Body Mass (LBM)
    const weight = parseFloat(user.weight || '70');
    const lbm = weight * (1 - bodyFat / 100);

    // Calculate protein using body fat percentage (existing logic)
    const proteinMultiplier = this.calculateProteinMultiplier(bodyFat, gender);
    const protein = Math.round(lbm * proteinMultiplier);

    // Calculate fat percentage using body fat (existing logic)
    const fatPercentage = Math.round(this.calculateFatPercentage(bodyFat, gender));
    const fat = Math.round((adjustedTDCI * fatPercentage / 100) / 9);

    // Calculate remaining carbs
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const carbsCalories = adjustedTDCI - proteinCalories - fatCalories;
    const carbs = Math.round(carbsCalories / 4);

    const proteinPercentage = Math.round((proteinCalories / adjustedTDCI) * 100);
    const carbsPercentage = 100 - proteinPercentage - fatPercentage;

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
   * Calculate protein multiplier based on body fat and gender (from PortionSizesModal)
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
   * Calculate fat percentage based on body fat and gender (from PortionSizesModal)
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
   * Calculate default portion sizes based on meal preferences
   */
  private static calculateDefaultPortionSizes(mealPreferences: any): { [key: string]: number } {
    const snackCount = mealPreferences.snackPositions?.length || 0;
    const totalSnackPercentage = snackCount * 0.1; // Each snack gets 10%
    const remainingPercentage = 1 - totalSnackPercentage;
    const mainMealPercentage = remainingPercentage / 3; // Split among 3 main meals

    const portionSizes: { [key: string]: number } = {
      'Breakfast': mainMealPercentage,
      'Lunch': mainMealPercentage,
      'Dinner': mainMealPercentage
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
   * Calculate percentage deviation between current and target values
   */
  private static calculateDeviation(current: number, target: number): number {
    if (target === 0) return current === 0 ? 0 : 100;
    return ((current - target) / target) * 100;
  }

  /**
   * Check if a recipe/food fits within meal nutritional constraints
   */
  static checkNutritionalFit(
    nutrition: NutritionalTargets,
    mealTarget: MealNutritionalTargets,
    tolerance: number = 20 // % tolerance
  ): {
    fits: boolean;
    deviations: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    score: number; // 0-100, higher is better fit
  } {
    const deviations = {
      calories: Math.abs(this.calculateDeviation(nutrition.calories, mealTarget.targets.calories)),
      protein: Math.abs(this.calculateDeviation(nutrition.protein, mealTarget.targets.protein)),
      carbs: Math.abs(this.calculateDeviation(nutrition.carbs, mealTarget.targets.carbs)),
      fat: Math.abs(this.calculateDeviation(nutrition.fat, mealTarget.targets.fat))
    };

    // Check if within tolerance
    const fits = Object.values(deviations).every(dev => dev <= tolerance);

    // Calculate fit score (inverse of average deviation)
    const averageDeviation = Object.values(deviations).reduce((sum, dev) => sum + dev, 0) / 4;
    const score = Math.max(0, 100 - averageDeviation);

    return {
      fits,
      deviations,
      score
    };
  }

  /**
   * Estimate nutrition for combined meals
   */
  static combineMealNutrition(nutritions: NutritionalTargets[]): NutritionalTargets {
    const combined = nutritions.reduce(
      (total, current) => ({
        calories: total.calories + current.calories,
        protein: total.protein + current.protein,
        carbs: total.carbs + current.carbs,
        fat: total.fat + current.fat,
        proteinPercentage: 0, // Will calculate after
        carbsPercentage: 0,
        fatPercentage: 0
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, proteinPercentage: 0, carbsPercentage: 0, fatPercentage: 0 }
    );

    // Calculate percentages for combined nutrition
    if (combined.calories > 0) {
      combined.proteinPercentage = (combined.protein * 4 / combined.calories) * 100;
      combined.carbsPercentage = (combined.carbs * 4 / combined.calories) * 100;
      combined.fatPercentage = (combined.fat * 9 / combined.calories) * 100;
    }

    return combined;
  }
}

export default NutritionCalculator;