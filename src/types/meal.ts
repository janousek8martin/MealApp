// src/types/meal.ts

export interface Meal {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  position?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  categories: string[];
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  image?: string;
}

export interface Food {
  id: string;
  name: string;
  category?: string;
  nutrition: NutritionInfo;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
}

export type SnackPosition = 
  | 'Before Breakfast'
  | 'Between Breakfast and Lunch'
  | 'Between Lunch and Dinner'
  | 'After Dinner';

export interface MealPlan {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  meals: Meal[];
}