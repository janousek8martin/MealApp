// src/services/OpenFoodFactsService.ts
// 🥤 OpenFoodFacts service - COMPLETE version

import { UnifiedFoodItem, APIResponse, ProductUploadData, convertNutritionToNumbers, safeNutritionValue } from '../types/UnifiedFood';

/**
 * OpenFoodFacts API response interfaces
 */
export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  nutrition_grades?: string;
  nova_group?: number;
  nutriments?: {
    energy_kcal_100g?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    sodium_100g?: number;
    calcium_100g?: number;
    iron_100g?: number;
    'vitamin-c_100g'?: number;
    'vitamin-a_100g'?: number;
    potassium_100g?: number;
    magnesium_100g?: number;
  };
  nutrient_levels?: {
    fat?: 'low' | 'moderate' | 'high';
    sugars?: 'low' | 'moderate' | 'high';
    salt?: 'low' | 'moderate' | 'high';
  };
  ingredients_analysis_tags?: string[];
  categories_tags?: string[];
  countries_tags?: string[];
  image_url?: string;
  image_front_url?: string;
  last_modified_t?: number;
}

interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
  skip: number;
}

/**
 * OpenFoodFacts service for real products with barcodes
 */
export class OpenFoodFactsService {
  private static readonly BASE_URL = 'https://world.openfoodfacts.org';
  private static readonly API_URL = 'https://world.openfoodfacts.org/api/v2';
  private static readonly CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
  private static cache = new Map<string, { data: UnifiedFoodItem[]; timestamp: number }>();
  
  // User credentials for uploads (to be configured)
  private static readonly USER_ID = 'meal-planner-app-user';
  private static readonly USER_PASSWORD = 'your-openfoodfacts-password';

