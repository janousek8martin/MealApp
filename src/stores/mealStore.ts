// src/stores/mealStore.ts
import { create } from 'zustand';
import { Meal, Recipe, Food, MealPlan } from '../types/meal';

interface MealStore {
  mealPlans: Record<string, MealPlan>; // key: userId-date
  recipes: Recipe[];
  foods: Food[];
  
  // Meal plan actions
  getMealPlan: (userId: string, date: string) => MealPlan | null;
  addMeal: (userId: string, date: string, meal: Omit<Meal, 'id' | 'userId' | 'date'>) => void;
  removeMeal: (userId: string, date: string, mealId: string) => void;
  resetDay: (userId: string, date: string) => void;
  
  // Recipe/Food actions
  addRecipe: (recipe: Recipe) => void;
  addFood: (food: Food) => void;
}

// Demo data
const demoRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Scrambled Eggs',
    categories: ['Breakfast'],
    ingredients: [],
    instructions: [],
    nutrition: { calories: 200, protein: 15, carbs: 2, fat: 14 }
  },
  {
    id: '2',
    name: 'Chicken Salad',
    categories: ['Lunch'],
    ingredients: [],
    instructions: [],
    nutrition: { calories: 350, protein: 30, carbs: 15, fat: 20 }
  }
];

const demoFoods: Food[] = [
  {
    id: '1',
    name: 'Apple',
    nutrition: { calories: 80, protein: 0, carbs: 21, fat: 0 }
  },
  {
    id: '2',
    name: 'Banana',
    nutrition: { calories: 105, protein: 1, carbs: 27, fat: 0 }
  }
];

export const useMealStore = create<MealStore>((set, get) => ({
  mealPlans: {},
  recipes: demoRecipes,
  foods: demoFoods,
  
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
  
  addRecipe: (recipe) => {
    set(state => ({
      recipes: [...state.recipes, recipe]
    }));
  },
  
  addFood: (food) => {
    set(state => ({
      foods: [...state.foods, food]
    }));
  }
}));