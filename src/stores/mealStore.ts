// src/stores/mealStore.ts
// 🔧 PHASE 1.2: RECIPE SOURCE FIX - Uses recipeStore instead of API fallback
// ✅ Fixed all TypeScript errors and implemented missing methods

import { create } from 'zustand';
import { Meal, MealPlan, getMealNutrition } from '../types/meal';
import { Recipe, useRecipeStore } from '../stores/recipeStore';
import { RecipeFromAPI } from '../services/foodApiService';
import { NutritionCalculator, NutritionalTargets } from '../services/mealPlanGenerator/preparation/NutritionCalculator';

// ✅ KEPT: Original APIRecipe interface for backward compatibility
export interface APIRecipe extends RecipeFromAPI {
  categories: string[];
  ingredients: Array<{
    id: string;
    name: string;
    amount: number;
    unit: string;
  }>;
  instructions: string[];
  image: string | null;
}

interface MealStore {
  mealPlans: Record<string, MealPlan>;
  
  // ✅ KEPT: API recepty pro backward compatibility
  apiRecipes: APIRecipe[];
  isRecipeDatabaseInitialized: boolean;
  lastAPIUpdate: number | null;
  
  // Metody
  generateMealPlan: (userId: string, date: string, userProfile: any) => Promise<boolean>;
  initializeRecipeDatabase: () => Promise<void>;
  searchAPIRecipes: (query: string) => Promise<APIRecipe[]>;
  getRecipesByMealType: (mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => APIRecipe[];
  generateSimpleFallbackPlan: (userId: string, date: string, userProfile: any) => boolean;
  
  // Existující metody
  getMealPlan: (userId: string, date: string) => MealPlan | null;
  addMeal: (userId: string, date: string, meal: Omit<Meal, 'id' | 'userId' | 'date'>) => void;
  removeMeal: (userId: string, date: string, mealId: string) => void;
  resetDay: (userId: string, date: string) => void;
  setMealPlans: (newMealPlans: Record<string, MealPlan>) => void;
}

// ✅ HELPER FUNKCE: Výpočet meal targets s prioritizací mealNutritionTargets
const calculateMealTargetsFromPortionSizes = (userProfile: any, dailyCalories: number): { [key: string]: number } => {
  console.log('🎯 Calculating meal targets from user portion sizes');
  
  // ✅ PRIORITA: mealNutritionTargets over portionSizes (PHASE 1 requirement)
  if (userProfile.mealNutritionTargets) {
    console.log('✅ Using absolute calorie targets from mealNutritionTargets');
    const mealTargets: { [key: string]: number } = {};
    
    // Extract calorie values from mealNutritionTargets
    Object.keys(userProfile.mealNutritionTargets).forEach(mealName => {
      mealTargets[mealName] = userProfile.mealNutritionTargets[mealName].calories;
    });
    
    console.log('📊 Meal calorie targets from mealNutritionTargets:', mealTargets);
    return mealTargets;
  }
  
  // Check if user has custom portion sizes
  if (!userProfile.portionSizes) {
    console.log('⚠️ No custom portion sizes found, using default distribution');
    // Default distribution: Breakfast 27%, Lunch 27%, Dinner 27%, Snacks 19%
    return {
      'Breakfast': dailyCalories * 0.27,
      'Lunch': dailyCalories * 0.27,
      'Dinner': dailyCalories * 0.27,
      'Between Breakfast and Lunch': dailyCalories * 0.095,
      'Between Lunch and Dinner': dailyCalories * 0.095
    };
  }

  const portionSizes = userProfile.portionSizes;
  console.log('📊 User portion sizes:', portionSizes);

  // ✅ OPRAVA: Použít user.portionSizes místo hardcoded percentages
  const mealTargets: { [key: string]: number } = {};

  // Main meals - direct mapping from portionSizes
  if (portionSizes.Breakfast !== undefined) {
    mealTargets.Breakfast = dailyCalories * portionSizes.Breakfast;
  } else if (portionSizes.breakfast !== undefined) {
    mealTargets.Breakfast = dailyCalories * portionSizes.breakfast;
  } else {
    mealTargets.Breakfast = dailyCalories * 0.27; // Default fallback
  }

  if (portionSizes.Lunch !== undefined) {
    mealTargets.Lunch = dailyCalories * portionSizes.Lunch;
  } else if (portionSizes.lunch !== undefined) {
    mealTargets.Lunch = dailyCalories * portionSizes.lunch;
  } else {
    mealTargets.Lunch = dailyCalories * 0.27; // ✅ FIXED: Added semicolon
  }

  if (portionSizes.Dinner !== undefined) {
    mealTargets.Dinner = dailyCalories * portionSizes.Dinner;
  } else if (portionSizes.dinner !== undefined) {
    mealTargets.Dinner = dailyCalories * portionSizes.dinner;
  } else {
    mealTargets.Dinner = dailyCalories * 0.27; // Default fallback
  }

  // Snacks - handle individual snack positions
  const snackPositions = userProfile.mealPreferences?.snackPositions || [];
  
  // Calculate total snack calories from portion sizes or default snack value
  if (portionSizes.snack !== undefined) {
    // If there's a global snack portion size, distribute among all snack positions
    const snackCount = snackPositions.length || 1;
    const caloriesPerSnack = (dailyCalories * portionSizes.snack) / snackCount;
    
    snackPositions.forEach((position: string) => {
      mealTargets[position] = caloriesPerSnack;
    });
    
    // Also set a general snack target for backward compatibility
    mealTargets.Snack = caloriesPerSnack;
  } else {
    // Check for individual snack position portion sizes
    snackPositions.forEach((position: string) => {
      const key = position.replace(/\s+/g, ''); // Remove spaces for key matching
      if (portionSizes[key] !== undefined) {
        mealTargets[position] = dailyCalories * portionSizes[key];
      } else if (portionSizes[position] !== undefined) {
        mealTargets[position] = dailyCalories * portionSizes[position];
      } else {
        // Default snack allocation split among positions
        mealTargets[position] = (dailyCalories * 0.10) / snackPositions.length;
      }
    });
    
    // ✅ FIXED: Add explicit types for reduce parameters
    const totalSnackCalories = snackPositions.reduce((total: number, pos: string) => total + (mealTargets[pos] || 0), 0);
    mealTargets.Snack = snackPositions.length > 0 ? totalSnackCalories / snackPositions.length : dailyCalories * 0.10;
  }

  console.log('🎯 Final calculated meal targets:', mealTargets);
  return mealTargets;
};

// ✅ ENHANCED: Nutrition safety helpers pro TypeScript errors
const safeNutritionValue = (value: number | undefined, fallback: number = 0): number => {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
};

// ✅ ENHANCED: Filter funkce s proper avoid meals logic for Recipe interface
const filterRecipesByUserPreferences = (recipes: Recipe[], userProfile: any): Recipe[] => {
  console.log('🔍 Filtering recipes by user preferences');
  console.log('🚫 User avoid meals:', userProfile.avoidMeals);

  const filtered = recipes.filter(recipe => {
    // ✅ FIXED: Handle Recipe interface nutrition values (strings)
    const recipeCalories = safeNutritionValue(parseInt(recipe.calories));
    const recipeProtein = safeNutritionValue(parseInt(recipe.protein));

    // ✅ PROPER AVOID MEALS FILTERING: Check foodTypes, allergens, and ingredients
    if (userProfile.avoidMeals && userProfile.avoidMeals.length > 0) {
      let avoidList: string[] = [];
      
      // Handle both array and object formats
      if (Array.isArray(userProfile.avoidMeals)) {
        avoidList = userProfile.avoidMeals;
      } else if (typeof userProfile.avoidMeals === 'object') {
        const avoidObj = userProfile.avoidMeals as { foodTypes?: string[]; allergens?: string[] };
        avoidList = [...(avoidObj.foodTypes || []), ...(avoidObj.allergens || [])];
      }

      // 1. Check recipe name for avoided terms
      const nameContainsAvoided = avoidList.some(avoid => 
        recipe.name.toLowerCase().includes(avoid.toLowerCase())
      );

      // 2. Check recipe foodTypes
      const foodTypeMatches = avoidList.some(avoid => 
        recipe.foodTypes.some(foodType => 
          foodType.toLowerCase().includes(avoid.toLowerCase())
        )
      );

      // 3. Check recipe allergens  
      const allergenMatches = avoidList.some(avoid =>
        recipe.allergens.some(allergen =>
          allergen.toLowerCase().includes(avoid.toLowerCase())
        )
      );

      if (nameContainsAvoided || foodTypeMatches || allergenMatches) {
        console.log(`❌ Filtered out ${recipe.name} - contains avoided food: ${avoidList.join(', ')}`);
        return false;
      }
    }

    // Filtr podle kalorií - použij rozumný upper limit
    if (userProfile.tdci?.adjustedTDCI) {
      const maxCaloriesPerMeal = userProfile.tdci.adjustedTDCI * 0.6;
      if (recipeCalories > maxCaloriesPerMeal) {
        console.log(`❌ Filtered out ${recipe.name} - too many calories (${recipeCalories} > ${maxCaloriesPerMeal})`);
        return false;
      }
    }

    // Filtr podle minimálního obsahu bílkovin (relaxed pro snacks)
    const isSnack = recipe.categories.includes('Snack');
    if (recipeProtein < 3 && !isSnack) {
      console.log(`❌ Filtered out ${recipe.name} - too little protein (${recipeProtein}g)`);
      return false;
    }

    return true;
  });

  console.log('📊 Filtered recipes:', filtered.length);
  console.log('✅ Remaining recipes:', filtered.map(r => r.name));
  return filtered;
};

// ✅ NEW: Get recipes by meal type from Recipe interface
const getRecipesByMealType = (recipes: Recipe[], mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'): Recipe[] => {
  return recipes.filter(recipe => recipe.categories.includes(mealType));
};

// ✅ NEW: Convert Recipe to compatible format for NutritionCalculator
const convertRecipeForCalculator = (recipe: Recipe): any => {
  return {
    id: recipe.id,
    name: recipe.name,
    calories: parseInt(recipe.calories),
    protein: parseInt(recipe.protein), 
    carbs: parseInt(recipe.carbs),
    fat: parseInt(recipe.fat),
    type: recipe.categories[0], // Use first category as type
    categories: recipe.categories,
    foodTypes: recipe.foodTypes,
    allergens: recipe.allergens
  };
};

// ✅ KEPT: Original filter function for APIRecipe backward compatibility
const filterAPIRecipesByUserPreferences = (recipes: APIRecipe[], userProfile: any): APIRecipe[] => {
  console.log('🔍 Filtering API recipes by user preferences');
  console.log('🚫 User avoid meals:', userProfile.avoidMeals);

  const filtered = recipes.filter(recipe => {
    // ✅ FIXED: Handle undefined nutrition values
    const recipeCalories = safeNutritionValue(recipe.calories);
    const recipeProtein = safeNutritionValue(recipe.protein);

    // ✅ PROPER AVOID MEALS FILTERING: Check foodTypes, allergens, and ingredients
    if (userProfile.avoidMeals && userProfile.avoidMeals.length > 0) {
      let avoidList: string[] = [];
      
      // Handle both array and object formats
      if (Array.isArray(userProfile.avoidMeals)) {
        avoidList = userProfile.avoidMeals;
      } else if (typeof userProfile.avoidMeals === 'object') {
        const avoidObj = userProfile.avoidMeals as { foodTypes?: string[]; allergens?: string[] };
        avoidList = [...(avoidObj.foodTypes || []), ...(avoidObj.allergens || [])];
      }

      // 1. Check recipe name for avoided terms
      const nameContainsAvoided = avoidList.some(avoid => 
        recipe.name.toLowerCase().includes(avoid.toLowerCase())
      );

      // 2. Check recipe description  
      const descriptionContainsAvoided = recipe.description ? 
        avoidList.some(avoid => recipe.description!.toLowerCase().includes(avoid.toLowerCase())) : false;

      // 3. Check foodTypes (most important for APIRecipe from fallback)
      const foodTypeMatches = avoidList.some(avoid => {
        // Map common avoid terms to food types
        const avoidLower = avoid.toLowerCase();
        if (avoidLower === 'fish' && recipe.name.toLowerCase().includes('salmon')) return true;
        if (avoidLower === 'fish' && recipe.name.toLowerCase().includes('fish')) return true;
        if (avoidLower === 'dairy' && recipe.name.toLowerCase().includes('yogurt')) return true;
        if (avoidLower === 'dairy' && recipe.name.toLowerCase().includes('cheese')) return true;
        if (avoidLower === 'meat' && recipe.name.toLowerCase().includes('chicken')) return true;
        if (avoidLower === 'meat' && recipe.name.toLowerCase().includes('turkey')) return true;
        if (avoidLower === 'nuts' && recipe.name.toLowerCase().includes('peanut')) return true;
        return false;
      });

      if (nameContainsAvoided || descriptionContainsAvoided || foodTypeMatches) {
        console.log(`❌ Filtered out ${recipe.name} - contains avoided food: ${avoidList.join(', ')}`);
        return false;
      }
    }

    // Filtr podle kalorií - použij rozumný upper limit
    if (userProfile.tdci?.adjustedTDCI) {
      const maxCaloriesPerMeal = userProfile.tdci.adjustedTDCI * 0.6;
      if (recipeCalories > maxCaloriesPerMeal) {
        console.log(`❌ Filtered out ${recipe.name} - too many calories (${recipeCalories} > ${maxCaloriesPerMeal})`);
        return false;
      }
    }

    // Filtr podle minimálního obsahu bílkovin (relaxed pro snacks)
    if (recipeProtein < 3 && recipe.type !== 'Snack') {
      console.log(`❌ Filtered out ${recipe.name} - too little protein (${recipeProtein}g)`);
      return false;
    }

    return true;
  });

  console.log('📊 Filtered recipes:', filtered.length);
  console.log('✅ Remaining recipes:', filtered.map(r => r.name));
  return filtered;
};

export const useMealStore = create<MealStore>((set, get) => ({
  // Existující data
  mealPlans: {},
  
  // ✅ KEPT: API recipe management pro backward compatibility
  apiRecipes: [],
  isRecipeDatabaseInitialized: false,
  lastAPIUpdate: null,

  // 🔧 PHASE 1.2: HLAVNÍ OPRAVA - generateMealPlan používá recipeStore
  generateMealPlan: async (userId: string, date: string, userProfile: any) => {
    try {
      console.log('🎯 Starting meal plan generation with RECIPE STORE INTEGRATION');
      console.log('📋 User profile summary:', {
        userId,
        date,
        tdci: userProfile.tdci?.adjustedTDCI,
        snackPositions: userProfile.mealPreferences?.snackPositions,
        hasPortionSizes: !!userProfile.portionSizes,
        hasMealNutritionTargets: !!userProfile.mealNutritionTargets,
        mealNutritionTargets: userProfile.mealNutritionTargets,
        portionSizes: userProfile.portionSizes
      });

      // ✅ KLÍČOVÁ ZMĚNA: Použij recipeStore místo API fallback
      const allRecipes = useRecipeStore.getState().recipes;
      console.log('📚 Available recipes from recipeStore:', allRecipes.length);

      if (allRecipes.length === 0) {
        throw new Error('No recipes available from recipeStore');
      }

      // Filtruj podle preferencí
      const filteredRecipes = filterRecipesByUserPreferences(allRecipes, userProfile);
      console.log('🔍 Recipes after filtering:', filteredRecipes.length);

      if (filteredRecipes.length === 0) {
        throw new Error('No suitable recipes found after filtering preferences');
      }

      // Vymaž existující plán
      get().resetDay(userId, date);

      // ✅ Použij portion sizes/meal nutrition targets
      const dailyCalories = userProfile.tdci?.adjustedTDCI || 2000;
      const mealTargets = calculateMealTargetsFromPortionSizes(userProfile, dailyCalories);

      console.log('🎯 Final meal calorie targets (from portion sizes):', mealTargets);

      // Generuj hlavní jídla
      const mainMealTypes: Array<'Breakfast' | 'Lunch' | 'Dinner'> = ['Breakfast', 'Lunch', 'Dinner'];
      let totalMealsGenerated = 0;

      for (const mealType of mainMealTypes) {
        const availableRecipes = getRecipesByMealType(filteredRecipes, mealType);

        if (availableRecipes.length === 0) {
          console.warn(`⚠️ No ${mealType} recipes available`);
          continue;
        }

        // ✅ RECIPE SCALING INTEGRATION: Use NutritionCalculator for optimal selection
        const targetCalories = mealTargets[mealType] || dailyCalories * 0.33;
        
        // Create proper target structure for scaling
        const dailyTargets = NutritionCalculator.calculateDailyTargets({
          tdci: { adjustedTDCI: dailyCalories },
          bodyFat: userProfile.bodyFat || '15',
          gender: userProfile.gender || 'Male',
          weight: userProfile.weight || '70'
        } as any);

        const scaledDailyTargets = {
          ...dailyTargets,
          calories: targetCalories,
          protein: dailyTargets.protein * (targetCalories / dailyCalories),
          carbs: dailyTargets.carbs * (targetCalories / dailyCalories),
          fat: dailyTargets.fat * (targetCalories / dailyCalories)
        };

        // ✅ SCALING SELECTION: Use selectBestRecipe with tolerance checking
        const convertedRecipes = availableRecipes.map(convertRecipeForCalculator);
        const scalingResult = NutritionCalculator.selectBestRecipe(
          convertedRecipes, 
          scaledDailyTargets,
          'high' // High priority for main meals
        );

        if (!scalingResult) {
          console.warn(`⚠️ No suitable scaled recipe found for ${mealType}`);
          continue;
        }

        console.log(`🍽️ Selected ${mealType}: ${scalingResult.originalRecipe.name} (${scalingResult.displayPortion}, ${scalingResult.scaledNutrition.calories} kcal, target: ${Math.round(targetCalories)} kcal)`);

        // ✅ SCALED MEAL CREATION: Use scaled nutrition values
        get().addMeal(userId, date, {
          type: mealType,
          name: scalingResult.originalRecipe.name,
          position: mealType,
          calories: scalingResult.scaledNutrition.calories,
          protein: scalingResult.scaledNutrition.protein,
          carbs: scalingResult.scaledNutrition.carbs,
          fat: scalingResult.scaledNutrition.fat,
          // ✅ STORE SCALING INFO: For UI display and tracking
          scaleFactor: scalingResult.scalingFactor,
          scaledPortion: scalingResult.displayPortion
        } as any);

        totalMealsGenerated++;
      }

      // Generuj snacks pokud jsou nakonfigurované
      const snackPositions = userProfile.mealPreferences?.snackPositions || [];
      
      for (const snackPosition of snackPositions) {
        const snackRecipes = getRecipesByMealType(filteredRecipes, 'Snack');

        if (snackRecipes.length === 0) {
          console.warn('⚠️ No snack recipes available');
          continue;
        }

        // ✅ SNACK SCALING INTEGRATION: Apply scaling to snacks too
        const targetCalories = mealTargets[snackPosition] || mealTargets.Snack || dailyCalories * 0.1;
        
        // Create scaled target for snack
        const snackDailyTargets = NutritionCalculator.calculateDailyTargets({
          tdci: { adjustedTDCI: dailyCalories },
          bodyFat: userProfile.bodyFat || '15',
          gender: userProfile.gender || 'Male',
          weight: userProfile.weight || '70'
        } as any);

        const scaledSnackTargets = {
          ...snackDailyTargets,
          calories: targetCalories,
          protein: snackDailyTargets.protein * (targetCalories / dailyCalories),
          carbs: snackDailyTargets.carbs * (targetCalories / dailyCalories),
          fat: snackDailyTargets.fat * (targetCalories / dailyCalories)
        };

        // ✅ SNACK SCALING SELECTION: Use selectBestRecipe for snacks
        const convertedSnackRecipes = snackRecipes.map(convertRecipeForCalculator);
        const snackScalingResult = NutritionCalculator.selectBestRecipe(
          convertedSnackRecipes,
          scaledSnackTargets,
          'medium' // Medium priority for snacks
        );

        if (!snackScalingResult) {
          console.warn(`⚠️ No suitable scaled snack found for ${snackPosition}`);
          continue;
        }

        console.log(`🍪 Selected Snack (${snackPosition}): ${snackScalingResult.originalRecipe.name} (${snackScalingResult.displayPortion}, ${snackScalingResult.scaledNutrition.calories} kcal, target: ${Math.round(targetCalories)} kcal)`);

        // ✅ SCALED SNACK CREATION: Use scaled nutrition values
        get().addMeal(userId, date, {
          type: 'Snack',
          name: snackScalingResult.originalRecipe.name,
          position: snackPosition,
          calories: snackScalingResult.scaledNutrition.calories,
          protein: snackScalingResult.scaledNutrition.protein,
          carbs: snackScalingResult.scaledNutrition.carbs,
          fat: snackScalingResult.scaledNutrition.fat,
          // ✅ STORE SNACK SCALING INFO
          scaleFactor: snackScalingResult.scalingFactor,
          scaledPortion: snackScalingResult.displayPortion
        } as any);

        totalMealsGenerated++;
      }

      // Final summary
      const finalPlan = get().getMealPlan(userId, date);
      if (finalPlan) {
        const totalNutrition = finalPlan.meals.reduce(
          (total, meal) => {
            const nutrition = getMealNutrition(meal);
            return {
              calories: total.calories + nutrition.calories,
              protein: total.protein + nutrition.protein,
              carbs: total.carbs + nutrition.carbs,
              fat: total.fat + nutrition.fat
            };
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        console.log('✅ Generation completed successfully!');
        console.log('📊 Final totals:', totalNutrition);
        console.log('🎯 Target was:', dailyCalories, 'kcal');
        console.log('📈 Accuracy:', Math.round((totalNutrition.calories / dailyCalories) * 100), '%');
        console.log('🔧 Scaling applied to', finalPlan.meals.filter(m => (m as any).scaleFactor).length, 'meals');
      }

      return true;

    } catch (error) {
      console.error('❌ Meal plan generation failed:', error);
      
      // Fallback na simple generation
      console.log('🔄 Attempting fallback generation...');
      try {
        return get().generateSimpleFallbackPlan(userId, date, userProfile);
      } catch (fallbackError) {
        console.error('💥 Even fallback failed:', fallbackError);
        return false;
      }
    }
  },

  // ✅ KEPT: Original initializeRecipeDatabase for backward compatibility
  initializeRecipeDatabase: async () => {
    try {
      console.log('🚀 Starting recipe database initialization...');
      
      // ✅ IMMEDIATE FALLBACK: Skip API calls, use reliable fallback recipes
      console.log('⚠️ Using fallback recipes for reliable operation');
      const { foodAPIService } = await import('../services/foodApiService');
      const recipes = foodAPIService.generateOfflineFallback();
      
      if (recipes.length === 0) {
        throw new Error('No fallback recipes available');
      }

      // Enhanced recepty s better categorization
      const enhancedRecipes: APIRecipe[] = recipes.map(recipe => ({
        ...recipe,
        categories: [recipe.type],
        ingredients: [],
        instructions: [],
        image: null
      }) as APIRecipe);

      set({ 
        apiRecipes: enhancedRecipes,
        isRecipeDatabaseInitialized: true,
        lastAPIUpdate: Date.now()
      });

      console.log('✅ Recipe database initialized successfully');
      console.log(`📊 Database stats:`, {
        total: enhancedRecipes.length,
        breakfast: enhancedRecipes.filter(r => r.type === 'Breakfast').length,
        lunch: enhancedRecipes.filter(r => r.type === 'Lunch').length,
        dinner: enhancedRecipes.filter(r => r.type === 'Dinner').length,
        snacks: enhancedRecipes.filter(r => r.type === 'Snack').length
      });

    } catch (error) {
      console.error('❌ Failed to initialize recipe database:', error);
      
      // Final fallback
      const { foodAPIService } = await import('../services/foodApiService');
      const fallbackRecipes = foodAPIService.generateOfflineFallback();
      
      set({ 
        apiRecipes: fallbackRecipes.map(recipe => ({
          ...recipe,
          categories: [recipe.type],
          ingredients: [],
          instructions: [],
          image: null
        }) as APIRecipe),
        isRecipeDatabaseInitialized: true,
        lastAPIUpdate: Date.now()
      });
      
      console.log('✅ Final fallback database initialized with', fallbackRecipes.length, 'recipes');
    }
  },

  // ✅ KEPT: Original search methods
  searchAPIRecipes: async (query: string) => {
    const allRecipes = get().apiRecipes;
    
    if (!query.trim()) {
      return allRecipes.slice(0, 20); // Return first 20 if no query
    }

    const searchResults = allRecipes.filter(recipe => {
      const searchableText = [
        recipe.name,
        recipe.description,
        ...(recipe.categories || []),
        ...(recipe.ingredients?.map(ing => ing.name) || [])
      ].join(' ').toLowerCase();
      
      return query.toLowerCase()
        .split(' ')
        .every(term => searchableText.includes(term));
    });

    return searchResults.slice(0, 50); // Limit results
  },

  getRecipesByMealType: (mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => {
    const allRecipes = get().apiRecipes;
    return allRecipes.filter(recipe => recipe.type === mealType);
  },

  // ✅ FALLBACK: Simple generation s portion sizes support
  generateSimpleFallbackPlan: (userId: string, date: string, userProfile: any) => {
    console.log('🔄 Executing simple fallback meal plan generation');
    
    try {
      get().resetDay(userId, date);
      
      // ✅ OPRAVA: Použij portion sizes i v fallback
      const dailyCalories = userProfile.tdci?.adjustedTDCI || 2000;
      const mealTargets = calculateMealTargetsFromPortionSizes(userProfile, dailyCalories);
      
      // Simple fallback recepty s defined nutrition values
      const fallbackRecipes = [
        { name: 'Oatmeal with Banana', calories: 250, protein: 8, carbs: 45, fat: 5, type: 'Breakfast' },
        { name: 'Turkey Sandwich', calories: 300, protein: 25, carbs: 30, fat: 12, type: 'Lunch' },
        { name: 'Grilled Chicken', calories: 320, protein: 35, carbs: 5, fat: 18, type: 'Dinner' },
        { name: 'Greek Yogurt', calories: 130, protein: 15, carbs: 8, fat: 5, type: 'Snack' },
        { name: 'Apple with Almonds', calories: 190, protein: 6, carbs: 25, fat: 8, type: 'Snack' }
      ];

      // Generate main meals with simple selection
      const mainMealTypes = ['Breakfast', 'Lunch', 'Dinner'];
      mainMealTypes.forEach(mealType => {
        const recipe = fallbackRecipes.find(r => r.type === mealType);
        if (recipe) {
          const targetCalories = mealTargets[mealType] || dailyCalories * 0.33;
          const scaleFactor = targetCalories / recipe.calories;
          
          get().addMeal(userId, date, {
            type: mealType as any,
            name: recipe.name,
            calories: Math.round(recipe.calories * scaleFactor),
            protein: Math.round(recipe.protein * scaleFactor),
            carbs: Math.round(recipe.carbs * scaleFactor),
            fat: Math.round(recipe.fat * scaleFactor)
          });
        }
      });

      // Generate snacks
      const snackPositions = userProfile.mealPreferences?.snackPositions || [];
      snackPositions.forEach((position: string) => {
        const snackRecipe = fallbackRecipes.find(r => r.type === 'Snack');
        if (snackRecipe) {
          const targetCalories = mealTargets[position] || mealTargets.Snack || dailyCalories * 0.1;
          const scaleFactor = targetCalories / snackRecipe.calories;
          
          get().addMeal(userId, date, {
            type: 'Snack',
            name: snackRecipe.name,
            position: position,
            calories: Math.round(snackRecipe.calories * scaleFactor),
            protein: Math.round(snackRecipe.protein * scaleFactor),
            carbs: Math.round(snackRecipe.carbs * scaleFactor),
            fat: Math.round(snackRecipe.fat * scaleFactor)
          });
        }
      });

      console.log('✅ Fallback generation completed');
      return true;

    } catch (error) {
      console.error('💥 Fallback generation failed:', error);
      return false;
    }
  },

  // ✅ EXISTING METHODS - cleaned and consistent
  getMealPlan: (userId: string, date: string) => {
    const key = `${userId}_${date}`;
    return get().mealPlans[key] || null;
  },

  // ✅ ENHANCED: Add ScaledMeal support to Meal interface extension
  addMeal: (userId: string, date: string, meal: Omit<Meal, 'id' | 'userId' | 'date'> & { scaleFactor?: number; scaledPortion?: string }) => {
    const key = `${userId}_${date}`;
    const currentPlan = get().mealPlans[key];
    
    const newMeal: Meal = {
      id: Date.now().toString(),
      userId,
      date,
      ...meal
    };

    if (currentPlan) {
      currentPlan.meals.push(newMeal);
    } else {
      set(state => ({
        mealPlans: {
          ...state.mealPlans,
          [key]: {
            id: key,
            userId,
            date,
            meals: [newMeal]
          }
        }
      }));
    }
  },

  removeMeal: (userId: string, date: string, mealId: string) => {
    const key = `${userId}_${date}`;
    const currentPlan = get().mealPlans[key];
    
    if (currentPlan) {
      currentPlan.meals = currentPlan.meals.filter(meal => meal.id !== mealId);
    }
  },

  resetDay: (userId: string, date: string) => {
    const key = `${userId}_${date}`;
    set(state => ({
      mealPlans: {
        ...state.mealPlans,
        [key]: {
          id: key,
          userId,
          date,
          meals: []
        }
      }
    }));
  },

  setMealPlans: (newMealPlans: Record<string, MealPlan>) => {
    set({ mealPlans: newMealPlans });
  }
}));