  /**
   * Search for products (for Foods & Drinks tab)
   */
  static async searchProducts(query: string): Promise<APIResponse<UnifiedFoodItem[]>> {
    try {
      // Check cache first
      const cacheKey = `off-search-${query.toLowerCase()}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('🎯 OpenFoodFacts cache hit:', query);
        return {
          success: true,
          data: cached.data,
          message: 'Data retrieved from cache',
          timestamp: new Date().toISOString()
        };
      }

      let url = `${this.API_URL}/search?search_terms=${encodeURIComponent(query)}`;
      url += `&fields=code,product_name,nutrition_grades,nutriments,nova_group,nutrient_levels,ingredients_analysis_tags,categories_tags,countries_tags,image_url,image_front_url,last_modified_t`;
      url += `&page_size=20&sort_by=popularity`;
      
      console.log('🔍 OpenFoodFacts search:', query);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MealPlannerApp/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: OpenFoodFactsSearchResponse = await response.json();
      console.log(`📊 OpenFoodFacts found ${data.products?.length || 0} products`);
      
      // Convert to unified format
      const unifiedItems: UnifiedFoodItem[] = [];
      
      for (const product of (data.products || [])) {
        try {
          const converted = this.convertToUnified(product);
          if (converted) {
            unifiedItems.push(converted);
          }
        } catch (error) {
          console.warn(`⚠️ Skipping OpenFoodFacts product ${product.code}:`, error);
        }
      }
      
      console.log(`📊 OpenFoodFacts contributed ${unifiedItems.length} products`);
      
      // Cache results
      this.cache.set(cacheKey, {
        data: unifiedItems,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        data: unifiedItems,
        message: `Found ${unifiedItems.length} products`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ OpenFoodFacts search error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to search OpenFoodFacts database',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get product by barcode (main barcode function for both tabs)
   */
  static async getProductByBarcode(barcode: string): Promise<APIResponse<UnifiedFoodItem | null>> {
    try {
      const url = `${this.BASE_URL}/api/v0/product/${barcode}.json`;
      
      console.log('📷 OpenFoodFacts barcode lookup:', barcode);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MealPlannerApp/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return {
          success: false,
          data: null,
          error: `HTTP ${response.status}`,
          message: 'Product not found',
          timestamp: new Date().toISOString()
        };
      }
      
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const unifiedItem = this.convertToUnified(data.product);
        
        if (unifiedItem) {
          return {
            success: true,
            data: unifiedItem,
            message: 'Product found',
            timestamp: new Date().toISOString()
          };
        }
      }
      
      return {
        success: false,
        data: null,
        message: 'Product not found in database',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ OpenFoodFacts barcode error:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to lookup barcode',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Upload a new product to OpenFoodFacts
   */
  static async uploadProduct(productData: ProductUploadData): Promise<APIResponse<string>> {
    try {
      console.log('📤 Uploading product to OpenFoodFacts:', productData.name);
      
      const formData = new FormData();
      
      // Basic product info
      formData.append('code', productData.barcode);
      formData.append('product_name', productData.name);
      formData.append('user_id', this.USER_ID);
      formData.append('password', this.USER_PASSWORD);
      
      // Nutrition facts (per 100g)
      if (productData.nutrition) {
        const nutrition = convertNutritionToNumbers(productData.nutrition);
        if (nutrition.calories) formData.append('nutriment_energy', nutrition.calories.toString());
        if (nutrition.protein) formData.append('nutriment_proteins', nutrition.protein.toString());
        if (nutrition.carbohydrates) formData.append('nutriment_carbohydrates', nutrition.carbohydrates.toString());
        if (nutrition.fat) formData.append('nutriment_fat', nutrition.fat.toString());
        if (nutrition.fiber) formData.append('nutriment_fiber', nutrition.fiber.toString());
        if (nutrition.sugar) formData.append('nutriment_sugars', nutrition.sugar.toString());
        if (nutrition.sodium) formData.append('nutriment_sodium', (nutrition.sodium / 1000).toString()); // Convert mg to g
      }
      
      // Additional info
      if (productData.ingredients) {
        formData.append('ingredients_text', productData.ingredients);
      }
      
      if (productData.categories?.length) {
        formData.append('categories', productData.categories.join(', '));
      }
      
      if (productData.countries?.length) {
        formData.append('countries', productData.countries.join(', '));
      }
      
      // Image upload (if provided)
      if (productData.image) {
        formData.append('imgupload_front', productData.image);
      }
      
      const response = await fetch(`${this.BASE_URL}/cgi/product_jqm2.pl`, {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'MealPlannerApp/1.0'
        }
      });
      
      if (response.ok) {
        return {
          success: true,
          data: productData.barcode,
          message: 'Product uploaded successfully',
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Upload failed: Invalid response');
      }
      
    } catch (error) {
      console.error('❌ OpenFoodFacts upload error:', error);
      return {
        success: false,
        data: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Product upload failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get product image URLs with fallbacks
   */
  static getImageURL(barcode: string, type: 'front' | 'nutrition' | 'ingredients' = 'front'): string[] {
    const clean = barcode.replace(/\D/g, '');
    const folder = clean.length >= 9 ? 
      `${clean.slice(0, 3)}/${clean.slice(3, 6)}/${clean.slice(6, 9)}/${clean}` : 
      clean;
    
    return [
      `https://images.openfoodfacts.org/images/products/${folder}/${type}_400.jpg`,
      `https://images.openfoodfacts.org/images/products/${folder}/${type}_200.jpg`,
      `https://images.openfoodfacts.org/images/products/${folder}/front_400.jpg`,
      'https://via.placeholder.com/200x200/FFB347/FFFFFF?text=📦'
    ];
  }

