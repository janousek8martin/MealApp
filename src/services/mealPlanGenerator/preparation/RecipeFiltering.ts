// src/services/mealPlanGenerator/preparation/RecipeFiltering.ts
import { Recipe, Food } from '../../../stores/recipeStore';
import { User } from '../../../stores/userStore';
import { MealNutritionalTargets } from './NutritionCalculator';

export interface FilterCriteria {
  mealType: string;
  position?: string;
  nutritionalTargets: MealNutritionalTargets;
  user: User;
  contextFactors?: {
    timeOfDay?: string;
    dayOfWeek?: string;
    isWorkoutDay?: boolean;
    season?: 'spring' | 'summer' | 'fall' | 'winter';
    previousMeals?: string[]; // For variety
  };
}

export interface FilteredItem {
  item: Recipe | Food;
  type: 'recipe' | 'food';
  score: number; // 0-100, higher is better
  reasons: string[]; // Why this item was scored this way
  constraints: {
    nutritionalFit: number; // 0-100
    userPreference: number; // 0-100
    availability: number; // 0-100
    variety: number; // 0-100
  };
}

export interface FilterResults {
  eligible: FilteredItem[];
  rejected: Array<{
    item: Recipe | Food;
    type: 'recipe' | 'food';
    reason: string;
  }>;
  stats: {
    totalProcessed: number;
    eligibleCount: number;
    rejectedCount: number;
    averageScore: number;
    topScore: number;
  };
}

/**
 * Intelligent recipe/food filtering engine
 * Leverages existing filtering logic from recipeStore and adds ML-based improvements
 */
export class RecipeFilteringEngine {
  
  /**
   * Main filtering method - applies all constraints and scoring
   */
  static filterForMeal(
    recipes: Recipe[],
    foods: Food[],
    criteria: FilterCriteria
  ): FilterResults {
    const results: FilterResults = {
      eligible: [],
      rejected: [],
      stats: {
        totalProcessed: 0,
        eligibleCount: 0,
        rejectedCount: 0,
        averageScore: 0,
        topScore: 0
      }
    };

    // Process recipes
    recipes.forEach(recipe => {
      results.stats.totalProcessed++;
      const evaluation = this.evaluateRecipe(recipe, criteria);
      
      if (evaluation.isEligible) {
        results.eligible.push({
          item: recipe,
          type: 'recipe',
          score: evaluation.score,
          reasons: evaluation.reasons,
          constraints: evaluation.constraints
        });
        results.stats.eligibleCount++;
      } else {
        results.rejected.push({
          item: recipe,
          type: 'recipe',
          reason: evaluation.rejectionReason || 'Unknown'
        });
        results.stats.rejectedCount++;
      }
    });

    // Process foods
    foods.forEach(food => {
      results.stats.totalProcessed++;
      const evaluation = this.evaluateFood(food, criteria);
      
      if (evaluation.isEligible) {
        results.eligible.push({
          item: food,
          type: 'food',
          score: evaluation.score,
          reasons: evaluation.reasons,
          constraints: evaluation.constraints
        });
        results.stats.eligibleCount++;
      } else {
        results.rejected.push({
          item: food,
          type: 'food',
          reason: evaluation.rejectionReason || 'Unknown'
        });
        results.stats.rejectedCount++;
      }
    });

    // Sort eligible items by score (highest first)
    results.eligible.sort((a, b) => b.score - a.score);

    // Calculate stats
    if (results.eligible.length > 0) {
      results.stats.averageScore = results.eligible.reduce((sum, item) => sum + item.score, 0) / results.eligible.length;
      results.stats.topScore = results.eligible[0].score;
    }

    return results;
  }

