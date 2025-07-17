// src/stores/mealStore.ts
// 🔧 OPRAVED: Generování s kompletním nutrition info a debug logy

import { create } from 'zustand';
import { Meal, MealPlan } from '../types/meal';
import { RecipeFromAPI } from '../services/foodApiService';

export interface APIRecipe extends RecipeFromAPI {
  categories?: string[];
  ingredients?: Array<{
    id: string;
    name: string;
    amount: number;
    unit: string;
  }>;
  instructions?: string[];
  image?: string;
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

// Helper funkce pro filtrování API receptů
const filterAPIRecipesByUserPreferences = (recipes: APIRecipe[], userProfile: any): APIRecipe[] => {
  console.log('🔍 Filtering API recipes for user preferences');
  
  return recipes.filter(recipe => {
    // Filtr podle vyhýbání se jídlům
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

    // Filtr podle kalorií
    if (userProfile.tdci?.adjustedTDCI) {
      const maxCaloriesPerMeal = userProfile.tdci.adjustedTDCI * 0.5;
      if (recipe.calories > maxCaloriesPerMeal) {
        console.log(`❌ Filtered out ${recipe.name} - too many calories (${recipe.calories})`);
        return false;
      }
    }

    // Filtr podle minimálního obsahu bílkovin
    if (recipe.protein < 5 && recipe.type !== 'Snack') {
      console.log(`❌ Filtered out ${recipe.name} - too little protein (${recipe.protein}g)`);
      return false;
    }

    return true;
  });
};

export const useMealStore = create<MealStore>((set, get) => ({
  // Existující data
  mealPlans: {},
  
  // API recipe management
  apiRecipes: [],
  isRecipeDatabaseInitialized: false,
  lastAPIUpdate: null,

  // 🔧 OPRAVED generateMealPlan - s kompletním debug a nutrition info
  generateMealPlan: async (userId: string, date: string, userProfile: any) => {
    try {
      console.log('🎯 Starting API-powered meal plan generation');
      console.log('📋 User profile:', {
        userId,
        date,
        tdci: userProfile.tdci?.adjustedTDCI,
        snackPositions: userProfile.mealPreferences?.snackPositions
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

      // Kalorie targets
      const dailyCalories = userProfile.tdci?.adjustedTDCI || 2000;
      const mealTargets = {
        Breakfast: dailyCalories * 0.25,
        Lunch: dailyCalories * 0.35,
        Dinner: dailyCalories * 0.30,
        Snack: dailyCalories * 0.10
      };

      console.log('🎯 Meal calorie targets:', mealTargets);

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

        // Najdi nejlepší recept podle kalorií
        const targetCalories = mealTargets[mealType];
        const selectedRecipe = availableRecipes.reduce((best, current) => {
          const bestDiff = Math.abs(best.calories - targetCalories);
          const currentDiff = Math.abs(current.calories - targetCalories);
          return currentDiff < bestDiff ? current : best;
        });

        console.log(`✅ Selected ${mealType}:`, {
          name: selectedRecipe.name,
          calories: selectedRecipe.calories,
          protein: selectedRecipe.protein,
          carbs: selectedRecipe.carbs,
          fat: selectedRecipe.fat,
          source: selectedRecipe.source
        });

        // 🔧 OPRAVED: Kompletní nutrition info
        get().addMeal(userId, date, {
          type: mealType,
          name: selectedRecipe.name,
          recipeId: selectedRecipe.id,
          calories: selectedRecipe.calories,
          protein: selectedRecipe.protein,
          carbs: selectedRecipe.carbs || 0,  // 🔧 OPRAVED: Fallback na 0
          fat: selectedRecipe.fat || 0       // 🔧 OPRAVED: Fallback na 0
        } as Omit<Meal, 'id' | 'userId' | 'date'>);

        totalMealsGenerated++;
      }

      // 🔧 OPRAVED: Snacky s kompletním debug
      if (userProfile.mealPreferences?.snackPositions) {
        console.log('🍎 Generating snacks for positions:', userProfile.mealPreferences.snackPositions);
        
        const snackRecipes = get().getRecipesByMealType('Snack')
          .filter(recipe => filteredRecipes.includes(recipe));
        
        console.log('🍎 Available snack recipes:', snackRecipes.length);

        userProfile.mealPreferences.snackPositions.forEach((position: string, index: number) => {
          let selectedSnack;
          
          if (snackRecipes.length > 0) {
            selectedSnack = snackRecipes[index % snackRecipes.length];
            console.log(`✅ Selected snack for ${position}:`, {
              name: selectedSnack.name,
              calories: selectedSnack.calories,
              protein: selectedSnack.protein,
              carbs: selectedSnack.carbs,
              fat: selectedSnack.fat
            });
          } else {
            // Fallback snack
            selectedSnack = {
              id: 'fallback-snack',
              name: 'Healthy Snack',
              calories: 150,
              protein: 5,
              carbs: 15,
              fat: 7,
              source: 'fallback'
            };
            console.log(`📦 Using fallback snack for ${position}:`, selectedSnack);
          }

          // 🔧 OPRAVED: Kompletní nutrition info pro snacky
          get().addMeal(userId, date, {
            type: 'Snack',
            name: selectedSnack.name,
            position: position,
            calories: selectedSnack.calories,
            protein: selectedSnack.protein,
            carbs: selectedSnack.carbs || 0,  // 🔧 OPRAVED: Fallback na 0
            fat: selectedSnack.fat || 0       // 🔧 OPRAVED: Fallback na 0
          } as Omit<Meal, 'id' | 'userId' | 'date'>);

          totalMealsGenerated++;
        });
      }

      console.log(`🎉 Generated ${totalMealsGenerated} meals total`);
      
      // 🔧 OPRAVED: Debug finálního meal planu
      const finalMealPlan = get().getMealPlan(userId, date);
      console.log('📊 Final meal plan:', finalMealPlan);
      
      return true;

    } catch (error) {
      console.error('❌ Meal plan generation failed:', error);
      
      // Fallback na simple generation
      console.log('🔄 Trying fallback generation...');
      return get().generateSimpleFallbackPlan(userId, date, userProfile);
    }
  },

  // 🔧 OPRAVED: Inicializace databáze s fallback daty
  initializeRecipeDatabase: async () => {
    try {
      console.log('🌐 Initializing recipe database with fallback data...');
      
      // Pro teď používáme fallback data
      const simpleFallback: APIRecipe[] = [
        {
          id: 'fallback-1',
          name: 'Oatmeal',
          type: 'Breakfast',
          calories: 250,
          protein: 10,
          carbs: 45,
          fat: 4,
          source: 'fallback'
        },
        {
          id: 'fallback-2',
          name: 'Turkey Sandwich',
          type: 'Lunch',
          calories: 300,
          protein: 25,
          carbs: 30,
          fat: 12,
          source: 'fallback'
        },
        {
          id: 'fallback-3',
          name: 'Grilled Salmon',
          type: 'Dinner',
          calories: 320,
          protein: 35,
          carbs: 0,
          fat: 18,
          source: 'fallback'
        },
        {
          id: 'fallback-4',
          name: 'Greek Yogurt',
          type: 'Snack',
          calories: 130,
          protein: 15,
          carbs: 8,
          fat: 5,
          source: 'fallback'
        },
        {
          id: 'fallback-5',
          name: 'Apple with Peanut Butter',
          type: 'Snack',
          calories: 190,
          protein: 8,
          carbs: 25,
          fat: 8,
          source: 'fallback'
        },
        {
          id: 'fallback-6',
          name: 'Protein Smoothie',
          type: 'Snack',
          calories: 200,
          protein: 20,
          carbs: 15,
          fat: 6,
          source: 'fallback'
        }
      ];

      console.log('✅ Recipe database initialized with', simpleFallback.length, 'fallback recipes');

      set({
        apiRecipes: simpleFallback,
        isRecipeDatabaseInitialized: true,
        lastAPIUpdate: Date.now()
      });

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      
      // Minimální fallback
      set({
        apiRecipes: [
          {
            id: 'minimal-1',
            name: 'Simple Meal',
            type: 'Breakfast',
            calories: 200,
            protein: 15,
            carbs: 20,
            fat: 8,
            source: 'fallback'
          }
        ],
        isRecipeDatabaseInitialized: true,
        lastAPIUpdate: Date.now()
      });
    }
  },

  // Vyhledávání receptů
  searchAPIRecipes: async (query: string) => {
    try {
      const allRecipes = get().apiRecipes;
      return allRecipes.filter(recipe => 
        recipe.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('❌ Recipe search failed:', error);
      return [];
    }
  },

  // Získání receptů podle typu
  getRecipesByMealType: (mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => {
    return get().apiRecipes.filter(recipe => recipe.type === mealType);
  },

  // Fallback metoda pro offline použití
  generateSimpleFallbackPlan: (userId: string, date: string, userProfile: any): boolean => {
    try {
      console.log('📱 Generating simple fallback meal plan');
      
      const simpleMeals = [
        { type: 'Breakfast' as const, name: 'Scrambled Eggs', calories: 220, protein: 14, carbs: 2, fat: 18 },
        { type: 'Lunch' as const, name: 'Chicken Salad', calories: 280, protein: 35, carbs: 8, fat: 12 },
        { type: 'Dinner' as const, name: 'Grilled Salmon', calories: 320, protein: 35, carbs: 0, fat: 18 }
      ];

      simpleMeals.forEach(meal => {
        get().addMeal(userId, date, meal as Omit<Meal, 'id' | 'userId' | 'date'>);
      });

      // Přidej snacky pokud jsou nastavené
      if (userProfile.mealPreferences?.snackPositions) {
        userProfile.mealPreferences.snackPositions.forEach((position: string) => {
          get().addMeal(userId, date, {
            type: 'Snack' as const,
            name: 'Healthy Snack',
            position: position,
            calories: 150,
            protein: 5,
            carbs: 15,
            fat: 7
          } as Omit<Meal, 'id' | 'userId' | 'date'>);
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Even fallback generation failed:', error);
      return false;
    }
  },

  // Existující metody
  getMealPlan: (userId: string, date: string): MealPlan | null => {
    const key = `${userId}-${date}`;
    return get().mealPlans[key] || null;
  },

  addMeal: (userId: string, date: string, mealData: Omit<Meal, 'id' | 'userId' | 'date'>) => {
    const key = `${userId}-${date}`;
    const mealPlans = get().mealPlans;
    
    const meal: Meal = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      date,
      ...mealData
    };
    
    if (!mealPlans[key]) {
      mealPlans[key] = {
        id: key,
        userId,
        date,
        meals: []
      };
    }
    
    mealPlans[key].meals.push(meal);
    
    // 🔧 OPRAVED: Debug přidání meal
    console.log('✅ Added meal:', {
      type: meal.type,
      name: meal.name,
      position: meal.position,
      nutrition: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat
      }
    });
    
    set({ mealPlans: { ...mealPlans } });
  },

  removeMeal: (userId: string, date: string, mealId: string) => {
    const key = `${userId}-${date}`;
    const mealPlans = get().mealPlans;
    
    if (mealPlans[key]) {
      mealPlans[key].meals = mealPlans[key].meals.filter((meal: Meal) => meal.id !== mealId);
      set({ mealPlans: { ...mealPlans } });
    }
  },

  resetDay: (userId: string, date: string) => {
    const key = `${userId}-${date}`;
    const mealPlans = get().mealPlans;
    
    if (mealPlans[key]) {
      delete mealPlans[key];
      set({ mealPlans: { ...mealPlans } });
    }
  },

  setMealPlans: (newMealPlans: Record<string, MealPlan>) => {
    set({ mealPlans: newMealPlans });
  }
}));