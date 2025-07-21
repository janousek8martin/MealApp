// src/types/meal.ts
// ✅ FIXED: Better nutrition type safety to prevent "possibly undefined" errors

export interface Meal {
  id: string;
  userId: string;
  date: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  position?: string;
  recipeId?: string;
  // ✅ CRITICAL FIX: Make nutrition values required with default 0, not optional
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Keep these optional as they're less commonly used
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

// ✅ ENHANCED: Safe meal creation helpers
export const createMealWithDefaults = (mealData: Partial<Meal> & Pick<Meal, 'id' | 'userId' | 'date' | 'type' | 'name'>): Meal => {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ...mealData
  };
};

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
  return createMealWithDefaults({
    id: `snack-${position.replace(/\s+/g, '')}-${dateStr}-${index}-${Date.now()}`,
    userId,
    date: dateStr,
    type: 'Snack',
    name: 'Snack',
    position: position
  });
};

// ✅ ENHANCED: Nutrition safety helpers
export const safeNutritionValue = (value: number | undefined | null, fallback: number = 0): number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : fallback;
};

export const getMealNutrition = (meal: Meal) => {
  return {
    calories: safeNutritionValue(meal.calories),
    protein: safeNutritionValue(meal.protein),
    carbs: safeNutritionValue(meal.carbs),
    fat: safeNutritionValue(meal.fat)
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

// ✅ ENHANCED: Validate meal nutrition values
export const isValidMealNutrition = (meal: Meal): boolean => {
  return typeof meal.calories === 'number' && 
         typeof meal.protein === 'number' && 
         typeof meal.carbs === 'number' && 
         typeof meal.fat === 'number' &&
         meal.calories >= 0 && 
         meal.protein >= 0 && 
         meal.carbs >= 0 && 
         meal.fat >= 0;
};

// Helper pro filtrování jídel podle typu
export const filterMealsByType = (meals: Meal[], type: Meal['type']): Meal[] => {
  return meals.filter(meal => meal.type === type);
};

// ✅ FIXED: Safe calculation helper pro denní celky
export const calculateDailyTotals = (meals: Meal[]) => {
  return meals.reduce(
    (totals, meal) => {
      const nutrition = getMealNutrition(meal);
      return {
        calories: totals.calories + nutrition.calories,
        protein: totals.protein + nutrition.protein,
        carbs: totals.carbs + nutrition.carbs,
        fat: totals.fat + nutrition.fat
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
};

// ✅ NEW: Calculate meal plan accuracy vs targets
export const calculateMealPlanAccuracy = (
  meals: Meal[], 
  targets: { calories: number; protein: number; carbs: number; fat: number }
) => {
  const totals = calculateDailyTotals(meals);
  
  return {
    totals,
    accuracy: {
      calories: Math.abs(totals.calories - targets.calories) / targets.calories * 100,
      protein: Math.abs(totals.protein - targets.protein) / targets.protein * 100,
      carbs: Math.abs(totals.carbs - targets.carbs) / targets.carbs * 100,
      fat: Math.abs(totals.fat - targets.fat) / targets.fat * 100
    },
    withinTolerance: {
      calories: Math.abs(totals.calories - targets.calories) <= targets.calories * 0.15, // ±15%
      protein: Math.abs(totals.protein - targets.protein) <= targets.protein * 0.10,   // ±10%
      carbs: Math.abs(totals.carbs - targets.carbs) <= targets.carbs * 0.25,           // ±25%
      fat: Math.abs(totals.fat - targets.fat) <= targets.fat * 0.20                    // ±20%
    }
  };
};

// ✅ NEW: Recipe scaling helpers for Phase 1.2
export interface ScaledMeal extends Meal {
  scaleFactor?: number;
  originalCalories?: number;
  scaledPortion?: string; // e.g., "1.5x portion"
}

export const calculateScalingFactor = (targetCalories: number, recipeCalories: number): number => {
  if (recipeCalories <= 0) return 1;
  return targetCalories / recipeCalories;
};

export const scaleRecipeNutrition = (
  originalNutrition: { calories: number; protein: number; carbs: number; fat: number },
  scaleFactor: number
) => {
  return {
    calories: Math.round(originalNutrition.calories * scaleFactor),
    protein: Math.round(originalNutrition.protein * scaleFactor * 10) / 10, // 1 decimal place
    carbs: Math.round(originalNutrition.carbs * scaleFactor * 10) / 10,
    fat: Math.round(originalNutrition.fat * scaleFactor * 10) / 10
  };
};

export const formatScalingFactor = (scaleFactor: number): string => {
  if (scaleFactor === 1) return "1x portion";
  return `${Math.round(scaleFactor * 10) / 10}x portion`;
};

// ✅ NEW: Meal generation result interface pro Phase 1 completion tracking
export interface MealGenerationResult {
  success: boolean;
  mealsGenerated: number;
  accuracy: ReturnType<typeof calculateMealPlanAccuracy>;
  usedPortionSizes: boolean;
  usedFallback: boolean;
  errors?: string[];
}

// ✅ NEW: User portion sizes interface pro TypeScript support
export interface UserPortionSizes {
  Breakfast?: number;
  breakfast?: number;
  Lunch?: number;
  lunch?: number;
  Dinner?: number;
  dinner?: number;
  snack?: number;
  Snack?: number;
  // Individual snack positions
  'Before Breakfast'?: number;
  'Between Breakfast and Lunch'?: number;
  'Between Lunch and Dinner'?: number;
  'After Dinner'?: number;
  // Dynamic snack position keys
  [key: string]: number | undefined;
}