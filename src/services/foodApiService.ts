// src/services/foodApiService.ts
// USDA Food Data Central API integration - OPRAVENO: Různé export styly

// ✅ ŘEŠENÍ 1: Definice bez export, pak export na konci
interface FoodSearchResult {
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

interface FoodNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
  rank?: number;
}

interface RecipeFromAPI {
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
  source: 'usda' | 'openfoodfacts' | 'edamam';
  fdcId?: number;
  description?: string;
}

class FoodAPIService {
  private readonly USDA_API_KEY = 'DEMO_KEY'; // ✅ Nahraďte vlastním API klíčem z https://fdc.nal.usda.gov/api-guide.html
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
        dataType: 'Foundation,SR Legacy' // Nejkvalitnější data
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
        nutrients[nutrientKey] = Math.round(nutrient.value * 100) / 100; // Zaokrouhlí na 2 desetinná místa
      }
    });

    return nutrients;
  }

  /**
   * Vyčistí název potraviny pro lepší zobrazení
   */
  private cleanFoodName(description: string): string {
    return description
      .replace(/,.*$/, '') // Odstraní vše za první čárkou
      .replace(/\b(raw|cooked|boiled|fresh)\b/gi, '') // Odstraní běžné přívlastky
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letters
  }

  /**
   * Vygeneruje recepty pro konkrétní typ jídla
   */
  async generateRecipesForMealType(
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
    count: number = 10
  ): Promise<RecipeFromAPI[]> {
    const searchTerms = this.getMealTypeSearchTerms(mealType);
    const recipes: RecipeFromAPI[] = [];

    console.log(`🍽️ Generating ${count} recipes for ${mealType}`);

    for (const searchTerm of searchTerms) {
      if (recipes.length >= count) break;

      const foods = await this.searchFoods(searchTerm, 5);
      
      for (const food of foods) {
        if (recipes.length >= count) break;
        
        // Filtruj jen potraviny s dostatečnými nutričními údaji
        const nutrients = this.extractNutrients(food.foodNutrients);
        if (nutrients.calories > 50) { // Minimální kalorie pro validní recept
          const recipe = this.convertUSDAToRecipe(food, mealType);
          recipes.push(recipe);
        }
      }

      // Krátká pauza mezi API calls
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Generated ${recipes.length} recipes for ${mealType}`);
    return recipes.slice(0, count);
  }

  /**
   * Určí vyhledávací termíny pro konkrétní typ jídla
   */
  private getMealTypeSearchTerms(mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'): string[] {
    const terms = {
      Breakfast: [
        'eggs', 'oatmeal', 'yogurt', 'toast', 'cereal', 
        'pancakes', 'bacon', 'sausage', 'fruit', 'smoothie'
      ],
      Lunch: [
        'chicken breast', 'turkey', 'salad', 'sandwich', 'wrap',
        'soup', 'quinoa', 'rice', 'vegetables', 'tuna'
      ],
      Dinner: [
        'salmon', 'beef', 'pork', 'chicken thigh', 'pasta',
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
   * Inicializuje databázi receptů z API
   */
  async initializeDatabaseFromAPI(): Promise<RecipeFromAPI[]> {
    console.log('🚀 Initializing recipe database from USDA API...');
    
    const allRecipes: RecipeFromAPI[] = [];
    const mealTypes: Array<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'> = 
      ['Breakfast', 'Lunch', 'Dinner', 'Snack'];// src/services/foodApiService.ts
// USDA Food Data Central API integration

type FoodSearchResult = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  gtinUpc?: string;
  ndbNumber?: string;
  publishedDate: string;
  foodNutrients: FoodNutrient[];
  dataType: string;
  score?: number;
};

type FoodNutrient = {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
  rank?: number;
};

type RecipeFromAPI = {
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
  source: 'usda' | 'openfoodfacts' | 'edamam';
  fdcId?: number;
  description?: string;
};

class FoodAPIService {
  private readonly USDA_API_KEY = '8kmv0bGsgvWOtWgULH3c4ExUNW5C6WG8guJTfUjr'; // ✅ Nahraďte vlastním API klíčem z https://fdc.nal.usda.gov/api-guide.html
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
        dataType: 'Foundation,SR Legacy' // Nejkvalitnější data
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
        nutrients[nutrientKey] = Math.round(nutrient.value * 100) / 100; // Zaokrouhlí na 2 desetinná místa
      }
    });

    return nutrients;
  }

  /**
   * Vyčistí název potraviny pro lepší zobrazení
   */
  private cleanFoodName(description: string): string {
    return description
      .replace(/,.*$/, '') // Odstraní vše za první čárkou
      .replace(/\b(raw|cooked|boiled|fresh)\b/gi, '') // Odstraní běžné přívlastky
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letters
  }

  /**
   * Vygeneruje recepty pro konkrétní typ jídla
   */
  async generateRecipesForMealType(
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
    count: number = 10
  ): Promise<RecipeFromAPI[]> {
    const searchTerms = this.getMealTypeSearchTerms(mealType);
    const recipes: RecipeFromAPI[] = [];

    console.log(`🍽️ Generating ${count} recipes for ${mealType}`);

    for (const searchTerm of searchTerms) {
      if (recipes.length >= count) break;

      const foods = await this.searchFoods(searchTerm, 5);
      
      for (const food of foods) {
        if (recipes.length >= count) break;
        
        // Filtruj jen potraviny s dostatečnými nutričními údaji
        const nutrients = this.extractNutrients(food.foodNutrients);
        if (nutrients.calories > 50) { // Minimální kalorie pro validní recept
          const recipe = this.convertUSDAToRecipe(food, mealType);
          recipes.push(recipe);
        }
      }

      // Krátká pauza mezi API calls
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Generated ${recipes.length} recipes for ${mealType}`);
    return recipes.slice(0, count);
  }

  /**
   * Určí vyhledávací termíny pro konkrétní typ jídla
   */
  private getMealTypeSearchTerms(mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'): string[] {
    const terms = {
      Breakfast: [
        'eggs', 'oatmeal', 'yogurt', 'toast', 'cereal', 
        'pancakes', 'bacon', 'sausage', 'fruit', 'smoothie'
      ],
      Lunch: [
        'chicken breast', 'turkey', 'salad', 'sandwich', 'wrap',
        'soup', 'quinoa', 'rice', 'vegetables', 'tuna'
      ],
      Dinner: [
        'salmon', 'beef', 'pork', 'chicken thigh', 'pasta',
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
   * Fallback: Vygeneruje minimální dataset pro offline použití
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
        source: 'usda'
      },
      {
        id: 'fallback-2',
        name: 'Chicken Breast',
        type: 'Lunch',
        calories: 280,
        protein: 35,
        carbs: 0,
        fat: 12,
        source: 'usda'
      },
      {
        id: 'fallback-3',
        name: 'Grilled Salmon',
        type: 'Dinner',
        calories: 320,
        protein: 35,
        carbs: 0,
        fat: 18,
        source: 'usda'
      },
      {
        id: 'fallback-4',
        name: 'Greek Yogurt',
        type: 'Snack',
        calories: 130,
        protein: 15,
        carbs: 8,
        fat: 5,
        source: 'usda'
      }
    ];
  }
}

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
   * Fallback: Vygeneruje minimální dataset pro offline použití
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
        source: 'usda'
      },
      {
        id: 'fallback-2',
        name: 'Chicken Breast',
        type: 'Lunch',
        calories: 280,
        protein: 35,
        carbs: 0,
        fat: 12,
        source: 'usda'
      },
      {
        id: 'fallback-3',
        name: 'Grilled Salmon',
        type: 'Dinner',
        calories: 320,
        protein: 35,
        carbs: 0,
        fat: 18,
        source: 'usda'
      },
      {
        id: 'fallback-4',
        name: 'Greek Yogurt',
        type: 'Snack',
        calories: 130,
        protein: 15,
        carbs: 8,
        fat: 5,
        source: 'usda'
      }
    ];
  }
}

// ✅ OPRAVENO: Singleton instance
export const foodAPIService = new FoodAPIService();

// ✅ Export interfaces na konci
export { FoodSearchResult, FoodNutrient, RecipeFromAPI };