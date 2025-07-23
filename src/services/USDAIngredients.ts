// src/services/USDAIngredients.ts
// 🥕 USDA FoodData Central service - FIXED parsing errors

import { UnifiedFoodItem, APIResponse, safeNutritionValue } from '../types/UnifiedFood';

/**
 * USDA FoodData Central API response interfaces
 */
interface USDAFood {
  fdcId: number;
  description: string;
  foodCategory?: {
    id: number;
    code: string;
    description: string;
  };
  foodNutrients: {
    nutrient: {
      id: number;
      number: string;
      name: string;
      rank?: number;
      unitName: string;
    };
    amount: number;
  }[];
  dataType: string;
  publicationDate?: string;
  foodPortions?: {
    id: number;
    amount: number;
    measureUnit: {
      id: number;
      name: string;
      abbreviation: string;
    };
    modifier?: string;
  }[];
}

interface USDASearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFood[];
}

/**
 * USDA FoodData Central service for ingredient data
 */
export class USDAIngredients {
  private static readonly API_KEY = 'DEMO_KEY'; // Replace with your API key
  private static readonly BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static cache = new Map<string, { data: UnifiedFoodItem[]; timestamp: number }>();

  /**
   * Search for ingredients in USDA database
   */
  static async searchIngredients(query: string): Promise<APIResponse<UnifiedFoodItem[]>> {
    try {
      // Check cache first
      const cacheKey = `usda-search-${query.toLowerCase()}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('🎯 USDA cache hit:', query);
        return {
          success: true,
          data: cached.data,
          message: 'Data retrieved from cache',
          timestamp: new Date().toISOString()
        };
      }

      const url = `${this.BASE_URL}/foods/search`;
      const params = new URLSearchParams({
        query: query.trim(),
        dataType: 'Foundation,SR Legacy',
        pageSize: '20',
        pageNumber: '1',
        sortBy: 'dataType.keyword',
        sortOrder: 'asc',
        api_key: this.API_KEY
      });
      
      console.log('🔍 USDA search:', query);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${url}?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MealPlannerApp/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
      }
      
      const data: USDASearchResponse = await response.json();
      const foods = data.foods || [];
      
      console.log(`📊 USDA found ${foods.length} ingredients`);
      
      // Convert to unified format with proper error handling
      const unifiedItems: UnifiedFoodItem[] = [];
      
      for (const food of foods) {
        try {
          const converted = this.convertToUnified(food);
          if (converted) {
            unifiedItems.push(converted);
          }
        } catch (error) {
          console.warn(`⚠️ Skipping USDA food ${food.fdcId}:`, error);
          // Continue processing other foods
        }
      }
      
      console.log(`📊 USDA contributed ${unifiedItems.length} ingredients`);
      
      // Cache results
      this.cache.set(cacheKey, {
        data: unifiedItems,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        data: unifiedItems,
        message: `Found ${unifiedItems.length} ingredients`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ USDA API error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'USDA search failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get food by FDC ID
   */
  static async getFoodById(fdcId: number): Promise<APIResponse<UnifiedFoodItem | null>> {
    try {
      const cacheKey = `usda-food-${fdcId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.data.length > 0) {
        return {
          success: true,
          data: cached.data[0],
          message: 'Food retrieved from cache',
          timestamp: new Date().toISOString()
        };
      }

      const url = `${this.BASE_URL}/food/${fdcId}`;
      const params = new URLSearchParams({
        api_key: this.API_KEY
      });
      
      const response = await fetch(`${url}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }
      
      const food: USDAFood = await response.json();
      const unifiedItem = this.convertToUnified(food);
      
      if (unifiedItem) {
        return {
          success: true,
          data: unifiedItem,
          message: 'Food found',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          data: null,
          message: 'Food not found',
          timestamp: new Date().toISOString()
        };
      }
      
    } catch (error) {
      console.error('❌ USDA getFoodById error:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Convert USDA food to unified format - FIXED parsing
   */
  private static convertToUnified(food: USDAFood): UnifiedFoodItem | null {
    try {
      // Skip foods with no meaningful name
      if (!food.description || food.description.trim().length < 3) {
        return null;
      }

      // FIXED: Safe extraction of nutrition data
      const nutrients = food.foodNutrients || [];
      const nutritionMap = new Map<string, number>();
      
      // FIXED: Check if nutrient and nutrient.nutrient exist before accessing
      nutrients.forEach(nutrient => {
        if (nutrient && nutrient.nutrient && nutrient.nutrient.number && typeof nutrient.amount === 'number') {
          const key = nutrient.nutrient.number;
          nutritionMap.set(key, nutrient.amount);
        }
      });

      // USDA nutrient IDs (standardized)
      const calories = safeNutritionValue(nutritionMap.get('208'), 0); // Energy (kcal)
      const protein = safeNutritionValue(nutritionMap.get('203'), 0); // Protein
      const carbs = safeNutritionValue(nutritionMap.get('205'), 0); // Carbohydrates
      const fat = safeNutritionValue(nutritionMap.get('204'), 0); // Total fat
      const fiber = nutritionMap.get('291'); // Fiber
      const sugar = nutritionMap.get('269'); // Total sugars
      const sodium = nutritionMap.get('307'); // Sodium (in mg)
      const calcium = nutritionMap.get('301'); // Calcium
      const iron = nutritionMap.get('303'); // Iron
      const vitaminC = nutritionMap.get('401'); // Vitamin C
      const vitaminA = nutritionMap.get('320'); // Vitamin A (RAE)

      return {
        id: `usda-${food.fdcId}`,
        name: this.cleanFoodName(food.description),
        source: 'usda',
        type: 'ingredient',
        nutrition: {
          calories: Math.round(calories),
          protein: Math.round(protein * 10) / 10,
          carbohydrates: Math.round(carbs * 10) / 10,
          fat: Math.round(fat * 10) / 10,
          fiber: fiber ? Math.round(fiber * 10) / 10 : undefined,
          sugar: sugar ? Math.round(sugar * 10) / 10 : undefined,
          sodium: sodium ? Math.round(sodium) : undefined,
          calcium: calcium ? Math.round(calcium) : undefined,
          iron: iron ? Math.round(iron * 100) / 100 : undefined,
          vitaminC: vitaminC ? Math.round(vitaminC * 10) / 10 : undefined,
          vitaminA: vitaminA ? Math.round(vitaminA) : undefined,
        },
        usdaData: {
          fdcId: food.fdcId,
          category: food.foodCategory?.description,
          dataType: food.dataType,
          publicationDate: food.publicationDate,
          foodPortions: this.convertFoodPortions(food.foodPortions)
        },
        metadata: {
          image: this.getIngredientImage(food.description),
          description: `${this.cleanFoodName(food.description)} - USDA ${food.dataType}`,
          servingSizes: this.extractServingSizes(food.foodPortions)
        }
      };
      
    } catch (error) {
      console.error('❌ Error converting USDA food:', error);
      return null;
    }
  }

  /**
   * Convert USDA food portions to unified format
   */
  private static convertFoodPortions(foodPortions?: USDAFood['foodPortions']) {
    if (!foodPortions || foodPortions.length === 0) {
      return undefined;
    }
    
    return foodPortions.map(portion => ({
      amount: portion.amount,
      unit: portion.measureUnit.name,
      modifier: portion.modifier
    }));
  }

  /**
   * Extract serving sizes for metadata
   */
  private static extractServingSizes(foodPortions?: USDAFood['foodPortions']) {
    if (!foodPortions || foodPortions.length === 0) {
      return [
        { amount: 100, unit: 'g', description: '100 grams' }
      ];
    }
    
    return foodPortions.slice(0, 3).map(portion => ({
      amount: portion.amount,
      unit: portion.measureUnit.abbreviation || portion.measureUnit.name,
      description: `${portion.amount} ${portion.measureUnit.name}${portion.modifier ? ` ${portion.modifier}` : ''}`
    }));
  }

  /**
   * Clean USDA food names for display
   */
  private static cleanFoodName(description: string): string {
    return description
      .replace(/,\s*(raw|cooked|boiled|steamed|baked|roasted|grilled)$/i, ' ($1)')
      .replace(/,\s*(without\s+.*|with\s+.*)$/i, '')
      .replace(/,\s*(grade\s+.*|usda\s+.*|nfs)$/i, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  /**
   * Get placeholder image for ingredient based on description
   */
  private static getIngredientImage(description: string): string {
    const name = description.toLowerCase();
    
    if (name.includes('chicken') || name.includes('poultry')) {
      return 'https://via.placeholder.com/200x200/F4A460/FFFFFF?text=🐔';
    } else if (name.includes('beef') || name.includes('cattle')) {
      return 'https://via.placeholder.com/200x200/8B4513/FFFFFF?text=🥩';
    } else if (name.includes('pork') || name.includes('swine')) {
      return 'https://via.placeholder.com/200x200/DDA0DD/FFFFFF?text=🐷';
    } else if (name.includes('fish') || name.includes('salmon') || name.includes('tuna')) {
      return 'https://via.placeholder.com/200x200/4682B4/FFFFFF?text=🐟';
    } else if (name.includes('rice')) {
      return 'https://via.placeholder.com/200x200/F5DEB3/FFFFFF?text=🍚';
    } else if (name.includes('wheat') || name.includes('flour')) {
      return 'https://via.placeholder.com/200x200/DEB887/FFFFFF?text=🌾';
    } else if (name.includes('tomato')) {
      return 'https://via.placeholder.com/200x200/FF6347/FFFFFF?text=🍅';
    } else if (name.includes('carrot')) {
      return 'https://via.placeholder.com/200x200/FF8C00/FFFFFF?text=🥕';
    } else if (name.includes('apple')) {
      return 'https://via.placeholder.com/200x200/FF6347/FFFFFF?text=🍎';
    } else if (name.includes('banana')) {
      return 'https://via.placeholder.com/200x200/FFD700/FFFFFF?text=🍌';
    } else {
      return 'https://via.placeholder.com/200x200/4ECDC4/FFFFFF?text=🥕';
    }
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ USDA cache cleared');
  }

  /**
   * Get cache size
   */
  static getCacheSize(): number {
    return this.cache.size;
  }
}