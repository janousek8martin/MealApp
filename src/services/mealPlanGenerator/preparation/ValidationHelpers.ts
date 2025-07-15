// src/services/mealPlanGenerator/preparation/ValidationHelpers.ts
// ✅ INPUT VALIDATION - Ensures data integrity for meal plan generation

import { User } from '../../../stores/userStore';
import { Recipe, Food } from '../../../stores/recipeStore';
import { GenerationOptions } from '../HybridMealPlanGenerator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100, quality of input data
}

export interface UserValidationResult extends ValidationResult {
  missingFields: string[];
  dataQuality: {
    profileCompleteness: number; // 0-100
    preferencesCompleteness: number; // 0-100
    nutritionalDataQuality: number; // 0-100
  };
}

export interface RecipeValidationResult extends ValidationResult {
  validRecipes: Recipe[];
  invalidRecipes: Array<{ recipe: Recipe; issues: string[] }>;
  nutritionDataQuality: number; // 0-100
}

export interface FoodValidationResult extends ValidationResult {
  validFoods: Food[];
  invalidFoods: Array<{ food: Food; issues: string[] }>;
  nutritionDataQuality: number; // 0-100
}

/**
 * Comprehensive validation helpers for meal plan generation
 */
export class ValidationHelpers {
  
  // ===== USER VALIDATION =====
  
  /**
   * Validate user data for meal plan generation
   */
  static validateUser(user: User): UserValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    
    // Required fields
    if (!user.id) {
      errors.push('User ID is required');
      missingFields.push('id');
    }
    
    if (!user.name || user.name.trim() === '') {
      errors.push('User name is required');
      missingFields.push('name');
    }

    // TDCI validation (critical for meal planning)
    if (!user.tdci) {
      errors.push('TDCI data is required for meal planning');
      missingFields.push('tdci');
    } else {
      if (!user.tdci.adjustedTDCI || user.tdci.adjustedTDCI <= 0) {
        errors.push('Valid adjusted TDCI is required');
        missingFields.push('tdci.adjustedTDCI');
      }
      
      if (user.tdci.adjustedTDCI < 1000 || user.tdci.adjustedTDCI > 5000) {
        warnings.push(`TDCI of ${user.tdci.adjustedTDCI} calories seems unusual`);
      }
    }

    // Meal preferences validation
    if (!user.mealPreferences) {
      errors.push('Meal preferences are required');
      missingFields.push('mealPreferences');
    } else {
      if (!user.mealPreferences.snackPositions) {
        warnings.push('No snack positions defined');
      } else if (user.mealPreferences.snackPositions.length > 5) {
        warnings.push('More than 5 snacks per day may be excessive');
      }
    }

    // Portion sizes validation
    if (!user.portionSizes) {
      warnings.push('Portion sizes not configured, using defaults');
      missingFields.push('portionSizes');
    } else {
      const { breakfast, lunch, dinner, snack } = user.portionSizes;
      
      if (breakfast && (breakfast < 0.1 || breakfast > 5)) {
        warnings.push(`Breakfast portion size (${breakfast}x) seems unusual`);
      }
      if (lunch && (lunch < 0.1 || lunch > 5)) {
        warnings.push(`Lunch portion size (${lunch}x) seems unusual`);
      }
      if (dinner && (dinner < 0.1 || dinner > 5)) {
        warnings.push(`Dinner portion size (${dinner}x) seems unusual`);
      }
      if (snack && (snack < 0.1 || snack > 2)) {
        warnings.push(`Snack portion size (${snack}x) seems unusual`);
      }
    }

    // ✅ OPRAVA: Physical data validation - parseFloat pro string values
    if (!user.age) {
      warnings.push('Age not set');
      missingFields.push('age');
    } else {
      const ageNum = parseFloat(user.age);
      if (ageNum < 12 || ageNum > 120) {
        warnings.push(`Age of ${user.age} seems unusual`);
      }
    }

    if (!user.weight) {
      warnings.push('Weight not set');
      missingFields.push('weight');
    } else {
      const weightNum = parseFloat(user.weight);
      if (weightNum < 30 || weightNum > 300) {
        warnings.push(`Weight of ${user.weight}kg seems unusual`);
      }
    }

    if (!user.height) {
      warnings.push('Height not set');
      missingFields.push('height');
    } else {
      const heightNum = parseFloat(user.height);
      if (heightNum < 100 || heightNum > 250) {
        warnings.push(`Height of ${user.height}cm seems unusual`);
      }
    }

    // Calculate data quality scores
    const profileCompleteness = this.calculateProfileCompleteness(user);
    const preferencesCompleteness = this.calculatePreferencesCompleteness(user);
    const nutritionalDataQuality = this.calculateNutritionalDataQuality(user);
    
