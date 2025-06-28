// src/types/index.ts
export interface User {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  height: number; // cm
  weight: number; // kg
  bodyFat: number; // %
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  categories: string[];
  image?: string;
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

export interface MealPlan {
  id: string;
  date: string; // YYYY-MM-DD format
  meals: Meal[];
  userId: string;
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: string;
  customName?: string;
  servings: number;
  time?: string; // HH:MM format
}

// Additional types from meal.ts
export * from './meal';