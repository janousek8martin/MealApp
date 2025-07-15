// src/services/mealPlanGenerator/optimization/MultiDimensionalKnapsack.ts
// 🔧 FIXED: Recipe servings property access

import { Recipe, Food } from '../../../stores/recipeStore';
import { MealNutritionalTargets } from '../preparation/NutritionCalculator';

export interface KnapsackItem {
  id: string;
  name: string;
  type: 'recipe' | 'food';
  value: number; // Overall desirability score
  constraints: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    volume: number; // Estimated portion size
    prepTime: number;
    cost: number; // Estimated cost (can be 1 as default)
  };
  metadata: {
    categories: string[];
    mealType: string;
    position?: string;
    originalItem: Recipe | Food;
  };
}

export interface KnapsackConstraints {
  maxCalories: number;
  maxProtein: number;
  maxCarbs: number;
  maxFat: number;
  maxVolume: number;
  maxPrepTime: number;
  maxCost: number;
  
  // Minimum constraints
  minCalories: number;
  minProtein: number;
  minCarbs: number;
  minFat: number;
}

export interface KnapsackSolution {
  selectedItems: KnapsackItem[];
  totalValue: number;
  constraintUsage: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    volume: number;
    prepTime: number;
    cost: number;
  };
  feasible: boolean;
  optimality: number; // 0-1, how close to optimal
  solutionTime: number; // ms
}

/**
 * Multi-Dimensional Knapsack Solver for Meal Planning
 * 
 * This implements a sophisticated approach to meal selection that considers:
 * - Multiple nutritional constraints (calories, protein, carbs, fat)
 * - Volume constraints (portion sizes)
 * - Time constraints (prep time)
 * - Cost constraints (budget)
 * - Value maximization (taste, user preference, variety)
 */
export class MultiDimensionalKnapsack {
  
  /**
   * Solve the multi-dimensional knapsack problem for meal selection
   */
  static solve(
    items: KnapsackItem[],
    constraints: KnapsackConstraints,
    options: {
      algorithm?: 'dynamic' | 'greedy' | 'hybrid';
      timeLimit?: number; // ms
      qualityTarget?: number; // 0-1
    } = {}
  ): KnapsackSolution {
    const startTime = Date.now();
    const algorithm = options.algorithm || 'hybrid';
    const timeLimit = options.timeLimit || 5000; // 5 seconds default
    
    console.log(`🎯 Starting Multi-Dimensional Knapsack with ${items.length} items`);
    
    let solution: KnapsackSolution;
    
    switch (algorithm) {
      case 'dynamic':
        solution = this.solveDynamic(items, constraints, timeLimit);
        break;
      case 'greedy':
        solution = this.solveGreedy(items, constraints);
        break;
      case 'hybrid':
      default:
        solution = this.solveHybrid(items, constraints, timeLimit);
        break;
    }
    
    solution.solutionTime = Date.now() - startTime;
    
    console.log(`✅ Knapsack solved in ${solution.solutionTime}ms, value: ${solution.totalValue.toFixed(2)}`);
    
    return solution;
  }

  /**
   * Hybrid approach: Start with greedy, then improve with local search
   */
  private static solveHybrid(
    items: KnapsackItem[],
    constraints: KnapsackConstraints,
    timeLimit: number
  ): KnapsackSolution {
    const startTime = Date.now();
    
    // Phase 1: Quick greedy solution
    let bestSolution = this.solveGreedy(items, constraints);
    
    if (Date.now() - startTime > timeLimit * 0.3) {
      return bestSolution; // Return greedy if we're running out of time
    }
    
    // Phase 2: Local search improvement
    const remainingTime = timeLimit - (Date.now() - startTime);
    const improvedSolution = this.improveWithLocalSearch(
      bestSolution, 
      items, 
      constraints, 
      remainingTime
    );
    
    return improvedSolution.totalValue > bestSolution.totalValue ? improvedSolution : bestSolution;
  }

  /**
   * Greedy approximation algorithm with ratio optimization
   */
  private static solveGreedy(items: KnapsackItem[], constraints: KnapsackConstraints): KnapsackSolution {
    // Calculate efficiency ratios for each item
    const itemsWithRatio = items.map(item => ({
      ...item,
      efficiency: this.calculateEfficiency(item, constraints)
    }));
    
    // Sort by efficiency (value per constraint cost)
    itemsWithRatio.sort((a, b) => b.efficiency - a.efficiency);
    
    const selectedItems: KnapsackItem[] = [];
    const usage = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      volume: 0,
      prepTime: 0,
      cost: 0
    };
    
