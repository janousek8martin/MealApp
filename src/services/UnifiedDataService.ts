// src/services/UnifiedDataService.ts
// 🔄 Unified data service that aggregates data from multiple sources
// Main entry point for all food data operations

import { USDAIngredients } from './USDAIngredients';
import { OpenFoodFactsService } from './OpenFoodFactsService'; // ← FIXED IMPORT
import { 
  UnifiedFoodItem, 
  UnifiedSearchResult, 
  UnifiedSearchFilters, 
  APIResponse,
  ProductUploadData 
} from '../types/UnifiedFood';

/**
 * Unified data service that aggregates data from multiple sources
 * Main entry point for all food data operations
 */
export class UnifiedDataService {
  
  /**
   * Search for ingredients (primarily USDA + OpenFoodFacts barcode capability)
   */
  static async searchIngredients(
    query: string, 
    includeOpenFoodFacts: boolean = true
  ): Promise<UnifiedSearchResult> {
    const startTime = Date.now();
    const allItems: UnifiedFoodItem[] = [];
    const sources = { usda: 0, openfoodfacts: 0, userCustom: 0 };
    
    console.log('🔍 UnifiedDataService.searchIngredients:', query);
    
    try {
      // Always search USDA for ingredients (primary source)
      const usdaResponse = await USDAIngredients.searchIngredients(query);
      if (usdaResponse.success && usdaResponse.data) {
        allItems.push(...usdaResponse.data);
        sources.usda = usdaResponse.data.length;
        console.log(`📊 USDA contributed ${sources.usda} ingredients`);
      }
      
      // Optionally include OpenFoodFacts for products with barcodes
      if (includeOpenFoodFacts) {
        const offResponse = await OpenFoodFactsService.searchProducts(query, true);
        if (offResponse.success && offResponse.data) {
          // Filter for ingredient-like products
          const ingredientProducts = offResponse.data.filter(item => 
            this.isIngredientLikeProduct(item)
          );
          allItems.push(...ingredientProducts);
          sources.openfoodfacts = ingredientProducts.length;
          console.log(`📊 OpenFoodFacts contributed ${sources.openfoodfacts} ingredients`);
        }
      }
      
    } catch (error) {
      console.error('❌ UnifiedDataService.searchIngredients error:', error);
    }
    
    return {
      items: allItems,
      totalFound: allItems.length,
      sources,
      searchTime: Date.now() - startTime,
      filters: { type: 'ingredient', source: 'all' }
    };
  }

  /**
   * Search for foods and drinks (primarily OpenFoodFacts + USDA fallback)
   */
  static async searchFoodsAndDrinks(
    query: string,
    includeOpenFoodFacts: boolean = true,
    includeUSDAFallback: boolean = true
  ): Promise<UnifiedSearchResult> {
    const startTime = Date.now();
    const allItems: UnifiedFoodItem[] = [];
    const sources = { usda: 0, openfoodfacts: 0, userCustom: 0 };
    
    console.log('🔍 UnifiedDataService.searchFoodsAndDrinks:', query);
    
    try {
      // Primary: OpenFoodFacts for real products with barcodes
      if (includeOpenFoodFacts) {
        const offResponse = await OpenFoodFactsService.searchProducts(query, true);
        if (offResponse.success && offResponse.data) {
          allItems.push(...offResponse.data);
          sources.openfoodfacts = offResponse.data.length;
          console.log(`📊 OpenFoodFacts contributed ${sources.openfoodfacts} products`);
        }
      }
      
      // Fallback: USDA for generic items
      if (includeUSDAFallback && allItems.length < 5) {
        const usdaResponse = await USDAIngredients.searchIngredients(query);
        if (usdaResponse.success && usdaResponse.data) {
          // Filter for food-like items (avoid raw ingredients)
          const foodLikeItems = usdaResponse.data.filter(item => 
            this.isFoodLikeItem(item)
          );
          allItems.push(...foodLikeItems);
          sources.usda = foodLikeItems.length;
          console.log(`📊 USDA fallback contributed ${sources.usda} items`);
        }
      }
      
    } catch (error) {
      console.error('❌ UnifiedDataService.searchFoodsAndDrinks error:', error);
    }
    
    return {
      items: allItems,
      totalFound: allItems.length,
      sources,
      searchTime: Date.now() - startTime,
      filters: { type: 'food-drink', source: 'all' }
    };
  }

  /**
   * Barcode lookup (OpenFoodFacts only)
   */
  static async lookupBarcode(barcode: string): Promise<APIResponse<UnifiedFoodItem | null>> {
    console.log('📷 UnifiedDataService.lookupBarcode:', barcode);
    return await OpenFoodFactsService.getProductByBarcode(barcode);
  }

  /**
   * Upload new product (OpenFoodFacts only)
   */
  static async uploadProduct(productData: ProductUploadData): Promise<APIResponse<string>> {
    console.log('📤 UnifiedDataService.uploadProduct:', productData.barcode);
    return await OpenFoodFactsService.uploadProduct(productData);
  }