  /**
   * Apply user's avoid meals preferences (leverages existing avoidMeals logic)
   */
  static applyAvoidanceFilters(recipes: Recipe[], foods: Food[], user: User): {
    recipes: Recipe[];
    foods: Food[];
    filtered: Array<{ name: string; reason: string }>;
  } {
    const filtered: Array<{ name: string; reason: string }> = [];
    
    // ✅ OPRAVA: Správné typování user.avoidMeals s explicit type assertion
    let avoidList: string[] = [];
    if (user.avoidMeals) {
      if (Array.isArray(user.avoidMeals)) {
        avoidList = user.avoidMeals;
      } else if (typeof user.avoidMeals === 'object' && user.avoidMeals !== null) {
        // Type assertion pro objekt s foodTypes a allergens
        const avoidObj = user.avoidMeals as { foodTypes?: string[]; allergens?: string[] };
        avoidList = [...(avoidObj.foodTypes || []), ...(avoidObj.allergens || [])];
      }
    }

    // Filter recipes
    const filteredRecipes = recipes.filter(recipe => {
      // Check food types
      if (recipe.foodTypes && recipe.foodTypes.some(type => avoidList.includes(type))) {
        filtered.push({ name: recipe.name, reason: `Contains avoided food type` });
        return false;
      }

      // Check allergens
      if (recipe.allergens && recipe.allergens.some(allergen => avoidList.includes(allergen))) {
        filtered.push({ name: recipe.name, reason: `Contains allergen` });
        return false;
      }

      // Check ingredients (basic name matching)
      if (recipe.ingredients && recipe.ingredients.some(ingredient => 
        avoidList.some(avoid => ingredient.name.toLowerCase().includes(avoid.toLowerCase()))
      )) {
        filtered.push({ name: recipe.name, reason: `Contains avoided ingredient` });
        return false;
      }

      return true;
    });

    // Filter foods (simpler logic)
    const filteredFoods = foods.filter(food => {
      if (avoidList.some(avoid => food.name.toLowerCase().includes(avoid.toLowerCase()))) {
        filtered.push({ name: food.name, reason: `Food is in avoid list` });
        return false;
      }
      return true;
    });

    return {
      recipes: filteredRecipes,
      foods: filteredFoods,
      filtered
    };
  }

  /**
   * Apply meal type and category filtering (leverages existing category logic)
   */
  static filterByMealType(recipes: Recipe[], foods: Food[], mealType: string, position?: string): {
    recipes: Recipe[];
    foods: Food[];
  } {
    // Filter recipes by categories
    const filteredRecipes = recipes.filter(recipe => {
      // Must have appropriate category for meal type
      if (!recipe.categories || recipe.categories.length === 0) return false;
      
      // Main meals
      if (['Breakfast', 'Lunch', 'Dinner'].includes(mealType)) {
        return recipe.categories.includes(mealType);
      }
      
      // Snacks
      if (mealType === 'Snack') {
        return recipe.categories.includes('Snack') || 
               recipe.categories.includes('Appetizer') ||
               recipe.categories.includes('Side Dish');
      }
      
      return true;
    });

    // Foods are generally suitable for any meal type, but we can add logic here
    const filteredFoods = foods.filter(food => {
      // Simple category-based filtering for foods
      if (food.category) {
        // Fruits are good for breakfast and snacks
        if (mealType === 'Breakfast' || mealType === 'Snack') {
          return ['Fruit', 'Dairy', 'Nuts', 'Grains'].includes(food.category);
        }
        
        // Main meals can include more substantial foods
        if (['Lunch', 'Dinner'].includes(mealType)) {
          return ['Protein', 'Meat', 'Fish', 'Vegetable', 'Grains', 'Dairy'].includes(food.category);
        }
      }
      
      return true; // Default to including if no clear category rules
    });

    return {
      recipes: filteredRecipes,
      foods: filteredFoods
    };
  }

