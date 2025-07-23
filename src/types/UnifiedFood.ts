// src/types/UnifiedFood.ts
// 🔧 COMPLETE TYPE DEFINITIONS - Fixed all TypeScript errors

/**
 * Unified nutrition interface (standardized per 100g)
 */
export interface UnifiedNutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number; // Optional - not all sources have this
  sugar?: number; // ← FIXED: Changed from 'sugars' to 'sugar' 
  sodium?: number; // in mg
  calcium?: number;
  iron?: number;
  vitaminC?: number;
  vitaminA?: number;
  potassium?: number;
  magnesium?: number;
}

/**
 * OpenFoodFacts specific data
 */
export interface OpenFoodFactsData {
  barcode: string;
  nutriScore?: string; // A-E
  novaGroup?: number; // 1-4
  nutrientLevels?: {
    fat?: 'low' | 'moderate' | 'high';
    sugar?: 'low' | 'moderate' | 'high'; // ← FIXED: Changed from 'sugars' to 'sugar'
    salt?: 'low' | 'moderate' | 'high';
  };
  ingredientAnalysis?: string[]; // ← FIXED: Changed from 'ingredientsAnalysis' to 'ingredientAnalysis'
  categories?: string[];
  countries?: string[];
  lastModified?: number;
}

/**
 * USDA specific data
 */
export interface USDAData {
  fdcId: number;
  category?: string;
  dataType: string;
  publicationDate?: string;
  foodPortions?: Array<{
    amount: number;
    unit: string;
    modifier?: string;
  }>;
}

/**
 * Metadata for any food item
 */
export interface FoodMetadata {
  image?: string;
  description?: string;
  servingSizes: Array<{
    amount: number;
    unit: string;
    description: string;
  }>;
}

/**
 * Main unified food item interface
 */
export interface UnifiedFoodItem {
  id: string;
  name: string;
  source: 'usda' | 'openfoodfacts' | 'user';
  type: 'ingredient' | 'food-drink';
  
  // Standardized nutrition (per 100g)
  nutrition: UnifiedNutrition;
  
  // Source-specific data (optional)
  openFoodFactsData?: OpenFoodFactsData;
  usdaData?: USDAData;
  
  // Common metadata
  metadata: FoodMetadata;
}

/**
 * API response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Search result interface
 */
export interface UnifiedSearchResult {
  items: UnifiedFoodItem[];
  totalFound: number;
  sources: {
    usda: number;
    openfoodfacts: number;
    userCustom: number;
  };
  searchTime: number; // in ms
  filters?: UnifiedSearchFilters;
}

/**
 * Search filters
 */
export interface UnifiedSearchFilters {
  type?: 'ingredient' | 'food-drink' | 'all';
  source?: 'usda' | 'openfoodfacts' | 'user' | 'all';
  nutritionFilters?: {
    maxCalories?: number;
    minProtein?: number;
    maxCarbs?: number;
    maxFat?: number;
  };
  sortBy?: 'name' | 'calories' | 'protein' | 'relevance';
}

/**
 * Product upload data (for OpenFoodFacts contribution)
 */
export interface ProductUploadData {
  barcode: string;
  name: string; // ← FIXED: Changed from 'productName' to 'name'
  nutrition?: NutritionInput; // ← FIXED: Uses NutritionInput interface
  ingredients?: string;
  categories?: string[];
  countries?: string[];
  image?: string; // Base64 or URL
}

/**
 * Nutrition input interface (for forms)
 */
export interface NutritionInput {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number; // ← FIXED: Consistent naming
  sodium?: number;
  calcium?: number;
  iron?: number;
  vitaminC?: number;
  vitaminA?: number;
  potassium?: number;
  magnesium?: number;
}

/**
 * Utility function to convert NutritionInput to UnifiedNutrition
 */
export function convertNutritionToNumbers(input: NutritionInput): UnifiedNutrition {
  return {
    calories: input.calories || 0,
    protein: input.protein || 0,
    carbohydrates: input.carbohydrates || 0,
    fat: input.fat || 0,
    fiber: input.fiber,
    sugar: input.sugar, // ← FIXED: Consistent naming
    sodium: input.sodium,
    calcium: input.calcium,
    iron: input.iron,
    vitaminC: input.vitaminC,
    vitaminA: input.vitaminA,
    potassium: input.potassium,
    magnesium: input.magnesium,
  };
}

/**
 * Utility function to safely access nutrition values
 */
export function safeNutritionValue(value: number | undefined, defaultValue: number = 0): number {
  return value && !isNaN(value) ? value : defaultValue;
}

/**
 * Utility function to format nutrition display
 */
export function formatNutritionValue(value: number | undefined, decimals: number = 1): string {
  if (!value || isNaN(value)) return '0';
  return value < 1 ? value.toFixed(decimals) : Math.round(value).toString();
}