  /**
   * Convert OpenFoodFacts product to UnifiedFoodItem - ENHANCED with fallbacks
   */
  private static convertToUnified(product: OpenFoodFactsProduct): UnifiedFoodItem | null {
    try {
      // Skip products with no meaningful name
      if (!product.product_name || product.product_name.trim().length < 2) {
        return null;
      }

      const nutrition = product.nutriments || {};
      
      // Enhanced nutrition extraction with fallbacks
      const calories = this.extractNutrientValue(nutrition, ['energy_kcal_100g', 'energy-kcal_100g'], 0);
      const protein = this.extractNutrientValue(nutrition, ['proteins_100g', 'protein_100g'], 0);
      const carbs = this.extractNutrientValue(nutrition, ['carbohydrates_100g', 'carbohydrate_100g'], 0);
      const fat = this.extractNutrientValue(nutrition, ['fat_100g', 'total-fat_100g'], 0);
      const fiber = this.extractNutrientValue(nutrition, ['fiber_100g', 'dietary-fiber_100g'], undefined);
      const sugar = this.extractNutrientValue(nutrition, ['sugars_100g', 'total-sugars_100g'], undefined);
      const sodium = this.extractNutrientValue(nutrition, ['sodium_100g', 'salt_100g'], undefined);
      
      console.log(`🔍 Converting: ${product.product_name}`);
      console.log(`📊 Nutrition: cal=${calories}, protein=${protein}, carbs=${carbs}, fat=${fat}`);
      
      return {
        id: `off-${product.code}`,
        name: product.product_name.trim(),
        source: 'openfoodfacts',
        type: this.determineType(product),
        nutrition: {
          calories: Math.round(calories),
          protein: Math.round(protein * 100) / 100,
          carbohydrates: Math.round(carbs * 100) / 100,
          fat: Math.round(fat * 100) / 100,
          fiber: fiber ? Math.round(fiber * 100) / 100 : undefined,
          sugar: sugar ? Math.round(sugar * 100) / 100 : undefined,
          sodium: sodium ? Math.round(sodium * 1000) : undefined, // Convert g to mg
          calcium: nutrition.calcium_100g ? Math.round(nutrition.calcium_100g) : undefined,
          iron: nutrition.iron_100g ? Math.round(nutrition.iron_100g * 100) / 100 : undefined,
          vitaminC: nutrition['vitamin-c_100g'] ? Math.round(nutrition['vitamin-c_100g'] * 10) / 10 : undefined,
        },
        openFoodFactsData: {
          barcode: product.code,
          nutriScore: product.nutrition_grades?.toUpperCase(),
          novaGroup: product.nova_group,
          nutrientLevels: product.nutrient_levels ? {
            fat: product.nutrient_levels.fat,
            sugar: product.nutrient_levels.sugars, // Map 'sugars' to 'sugar'
            salt: product.nutrient_levels.salt
          } : undefined,
          ingredientAnalysis: product.ingredients_analysis_tags || [],
          categories: product.categories_tags || [],
          countries: product.countries_tags || [],
          lastModified: product.last_modified_t
        },
        metadata: {
          image: product.image_url || product.image_front_url,
          description: this.generateDescription(product),
          servingSizes: [
            { amount: 100, unit: 'g', description: '100 grams' }
          ]
        }
      };
    } catch (error) {
      console.error('❌ Error converting OpenFoodFacts product:', error);
      return null;
    }
  }

  /**
   * Enhanced nutrient value extraction with multiple field name attempts
   */
  private static extractNutrientValue(
    nutriments: any, 
    fieldNames: string[], 
    defaultValue: number | undefined
  ): number {
    for (const fieldName of fieldNames) {
      const value = nutriments[fieldName];
      if (typeof value === 'number' && !isNaN(value) && value >= 0) {
        return value;
      }
    }
    return defaultValue || 0;
  }

  /**
   * Determine product type based on categories
   */
  private static determineType(product: OpenFoodFactsProduct): 'ingredient' | 'food-drink' {
    const categories = product.categories_tags || [];
    
    const ingredientKeywords = [
      'fruits', 'vegetables', 'meats', 'fish', 'dairy-products', 
      'cereals', 'spices', 'oils', 'nuts', 'legumes'
    ];
    
    const hasIngredientCategory = categories.some(cat => 
      ingredientKeywords.some(keyword => cat.includes(keyword))
    );
    
    return hasIngredientCategory ? 'ingredient' : 'food-drink';
  }

  /**
   * Generate description from available data
   */
  private static generateDescription(product: OpenFoodFactsProduct): string {
    const parts: string[] = [];
    
    if (product.nutrition_grades) {
      parts.push(`Nutri-Score: ${product.nutrition_grades.toUpperCase()}`);
    }
    
    if (product.nova_group) {
      const novaDescriptions = {
        1: 'Minimally processed',
        2: 'Processed ingredients',
        3: 'Processed foods',
        4: 'Ultra-processed'
      };
      parts.push(`Processing: ${novaDescriptions[product.nova_group as keyof typeof novaDescriptions]}`);
    }
    
    const analysis = product.ingredients_analysis_tags || [];
    if (analysis.includes('en:vegetarian')) parts.push('Vegetarian');
    if (analysis.includes('en:vegan')) parts.push('Vegan');
    if (analysis.includes('en:palm-oil-free')) parts.push('Palm oil free');
    if (analysis.includes('en:gluten-free')) parts.push('Gluten free');
    
    return parts.join(' • ');
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🧹 OpenFoodFacts cache cleared');
  }

  /**
   * Get cache size
   */
  static getCacheSize(): number {
    return this.cache.size;
  }
}