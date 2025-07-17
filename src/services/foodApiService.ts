// src/services/foodApiService.ts
// 🔧 OPRAVED: Union type pro source

export interface FoodSearchResult {
  fdcId: number;
  description: string;
  brandOwner?: string;
  gtinUpc?: string;
  ndbNumber?: string;
  publishedDate: string;
  foodNutrients: FoodNutrient[];
  dataType: string;
  score?: number;
}

export interface FoodNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
  rank?: number;
}

// 🔧 OPRAVED: Rozšířen source type o 'fallback'
export interface RecipeFromAPI {
  id: string;
  name: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  source: 'usda' | 'openfoodfacts' | 'edamam' | 'fallback'; // 🔧 OPRAVED: Přidáno 'fallback'
  fdcId?: number;
  description?: string;
}

class FoodAPIService {
  private readonly USDA_API_KEY = 'DEMO_KEY'; // Nahraďte vlastním API klíčem
  private readonly USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
  private readonly OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v0';

  /**
   * Vyhledá potraviny v USDA databázi
   */
  async searchFoods(query: string, pageSize: number = 20): Promise<FoodSearchResult[]> {
    try {
      const url = `${this.USDA_BASE_URL}/foods/search`;
      const params = new URLSearchParams({
        query: query,
        pageSize: pageSize.toString(),
        api_key: this.USDA_API_KEY,
        dataType: 'Foundation,SR Legacy'
      });

      console.log('🔍 Searching USDA for:', query);
      
      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 USDA results:', data.foods?.length || 0);
      
      return data.foods || [];
    } catch (error) {
      console.error('❌ USDA API error:', error);
      return [];
    }
  }