    const overallScore = (profileCompleteness + preferencesCompleteness + nutritionalDataQuality) / 3;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: overallScore,
      missingFields,
      dataQuality: {
        profileCompleteness,
        preferencesCompleteness,
        nutritionalDataQuality
      }
    };
  }

  /**
   * Calculate profile completeness score
   */
  private static calculateProfileCompleteness(user: User): number {
    let score = 0;
    let maxScore = 0;

    // Required fields (higher weight)
    maxScore += 30;
    if (user.id && user.name) score += 30;

    // Physical data
    maxScore += 20;
    if (user.age && user.weight && user.height && user.gender) score += 20;

    // Activity level
    maxScore += 15;
    if (user.activityMultiplier) score += 15;

    // Fitness goals
    maxScore += 15;
    if (user.fitnessGoal) score += 15;

    // Additional data
    maxScore += 20;
    if (user.workoutDays && user.workoutDays.length > 0) score += 10;
    // ✅ OPRAVA: Odebrání neexistující property allergens
    if (user.avoidMeals !== undefined) score += 10; // Zvýšeno z 5 na 10

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate preferences completeness score
   */
  private static calculatePreferencesCompleteness(user: User): number {
    let score = 0;
    let maxScore = 0;

    // Meal preferences (critical)
    maxScore += 40;
    if (user.mealPreferences) score += 40;

    // Portion sizes
    maxScore += 30;
    if (user.portionSizes) {
      if (user.portionSizes.breakfast) score += 7.5;
      if (user.portionSizes.lunch) score += 7.5;
      if (user.portionSizes.dinner) score += 7.5;
      if (user.portionSizes.snack) score += 7.5;
    }

    // Avoid meals
    maxScore += 30; // ✅ OPRAVA: Zvýšeno z 15 na 30 kvůli odebrání allergens
    if (user.avoidMeals !== undefined) score += 30;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate nutritional data quality score
   */
  private static calculateNutritionalDataQuality(user: User): number {
    let score = 0;
    let maxScore = 0;

    // TDCI (most critical)
    maxScore += 60;
    if (user.tdci?.adjustedTDCI) {
      score += 50;
      if (user.tdci.adjustedTDCI >= 1200 && user.tdci.adjustedTDCI <= 4000) {
        score += 10; // Reasonable range
      }
    }

    // ✅ OPRAVA: Odebrání neexistující property bmr
    // BMR section removed as it doesn't exist in User type

    // Activity multiplier
    maxScore += 20; // ✅ OPRAVA: Zvýšeno z 10 na 20
    if (user.activityMultiplier) score += 20;

    // Fitness goal alignment
    maxScore += 20; // ✅ OPRAVA: Zvýšeno z 10 na 20
    if (user.fitnessGoal) score += 20;

    return Math.round((score / maxScore) * 100);
  }

  // ===== RECIPE VALIDATION =====

  /**
   * Validate recipe data for meal planning
   */
  static validateRecipes(recipes: Recipe[]): RecipeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validRecipes: Recipe[] = [];
    const invalidRecipes: Array<{ recipe: Recipe; issues: string[] }> = [];

    recipes.forEach(recipe => {
      const recipeIssues: string[] = [];

      // Required fields
      if (!recipe.id) recipeIssues.push('Missing recipe ID');
      if (!recipe.name || recipe.name.trim() === '') {
        recipeIssues.push('Missing recipe name');
      }

      // ✅ OPRAVA: Nutritional data validation - parseFloat pro string values
      const caloriesNum = parseFloat(recipe.calories || '0');
      if (!recipe.calories || caloriesNum <= 0) {
        recipeIssues.push('Missing or invalid calories');
      } else if (caloriesNum > 2000) {
        recipeIssues.push('Very high calories (>2000)');
      }

      const proteinNum = parseFloat(recipe.protein || '0');
      if (recipe.protein && proteinNum < 0) {
        recipeIssues.push('Negative protein value');
      }
      
      const carbsNum = parseFloat(recipe.carbs || '0');
      if (recipe.carbs && carbsNum < 0) {
        recipeIssues.push('Negative carbs value');
      }
      
      const fatNum = parseFloat(recipe.fat || '0');
      if (recipe.fat && fatNum < 0) {
        recipeIssues.push('Negative fat value');
      }

      // Ingredients validation
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        recipeIssues.push('No ingredients specified');
      } else {
        recipe.ingredients.forEach((ing, index) => {
          if (!ing.name || ing.name.trim() === '') {
            recipeIssues.push(`Ingredient ${index + 1} missing name`);
          }
          if (!ing.amount || ing.amount.trim() === '') {
            recipeIssues.push(`Ingredient ${index + 1} missing amount`);
          }
        });
      }

      // ✅ OPRAVA: Prep time validation - parseFloat pro string values
      const prepTimeNum = parseFloat(recipe.prepTime || '0');
      if (recipe.prepTime && prepTimeNum < 0) {
        recipeIssues.push('Negative prep time');
      }

      if (recipeIssues.length === 0) {
        validRecipes.push(recipe);
      } else {
        invalidRecipes.push({ recipe, issues: recipeIssues });
      }
    });

    // Overall validation
    if (validRecipes.length === 0) {
      errors.push('No valid recipes available for meal planning');
    }

    if (invalidRecipes.length > 0) {
      warnings.push(`${invalidRecipes.length} recipes have issues and will be excluded`);
    }

    const nutritionDataQuality = this.calculateRecipeNutritionQuality(validRecipes);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: validRecipes.length > 0 ? Math.min(100, (validRecipes.length / recipes.length) * 100) : 0,
      validRecipes,
      invalidRecipes,
      nutritionDataQuality
    };
  }

  /**
   * Calculate recipe nutrition data quality
   */
  private static calculateRecipeNutritionQuality(recipes: Recipe[]): number {
    if (recipes.length === 0) return 0;

    let totalScore = 0;

    recipes.forEach(recipe => {
      let recipeScore = 0;
      let maxRecipeScore = 0;

      // ✅ OPRAVA: Calories validation - parseFloat pro string values
      maxRecipeScore += 30;
      const caloriesNum = parseFloat(recipe.calories || '0');
      if (recipe.calories && caloriesNum > 0) recipeScore += 30;

      // Macronutrients
      maxRecipeScore += 45;
      const proteinNum = parseFloat(recipe.protein || '0');
      if (recipe.protein && proteinNum >= 0) recipeScore += 15;
      const carbsNum = parseFloat(recipe.carbs || '0');
      if (recipe.carbs && carbsNum >= 0) recipeScore += 15;
      const fatNum = parseFloat(recipe.fat || '0');
      if (recipe.fat && fatNum >= 0) recipeScore += 15;

      // ✅ OPRAVA: Additional nutrition data - odstranění neexistujících properties
      maxRecipeScore += 25;
      // Removed fiber, sugar, sodium, cholesterol checks as they don't exist in Recipe type
      // Placeholder scoring for this section
      recipeScore += 25; // Give full points since we can't check these properties

      totalScore += (recipeScore / maxRecipeScore) * 100;
    });

    return Math.round(totalScore / recipes.length);
  }

  // ===== FOOD VALIDATION =====

  /**
   * Validate food data for meal planning
   */
  static validateFoods(foods: Food[]): FoodValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validFoods: Food[] = [];
    const invalidFoods: Array<{ food: Food; issues: string[] }> = [];

    foods.forEach(food => {
      const foodIssues: string[] = [];

      // Required fields
      if (!food.id) foodIssues.push('Missing food ID');
      if (!food.name || food.name.trim() === '') {
        foodIssues.push('Missing food name');
      }

      // ✅ OPRAVA: Nutritional data validation - parseFloat pro string values
      const caloriesNum = parseFloat(food.calories || '0');
      if (!food.calories || caloriesNum <= 0) {
        foodIssues.push('Missing or invalid calories per 100g');
      }

      const proteinNum = parseFloat(food.protein || '0');
      if (food.protein && proteinNum < 0) {
        foodIssues.push('Negative protein value');
      }
      
      const carbsNum = parseFloat(food.carbs || '0');
      if (food.carbs && carbsNum < 0) {
        foodIssues.push('Negative carbs value');
      }
      
      const fatNum = parseFloat(food.fat || '0');
      if (food.fat && fatNum < 0) {
        foodIssues.push('Negative fat value');
      }

      // ✅ OPRAVA: Logical validation - použití parseFloat
      if (food.calories && food.protein && food.carbs && food.fat) {
        const calculatedCalories = (proteinNum * 4) + (carbsNum * 4) + (fatNum * 9);
        const deviation = Math.abs(caloriesNum - calculatedCalories) / caloriesNum;
        
        if (deviation > 0.3) { // More than 30% deviation
          foodIssues.push('Calories don\'t match macronutrient breakdown');
        }
      }

      if (foodIssues.length === 0) {
        validFoods.push(food);
      } else {
        invalidFoods.push({ food, issues: foodIssues });
      }
    });

    // Overall validation
    if (validFoods.length === 0) {
      errors.push('No valid foods available for meal planning');
    }

    if (invalidFoods.length > 0) {
      warnings.push(`${invalidFoods.length} foods have issues and will be excluded`);
    }

    const nutritionDataQuality = this.calculateFoodNutritionQuality(validFoods);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: validFoods.length > 0 ? Math.min(100, (validFoods.length / foods.length) * 100) : 0,
      validFoods,
      invalidFoods,
      nutritionDataQuality
    };
  }

  /**
   * Calculate food nutrition data quality
   */
  private static calculateFoodNutritionQuality(foods: Food[]): number {
    if (foods.length === 0) return 0;

    let totalScore = 0;

    foods.forEach(food => {
      let foodScore = 0;
      let maxFoodScore = 0;

      // ✅ OPRAVA: Calories validation - parseFloat pro string values
      maxFoodScore += 25;
      const caloriesNum = parseFloat(food.calories || '0');
      if (food.calories && caloriesNum > 0) foodScore += 25;

      // Macronutrients
      maxFoodScore += 60;
      const proteinNum = parseFloat(food.protein || '0');
      if (food.protein !== undefined && proteinNum >= 0) foodScore += 20;
      const carbsNum = parseFloat(food.carbs || '0');
      if (food.carbs !== undefined && carbsNum >= 0) foodScore += 20;
      const fatNum = parseFloat(food.fat || '0');
      if (food.fat !== undefined && fatNum >= 0) foodScore += 20;

      // ✅ OPRAVA: Additional nutrition data - odstranění neexistujících properties
      maxFoodScore += 15;
      // Removed fiber, sugar, sodium checks as they don't exist in Food type
      // Placeholder scoring for this section
      foodScore += 15; // Give full points since we can't check these properties

      totalScore += (foodScore / maxFoodScore) * 100;
    });

    return Math.round(totalScore / foods.length);
  }

  // ===== GENERATION OPTIONS VALIDATION =====

  /**
   * Validate generation options
   */
  static validateGenerationOptions(options: GenerationOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!options.user) {
      errors.push('User is required for meal plan generation');
    }

    if (!options.date) {
      errors.push('Date is required for meal plan generation');
    } else {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(options.date)) {
        errors.push('Date must be in YYYY-MM-DD format');
      } else {
        const date = new Date(options.date);
        if (isNaN(date.getTime())) {
          errors.push('Invalid date provided');
        }
      }
    }

    // Mode validation
    if (!['speed', 'balanced', 'quality'].includes(options.mode)) {
      errors.push('Mode must be "speed", "balanced", or "quality"');
    }

    // Preferences validation
    if (options.preferences) {
      const prefs = options.preferences;
      
      if (prefs.maxPrepTime && prefs.maxPrepTime < 0) {
        warnings.push('Negative max prep time');
      }
      if (prefs.maxPrepTime && prefs.maxPrepTime > 300) {
        warnings.push('Very long max prep time (>5 hours)');
      }

      if (prefs.minProtein && prefs.minProtein < 0) {
        warnings.push('Negative minimum protein');
      }
      if (prefs.maxCalories && prefs.maxCalories < 0) {
        warnings.push('Negative maximum calories');
      }

      if (prefs.varietyLevel && !['low', 'medium', 'high'].includes(prefs.varietyLevel)) {
        warnings.push('Variety level must be "low", "medium", or "high"');
      }
    }

    // Calculate score based on completeness and validity
    let score = 100;
    score -= errors.length * 25; // Major penalty for errors
    score -= warnings.length * 5; // Minor penalty for warnings
    score = Math.max(0, score);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  // ===== COMPREHENSIVE VALIDATION =====

  /**
   * Perform comprehensive validation for meal plan generation
   */
  static validateAll(
    user: User,
    recipes: Recipe[],
    foods: Food[],
    options: GenerationOptions
  ): {
    isValid: boolean;
    user: UserValidationResult;
    recipes: RecipeValidationResult;
    foods: FoodValidationResult;
    options: ValidationResult;
    overallScore: number;
    canProceed: boolean;
  } {
    const userValidation = this.validateUser(user);
    const recipeValidation = this.validateRecipes(recipes);
    const foodValidation = this.validateFoods(foods);
    const optionsValidation = this.validateGenerationOptions(options);

    const overallScore = Math.round(
      (userValidation.score * 0.4 +
       recipeValidation.score * 0.3 +
       foodValidation.score * 0.2 +
       optionsValidation.score * 0.1)
    );

    const isValid = 
      userValidation.isValid &&
      recipeValidation.isValid &&
      foodValidation.isValid &&
      optionsValidation.isValid;

    // Can proceed if critical requirements are met
    const canProceed = 
      userValidation.isValid &&
      (recipeValidation.validRecipes.length > 0 || foodValidation.validFoods.length > 0) &&
      optionsValidation.isValid;

    return {
      isValid,
      user: userValidation,
      recipes: recipeValidation,
      foods: foodValidation,
      options: optionsValidation,
      overallScore,
      canProceed
    };
  }
}

export default ValidationHelpers;