  /**
   * Apply contextual filters (workout days, time of day, season)
   */
  static applyContextualFilters(
    recipes: Recipe[],
    foods: Food[],
    context: FilterCriteria['contextFactors'],
    user: User
  ): { recipes: Recipe[]; foods: Food[] } {
    if (!context) return { recipes, foods };

    let filteredRecipes = [...recipes];
    let filteredFoods = [...foods];

    // Workout day preferences
    if (context.isWorkoutDay && user.workoutDays) {
      // Prefer higher protein options on workout days
      filteredRecipes = filteredRecipes.filter(recipe => {
        const protein = parseFloat(recipe.protein || '0');
        const calories = parseFloat(recipe.calories || '1');
        const proteinRatio = (protein * 4) / calories;
        return proteinRatio >= 0.15; // At least 15% protein
      });
    }

    // Time-based filtering
    if (context.timeOfDay) {
      if (context.timeOfDay === 'morning') {
        // Prefer lighter, energizing foods for morning
        filteredRecipes = filteredRecipes.filter(recipe => {
          const prepTime = parseFloat(recipe.prepTime || '0');
          const cookTime = parseFloat(recipe.cookTime || '0');
          return (prepTime + cookTime) <= 30; // Quick morning meals
        });
      }
    }

    // Seasonal preferences
    if (context.season) {
      // This could be expanded with seasonal ingredient preferences
      // For now, just basic logic
      if (context.season === 'summer') {
        // ✅ OPRAVA: Bezpečná kontrola pro instructions array
        filteredRecipes = filteredRecipes.filter(recipe => {
          if (!recipe.instructions || !Array.isArray(recipe.instructions)) {
            return true; // Skip filtering if no instructions
          }
          const instructionsText = recipe.instructions.join(' ').toLowerCase();
          return !instructionsText.includes('bake') && !instructionsText.includes('oven');
        });
      }
    }

    return {
      recipes: filteredRecipes,
      foods: filteredFoods
    };
  }

  // ===== PRIVATE EVALUATION METHODS =====

  private static evaluateRecipe(recipe: Recipe, criteria: FilterCriteria): {
    isEligible: boolean;
    score: number;
    reasons: string[];
    constraints: FilteredItem['constraints'];
    rejectionReason?: string;
  } {
    const reasons: string[] = [];
    let score = 50; // Base score

    // Nutritional fit scoring
    const nutritionalFit = this.scoreNutritionalFit(recipe, criteria.nutritionalTargets);
    score += (nutritionalFit - 50) * 0.4; // 40% weight
    reasons.push(`Nutritional fit: ${nutritionalFit.toFixed(0)}/100`);

    // User preference scoring
    const userPreference = this.scoreUserPreference(recipe, criteria.user);
    score += (userPreference - 50) * 0.3; // 30% weight
    reasons.push(`User preference: ${userPreference.toFixed(0)}/100`);

    // Availability scoring (based on ingredient complexity)
    const availability = this.scoreAvailability(recipe);
    score += (availability - 50) * 0.2; // 20% weight
    reasons.push(`Availability: ${availability.toFixed(0)}/100`);

    // Variety scoring (based on previous meals)
    const variety = this.scoreVariety(recipe, criteria.contextFactors?.previousMeals || []);
    score += (variety - 50) * 0.1; // 10% weight
    reasons.push(`Variety: ${variety.toFixed(0)}/100`);

    // Hard constraints check
    if (nutritionalFit < 20) {
      return {
        isEligible: false,
        score: 0,
        reasons,
        constraints: { nutritionalFit, userPreference, availability, variety },
        rejectionReason: 'Poor nutritional fit'
      };
    }

    if (userPreference < 10) {
      return {
        isEligible: false,
        score: 0,
        reasons,
        constraints: { nutritionalFit, userPreference, availability, variety },
        rejectionReason: 'User preferences not met'
      };
    }

    return {
      isEligible: true,
      score: Math.max(0, Math.min(100, score)),
      reasons,
      constraints: { nutritionalFit, userPreference, availability, variety }
    };
  }

  private static evaluateFood(food: Food, criteria: FilterCriteria): {
    isEligible: boolean;
    score: number;
    reasons: string[];
    constraints: FilteredItem['constraints'];
    rejectionReason?: string;
  } {
    const reasons: string[] = [];
    let score = 40; // Base score (slightly lower than recipes)

    // Nutritional fit
    const nutritionalFit = this.scoreFoodNutritionalFit(food, criteria.nutritionalTargets);
    score += (nutritionalFit - 50) * 0.5; // Higher weight for foods

    // Simpler scoring for foods
    const userPreference = 70; // Default assumption
    const availability = 90; // Foods are generally more available
    const variety = this.scoreFoodVariety(food, criteria.contextFactors?.previousMeals || []);

    return {
      isEligible: nutritionalFit > 15, // Lower threshold for foods
      score: Math.max(0, Math.min(100, score)),
      reasons: [`Nutritional fit: ${nutritionalFit.toFixed(0)}/100`],
      constraints: { nutritionalFit, userPreference, availability, variety }
    };
  }

