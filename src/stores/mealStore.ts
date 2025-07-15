// src/stores/mealStore.ts
// Aktualizovaný Meal Store - OPRAVENO: Bez persist middleware

import { create } from 'zustand';
// ✅ OPRAVENO: Odstraněn persist middleware
import { Meal, MealPlan } from '../types/meal';
import { RecipeFromAPI } from '../services/foodApiService'; // ✅ OPRAVENO: Normální import

// Rozšíříme váš existující interface
export interface APIRecipe extends RecipeFromAPI {
  // Kompatibilita s vaším existujícím systémem
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
  // Existující struktura
  mealPlans: Record<string, MealPlan>; // ✅ Správný typ
  
  // ✅ NOVÉ: API recepty
  apiRecipes: APIRecipe[];
  isRecipeDatabaseInitialized: boolean;
  lastAPIUpdate: number | null;
  
  // ✅ AKTUALIZOVANÁ generateMealPlan metoda
  generateMealPlan: (userId: string, date: string, userProfile: any) => Promise<boolean>;
  
  // ✅ NOVÉ: API metody
  initializeRecipeDatabase: () => Promise<void>;
  searchAPIRecipes: (query: string) => Promise<APIRecipe[]>;
  getRecipesByMealType: (mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => APIRecipe[];
  generateSimpleFallbackPlan: (userId: string, date: string, userProfile: any) => boolean; // ✅ PŘIDÁNO
  
  // Existující metody (zachováváme kompatibilitu)
  getMealPlan: (userId: string, date: string) => MealPlan | null; // ✅ Správný typ
  addMeal: (userId: string, date: string, meal: Omit<Meal, 'id' | 'userId' | 'date'>) => void; // ✅ Správný typ
  removeMeal: (userId: string, date: string, mealId: string) => void;
  resetDay: (userId: string, date: string) => void;
  setMealPlans: (newMealPlans: Record<string, MealPlan>) => void; // ✅ Správný typ
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

    // Filtr podle kalorií (pokud má uživatel limit)
    if (userProfile.tdci?.adjustedTDCI) {
      const maxCaloriesPerMeal = userProfile.tdci.adjustedTDCI * 0.5; // Max 50% denních kalorií na jídlo
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
  
  // ✅ NOVÉ: API recipe management
  apiRecipes: [],
  isRecipeDatabaseInitialized: false,
  lastAPIUpdate: null,

      // ✅ AKTUALIZOVANÁ generateMealPlan - používá API
      generateMealPlan: async (userId: string, date: string, userProfile: any) => {
        try {
          console.log('🎯 Starting API-powered meal plan generation');

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
              source: selectedRecipe.source
            });

            // Přidej jídlo - ✅ OPRAVENO: Správný typ pro meal
            get().addMeal(userId, date, {
              type: mealType, // ✅ Už je správný typ
              name: selectedRecipe.name,
              recipeId: selectedRecipe.id,
              calories: selectedRecipe.calories,
              protein: selectedRecipe.protein,
              carbs: selectedRecipe.carbs,
              fat: selectedRecipe.fat
            } as Omit<Meal, 'id' | 'userId' | 'date'>);

            totalMealsGenerated++;
          }

          // Přidej snacky
          if (userProfile.mealPreferences?.snackPositions) {
            const snackRecipes = get().getRecipesByMealType('Snack')
              .filter(recipe => filteredRecipes.includes(recipe));

            userProfile.mealPreferences.snackPositions.forEach((position: string, index: number) => {
              let selectedSnack;
              
              if (snackRecipes.length > 0) {
                selectedSnack = snackRecipes[index % snackRecipes.length];
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
              }

              // ✅ OPRAVENO: Správný typ pro snack meal
              get().addMeal(userId, date, {
                type: 'Snack', // ✅ Explicitně jako 'Snack'
                name: selectedSnack.name,
                position: position,
                calories: selectedSnack.calories,
                protein: selectedSnack.protein,
                carbs: selectedSnack.carbs,
                fat: selectedSnack.fat
              } as Omit<Meal, 'id' | 'userId' | 'date'>);

              totalMealsGenerated++;
            });
          }

          console.log(`🎉 Generated ${totalMealsGenerated} meals using API data`);
          return true;

        } catch (error) {
          console.error('❌ API meal generation failed:', error);
          
          // Fallback na jednoduché recepty
          console.log('🔄 Falling back to simple meal generation...');
          return get().generateSimpleFallbackPlan(userId, date, userProfile);
        }
      },

      // ✅ NOVÁ metoda: Inicializace databáze - BEZ závislosti na foodAPIService
      initializeRecipeDatabase: async () => {
        try {
          console.log('🌐 Initializing recipe database with fallback data...');
          
          // ✅ OPRAVENO: Používáme lokální fallback data s type safety
          const fallbackRecipes: RecipeFromAPI[] = [
            {
              id: 'fallback-1',
              name: 'Scrambled Eggs',
              type: 'Breakfast',
              calories: 220,
              protein: 14,
              carbs: 2,
              fat: 18,
              source: 'usda'
            },
            {
              id: 'fallback-2',
              name: 'Chicken Breast',
              type: 'Lunch',
              calories: 280,
              protein: 35,
              carbs: 0,
              fat: 12,
              source: 'usda'
            },
            {
              id: 'fallback-3',
              name: 'Grilled Salmon',
              type: 'Dinner',
              calories: 320,
              protein: 35,
              carbs: 0,
              fat: 18,
              source: 'usda'
            },
            {
              id: 'fallback-4',
              name: 'Greek Yogurt',
              type: 'Snack',
              calories: 130,
              protein: 15,
              carbs: 8,
              fat: 5,
              source: 'usda'
            },
            {
              id: 'fallback-5',
              name: 'Oatmeal',
              type: 'Breakfast',
              calories: 250,
              protein: 10,
              carbs: 40,
              fat: 6,
              source: 'usda'
            },
            {
              id: 'fallback-6',
              name: 'Turkey Sandwich',
              type: 'Lunch',
              calories: 300,
              protein: 25,
              carbs: 30,
              fat: 12,
              source: 'usda'
            }
          ];
          
          // Převeď recepty na náš formát s kompatibilitou
          const formattedRecipes: APIRecipe[] = fallbackRecipes.map(recipe => ({
            ...recipe,
            categories: [recipe.type], // Kompatibilita s existujícím systémem
            ingredients: [{
              id: '1',
              name: recipe.name,
              amount: 1,
              unit: 'serving'
            }],
            instructions: [`Prepare ${recipe.name} according to standard methods`],
            image: `https://via.placeholder.com/150?text=${encodeURIComponent(recipe.name)}`
          }));

          set({
            apiRecipes: formattedRecipes,
            isRecipeDatabaseInitialized: true,
            lastAPIUpdate: Date.now()
          });

          console.log('✅ Recipe database initialized with', formattedRecipes.length, 'fallback recipes');
          
        } catch (error) {
          console.error('❌ Failed to initialize recipe database:', error);
          
          // Jednoduchý fallback
          const simpleFallback: APIRecipe[] = [
            {
              id: 'simple-1',
              name: 'Simple Meal',
              type: 'Breakfast',
              calories: 200,
              protein: 10,
              carbs: 20,
              fat: 8,
              source: 'usda',
              categories: ['Breakfast'],
              ingredients: [{ id: '1', name: 'Simple Meal', amount: 1, unit: 'serving' }],
              instructions: ['Prepare simple meal']
            }
          ];

          set({
            apiRecipes: simpleFallback,
            isRecipeDatabaseInitialized: true,
            lastAPIUpdate: Date.now()
          });
        }
      },

      // ✅ NOVÁ metoda: Vyhledávání - zjednodušeno bez API
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

      // ✅ NOVÁ metoda: Získání receptů podle typu
      getRecipesByMealType: (mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => {
        return get().apiRecipes.filter(recipe => recipe.type === mealType);
      },

      // ✅ FALLBACK metoda pro offline použití
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

      // Existující metody (zachováváme pro kompatibilitu)
      getMealPlan: (userId: string, date: string): MealPlan | null => {
        const key = `${userId}-${date}`;
        return get().mealPlans[key] || null;
      },

      addMeal: (userId: string, date: string, mealData: Omit<Meal, 'id' | 'userId' | 'date'>) => {
        const key = `${userId}-${date}`;
        const mealPlans = get().mealPlans;
        
        const meal: Meal = {
          id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ✅ Unique ID
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