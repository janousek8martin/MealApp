// src/services/mealPlanGenerator/HybridMealPlanGenerator.ts
import { User } from '../../stores/userStore';
import { Recipe, Food } from '../../stores/recipeStore';
import { MealPlan, Meal } from '../../types/meal';
import { NutritionCalculator, MealNutritionalTargets } from './preparation/NutritionCalculator';
import { RecipeFilteringEngine, FilterCriteria } from './preparation/RecipeFiltering';
import { MultiDimensionalKnapsack, KnapsackItem, KnapsackConstraints } from './optimization/MultiDimensionalKnapsack';

export interface GenerationOptions {
  user: User;
  date: string;
  mode: 'speed' | 'balanced' | 'quality';
  weekPlan?: boolean;
  preferences?: {
    avoidIngredients?: string[];
    varietyLevel?: 'low' | 'medium' | 'high';
    maxPrepTime?: number;
    minProtein?: number;
    maxCalories?: number;
  };
}

export interface QualityMetrics {
  overall: number; // 0-100
  nutritionalAccuracy: number;
  varietyScore: number;
  constraintCompliance: number;
  userPreferenceAlignment: number;
  breakdown: {
    macroAccuracy: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    constraints: {
      satisfied: number;
      total: number;
      critical: number;
    };
    variety: {
      ingredientDiversity: number;
      recipeRepetition: number;
      categoryBalance: number;
    };
  };
}

export interface GenerationResult {
  success: boolean;
  mealPlan?: MealPlan;
  weekPlan?: MealPlan[];
  quality: QualityMetrics;
  generationTime: number; // ms
  error?: string;
  warnings?: string[];
  metadata: {
    algorithmsUsed: string[];
    iterationsCompleted: number;
    recipesConsidered: number;
    finalOptimality: number;
  };
}

/**
 * Main Hybrid Meal Plan Generator
 * Orchestrates the 5-stage generation pipeline
 */
export class HybridMealPlanGenerator {
  
