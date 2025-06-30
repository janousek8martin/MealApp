// src/stores/recipeStore.ts
import { create } from 'zustand';
import { defaultRecipes, defaultFoods } from '../data/recipesFoodsDatabase';

export interface Recipe {
  id: string;
  name: string;
  categories: string[];
  foodTypes: string[];
  allergens: string[];
  prepTime: string;
  cookTime: string;
  protein: string;
  carbs: string;
  fat: string;
  calories: string;
  instructions: string;
  ingredients: Ingredient[];
  image: string;
}

export interface Food {
  id: string;
  name: string;
  category?: string;
  protein: string;
  carbs: string;
  fat: string;
  calories: string;
  image?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface RecipeStore {
  // Data - now using external database
  recipes: Recipe[];
  foods: Food[];
  
  // Filters
  searchQuery: string;
  selectedCategories: string[];
  selectedFoodTypes: string[];
  selectedAllergens: string[];
  
  // Selection mode
  selectedRecipes: string[];
  selectedFoods: string[];
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategories: (categories: string[]) => void;
  setSelectedFoodTypes: (types: string[]) => void;
  setSelectedAllergens: (allergens: string[]) => void;
  clearFilters: () => void;
  
  // Recipe actions
  addRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  toggleRecipeSelection: (id: string) => void;
  clearRecipeSelection: () => void;
  
  // Food actions
  addFood: (food: Food) => void;
  deleteFood: (id: string) => void;
  updateFood: (id: string, food: Partial<Food>) => void;
  toggleFoodSelection: (id: string) => void;
  clearFoodSelection: () => void;
  
  // Computed
  getFilteredRecipes: () => Recipe[];
  getFilteredFoods: () => Food[];
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  // Initial data from external database
  recipes: defaultRecipes,
  foods: defaultFoods,
  
  // Initial filters
  searchQuery: '',
  selectedCategories: [],
  selectedFoodTypes: [],
  selectedAllergens: [],
  
  // Initial selection
  selectedRecipes: [],
  selectedFoods: [],
  
  // Filter actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategories: (categories) => set({ selectedCategories: categories }),
  setSelectedFoodTypes: (types) => set({ selectedFoodTypes: types }),
  setSelectedAllergens: (allergens) => set({ selectedAllergens: allergens }),
  clearFilters: () => set({
    searchQuery: '',
    selectedCategories: [],
    selectedFoodTypes: [],
    selectedAllergens: []
  }),
  
  // Recipe actions
  addRecipe: (recipe) => set(state => ({
    recipes: [...state.recipes, recipe]
  })),
  
  deleteRecipe: (id) => set(state => ({
    recipes: state.recipes.filter(r => r.id !== id),
    selectedRecipes: state.selectedRecipes.filter(rid => rid !== id)
  })),
  
  updateRecipe: (id, updates) => set(state => ({
    recipes: state.recipes.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  
  toggleRecipeSelection: (id) => set(state => ({
    selectedRecipes: state.selectedRecipes.includes(id)
      ? state.selectedRecipes.filter(rid => rid !== id)
      : [...state.selectedRecipes, id]
  })),
  
  clearRecipeSelection: () => set({ selectedRecipes: [] }),
  
  // Food actions
  addFood: (food) => set(state => ({
    foods: [...state.foods, food]
  })),
  
  deleteFood: (id) => set(state => ({
    foods: state.foods.filter(f => f.id !== id),
    selectedFoods: state.selectedFoods.filter(fid => fid !== id)
  })),
  
  updateFood: (id, updates) => set(state => ({
    foods: state.foods.map(f => f.id === id ? { ...f, ...updates } : f)
  })),
  
  toggleFoodSelection: (id) => set(state => ({
    selectedFoods: state.selectedFoods.includes(id)
      ? state.selectedFoods.filter(fid => fid !== id)
      : [...state.selectedFoods, id]
  })),
  
  clearFoodSelection: () => set({ selectedFoods: [] }),
  
  // Computed getters
  getFilteredRecipes: () => {
    const state = get();
    return state.recipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchesCategories = state.selectedCategories.length === 0 || 
        state.selectedCategories.some(cat => recipe.categories.includes(cat));
      const matchesFoodTypes = state.selectedFoodTypes.length === 0 || 
        state.selectedFoodTypes.some(type => recipe.foodTypes.includes(type));
      const matchesAllergens = state.selectedAllergens.length === 0 || 
        !state.selectedAllergens.some(allergen => recipe.allergens.includes(allergen));
      
      return matchesSearch && matchesCategories && matchesFoodTypes && matchesAllergens;
    });
  },
  
  getFilteredFoods: () => {
    const state = get();
    return state.foods.filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(state.searchQuery.toLowerCase());
      return matchesSearch;
    });
  }
}));