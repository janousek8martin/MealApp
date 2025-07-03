// src/types/index.ts
export interface User {
  id: string;
  name: string;
  age?: string;
  gender?: 'Male' | 'Female';
  height?: string; // cm value when using cm
  heightUnit?: 'cm' | 'ft'; // unit selection
  heightFeet?: string; // feet value when using ft/in
  heightInches?: string; // inches value when using ft/in
  weight?: string; // current weight value
  weightUnit?: 'kg' | 'lbs'; // weight unit selection
  bodyFat?: string; // current body fat percentage
  goalWeight?: string; // goal weight value
  goalBodyFat?: string; // goal body fat percentage
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  
  // New nutritional goals fields
  activityMultiplier?: number; // 1.2 - 2.2
  fitnessGoal?: {
    goal: string; // 'Lose Fat' | 'Maintenance' | 'Build Muscle' | 'Lose Fat & Build Muscle'
    fitnessLevel?: string; // 'Beginner' | 'Intermediate' | 'Advanced'
    calorieValue: string; // percentage adjustment like '-20', '0', '25'
  };
  tdci?: {
    baseTDCI: number;
    adjustedTDCI: number;
    weightChange: number;
    manualAdjustment: number;
  };
  macronutrients?: {
    protein: number; // grams
    fat: number; // grams
    carbs: number; // grams
    proteinPercentage: number;
    fatPercentage: number;
    carbsPercentage: number;
  };
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD format
  weight: number;
  bodyFat?: number;
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