  /**
   * Generate a meal plan using the hybrid approach
   */
  static async generate(
    recipes: Recipe[],
    foods: Food[],
    options: GenerationOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    
    console.log(`🎯 Starting Hybrid Generation for ${options.date} (mode: ${options.mode})`);
    
    try {
      // ===== STAGE 1: PREPARATION & VALIDATION =====
      const preparationResult = await this.prepareGeneration(options, warnings);
      if (!preparationResult.success) {
        return this.createErrorResult(preparationResult.error!, startTime);
      }
      
      const { dailyTargets, mealTargets } = preparationResult;
      
      // ===== STAGE 2: PRE-FILTERING =====
      const filteringResult = await this.performPreFiltering(
        recipes, 
        foods, 
        options.user, 
        mealTargets,
        options.preferences
      );
      
      if (filteringResult.eligible.length === 0) {
        return this.createErrorResult('No suitable recipes found after filtering', startTime);
      }
      
      console.log(`🔍 Pre-filtering: ${filteringResult.eligible.length}/${filteringResult.stats.totalProcessed} items eligible`);
      
      // ===== STAGE 3: KNAPSACK OPTIMIZATION =====
      const optimizationResult = await this.performOptimization(
        filteringResult.eligible,
        mealTargets,
        options
      );
      
      if (!optimizationResult.feasible) {
        warnings.push('Optimization could not find feasible solution, using best approximation');
      }
      
      console.log(`⚙️ Optimization: ${optimizationResult.selectedItems.length} items selected, value: ${optimizationResult.totalValue.toFixed(2)}`);
      
      // ===== STAGE 4: MEAL PLAN CONSTRUCTION =====
      const mealPlan = await this.constructMealPlan(
        optimizationResult.selectedItems,
        mealTargets,
        options
      );
      
      // ===== STAGE 5: QUALITY EVALUATION =====
      const quality = await this.evaluateQuality(
        mealPlan,
        dailyTargets,
        options.user,
        recipes,
        foods
      );
      
      const generationTime = Date.now() - startTime;
      
      console.log(`✅ Generation complete in ${generationTime}ms, quality: ${quality.overall.toFixed(1)}/100`);
      
      return {
        success: true,
        mealPlan,
        quality,
        generationTime,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
          algorithmsUsed: ['pre-filtering', 'knapsack-optimization', 'local-search'],
          iterationsCompleted: 1,
          recipesConsidered: filteringResult.stats.totalProcessed,
          finalOptimality: optimizationResult.optimality
        }
      };
      
    } catch (error) {
      console.error('❌ Generation failed:', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      );
    }
  }

  // ===== STAGE IMPLEMENTATIONS =====

  /**
   * Stage 1: Prepare and validate generation parameters
   */
  private static async prepareGeneration(
    options: GenerationOptions,
    warnings: string[]
  ): Promise<{
    success: boolean;
    error?: string;
    dailyTargets?: any;
    mealTargets?: MealNutritionalTargets[];
  }> {
    // Validate user data
    if (!options.user.tdci?.adjustedTDCI) {
      return { success: false, error: 'User TDCI not calculated' };
    }
    
    if (!options.user.mealPreferences) {
      return { success: false, error: 'User meal preferences not set' };
    }
    
    // Calculate nutritional targets
    try {
      const dailyTargets = NutritionCalculator.calculateDailyTargets(options.user);
      const mealTargets = NutritionCalculator.calculateMealTargets(options.user, dailyTargets);
      
      if (mealTargets.length === 0) {
        return { success: false, error: 'No meal targets calculated' };
      }
      
      console.log(`📊 Daily targets: ${dailyTargets.calories} kcal, ${mealTargets.length} meals`);
      
      return {
        success: true,
        dailyTargets,
        mealTargets
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to calculate targets: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Stage 2: Pre-filter recipes and foods
   */
  private static async performPreFiltering(
    recipes: Recipe[],
    foods: Food[],
    user: User,
    mealTargets: MealNutritionalTargets[],
    preferences?: GenerationOptions['preferences']
  ) {
    // Apply avoidance filters first
    const avoidanceResult = RecipeFilteringEngine.applyAvoidanceFilters(recipes, foods, user);
    
    let eligibleRecipes = avoidanceResult.recipes;
    let eligibleFoods = avoidanceResult.foods;
    
    // Apply preference-based filtering
    if (preferences?.maxPrepTime) {
      eligibleRecipes = eligibleRecipes.filter(recipe => {
        const prepTime = parseFloat(recipe.prepTime || '0');
        const cookTime = parseFloat(recipe.cookTime || '0');
        return (prepTime + cookTime) <= preferences.maxPrepTime!;
      });
    }
    
    // Combine all eligible items with basic scoring
    const allEligibleItems = [
      ...eligibleRecipes.map(recipe => ({
        item: recipe,
        type: 'recipe' as const,
        score: 70, // Base score for recipes
        reasons: ['Passed basic filtering'],
        constraints: {
          nutritionalFit: 70,
          userPreference: 70,
          availability: 80,
          variety: 70
        }
      })),
      ...eligibleFoods.map(food => ({
        item: food,
        type: 'food' as const,
        score: 60, // Slightly lower base score for foods
        reasons: ['Passed basic filtering'],
        constraints: {
          nutritionalFit: 60,
          userPreference: 70,
          availability: 90,
          variety: 60
        }
      }))
    ];
    
    return {
      eligible: allEligibleItems,
      rejected: avoidanceResult.filtered.map(f => ({
        item: { name: f.name } as any,
        type: 'unknown' as const,
        reason: f.reason
      })),
      stats: {
        totalProcessed: recipes.length + foods.length,
        eligibleCount: allEligibleItems.length,
        rejectedCount: avoidanceResult.filtered.length,
        averageScore: allEligibleItems.reduce((sum, item) => sum + item.score, 0) / allEligibleItems.length,
        topScore: Math.max(...allEligibleItems.map(item => item.score))
      }
    };
  }

  /**
   * Stage 3: Knapsack optimization
   */
  private static async performOptimization(
    eligibleItems: any[],
    mealTargets: MealNutritionalTargets[],
    options: GenerationOptions
  ) {
    // Convert filtered items to knapsack items
    const knapsackItems: KnapsackItem[] = [];
    
    eligibleItems.forEach(filtered => {
      mealTargets.forEach(mealTarget => {
        if (filtered.type === 'recipe') {
          const recipe = filtered.item as Recipe;
          // Check if recipe is suitable for this meal type
          if (this.isRecipeSuitableForMeal(recipe, mealTarget)) {
            knapsackItems.push(
              MultiDimensionalKnapsack.recipeToKnapsackItem(recipe, mealTarget, filtered.score)
            );
          }
        } else if (filtered.type === 'food') {
          const food = filtered.item as Food;
          knapsackItems.push(
            MultiDimensionalKnapsack.foodToKnapsackItem(food, mealTarget, filtered.score)
          );
        }
      });
    });
    
    // Create constraints from meal targets
    const constraints = MultiDimensionalKnapsack.createConstraintsFromTargets(mealTargets, {
      tolerancePercent: options.mode === 'speed' ? 30 : options.mode === 'balanced' ? 20 : 15,
      maxPrepTime: options.preferences?.maxPrepTime || 90,
      maxCost: 100
    });
    
    // Solve knapsack
    const algorithm = options.mode === 'speed' ? 'greedy' : 
                     options.mode === 'balanced' ? 'hybrid' : 'dynamic';
    
    return MultiDimensionalKnapsack.solve(knapsackItems, constraints, {
      algorithm,
      timeLimit: options.mode === 'speed' ? 2000 : options.mode === 'balanced' ? 5000 : 10000
    });
  }

  /**
   * Stage 4: Construct final meal plan
   */
  private static async constructMealPlan(
    selectedItems: KnapsackItem[],
    mealTargets: MealNutritionalTargets[],
    options: GenerationOptions
  ): Promise<MealPlan> {
    const meals: Meal[] = [];
    
    // Group selected items by meal type and position
    const mealGroups = new Map<string, KnapsackItem[]>();
    
    selectedItems.forEach(item => {
      const key = item.metadata.position || item.metadata.mealType;
      if (!mealGroups.has(key)) {
        mealGroups.set(key, []);
      }
      mealGroups.get(key)!.push(item);
    });
    
    // Create meals from groups
    mealGroups.forEach((items, mealKey) => {
      items.forEach((item, index) => {
        const meal: Meal = {
          id: `${item.id}-${Date.now()}-${index}`,
          type: item.metadata.mealType as any,
          name: item.name,
          position: item.metadata.position,
          userId: options.user.id,
          date: options.date
        };
        meals.push(meal);
      });
    });
    
    // Ensure we have meals for all required meal types
    mealTargets.forEach(target => {
      const mealKey = target.position || target.mealType;
      if (!mealGroups.has(mealKey)) {
        // Add a placeholder meal if none was selected
        const meal: Meal = {
          id: `placeholder-${Date.now()}-${Math.random()}`,
          type: target.mealType as any,
          name: `Default ${target.mealType}`,
          position: target.position,
          userId: options.user.id,
          date: options.date
        };
        meals.push(meal);
      }
    });
    
    return {
      id: `plan-${options.user.id}-${options.date}`,
      userId: options.user.id,
      date: options.date,
      meals
    };
  }

  /**
   * Stage 5: Evaluate solution quality
   */
  private static async evaluateQuality(
    mealPlan: MealPlan,
    dailyTargets: any,
    user: User,
    recipes: Recipe[],
    foods: Food[]
  ): Promise<QualityMetrics> {
    // Calculate nutritional accuracy
    const nutritionalAnalysis = NutritionCalculator.analyzeMealPlanCompliance(
      mealPlan.meals,
      recipes,
      foods,
      dailyTargets
    );
    
    // Calculate variety score
    const uniqueRecipes = new Set(mealPlan.meals.map(m => m.name)).size;
    const totalMeals = mealPlan.meals.length;
    const varietyScore = totalMeals > 0 ? (uniqueRecipes / totalMeals) * 100 : 0;
    
    // Calculate constraint compliance
    const constraintCompliance = nutritionalAnalysis.compliance === 'excellent' ? 95 :
                               nutritionalAnalysis.compliance === 'good' ? 80 :
                               nutritionalAnalysis.compliance === 'acceptable' ? 65 : 40;
    
    // Calculate nutritional accuracy score
    const avgDeviation = (
      Math.abs(nutritionalAnalysis.deviation.calories) +
      Math.abs(nutritionalAnalysis.deviation.protein) +
      Math.abs(nutritionalAnalysis.deviation.carbs) +
      Math.abs(nutritionalAnalysis.deviation.fat)
    ) / 4;
    
    const nutritionalAccuracy = Math.max(0, 100 - avgDeviation);
    
    // User preference alignment (simplified)
    const userPreferenceAlignment = 75; // Base score, would be enhanced with ML
    
    // Overall score (weighted average)
    const overall = (
      nutritionalAccuracy * 0.35 +
      varietyScore * 0.25 +
      constraintCompliance * 0.25 +
      userPreferenceAlignment * 0.15
    );
    
    return {
      overall,
      nutritionalAccuracy,
      varietyScore,
      constraintCompliance,
      userPreferenceAlignment,
      breakdown: {
        macroAccuracy: {
          calories: nutritionalAnalysis.deviation.calories,
          protein: nutritionalAnalysis.deviation.protein,
          carbs: nutritionalAnalysis.deviation.carbs,
          fat: nutritionalAnalysis.deviation.fat
        },
        constraints: {
          satisfied: constraintCompliance > 60 ? 4 : constraintCompliance > 40 ? 3 : 2,
          total: 4,
          critical: constraintCompliance > 80 ? 4 : constraintCompliance > 60 ? 3 : 2
        },
        variety: {
          ingredientDiversity: varietyScore,
          recipeRepetition: Math.max(0, 100 - ((totalMeals - uniqueRecipes) * 20)),
          categoryBalance: 75 // Placeholder
        }
      }
    };
  }

  // ===== UTILITY METHODS =====

  /**
   * Check if recipe is suitable for specific meal
   */
  private static isRecipeSuitableForMeal(recipe: Recipe, mealTarget: MealNutritionalTargets): boolean {
    // Main meals
    if (['Breakfast', 'Lunch', 'Dinner'].includes(mealTarget.mealType)) {
      return recipe.categories.includes(mealTarget.mealType);
    }
    
    // Snacks
    if (mealTarget.mealType === 'Snack') {
      return recipe.categories.includes('Snack') ||
             recipe.categories.includes('Appetizer') ||
             recipe.categories.includes('Side Dish') ||
             parseFloat(recipe.calories || '0') < 300; // Small portions for snacks
    }
    
    return true;
  }

  /**
   * Create error result
   */
  private static createErrorResult(error: string, startTime: number): GenerationResult {
    return {
      success: false,
      error,
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
      generationTime: Date.now() - startTime,
      metadata: {
        algorithmsUsed: [],
        iterationsCompleted: 0,
        recipesConsidered: 0,
        finalOptimality: 0
      }
    };
  }
}

export default HybridMealPlanGenerator;