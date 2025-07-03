// src/data/recipesFoodsDatabase.ts
import { Recipe, Food, Ingredient } from '../stores/recipeStore';

// Default recipes database
export const defaultRecipes: Recipe[] = [
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
    instructions: 'Beat eggs in a bowl. Heat butter in a non-stick pan over medium heat. Pour in eggs and gently stir with a spatula, creating soft curds. Remove from heat while still slightly wet as they will continue cooking.',
    ingredients: [
      { id: '1', name: 'Eggs', amount: '3', unit: 'pieces' },
      { id: '2', name: 'Butter', amount: '1', unit: 'tbsp' },
      { id: '3', name: 'Salt', amount: '1', unit: 'pinch' },
      { id: '4', name: 'Black pepper', amount: '1', unit: 'pinch' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '2',
    name: 'Chicken Caesar Salad',
    categories: ['Lunch', 'Salad'],
    foodTypes: ['Chicken'],
    allergens: ['Dairy', 'Eggs'],
    prepTime: '15',
    cookTime: '20',
    protein: '30',
    carbs: '15',
    fat: '20',
    calories: '350',
    instructions: 'Season chicken breast and grill until cooked through. Let rest, then slice. Wash and chop romaine lettuce. Toss lettuce with Caesar dressing, add grilled chicken, parmesan cheese, and croutons.',
    ingredients: [
      { id: '1', name: 'Chicken breast', amount: '200', unit: 'g' },
      { id: '2', name: 'Romaine lettuce', amount: '100', unit: 'g' },
      { id: '3', name: 'Caesar dressing', amount: '2', unit: 'tbsp' },
      { id: '4', name: 'Parmesan cheese', amount: '30', unit: 'g' },
      { id: '5', name: 'Croutons', amount: '20', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '3',
    name: 'Beef Stir Fry',
    categories: ['Dinner', 'Main Course'],
    foodTypes: ['Beef'],
    allergens: ['Soy'],
    prepTime: '20',
    cookTime: '15',
    protein: '35',
    carbs: '25',
    fat: '18',
    calories: '380',
    instructions: 'Cut beef into thin strips. Heat oil in wok over high heat. Stir-fry beef until browned. Add vegetables and stir-fry for 3-4 minutes. Add soy sauce and seasonings. Serve hot.',
    ingredients: [
      { id: '1', name: 'Beef strips', amount: '250', unit: 'g' },
      { id: '2', name: 'Mixed vegetables', amount: '200', unit: 'g' },
      { id: '3', name: 'Soy sauce', amount: '2', unit: 'tbsp' },
      { id: '4', name: 'Vegetable oil', amount: '1', unit: 'tbsp' },
      { id: '5', name: 'Garlic', amount: '2', unit: 'cloves' },
      { id: '6', name: 'Ginger', amount: '1', unit: 'tsp' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '4',
    name: 'Avocado Toast',
    categories: ['Breakfast', 'Snack'],
    foodTypes: ['Vegetarian', 'Vegan'],
    allergens: ['Gluten'],
    prepTime: '5',
    cookTime: '5',
    protein: '8',
    carbs: '30',
    fat: '15',
    calories: '280',
    instructions: 'Toast bread slices until golden. Mash avocado with lemon juice, salt, and pepper. Spread on toast and garnish with optional toppings.',
    ingredients: [
      { id: '1', name: 'Whole grain bread', amount: '2', unit: 'slices' },
      { id: '2', name: 'Avocado', amount: '1', unit: 'pieces' },
      { id: '3', name: 'Lemon juice', amount: '1', unit: 'tsp' },
      { id: '4', name: 'Salt', amount: '1', unit: 'pinch' },
      { id: '5', name: 'Black pepper', amount: '1', unit: 'pinch' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '5',
    name: 'Salmon with Rice',
    categories: ['Dinner', 'Main Course'],
    foodTypes: ['Fish'],
    allergens: ['Fish'],
    prepTime: '10',
    cookTime: '25',
    protein: '40',
    carbs: '45',
    fat: '12',
    calories: '420',
    instructions: 'Cook rice according to package instructions. Season salmon fillet and bake at 200°C for 15-20 minutes. Serve salmon over rice with steamed vegetables.',
    ingredients: [
      { id: '1', name: 'Salmon fillet', amount: '200', unit: 'g' },
      { id: '2', name: 'Jasmine rice', amount: '80', unit: 'g' },
      { id: '3', name: 'Olive oil', amount: '1', unit: 'tbsp' },
      { id: '4', name: 'Lemon', amount: '0.5', unit: 'pieces' },
      { id: '5', name: 'Dill', amount: '1', unit: 'tsp' }
    ],
    image: 'https://via.placeholder.com/150'
  }
];

// Default foods database
export const defaultFoods: Food[] = [
  {
    id: '1',
    name: 'Apple',
    category: 'Fruit',
    protein: '0.3',
    carbs: '14',
    fat: '0.2',
    calories: '52',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '2',
    name: 'Banana',
    category: 'Fruit',
    protein: '1.1',
    carbs: '23',
    fat: '0.3',
    calories: '96',
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
  },
  {
    id: '4',
    name: 'Brown Rice',
    category: 'Grain',
    protein: '2.6',
    carbs: '23',
    fat: '0.9',
    calories: '112',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '5',
    name: 'Broccoli',
    category: 'Vegetable',
    protein: '2.8',
    carbs: '7',
    fat: '0.4',
    calories: '34',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '6',
    name: 'Salmon',
    category: 'Fish',
    protein: '25',
    carbs: '0',
    fat: '12',
    calories: '208',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '7',
    name: 'Greek Yogurt',
    category: 'Dairy',
    protein: '10',
    carbs: '4',
    fat: '0.4',
    calories: '59',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '8',
    name: 'Oats',
    category: 'Grain',
    protein: '17',
    carbs: '66',
    fat: '7',
    calories: '389',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '9',
    name: 'Almonds',
    category: 'Nuts',
    protein: '21',
    carbs: '22',
    fat: '50',
    calories: '579',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '10',
    name: 'Sweet Potato',
    category: 'Vegetable',
    protein: '2',
    carbs: '20',
    fat: '0.1',
    calories: '86',
    image: 'https://via.placeholder.com/150'
  }
];

// Helper functions to get data
export const getDefaultRecipes = (): Recipe[] => {
  return defaultRecipes;
};

export const getDefaultFoods = (): Food[] => {
  return defaultFoods;
};

// Helper functions to find specific items
export const findRecipeById = (id: string): Recipe | undefined => {
  return defaultRecipes.find(recipe => recipe.id === id);
};

export const findFoodById = (id: string): Food | undefined => {
  return defaultFoods.find(food => food.id === id);
};

// Helper functions to filter by category/type
export const getRecipesByCategory = (category: string): Recipe[] => {
  return defaultRecipes.filter(recipe => recipe.categories.includes(category));
};

export const getFoodsByCategory = (category: string): Food[] => {
  return defaultFoods.filter(food => food.category === category);
};

export const getRecipesByFoodType = (foodType: string): Recipe[] => {
  return defaultRecipes.filter(recipe => recipe.foodTypes.includes(foodType));
};

// Helper function to get all unique food categories
export const getFoodCategories = (): string[] => {
  const categories = defaultFoods
    .map(food => food.category)
    .filter((category): category is string => category !== undefined);
  return [...new Set(categories)];
};