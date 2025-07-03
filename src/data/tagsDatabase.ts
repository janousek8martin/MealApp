// src/data/tagsDatabase.ts

export interface TagsDatabase {
  categories: string[];
  foodTypes: string[];
  allergens: string[];
}

export const tagsDatabase: TagsDatabase = {
  categories: [
    'Breakfast',
    'Lunch', 
    'Dinner',
    'Snack',
    'Dessert',
    'Appetizer',
    'Side Dish',
    'Soup',
    'Salad',
    'Main Course',
    'Beverage',
    'Smoothie'
  ],
  foodTypes: [
    'Fish',
    'Chicken', 
    'Pork',
    'Beef',
    'Vegetarian',
    'Vegan',
    'Seafood',
    'Poultry',
    'Lamb',
    'Turkey',
    'Duck',
    'Game',
    'Dairy-Free',
    'Gluten-Free',
    'Keto',
    'Low-Carb',
    'High-Protein'
  ],
  allergens: [
    'Gluten',
    'Dairy',
    'Nuts',
    'Eggs',
    'Soy',
    'Shellfish',
    'Fish',
    'Peanuts',
    'Tree Nuts',
    'Sesame',
    'Wheat',
    'Milk',
    'Celery',
    'Mustard',
    'Sulphites',
    'Lupin',
    'Molluscs'
  ]
};

// Helper functions to get specific tag types
export const getCategories = (): string[] => {
  return tagsDatabase.categories;
};

export const getFoodTypes = (): string[] => {
  return tagsDatabase.foodTypes;
};

export const getAllergens = (): string[] => {
  return tagsDatabase.allergens;
};

// Helper function to add new tags (for future use)
export const addCategory = (category: string): void => {
  if (!tagsDatabase.categories.includes(category)) {
    tagsDatabase.categories.push(category);
  }
};

export const addFoodType = (foodType: string): void => {
  if (!tagsDatabase.foodTypes.includes(foodType)) {
    tagsDatabase.foodTypes.push(foodType);
  }
};

export const addAllergen = (allergen: string): void => {
  if (!tagsDatabase.allergens.includes(allergen)) {
    tagsDatabase.allergens.push(allergen);
  }
};

// Helper function to check if tag exists
export const tagExists = (tagType: keyof TagsDatabase, tag: string): boolean => {
  return tagsDatabase[tagType].includes(tag);
};