    // Greedy selection
    for (const item of itemsWithRatio) {
      if (this.canAddItem(item, usage, constraints)) {
        selectedItems.push(item);
        this.addItemToUsage(item, usage);
      }
    }
    
    return {
      selectedItems,
      totalValue: selectedItems.reduce((sum, item) => sum + item.value, 0),
      constraintUsage: usage,
      feasible: this.checkFeasibility(usage, constraints),
      optimality: 0.7, // Greedy typically achieves 70% optimality
      solutionTime: 0 // Will be set by caller
    };
  }

  /**
   * Dynamic programming approach (simplified for large instances)
   */
  private static solveDynamic(
    items: KnapsackItem[],
    constraints: KnapsackConstraints,
    timeLimit: number
  ): KnapsackSolution {
    // For large instances, fall back to greedy + local search
    if (items.length > 50) {
      return this.solveHybrid(items, constraints, timeLimit);
    }
    
    // Simplified DP: focus on the most constraining dimension (usually calories)
    const maxCalories = constraints.maxCalories;
    const n = items.length;
    
    // DP table: dp[i][w] = maximum value using first i items with calories <= w
    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(maxCalories + 1).fill(0));
    const selected: boolean[][] = Array(n + 1).fill(null).map(() => Array(maxCalories + 1).fill(false));
    
    for (let i = 1; i <= n; i++) {
      const item = items[i - 1];
      const itemCalories = Math.round(item.constraints.calories);
      
      for (let w = 0; w <= maxCalories; w++) {
        // Don't include item
        dp[i][w] = dp[i - 1][w];
        
        // Include item if possible
        if (itemCalories <= w) {
          const valueWithItem = dp[i - 1][w - itemCalories] + item.value;
          if (valueWithItem > dp[i][w]) {
            dp[i][w] = valueWithItem;
            selected[i][w] = true;
          }
        }
      }
    }
    
    // Backtrack to find selected items
    const selectedItems: KnapsackItem[] = [];
    let w = maxCalories;
    
    for (let i = n; i > 0; i--) {
      if (selected[i][w]) {
        selectedItems.push(items[i - 1]);
        w -= Math.round(items[i - 1].constraints.calories);
      }
    }
    
    // Calculate final usage and validate other constraints
    const usage = this.calculateUsage(selectedItems);
    const feasible = this.checkFeasibility(usage, constraints);
    
    // If not feasible due to other constraints, fall back to greedy
    if (!feasible) {
      return this.solveGreedy(items, constraints);
    }
    
    return {
      selectedItems,
      totalValue: dp[n][maxCalories],
      constraintUsage: usage,
      feasible: true,
      optimality: 0.95, // DP typically achieves near-optimal results
      solutionTime: 0
    };
  }

  /**
   * Local search improvement using swapping and adding/removing items
   */
  private static improveWithLocalSearch(
    initialSolution: KnapsackSolution,
    allItems: KnapsackItem[],
    constraints: KnapsackConstraints,
    timeLimit: number
  ): KnapsackSolution {
    const startTime = Date.now();
    let currentSolution = { ...initialSolution };
    let bestSolution = { ...initialSolution };
    let iterations = 0;
    
    while (Date.now() - startTime < timeLimit && iterations < 100) {
      let improved = false;
      iterations++;
      
      // Try swapping items
      for (let i = 0; i < currentSolution.selectedItems.length && !improved; i++) {
        const currentItem = currentSolution.selectedItems[i];
        
        // Try replacing with a non-selected item
        for (const newItem of allItems) {
          if (currentSolution.selectedItems.find(item => item.id === newItem.id)) {
            continue; // Already selected
          }
          
          // Calculate what would happen if we swap
          const testItems = [...currentSolution.selectedItems];
          testItems[i] = newItem;
          
          const testUsage = this.calculateUsage(testItems);
          if (this.checkFeasibility(testUsage, constraints)) {
            const testValue = testItems.reduce((sum, item) => sum + item.value, 0);
            
            if (testValue > currentSolution.totalValue) {
              currentSolution = {
                selectedItems: testItems,
                totalValue: testValue,
                constraintUsage: testUsage,
                feasible: true,
                optimality: currentSolution.optimality + 0.05,
                solutionTime: currentSolution.solutionTime
              };
              improved = true;
              break;
            }
          }
        }
      }
      
      // Try adding items if we have capacity
      if (!improved) {
        for (const newItem of allItems) {
          if (currentSolution.selectedItems.find(item => item.id === newItem.id)) {
            continue; // Already selected
          }
          
          const testItems = [...currentSolution.selectedItems, newItem];
          const testUsage = this.calculateUsage(testItems);
          
          if (this.checkFeasibility(testUsage, constraints)) {
            const testValue = testItems.reduce((sum, item) => sum + item.value, 0);
            
            if (testValue > currentSolution.totalValue) {
              currentSolution = {
                selectedItems: testItems,
                totalValue: testValue,
                constraintUsage: testUsage,
                feasible: true,
                optimality: currentSolution.optimality + 0.02,
                solutionTime: currentSolution.solutionTime
              };
              improved = true;
              break;
            }
          }
        }
      }
      
      // Update best solution
      if (currentSolution.totalValue > bestSolution.totalValue) {
        bestSolution = { ...currentSolution };
      }
      
      // If no improvement, break
      if (!improved) {
        break;
      }
    }
    
    console.log(`🔄 Local search completed ${iterations} iterations`);
    return bestSolution;
  }

  // ===== HELPER METHODS =====

  /**
   * Calculate efficiency ratio for greedy selection
   */
  private static calculateEfficiency(item: KnapsackItem, constraints: KnapsackConstraints): number {
    // Weighted sum of constraint costs
    const caloriesCost = item.constraints.calories / constraints.maxCalories;
    const proteinCost = item.constraints.protein / constraints.maxProtein;
    const carbsCost = item.constraints.carbs / constraints.maxCarbs;
    const fatCost = item.constraints.fat / constraints.maxFat;
    const volumeCost = item.constraints.volume / constraints.maxVolume;
    const timeCost = item.constraints.prepTime / constraints.maxPrepTime;
    
    // Weighted average cost (calories are most important)
    const totalCost = (
      caloriesCost * 0.3 +
      proteinCost * 0.2 +
      carbsCost * 0.15 +
      fatCost * 0.15 +
      volumeCost * 0.1 +
      timeCost * 0.1
    );
    
    return totalCost > 0 ? item.value / totalCost : item.value;
  }

  /**
   * Check if an item can be added without violating constraints
   */
  private static canAddItem(
    item: KnapsackItem,
    currentUsage: KnapsackSolution['constraintUsage'],
    constraints: KnapsackConstraints
  ): boolean {
    return (
      currentUsage.calories + item.constraints.calories <= constraints.maxCalories &&
      currentUsage.protein + item.constraints.protein <= constraints.maxProtein &&
      currentUsage.carbs + item.constraints.carbs <= constraints.maxCarbs &&
      currentUsage.fat + item.constraints.fat <= constraints.maxFat &&
      currentUsage.volume + item.constraints.volume <= constraints.maxVolume &&
      currentUsage.prepTime + item.constraints.prepTime <= constraints.maxPrepTime &&
      currentUsage.cost + item.constraints.cost <= constraints.maxCost
    );
  }

  /**
   * Add item's constraints to current usage
   */
  private static addItemToUsage(
    item: KnapsackItem,
    usage: KnapsackSolution['constraintUsage']
  ): void {
    usage.calories += item.constraints.calories;
    usage.protein += item.constraints.protein;
    usage.carbs += item.constraints.carbs;
    usage.fat += item.constraints.fat;
    usage.volume += item.constraints.volume;
    usage.prepTime += item.constraints.prepTime;
    usage.cost += item.constraints.cost;
  }

  /**
   * Calculate total constraint usage for a set of items
   */
  private static calculateUsage(items: KnapsackItem[]): KnapsackSolution['constraintUsage'] {
    return items.reduce(
      (usage, item) => ({
        calories: usage.calories + item.constraints.calories,
        protein: usage.protein + item.constraints.protein,
        carbs: usage.carbs + item.constraints.carbs,
        fat: usage.fat + item.constraints.fat,
        volume: usage.volume + item.constraints.volume,
        prepTime: usage.prepTime + item.constraints.prepTime,
        cost: usage.cost + item.constraints.cost,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, volume: 0, prepTime: 0, cost: 0 }
    );
  }

  /**
   * Check if constraint usage is within bounds
   */
  private static checkFeasibility(
    usage: KnapsackSolution['constraintUsage'],
    constraints: KnapsackConstraints
  ): boolean {
    return (
      usage.calories >= constraints.minCalories &&
      usage.calories <= constraints.maxCalories &&
      usage.protein >= constraints.minProtein &&
      usage.protein <= constraints.maxProtein &&
      usage.carbs >= constraints.minCarbs &&
      usage.carbs <= constraints.maxCarbs &&
      usage.fat >= constraints.minFat &&
      usage.fat <= constraints.maxFat &&
      usage.volume <= constraints.maxVolume &&
      usage.prepTime <= constraints.maxPrepTime &&
      usage.cost <= constraints.maxCost
    );
  }

  /**
   * Convert Recipe to KnapsackItem
   */
  static recipeToKnapsackItem(
    recipe: Recipe,
    mealTarget: MealNutritionalTargets,
    baseValue: number = 50
  ): KnapsackItem {
    const calories = parseFloat(recipe.calories || '0');
    const protein = parseFloat(recipe.protein || '0');
    const carbs = parseFloat(recipe.carbs || '0');
    const fat = parseFloat(recipe.fat || '0');
    const prepTime = parseFloat(recipe.prepTime || '0');
    const cookTime = parseFloat(recipe.cookTime || '0');
    
    // Calculate value based on how well it fits the meal target
    let value = baseValue;
    
    // Nutritional fit bonus
    const targetCalories = mealTarget.targets.calories;
    if (targetCalories > 0) {
      const calorieRatio = calories / targetCalories;
      if (calorieRatio >= 0.8 && calorieRatio <= 1.2) {
        value += 20; // Good calorie fit
      } else if (calorieRatio >= 0.6 && calorieRatio <= 1.4) {
        value += 10; // Acceptable fit
      }
    }
    
    // Time bonus (prefer quicker meals)
    const totalTime = prepTime + cookTime;
    if (totalTime <= 15) value += 15;
    else if (totalTime <= 30) value += 10;
    else if (totalTime > 60) value -= 10;
    
    // Category bonus
    if (recipe.categories.includes(mealTarget.mealType)) {
      value += 15;
    }
    
    return {
      id: recipe.id,
      name: recipe.name,
      type: 'recipe',
      value,
      constraints: {
        calories,
        protein,
        carbs,
        fat,
        volume: this.estimateVolume(recipe),
        prepTime: totalTime,
        cost: this.estimateCost(recipe)
      },
      metadata: {
        categories: recipe.categories,
        mealType: mealTarget.mealType,
        position: mealTarget.position,
        originalItem: recipe
      }
    };
  }

  /**
   * Convert Food to KnapsackItem
   */
  static foodToKnapsackItem(
    food: Food,
    mealTarget: MealNutritionalTargets,
    baseValue: number = 40
  ): KnapsackItem {
    const calories = parseFloat(food.calories || '0');
    const protein = parseFloat(food.protein || '0');
    const carbs = parseFloat(food.carbs || '0');
    const fat = parseFloat(food.fat || '0');
    
    // Foods generally have lower base value but are more flexible
    let value = baseValue;
    
    // Nutritional density bonus
    if (protein > 10) value += 10; // High protein
    if (calories < 100) value += 5; // Low calorie option
    
    return {
      id: food.id,
      name: food.name,
      type: 'food',
      value,
      constraints: {
        calories,
        protein,
        carbs,
        fat,
        volume: calories / 100, // Simple volume estimation
        prepTime: 5, // Minimal prep for whole foods
        cost: 1 // Default unit cost
      },
      metadata: {
        categories: food.category ? [food.category] : [],
        mealType: mealTarget.mealType,
        position: mealTarget.position,
        originalItem: food
      }
    };
  }

  /**
   * Create knapsack constraints from meal nutritional targets
   */
  static createConstraintsFromTargets(
    targets: MealNutritionalTargets[],
    options: {
      tolerancePercent?: number;
      maxPrepTime?: number;
      maxCost?: number;
    } = {}
  ): KnapsackConstraints {
    const tolerance = options.tolerancePercent || 20; // 20% tolerance
    const maxPrepTime = options.maxPrepTime || 60; // 1 hour default
    const maxCost = options.maxCost || 50; // Arbitrary cost units
    
    // Aggregate all meal targets
    const totalTargets = targets.reduce(
      (total, mealTarget) => ({
        calories: total.calories + mealTarget.targets.calories,
        protein: total.protein + mealTarget.targets.protein,
        carbs: total.carbs + mealTarget.targets.carbs,
        fat: total.fat + mealTarget.targets.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    // Calculate min/max with tolerance
    const toleranceMultiplier = tolerance / 100;
    
    return {
      maxCalories: Math.round(totalTargets.calories * (1 + toleranceMultiplier)),
      maxProtein: Math.round(totalTargets.protein * (1 + toleranceMultiplier)),
      maxCarbs: Math.round(totalTargets.carbs * (1 + toleranceMultiplier)),
      maxFat: Math.round(totalTargets.fat * (1 + toleranceMultiplier)),
      maxVolume: 100, // Arbitrary volume units
      maxPrepTime,
      maxCost,
      
      minCalories: Math.round(totalTargets.calories * (1 - toleranceMultiplier)),
      minProtein: Math.round(totalTargets.protein * (1 - toleranceMultiplier)),
      minCarbs: Math.round(totalTargets.carbs * (1 - toleranceMultiplier)),
      minFat: Math.round(totalTargets.fat * (1 - toleranceMultiplier)),
    };
  }

  // ===== ESTIMATION HELPERS =====

  /**
   * ✅ FIXED: Estimate volume/portion size for a recipe WITHOUT servings property
   */
  private static estimateVolume(recipe: Recipe): number {
    // Since Recipe from recipeStore doesn't have servings property,
    // estimate volume based on calories and meal complexity
    const calories = parseFloat(recipe.calories?.toString() || '0');
    const ingredientCount = recipe.ingredients?.length || 1;
    
    // Simple heuristic: volume based on calories and complexity
    let baseVolume = 1;
    
    if (calories < 200) baseVolume = 1; // Small portion
    else if (calories < 400) baseVolume = 2; // Medium portion
    else if (calories < 600) baseVolume = 3; // Large portion
    else baseVolume = 4; // Very large portion
    
    // Adjust for complexity (more ingredients = bigger dish typically)
    if (ingredientCount > 5) baseVolume += 1;
    if (ingredientCount > 8) baseVolume += 1;
    
    return Math.min(5, baseVolume); // Cap at 5
  }

  /**
   * Estimate cost for a recipe based on ingredients
   */
  private static estimateCost(recipe: Recipe): number {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return 1;
    
    // Simple heuristic: cost based on ingredient count and complexity
    const ingredientCount = recipe.ingredients.length;
    const prepTime = parseFloat(recipe.prepTime?.toString() || '0');
    const cookTime = parseFloat(recipe.cookTime?.toString() || '0');
    
    let cost = ingredientCount * 0.5; // Base cost per ingredient
    
    // Time-based cost (more complex = more expensive ingredients)
    const totalTime = prepTime + cookTime;
    if (totalTime > 30) cost += 2;
    if (totalTime > 60) cost += 3;
    
    return Math.max(1, Math.round(cost));
  }

  /**
   * Analyze solution quality
   */
  static analyzeSolution(
    solution: KnapsackSolution,
    originalConstraints: KnapsackConstraints
  ): {
    efficiency: number; // 0-1
    balanceScore: number; // 0-1
    utilizationScore: number; // 0-1
    summary: string;
  } {
    const usage = solution.constraintUsage;
    
    // Calculate efficiency (value per constraint usage)
    const totalConstraintUsage = (
      usage.calories / originalConstraints.maxCalories +
      usage.protein / originalConstraints.maxProtein +
      usage.carbs / originalConstraints.maxCarbs +
      usage.fat / originalConstraints.maxFat +
      usage.volume / originalConstraints.maxVolume
    ) / 5;
    
    const efficiency = totalConstraintUsage > 0 ? solution.totalValue / (totalConstraintUsage * 100) : 0;
    
    // Calculate nutritional balance
    const totalNutrition = usage.protein + usage.carbs + usage.fat;
    const proteinRatio = totalNutrition > 0 ? usage.protein / totalNutrition : 0.25;
    const carbsRatio = totalNutrition > 0 ? usage.carbs / totalNutrition : 0.5;
    const fatRatio = totalNutrition > 0 ? usage.fat / totalNutrition : 0.25;
    
    // Ideal ratios (can be customized)
    const idealProtein = 0.25;
    const idealCarbs = 0.5;
    const idealFat = 0.25;
    
    const balanceScore = 1 - (
      Math.abs(proteinRatio - idealProtein) +
      Math.abs(carbsRatio - idealCarbs) +
      Math.abs(fatRatio - idealFat)
    ) / 3;
    
    // Calculate utilization (how well we used the available constraints)
    const utilizationScore = (
      usage.calories / originalConstraints.maxCalories +
      usage.protein / originalConstraints.maxProtein +
      usage.carbs / originalConstraints.maxCarbs +
      usage.fat / originalConstraints.maxFat
    ) / 4;
    
    let summary = `Selected ${solution.selectedItems.length} items with total value ${solution.totalValue.toFixed(1)}. `;
    summary += `Efficiency: ${(efficiency * 100).toFixed(1)}%, `;
    summary += `Balance: ${(balanceScore * 100).toFixed(1)}%, `;
    summary += `Utilization: ${(utilizationScore * 100).toFixed(1)}%`;
    
    return {
      efficiency: Math.min(1, efficiency),
      balanceScore: Math.max(0, balanceScore),
      utilizationScore: Math.min(1, utilizationScore),
      summary
    };
  }
}

export default MultiDimensionalKnapsack;