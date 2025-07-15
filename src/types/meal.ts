// src/types/meal.ts
// Správné typy pro meal objekty - oprava type errors

export interface Meal {
  id: string;
  userId: string;
  date: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  position?: string;
  recipeId?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  apiSource?: string;
  fdcId?: number;
}

export interface MealPlan {
  id: string;
  userId: string;
  date: string;
  meals: Meal[];
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  timestamp?: number;
}

// Helper funkce pro MealPlannerScreen - oprava type errors
export const createDefaultMealPlan = (userId: string, dateStr: string): MealPlan => {
  return {
    id: `${userId}-${dateStr}`,
    userId,
    date: dateStr,
    meals: []
  };
};

export const createMealFromSnackPosition = (
  userId: string, 
  dateStr: string, 
  position: string, 
  index: number
): Meal => {
  return {
    id: `snack-${position.replace(/\s+/g, '')}-${dateStr}-${index}-${Date.now()}`, // ✅ Unique ID
    userId,
    date: dateStr,
    type: 'Snack',
    name: 'Snack',
    position: position
  };
};

// Type guard pro kontrolu typu meal
export const isMeal = (obj: any): obj is Meal => {
  return obj && 
         typeof obj.id === 'string' &&
         typeof obj.userId === 'string' &&
         typeof obj.date === 'string' &&
         ['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(obj.type) &&
         typeof obj.name === 'string';
};

// Helper pro filtrování jídel podle typu
export const filterMealsByType = (meals: Meal[], type: Meal['type']): Meal[] => {
  return meals.filter(meal => meal.type === type);
};

// Helper pro výpočet denních celků
export const calculateDailyTotals = (meals: Meal[]) => {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + (meal.calories || 0),
      protein: totals.protein + (meal.protein || 0),
      carbs: totals.carbs + (meal.carbs || 0),
      fat: totals.fat + (meal.fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};