  /**
   * Získá detailní informace o potravině podle FDC ID
   */
  async getFoodDetails(fdcId: number): Promise<FoodSearchResult | null> {
    try {
      const url = `${this.USDA_BASE_URL}/food/${fdcId}`;
      const params = new URLSearchParams({
        api_key: this.USDA_API_KEY
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ USDA food details error:', error);
      return null;
    }
  }

  /**
   * Převede USDA food data na náš Recipe formát
   */
  convertUSDAToRecipe(food: FoodSearchResult, mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'): RecipeFromAPI {
    const nutrients = this.extractNutrients(food.foodNutrients);
    
    return {
      id: `usda-${food.fdcId}`,
      name: this.cleanFoodName(food.description),
      type: mealType,
      calories: nutrients.calories,
      protein: nutrients.protein,
      carbs: nutrients.carbs,
      fat: nutrients.fat,
      fiber: nutrients.fiber,
      sugar: nutrients.sugar,
      sodium: nutrients.sodium,
      source: 'usda',
      fdcId: food.fdcId,
      description: food.description
    };
  }

  /**
   * Extrahuje nutriční hodnoty z USDA formátu
   */
  private extractNutrients(foodNutrients: FoodNutrient[]) {
    const nutrients = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    // Mapování USDA nutrient IDs na naše hodnoty
    const nutrientMap: { [key: number]: keyof typeof nutrients } = {
      1008: 'calories',    // Energy (kcal)
      1003: 'protein',     // Protein
      1005: 'carbs',       // Carbohydrate, by difference
      1004: 'fat',         // Total lipid (fat)
      1079: 'fiber',       // Fiber, total dietary
      2000: 'sugar',       // Total sugars
      1093: 'sodium'       // Sodium
    };

    foodNutrients.forEach(nutrient => {
      const nutrientKey = nutrientMap[nutrient.nutrientId];
      if (nutrientKey) {
        nutrients[nutrientKey] = Math.round(nutrient.value * 100) / 100;
      }
    });

    return nutrients;
  }

  /**
   * Vyčistí název potraviny pro lepší zobrazení
   */
  private cleanFoodName(description: string): string {
    return description
      .replace(/,.*$/, '') // Odstraní všechno po první čárce
      .replace(/\b(raw|cooked|prepared)\b/gi, '') // Odstraní cooking states
      .replace(/\s+/g, ' ') // Normalizuje mezery
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Získá vhodné vyhledávací termíny pro meal type
   */
  private getMealTypeSearchTerms(mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'): string[] {
    const terms = {
      Breakfast: [
        'oatmeal', 'eggs', 'pancakes', 'toast', 'cereal',
        'yogurt', 'fruit', 'smoothie', 'coffee', 'milk'
      ],
      Lunch: [
        'sandwich', 'salad', 'soup', 'chicken', 'rice',
        'pasta', 'vegetables', 'quinoa', 'beans', 'fish'
      ],
      Dinner: [
        'chicken', 'beef', 'fish', 'pork', 'salmon',
        'beef', 'pork', 'chicken thigh', 'pasta',
        'broccoli', 'sweet potato', 'stir fry', 'steak', 'fish'
      ],
      Snack: [
        'almonds', 'apple', 'banana', 'carrots', 'hummus',
        'cheese', 'berries', 'nuts', 'crackers', 'yogurt'
      ]
    };

    return terms[mealType] || [];
  }

  /**
   * Vygeneruje recepty pro určitý meal type
   */
  async generateRecipesForMealType(mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', count: number = 5): Promise<RecipeFromAPI[]> {
    const recipes: RecipeFromAPI[] = [];
    const searchTerms = this.getMealTypeSearchTerms(mealType);
    
    for (let i = 0; i < Math.min(count, searchTerms.length); i++) {
      try {
        const foods = await this.searchFoods(searchTerms[i], 3);
        
        if (foods.length > 0) {
          // Vezmi první food result a převeď ho na recept
          const food = foods[0];
          const recipe = this.convertUSDAToRecipe(food, mealType);
          recipes.push(recipe);
          
          // Krátká pauza mezi požadavky
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`❌ Error generating recipe for ${searchTerms[i]}:`, error);
      }
    }
    
    return recipes;
  }

  /**
   * Inicializuje databázi receptů z API
   */
  async initializeDatabaseFromAPI(): Promise<RecipeFromAPI[]> {
    console.log('🚀 Initializing recipe database from USDA API...');
    
    const allRecipes: RecipeFromAPI[] = [];
    const mealTypes: Array<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'> = 
      ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

    for (const mealType of mealTypes) {
      try {
        const recipes = await this.generateRecipesForMealType(mealType, 8);
        allRecipes.push(...recipes);
        
        // Pauza mezi meal types aby nedošlo k rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to generate recipes for ${mealType}:`, error);
      }
    }

    console.log(`🎉 Database initialized with ${allRecipes.length} recipes from API`);
    return allRecipes;
  }

  /**
   * 🔧 OPRAVED: Fallback s fallback source type
   */
  generateOfflineFallback(): RecipeFromAPI[] {
    return [
      {
        id: 'fallback-1',
        name: 'Scrambled Eggs',
        type: 'Breakfast',
        calories: 220,
        protein: 14,
        carbs: 2,
        fat: 18,
        source: 'fallback' // 🔧 OPRAVED: Použito 'fallback' místo 'usda'
      },
      {
        id: 'fallback-2',
        name: 'Chicken Breast',
        type: 'Lunch',
        calories: 280,
        protein: 35,
        carbs: 0,
        fat: 12,
        source: 'fallback'
      },
      {
        id: 'fallback-3',
        name: 'Grilled Salmon',
        type: 'Dinner',
        calories: 320,
        protein: 35,
        carbs: 0,
        fat: 18,
        source: 'fallback'
      },
      {
        id: 'fallback-4',
        name: 'Greek Yogurt',
        type: 'Snack',
        calories: 130,
        protein: 15,
        carbs: 8,
        fat: 5,
        source: 'fallback'
      },
      {
        id: 'fallback-5',
        name: 'Oatmeal',
        type: 'Breakfast',
        calories: 250,
        protein: 10,
        carbs: 45,
        fat: 4,
        source: 'fallback'
      },
      {
        id: 'fallback-6',
        name: 'Turkey Sandwich',
        type: 'Lunch',
        calories: 300,
        protein: 25,
        carbs: 30,
        fat: 12,
        source: 'fallback'
      },
      {
        id: 'fallback-7',
        name: 'Apple with Peanut Butter',
        type: 'Snack',
        calories: 190,
        protein: 8,
        carbs: 25,
        fat: 8,
        source: 'fallback'
      },
      {
        id: 'fallback-8',
        name: 'Protein Smoothie',
        type: 'Snack',
        calories: 200,
        protein: 20,
        carbs: 15,
        fat: 6,
        source: 'fallback'
      }
    ];
  }
}

// Singleton instance
export const foodAPIService = new FoodAPIService();