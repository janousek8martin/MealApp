// src/stores/mealStore.ts
import { create } from 'zustand';
import { Meal, Recipe, Food, MealPlan } from '../types/meal';

interface MealStore {
  mealPlans: Record<string, MealPlan>; // key: userId-date
  recipes: Recipe[];
  foods: Food[];
  
  // Search and filter state
  searchQuery: string;
  selectedCategories: string[];
  selectedFoodTypes: string[];
  selectedAllergens: string[];
  
  // Meal plan actions
  getMealPlan: (userId: string, date: string) => MealPlan | null;
  addMeal: (userId: string, date: string, meal: Omit<Meal, 'id' | 'userId' | 'date'>) => void;
  removeMeal: (userId: string, date: string, mealId: string) => void;
  resetDay: (userId: string, date: string) => void;
  
  // Recipe actions
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  deleteRecipes: (ids: string[]) => void;
  getRecipe: (id: string) => Recipe | undefined;
  
  // Filter actions
  setSearchQuery: (query: string) => void;
  setSelectedCategories: (categories: string[]) => void;
  setSelectedFoodTypes: (types: string[]) => void;
  setSelectedAllergens: (allergens: string[]) => void;
  clearFilters: () => void;
  getFilteredRecipes: () => Recipe[];
  
  // Food actions
  addFood: (food: Food) => void;
}

// Demo data with more realistic recipes
const demoRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Scrambled Eggs',
    description: 'Fluffy scrambled eggs with herbs',
    prepTime: 5,
    cookTime: 5,
    servings: 2,
    categories: ['Breakfast'],
    ingredients: [
      { id: '1', name: 'Eggs', amount: 4, unit: 'pieces' },
      { id: '2', name: 'Butter', amount: 2, unit: 'tbsp' },
      { id: '3', name: 'Salt', amount: 1, unit: 'pinch' },
    ],
    instructions: [
      'Crack eggs into a bowl and whisk well',
      'Heat butter in a non-stick pan over medium-low heat',
      'Pour in eggs and gently stir with a spatula',
      'Continue stirring until eggs are just set',
      'Season with salt and serve immediately'
    ],
    nutrition: { calories: 200, protein: 15, carbs: 2, fat: 14 },
    image: 'https://via.placeholder.com/150x100/FFB347/FFFFFF?text=Eggs'
  },
  {
    id: '2',
    name: 'Chicken Salad',
    description: 'Fresh chicken salad with mixed greens',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    categories: ['Lunch', 'Dinner'],
    ingredients: [
      { id: '1', name: 'Chicken Breast', amount: 500, unit: 'g' },
      { id: '2', name: 'Mixed Greens', amount: 200, unit: 'g' },
      { id: '3', name: 'Cherry Tomatoes', amount: 150, unit: 'g' },
    ],
    instructions: [
      'Season and cook chicken breast until done',
      'Let chicken cool and slice thinly',
      'Combine greens and tomatoes in a bowl',
      'Add sliced chicken and toss with dressing'
    ],
    nutrition: { calories: 350, protein: 30, carbs: 15, fat: 20 },
    image: 'https://via.placeholder.com/150x100/4CAF50/FFFFFF?text=Salad'
  },
  {
    id: '3',
    name: 'Protein Smoothie',
    description: 'Post-workout protein smoothie',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    categories: ['Breakfast', 'Snack'],
    ingredients: [
      { id: '1', name: 'Banana', amount: 1, unit: 'piece' },
      { id: '2', name: 'Protein Powder', amount: 30, unit: 'g' },
      { id: '3', name: 'Milk', amount: 250, unit: 'ml' },
    ],
    instructions: [
      'Add all ingredients to blender',
      'Blend until smooth',
      'Serve immediately'
    ],
    nutrition: { calories: 280, protein: 25, carbs: 35, fat: 5 },
    image: 'https://via.placeholder.com/150x100/E91E63/FFFFFF?text=Smoothie'
  },
  {
    id: '4',
    name: 'Pasta Carbonara',
    description: 'Classic Italian pasta dish',
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    categories: ['Lunch', 'Dinner'],
    ingredients: [
      { id: '1', name: 'Spaghetti', amount: 400, unit: 'g' },
      { id: '2', name: 'Eggs', amount: 4, unit: 'pieces' },
      { id: '3', name: 'Bacon', amount: 200, unit: 'g' },
    ],
    instructions: [
      'Cook pasta according to package directions',
      'Fry bacon until crispy',
      'Whisk eggs with cheese',
      'Combine hot pasta with egg mixture and bacon'
    ],
    nutrition: { calories: 450, protein: 18, carbs: 55, fat: 18 },
    image: 'https://via.placeholder.com/150x100/FF9800/FFFFFF?text=Pasta'
  },
  {
    id: '5',
    name: 'Greek Yogurt Bowl',
    description: 'Healthy yogurt bowl with berries',
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    categories: ['Breakfast', 'Snack'],
    ingredients: [
      { id: '1', name: 'Greek Yogurt', amount: 200, unit: 'g' },
      { id: '2', name: 'Berries', amount: 100, unit: 'g' },
      { id: '3', name: 'Honey', amount: 15, unit: 'ml' },
    ],
    instructions: [
      'Place yogurt in a bowl',
      'Top with fresh berries',
      'Drizzle with honey'
    ],
    nutrition: { calories: 180, protein: 15, carbs: 25, fat: 3 },
    image: 'https://via.placeholder.com/150x100/9C27B0/FFFFFF?text=Yogurt'
  },
  {
    id: '6',
    name: 'Grilled Salmon',
    description: 'Perfectly grilled salmon with herbs',
    prepTime: 10,
    cookTime: 12,
    servings: 2,
    categories: ['Lunch', 'Dinner'],
    ingredients: [
      { id: '1', name: 'Salmon Fillet', amount: 400, unit: 'g' },
      { id: '2', name: 'Olive Oil', amount: 20, unit: 'ml' },
      { id: '3', name: 'Lemon', amount: 1, unit: 'piece' },
    ],
    instructions: [
      'Preheat grill to medium-high heat',
      'Brush salmon with olive oil',
      'Grill for 6 minutes per side',
      'Serve with lemon wedges'
    ],
    nutrition: { calories: 320, protein: 35, carbs: 0, fat: 18 },
    image: 'https://via.placeholder.com/150x100/2196F3/FFFFFF?text=Salmon'
  }
];