  private static scoreNutritionalFit(recipe: Recipe, targets: MealNutritionalTargets): number {
    const recipeCalories = parseFloat(recipe.calories || '0');
    const recipeProtein = parseFloat(recipe.protein || '0');
    const recipeCarbs = parseFloat(recipe.carbs || '0');
    const recipeFat = parseFloat(recipe.fat || '0');

    const targetCalories = targets.targets.calories;
    const targetProtein = targets.targets.protein;
    const targetCarbs = targets.targets.carbs;
    const targetFat = targets.targets.fat;

    // Calculate deviations
    const calorieDeviation = Math.abs((recipeCalories - targetCalories) / targetCalories) * 100;
    const proteinDeviation = Math.abs((recipeProtein - targetProtein) / targetProtein) * 100;
    const carbsDeviation = Math.abs((recipeCarbs - targetCarbs) / targetCarbs) * 100;
    const fatDeviation = Math.abs((recipeFat - targetFat) / targetFat) * 100;

    // Calculate weighted average (calories most important)
    const averageDeviation = (
      calorieDeviation * 0.4 +
      proteinDeviation * 0.25 +
      carbsDeviation * 0.2 +
      fatDeviation * 0.15
    );

    // Convert to score (lower deviation = higher score)
    return Math.max(0, 100 - averageDeviation);
  }

  private static scoreFoodNutritionalFit(food: Food, targets: MealNutritionalTargets): number {
    // Simpler scoring for individual foods
    const foodCalories = parseFloat(food.calories || '0');
    const targetCalories = targets.targets.calories;
    
    // Foods shouldn't exceed meal targets significantly
    if (foodCalories > targetCalories * 1.5) return 10;
    if (foodCalories > targetCalories) return 50;
    
    // Score based on how well it fits as a component
    const ratio = foodCalories / targetCalories;
    if (ratio >= 0.1 && ratio <= 0.8) return 80; // Good component size
    if (ratio < 0.1) return 60; // Very small component
    return 40; // Too large for component
  }

  private static scoreUserPreference(recipe: Recipe, user: User): number {
    let score = 50; // Base score

    // Check against workout days
    if (user.workoutDays && user.workoutDays.length > 0) {
      const protein = parseFloat(recipe.protein || '0');
      const calories = parseFloat(recipe.calories || '1');
      const proteinRatio = (protein * 4) / calories;
      
      if (proteinRatio > 0.2) score += 20; // High protein bonus
    }

    // Prep time preferences (assume users prefer quicker meals)
    const prepTime = parseFloat(recipe.prepTime || '0');
    const cookTime = parseFloat(recipe.cookTime || '0');
    const totalTime = prepTime + cookTime;
    
    if (totalTime <= 15) score += 15;
    else if (totalTime <= 30) score += 10;
    else if (totalTime > 60) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private static scoreAvailability(recipe: Recipe): number {
    // Score based on ingredient complexity and commonality
    let score = 80; // Base assumption of good availability

    const ingredientCount = recipe.ingredients?.length || 0;
    
    // Penalize for too many ingredients
    if (ingredientCount > 10) score -= 20;
    else if (ingredientCount > 6) score -= 10;
    
    // Bonus for simple recipes
    if (ingredientCount <= 4) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private static scoreVariety(recipe: Recipe, previousMeals: string[]): number {
    // Check if recipe was used recently
    if (previousMeals.includes(recipe.name)) {
      return 20; // Low variety score if recently used
    }

    // Check ingredient overlap with previous meals
    // This would require more sophisticated tracking
    return 80; // Default good variety score
  }

  private static scoreFoodVariety(food: Food, previousMeals: string[]): number {
    if (previousMeals.includes(food.name)) {
      return 30;
    }
    return 85;
  }
}

export default RecipeFilteringEngine;