  /**
   * Advanced search with filters
   */
  static async advancedSearch(
    query: string,
    filters: UnifiedSearchFilters
  ): Promise<UnifiedSearchResult> {
    console.log('🔍 UnifiedDataService.advancedSearch:', query, filters);
    
    // Route to appropriate search method based on type filter
    if (filters.type === 'ingredient') {
      return this.searchIngredients(query, filters.source !== 'usda');
    } else if (filters.type === 'food-drink') {
      return this.searchFoodsAndDrinks(query, filters.source !== 'usda', filters.source !== 'openfoodfacts');
    } else {
      // Search both and combine
      const [ingredientResults, foodResults] = await Promise.all([
        this.searchIngredients(query, true),
        this.searchFoodsAndDrinks(query, true, true)
      ]);
      
      const allItems = [...ingredientResults.items, ...foodResults.items];
      const combinedSources = {
        usda: ingredientResults.sources.usda + foodResults.sources.usda,
        openfoodfacts: ingredientResults.sources.openfoodfacts + foodResults.sources.openfoodfacts,
        userCustom: 0
      };
      
      return {
        items: this.applyFilters(allItems, filters),
        totalFound: allItems.length,
        sources: combinedSources,
        searchTime: Math.max(ingredientResults.searchTime, foodResults.searchTime),
        filters
      };
    }
  }

  /**
   * Get item by unified ID
   */
  static async getItemById(id: string): Promise<APIResponse<UnifiedFoodItem | null>> {
    try {
      if (id.startsWith('usda-')) {
        const fdcId = parseInt(id.replace('usda-', ''));
        return await USDAIngredients.getFoodById(fdcId);
      } else if (id.startsWith('off-')) {
        const barcode = id.replace('off-', '');
        return await OpenFoodFactsService.getProductByBarcode(barcode);
      } else {
        return {
          success: false,
          data: null,
          error: 'Invalid ID format',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Apply filters to search results
   */
  private static applyFilters(items: UnifiedFoodItem[], filters: UnifiedSearchFilters): UnifiedFoodItem[] {
    let filtered = [...items];
    
    // Filter by source
    if (filters.source && filters.source !== 'all') {
      filtered = filtered.filter(item => item.source === filters.source);
    }
    
    // Filter by type
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(item => item.type === filters.type);
    }
    
    // Filter by nutrition criteria
    if (filters.nutritionFilters) {
      const nutrition = filters.nutritionFilters;
      
      filtered = filtered.filter(item => {
        if (nutrition.maxCalories && item.nutrition.calories > nutrition.maxCalories) return false;
        if (nutrition.minProtein && item.nutrition.protein < nutrition.minProtein) return false;
        if (nutrition.maxCarbs && item.nutrition.carbohydrates > nutrition.maxCarbs) return false;
        if (nutrition.maxFat && item.nutrition.fat > nutrition.maxFat) return false;
        return true;
      });
    }
    
    // Sort results
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'calories':
            return a.nutrition.calories - b.nutrition.calories;
          case 'protein':
            return b.nutrition.protein - a.nutrition.protein; // Descending
          default:
            return 0;
        }
      });
    }
    
    return filtered;
  }

  /**
   * Check if OpenFoodFacts product is ingredient-like
   */
  private static isIngredientLikeProduct(item: UnifiedFoodItem): boolean {
    if (!item.openFoodFactsData) return false;
    
    const categories = item.openFoodFactsData.categories || [];
    const ingredientKeywords = [
      'fruits', 'vegetables', 'meats', 'fish', 'dairy-products',
      'cereals', 'spices', 'oils', 'nuts', 'legumes', 'herbs'
    ];
    
    return categories.some(cat => 
      ingredientKeywords.some(keyword => cat.includes(keyword))
    );
  }

  /**
   * Check if USDA item is food-like (prepared foods, not raw ingredients)
   */
  private static isFoodLikeItem(item: UnifiedFoodItem): boolean {
    if (!item.usdaData) return false;
    
    const category = item.usdaData.category || '';
    const name = item.name.toLowerCase();
    
    // Prefer prepared/processed foods
    const foodKeywords = [
      'prepared', 'cooked', 'baked', 'fried', 'grilled', 'steamed',
      'sandwich', 'pizza', 'burger', 'meal', 'dish', 'recipe',
      'fast food', 'restaurant', 'frozen', 'canned'
    ];
    
    // Avoid raw ingredients
    const rawKeywords = [
      'raw', 'fresh', 'uncooked', 'plain'
    ];
    
    const hasFood = foodKeywords.some(keyword => name.includes(keyword));
    const hasRaw = rawKeywords.some(keyword => name.includes(keyword));
    
    return hasFood && !hasRaw;
  }

  /**
   * Get nutrition summary for multiple items
   */
  static getNutritionSummary(items: UnifiedFoodItem[]): {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    averageCalories: number;
  } {
    if (items.length === 0) {
      return {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        averageCalories: 0
      };
    }

    const totals = items.reduce((acc, item) => {
      acc.calories += item.nutrition.calories;
      acc.protein += item.nutrition.protein;
      acc.carbs += item.nutrition.carbohydrates;
      acc.fat += item.nutrition.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein * 100) / 100,
      totalCarbs: Math.round(totals.carbs * 100) / 100,
      totalFat: Math.round(totals.fat * 100) / 100,
      averageCalories: Math.round(totals.calories / items.length)
    };
  }

  /**
   * Clear all caches
   */
  static clearAllCaches(): void {
    USDAIngredients.clearCache();
    OpenFoodFactsService.clearCache();
    console.log('🧹 All caches cleared');
  }

  /**
   * Get service status and statistics
   */
  static getServiceStatus(): {
    usda: { available: boolean; cacheSize: number };
    openFoodFacts: { available: boolean; cacheSize: number };
    unified: { available: boolean };
  } {
    return {
      usda: {
        available: true, // Always available (has fallback mock data)
        cacheSize: USDAIngredients.getCacheSize() // ← FIXED: Now method exists
      },
      openFoodFacts: {
        available: true, // Always available (has fallback mock data)
        cacheSize: OpenFoodFactsService.getCacheSize() // ← FIXED: Added getCacheSize method
      },
      unified: {
        available: true
      }
    };
  }
}