const demoFoods: Food[] = [
  {
    id: '1',
    name: 'Apple',
    category: 'Fruits',
    nutrition: { calories: 80, protein: 0, carbs: 21, fat: 0 }
  },
  {
    id: '2',
    name: 'Banana',
    category: 'Fruits',
    nutrition: { calories: 105, protein: 1, carbs: 27, fat: 0 }
  },
  {
    id: '3',
    name: 'Chicken Breast',
    category: 'Protein',
    nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6 }
  },
  {
    id: '4',
    name: 'Brown Rice',
    category: 'Grains',
    nutrition: { calories: 112, protein: 2.6, carbs: 23, fat: 0.9 }
  }
];

// Filter constants
export const foodCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export const foodTypes = ['Fish', 'Chicken', 'Pork', 'Beef', 'Vegetarian', 'Vegan'];
export const allergens = ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish'];

export const useMealStore = create<MealStore>((set, get) => ({
  mealPlans: {},
  recipes: demoRecipes,
  foods: demoFoods,
  
  // Filter state
  searchQuery: '',
  selectedCategories: [],
  selectedFoodTypes: [],
  selectedAllergens: [],
  
  getMealPlan: (userId: string, date: string) => {
    const key = `${userId}-${date}`;
    return get().mealPlans[key] || null;
  },
  
  addMeal: (userId: string, date: string, mealData) => {
    const key = `${userId}-${date}`;
    const mealPlans = get().mealPlans;
    
    const meal: Meal = {
      id: Date.now().toString(),
      userId,
      date,
      ...mealData
    };
    
    if (!mealPlans[key]) {
      mealPlans[key] = {
        id: key,
        userId,
        date,
        meals: []
      };
    }
    
    mealPlans[key].meals.push(meal);
    set({ mealPlans: { ...mealPlans } });
  },
  
  removeMeal: (userId: string, date: string, mealId: string) => {
    const key = `${userId}-${date}`;
    const mealPlans = get().mealPlans;
    
    if (mealPlans[key]) {
      mealPlans[key].meals = mealPlans[key].meals.filter(meal => meal.id !== mealId);
      set({ mealPlans: { ...mealPlans } });
    }
  },
  
  resetDay: (userId: string, date: string) => {
    const key = `${userId}-${date}`;
    const mealPlans = get().mealPlans;
    
    if (mealPlans[key]) {
      delete mealPlans[key];
      set({ mealPlans: { ...mealPlans } });
    }
  },
  
  // Recipe management
  addRecipe: (recipeData) => {
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      ...recipeData
    };
    set(state => ({
      recipes: [...state.recipes, newRecipe]
    }));
  },
  
  updateRecipe: (id: string, recipeData) => {
    set(state => ({
      recipes: state.recipes.map(recipe =>
        recipe.id === id ? { ...recipe, ...recipeData } : recipe
      )
    }));
  },
  
  deleteRecipe: (id: string) => {
    set(state => ({
      recipes: state.recipes.filter(recipe => recipe.id !== id)
    }));
  },
  
  deleteRecipes: (ids: string[]) => {
    set(state => ({
      recipes: state.recipes.filter(recipe => !ids.includes(recipe.id))
    }));
  },
  
  getRecipe: (id: string) => {
    return get().recipes.find(recipe => recipe.id === id);
  },
  
  // Filter management
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
  
  setSelectedCategories: (categories: string[]) => {
    set({ selectedCategories: categories });
  },
  
  setSelectedFoodTypes: (types: string[]) => {
    set({ selectedFoodTypes: types });
  },
  
  setSelectedAllergens: (allergens: string[]) => {
    set({ selectedAllergens: allergens });
  },
  
  clearFilters: () => {
    set({
      searchQuery: '',
      selectedCategories: [],
      selectedFoodTypes: [],
      selectedAllergens: []
    });
  },
  
  getFilteredRecipes: () => {
    const state = get();
    return state.recipes.filter(recipe => {
      // Search filter
      const matchesSearch = recipe.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                           recipe.description?.toLowerCase().includes(state.searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = state.selectedCategories.length === 0 ||
                             state.selectedCategories.some(category => recipe.categories.includes(category));
      
      // Note: Food types and allergens would need to be added to Recipe interface
      // For now, just using search and category filters
      
      return matchesSearch && matchesCategory;
    });
  },
  
  addFood: (food: Food) => {
    set(state => ({
      foods: [...state.foods, food]
    }));
  }
}));