// src/utils/mealPlannerHelper.ts
// Helper funkce pro MealPlannerScreen - ČISTÁ VERZE

import { Meal, MealPlan, createDefaultMealPlan, createMealFromSnackPosition } from '../types/meal';

/**
 * Aktualizuje existující meal plany podle nových snack preferencí
 */
export const updateExistingMealPlansWithSnacks = (
  allMealPlans: Record<string, MealPlan>,
  selectedUserId: string,
  snackPositions: string[]
): Record<string, MealPlan> => {
  const updatedMealPlans = { ...allMealPlans };

  // UPDATE EXISTING: Aktualizuj existující meal plany
  Object.keys(updatedMealPlans).forEach(key => {
    if (key.startsWith(selectedUserId + '-')) {
      const dateStr = key.split('-')[1];
      const currentMealPlan = updatedMealPlans[key];
      
      // Zachovej existující hlavní jídla - s typovaným parametrem
      const existingMainMeals = currentMealPlan.meals.filter((meal: Meal) => 
        meal.type !== 'Snack'
      );
      
      // Vytvoř nové snacky podle aktuálních preferences
      const newSnacks: Meal[] = snackPositions.map((position, index) => 
        createMealFromSnackPosition(selectedUserId, dateStr, position, index)
      );
      
      // Aktualizuj meal plan
      updatedMealPlans[key] = {
        ...currentMealPlan,
        meals: [...existingMainMeals, ...newSnacks]
      };
    }
  });

  return updatedMealPlans;
};

/**
 * Vytvoří meal plany pro aktuální týden pokud neexistují
 */
export const createMissingMealPlansForWeek = (
  allMealPlans: Record<string, MealPlan>,
  selectedUserId: string,
  selectedDate: Date,
  snackPositions: string[]
): Record<string, MealPlan> => {
  const updatedMealPlans = { ...allMealPlans };

  // CREATE MISSING: Vytvoř meal plány pro aktuální týden pokud neexistují
  const currentDate = new Date(selectedDate);
  for (let i = -7; i <= 7; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const key = `${selectedUserId}-${dateStr}`;
    
    if (!updatedMealPlans[key]) {
      const newMealPlan = createDefaultMealPlan(selectedUserId, dateStr);
      
      // Přidej snacky podle preferencí
      const snacks: Meal[] = snackPositions.map((position, index) => 
        createMealFromSnackPosition(selectedUserId, dateStr, position, index)
      );
      
      newMealPlan.meals = snacks;
      updatedMealPlans[key] = newMealPlan;
    }
  }

  return updatedMealPlans;
};

/**
 * Hlavní funkce - Nahrazuje problematický kód z MealPlannerScreen
 */
export const updateMealPlansWithSnackPositions = (
  currentMealPlans: Record<string, MealPlan>,
  selectedUserId: string,
  selectedDate: Date,
  snackPositions: string[]
): Record<string, MealPlan> => {
  
  console.log('🔄 Debug Meal Plans for user', selectedUserId, ':', currentMealPlans);
  
  // Krok 1: Aktualizuj existující plány
  let updatedMealPlans = updateExistingMealPlansWithSnacks(
    currentMealPlans, 
    selectedUserId, 
    snackPositions
  );

  // Krok 2: Vytvoř chybějící plány pro týden
  updatedMealPlans = createMissingMealPlansForWeek(
    updatedMealPlans,
    selectedUserId,
    selectedDate,
    snackPositions
  );

  console.log('✅ Meal plans updated:', {
    totalPlans: Object.keys(updatedMealPlans).length,
    userPlans: Object.keys(updatedMealPlans).filter(key => key.startsWith(selectedUserId)).length
  });

  return updatedMealPlans;
};

/**
 * Pomocná funkce pro filtrování jídel podle typu s type safety
 */
export const filterMealsByTypeTypeSafe = (meals: Meal[], mealType: Meal['type']): Meal[] => {
  return meals.filter((meal: Meal) => meal.type === mealType);
};

/**
 * Pomocná funkce pro počítání kalorií z meal planu
 */
export const calculateMealPlanTotals = (mealPlan: MealPlan | null) => {
  if (!mealPlan || !mealPlan.meals) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  return mealPlan.meals.reduce(
    (totals, meal: Meal) => ({
      calories: totals.calories + (meal.calories || 0),
      protein: totals.protein + (meal.protein || 0),
      carbs: totals.carbs + (meal.carbs || 0),
      fat: totals.fat + (meal.fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

/**
 * Validace meal objektu - type guard
 */
export const isValidMeal = (obj: any): obj is Meal => {
  return obj && 
         typeof obj.id === 'string' &&
         typeof obj.userId === 'string' &&
         typeof obj.date === 'string' &&
         ['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(obj.type) &&
         typeof obj.name === 'string';
};

/**
 * Debug funkce pro meal planner
 */
export const debugMealPlans = (mealPlans: Record<string, MealPlan>, userId: string) => {
  const userPlans = Object.entries(mealPlans)
    .filter(([key]) => key.startsWith(userId))
    .map(([key, plan]) => ({
      date: key.split('-')[1],
      mealsCount: plan.meals.length,
      snacksCount: plan.meals.filter((meal: Meal) => meal.type === 'Snack').length,
      mainMealsCount: plan.meals.filter((meal: Meal) => meal.type !== 'Snack').length
    }));

  console.log('🔍 Debug Meal Plans for user', userId, ':', userPlans);
  return userPlans;
};