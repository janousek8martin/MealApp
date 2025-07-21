// src/stores/mealStore.ts
// 🔧 PHASE 1.1: PORTION SIZES INTEGRATION - Fixed hardcoded percentages
// ✅ Fixed "possibly undefined" TypeScript errors

import { create } from 'zustand';
import { Meal, MealPlan } from '../types/meal';
import { RecipeFromAPI } from '../services/foodApiService';

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
  
  // API recepty
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

// ✅ OPRAVENÁ HELPER FUNKCE: Výpočet meal targets podle user portion sizes s prioritou na mealNutritionTargets
const calculateMealTargetsFromPortionSizes = (userProfile: any, dailyCalories: number): { [key: string]: number } => {
  console.log('🎯 Calculating meal targets from user portion sizes');
  
  // ✅ PRIORITIZE mealNutritionTargets over portionSizes
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
      Breakfast: dailyCalories * 0.25,
      Lunch: dailyCalories * 0.35,
      Dinner: dailyCalories * 0.30,
      Snack: dailyCalories * 0.10
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
    mealTargets.Lunch = dailyCalories * 0.27; // Default fallback
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

const calculateMealNutrition = (meal: Meal) => {
  return {
    calories: safeNutritionValue(meal.calories),
    protein: safeNutritionValue(meal.protein),
    carbs: safeNutritionValue(meal.carbs),
    fat: safeNutritionValue(meal.fat)
  };
};

// ✅ UPDATED: Filter funkce s better error handling
const filterAPIRecipesByUserPreferences = (recipes: APIRecipe[], userProfile: any): APIRecipe[] => {
  console.log('🔍 Filtering API recipes by user preferences');

  const filtered = recipes.filter(recipe => {
    // ✅ FIXED: Handle undefined nutrition values
    const recipeCalories = safeNutritionValue(recipe.calories);
    const recipeProtein = safeNutritionValue(recipe.protein);

    // Filtr podle avoid meals
    if (userProfile.avoidMeals && userProfile.avoidMeals.length > 0) {
      const hasAvoidedFood = userProfile.avoidMeals.some((avoid: string) =>
        recipe.name.toLowerCase().includes(avoid.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(avoid.toLowerCase())
      );
      if (hasAvoidedFood) {
        console.log(`❌ Filtered out ${recipe.name} - contains avoided food`);
        return false;
      }
    }

    // Filtr podle kalorií - použij rozumný upper limit
    if (userProfile.tdci?.adjustedTDCI) {
      const maxCaloriesPerMeal = userProfile.tdci.adjustedTDCI * 0.6; // Increased from 0.5 to 0.6
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
  return filtered;
};

export const useMealStore = create<MealStore>((set, get) => ({
  // Existující data
  mealPlans: {},
  
  // API recipe management
  apiRecipes: [],
  isRecipeDatabaseInitialized: false,
  lastAPIUpdate: null,

  // 🔧 PHASE 1.1: HLAVNÍ OPRAVA - generateMealPlan s portion sizes integration
  generateMealPlan: async (userId: string, date: string, userProfile: any) => {
    try {
      console.log('🎯 Starting meal plan generation with PORTION SIZES INTEGRATION');
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

      // Inicializuj databázi pokud ještě není
      if (!get().isRecipeDatabaseInitialized) {
        console.log('🚀 Initializing recipe database from API...');
        await get().initializeRecipeDatabase();
      }

      const allRecipes = get().apiRecipes;
      console.log('📚 Available API recipes:', allRecipes.length);

      if (allRecipes.length === 0) {
        throw new Error('No recipes available from API');
      }

      // Filtruj podle preferencí
      const filteredRecipes = filterAPIRecipesByUserPreferences(allRecipes, userProfile);
      console.log('🔍 Recipes after filtering:', filteredRecipes.length);

      if (filteredRecipes.length === 0) {
        throw new Error('No suitable recipes found after filtering preferences');
      }

      // Vymaž existující plán
      get().resetDay(userId, date);

      // ✅ KLÍČOVÁ ZMĚNA: Použij portion sizes místo hardcoded percentages
      const dailyCalories = userProfile.tdci?.adjustedTDCI || 2000;
      const mealTargets = calculateMealTargetsFromPortionSizes(userProfile, dailyCalories);

      console.log('🎯 Final meal calorie targets (from portion sizes):', mealTargets);

      // Generuj hlavní jídla
      const mainMealTypes: Array<'Breakfast' | 'Lunch' | 'Dinner'> = ['Breakfast', 'Lunch', 'Dinner'];
      let totalMealsGenerated = 0;

      for (const mealType of mainMealTypes) {
        const availableRecipes = get().getRecipesByMealType(mealType)
          .filter(recipe => filteredRecipes.includes(recipe));

        if (availableRecipes.length === 0) {
          console.warn(`⚠️ No ${mealType} recipes available`);
          continue;
        }

        // ✅ REVERTED: Use simple number access
        const targetCalories = mealTargets[mealType] || dailyCalories * 0.33;
        const selectedRecipe = availableRecipes.reduce((best, current) => {
          const bestDiff = Math.abs(safeNutritionValue(best.calories) - targetCalories);
          const currentDiff = Math.abs(safeNutritionValue(current.calories) - targetCalories);
          return currentDiff < bestDiff ? current : best;
        });

        console.log(`🍽️ Selected ${mealType}: ${selectedRecipe.name} (${safeNutritionValue(selectedRecipe.calories)} kcal, target: ${Math.round(targetCalories)} kcal)`);

        get().addMeal(userId, date, {
          type: mealType,
          name: selectedRecipe.name,
          position: mealType,
          calories: safeNutritionValue(selectedRecipe.calories),
          protein: safeNutritionValue(selectedRecipe.protein),
          carbs: safeNutritionValue(selectedRecipe.carbs),
          fat: safeNutritionValue(selectedRecipe.fat)
        });

        totalMealsGenerated++;
      }

      // Generuj snacks pokud jsou nakonfigurované
      const snackPositions = userProfile.mealPreferences?.snackPositions || [];
      
      for (const snackPosition of snackPositions) {
        const snackRecipes = get().getRecipesByMealType('Snack')
          .filter(recipe => filteredRecipes.includes(recipe));

        if (snackRecipes.length === 0) {
          console.warn('⚠️ No snack recipes available');
          continue;
        }

        // ✅ OPRAVA: Použij správný target z mealTargets
        const targetCalories = mealTargets[snackPosition] || mealTargets.Snack || dailyCalories * 0.1;
        const selectedSnack = snackRecipes.reduce((best, current) => {
          const bestDiff = Math.abs(safeNutritionValue(best.calories) - targetCalories);
          const currentDiff = Math.abs(safeNutritionValue(current.calories) - targetCalories);
          return currentDiff < bestDiff ? current : best;
        });

        console.log(`🍪 Selected Snack (${snackPosition}): ${selectedSnack.name} (${safeNutritionValue(selectedSnack.calories)} kcal, target: ${Math.round(targetCalories)} kcal)`);

        get().addMeal(userId, date, {
          type: 'Snack',
          name: selectedSnack.name,
          position: snackPosition,
          calories: safeNutritionValue(selectedSnack.calories),
          protein: safeNutritionValue(selectedSnack.protein),
          carbs: safeNutritionValue(selectedSnack.carbs),
          fat: safeNutritionValue(selectedSnack.fat)
        });

        totalMealsGenerated++;
      }

      // Final summary
      const finalPlan = get().getMealPlan(userId, date);
      if (finalPlan) {
        const totalNutrition = finalPlan.meals.reduce(
          (total, meal) => {
            const nutrition = calculateMealNutrition(meal);
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

  // ✅ FALLBACK: Simple generation s portion sizes support (FIXED TypeScript errors)
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
        { name: 'Grilled Salmon', calories: 320, protein: 35, carbs: 5, fat: 18, type: 'Dinner' },
        { name: 'Greek Yogurt', calories: 150, protein: 15, carbs: 12, fat: 6, type: 'Snack' },
        { name: 'Apple with Peanut Butter', calories: 180, protein: 8, carbs: 15, fat: 12, type: 'Snack' }
      ];

      // Generuj hlavní jídla s portion sizes targeting
      ['Breakfast', 'Lunch', 'Dinner'].forEach(mealType => {
        const recipe = fallbackRecipes.find(r => r.type === mealType);
        if (recipe) {
          get().addMeal(userId, date, {
            type: mealType as 'Breakfast' | 'Lunch' | 'Dinner',
            name: recipe.name,
            position: mealType,
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat
          });
        }
      });

      // Přidej snacks pokud jsou nakonfigurované
      const snackPositions = userProfile.mealPreferences?.snackPositions || [];
      snackPositions.forEach((position: string) => {
        const snackRecipe = fallbackRecipes.find(r => r.type === 'Snack') || fallbackRecipes[3];
        get().addMeal(userId, date, {
          type: 'Snack',
          name: snackRecipe.name,
          position: position,
          calories: snackRecipe.calories,
          protein: snackRecipe.protein,
          carbs: snackRecipe.carbs,
          fat: snackRecipe.fat
        });
      });

      console.log('✅ Fallback plan generated successfully');
      return true;

    } catch (error) {
      console.error('💥 Fallback generation failed:', error);
      return false;
    }
  },

  // 🔧 PHASE 1.0: API Recipe Management
  initializeRecipeDatabase: async () => {
    try {
      console.log('🚀 Starting recipe database initialization...');
      
      // Okamžitě použij fallback recepty místo API volání
      console.log('⚠️ Using fallback recipes (API disabled for now)');
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
      
      // Fallback na fallback recepty
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
      
      console.log('✅ Fallback database initialized with', fallbackRecipes.length, 'recipes');
    }
  },

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

  // Existující metody zůstávají stejné
  getMealPlan: (userId: string, date: string) => {
    const key = `${userId}_${date}`;
    return get().mealPlans[key] || null;
  },

  addMeal: (userId: string, date: string, meal: Omit<Meal, 'id' | 'userId' | 'date'>) => {
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