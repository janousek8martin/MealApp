// src/stores/recipeStore.ts
import { create } from 'zustand';

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
  // Data
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

// Demo data
const demoRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Scrambled Eggs',
    categories: ['Breakfast'],
    foodTypes: ['Vegetarian'],
    allergens: ['Eggs', 'Dairy'],
    prepTime: '5',
    cookTime: '10',
    protein: '15',
    carbs: '2',
    fat: '14',
    calories: '200',
    instructions: 'Beat eggs, cook in pan with butter.',
    ingredients: [
      { id: '1', name: 'Eggs', amount: '3', unit: 'pieces' },
      { id: '2', name: 'Butter', amount: '1', unit: 'tbsp' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '2',
    name: 'Chicken Salad',
    categories: ['Lunch'],
    foodTypes: ['Chicken'],
    allergens: [],
    prepTime: '15',
    cookTime: '0',
    protein: '30',
    carbs: '15',
    fat: '20',
    calories: '350',
    instructions: 'Mix chicken with vegetables and dressing.',
    ingredients: [
      { id: '1', name: 'Chicken breast', amount: '200', unit: 'g' },
      { id: '2', name: 'Lettuce', amount: '100', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '3',
    name: 'Beef Stir Fry',
    categories: ['Dinner'],
    foodTypes: ['Beef'],
    allergens: ['Soy'],
    prepTime: '20',
    cookTime: '15',
    protein: '35',
    carbs: '25',
    fat: '18',
    calories: '380',
    instructions: 'Stir fry beef with vegetables in wok.',
    ingredients: [
      { id: '1', name: 'Beef strips', amount: '250', unit: 'g' },
      { id: '2', name: 'Mixed vegetables', amount: '200', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  }
];

const demoFoods: Food[] = [
  {
    id: '1',
    name: 'Apple',
    category: 'Fruit',
    protein: '0.3',
    carbs: '21',
    fat: '0.2',
    calories: '80',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '2',
    name: 'Banana',
    category: 'Fruit',
    protein: '1.1',
    carbs: '27',
    fat: '0.3',
    calories: '105',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '3',
    name: 'Chicken Breast',
    category: 'Meat',
    protein: '31',
    carbs: '0',
    fat: '3.6',
    calories: '165',
    image: 'https://via.placeholder.com/150'
  }
];

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  // Initial data
  recipes: demoRecipes,
  foods: demoFoods,
  
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