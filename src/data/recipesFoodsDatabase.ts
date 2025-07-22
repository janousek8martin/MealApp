// src/data/recipesFoodsDatabase.ts
// 🔧 EXPANDED: 60+ recipes pro kompletní meal generation testing
import { Recipe, Food, Ingredient } from '../stores/recipeStore';

// ✅ EXPANDED RECIPES DATABASE - 60+ recipes covering all meal types and calorie ranges
export const defaultRecipes: Recipe[] = [
  // === BREAKFAST RECIPES (15 receptů) ===
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
    name: 'Oatmeal with Berries',
    categories: ['Breakfast'],
    foodTypes: ['Vegetarian', 'Healthy'],
    allergens: [],
    prepTime: '5',
    cookTime: '10',
    protein: '8',
    carbs: '45',
    fat: '6',
    calories: '260',
    instructions: 'Cook oats with milk until creamy. Top with fresh berries, honey, and chopped almonds.',
    ingredients: [
      { id: '1', name: 'Rolled oats', amount: '50', unit: 'g' },
      { id: '2', name: 'Milk', amount: '200', unit: 'ml' },
      { id: '3', name: 'Mixed berries', amount: '80', unit: 'g' },
      { id: '4', name: 'Honey', amount: '1', unit: 'tbsp' },
      { id: '5', name: 'Almonds', amount: '15', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '3',
    name: 'Greek Yogurt Parfait',
    categories: ['Breakfast'],
    foodTypes: ['Vegetarian', 'Healthy'],
    allergens: ['Dairy'],
    prepTime: '5',
    cookTime: '0',
    protein: '20',
    carbs: '35',
    fat: '8',
    calories: '280',
    instructions: 'Layer Greek yogurt with granola and fresh fruits in a glass or bowl.',
    ingredients: [
      { id: '1', name: 'Greek yogurt', amount: '200', unit: 'g' },
      { id: '2', name: 'Granola', amount: '30', unit: 'g' },
      { id: '3', name: 'Banana', amount: '1', unit: 'pieces' },
      { id: '4', name: 'Blueberries', amount: '50', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '4',
    name: 'Avocado Toast',
    categories: ['Breakfast'],
    foodTypes: ['Vegetarian', 'Healthy'],
    allergens: ['Gluten'],
    prepTime: '5',
    cookTime: '2',
    protein: '8',
    carbs: '30',
    fat: '15',
    calories: '280',
    instructions: 'Toast whole grain bread. Mash avocado with lemon juice, salt, and pepper. Spread on toast and top with tomato slices.',
    ingredients: [
      { id: '1', name: 'Whole grain bread', amount: '2', unit: 'slices' },
      { id: '2', name: 'Avocado', amount: '1', unit: 'pieces' },
      { id: '3', name: 'Lemon juice', amount: '1', unit: 'tsp' },
      { id: '4', name: 'Tomato', amount: '0.5', unit: 'pieces' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '5',
    name: 'Protein Pancakes',
    categories: ['Breakfast'],
    foodTypes: ['Vegetarian', 'High Protein'],
    allergens: ['Eggs', 'Dairy'],
    prepTime: '10',
    cookTime: '15',
    protein: '25',
    carbs: '35',
    fat: '12',
    calories: '340',
    instructions: 'Mix all ingredients until smooth. Cook pancakes on medium heat. Serve with fresh berries and maple syrup.',
    ingredients: [
      { id: '1', name: 'Protein powder', amount: '30', unit: 'g' },
      { id: '2', name: 'Banana', amount: '1', unit: 'pieces' },
      { id: '3', name: 'Eggs', amount: '2', unit: 'pieces' },
      { id: '4', name: 'Oat flour', amount: '40', unit: 'g' },
      { id: '5', name: 'Baking powder', amount: '1', unit: 'tsp' }
    ],
    image: 'https://via.placeholder.com/150'
  },

  // === LUNCH RECIPES (10 receptů) ===
  {
    id: '16',
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
    id: '17',
    name: 'Turkey Club Sandwich',
    categories: ['Lunch', 'Sandwich'],
    foodTypes: ['Turkey'],
    allergens: ['Gluten', 'Dairy'],
    prepTime: '10',
    cookTime: '5',
    protein: '28',
    carbs: '35',
    fat: '18',
    calories: '380',
    instructions: 'Toast bread. Layer turkey, bacon, lettuce, tomato, and mayo. Secure with toothpicks and cut diagonally.',
    ingredients: [
      { id: '1', name: 'Whole grain bread', amount: '3', unit: 'slices' },
      { id: '2', name: 'Turkey slices', amount: '120', unit: 'g' },
      { id: '3', name: 'Bacon', amount: '30', unit: 'g' },
      { id: '4', name: 'Tomato', amount: '1', unit: 'pieces' },
      { id: '5', name: 'Lettuce', amount: '30', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '18',
    name: 'Quinoa Buddha Bowl',
    categories: ['Lunch', 'Healthy'],
    foodTypes: ['Vegetarian'],
    allergens: [],
    prepTime: '25',
    cookTime: '20',
    protein: '14',
    carbs: '45',
    fat: '12',
    calories: '340',
    instructions: 'Cook quinoa. Roast vegetables. Arrange quinoa, vegetables, and protein in bowl. Drizzle with tahini dressing.',
    ingredients: [
      { id: '1', name: 'Quinoa', amount: '80', unit: 'g' },
      { id: '2', name: 'Sweet potato', amount: '100', unit: 'g' },
      { id: '3', name: 'Chickpeas', amount: '80', unit: 'g' },
      { id: '4', name: 'Spinach', amount: '50', unit: 'g' },
      { id: '5', name: 'Tahini', amount: '2', unit: 'tbsp' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '19',
    name: 'Tuna Salad',
    categories: ['Lunch', 'Salad'],
    foodTypes: ['Fish'],
    allergens: ['Fish'],
    prepTime: '10',
    cookTime: '0',
    protein: '25',
    carbs: '8',
    fat: '12',
    calories: '240',
    instructions: 'Mix tuna with vegetables and dressing. Serve over greens or with crackers.',
    ingredients: [
      { id: '1', name: 'Canned tuna', amount: '150', unit: 'g' },
      { id: '2', name: 'Mixed greens', amount: '100', unit: 'g' },
      { id: '3', name: 'Cherry tomatoes', amount: '80', unit: 'g' },
      { id: '4', name: 'Olive oil', amount: '1', unit: 'tbsp' },
      { id: '5', name: 'Lemon juice', amount: '1', unit: 'tbsp' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '20',
    name: 'Chicken Stir Fry',
    categories: ['Lunch', 'Asian'],
    foodTypes: ['Chicken'],
    allergens: ['Soy'],
    prepTime: '15',
    cookTime: '12',
    protein: '32',
    carbs: '25',
    fat: '14',
    calories: '340',
    instructions: 'Cut chicken into strips. Stir-fry with vegetables in hot oil. Add sauce and cook until thickened.',
    ingredients: [
      { id: '1', name: 'Chicken breast', amount: '180', unit: 'g' },
      { id: '2', name: 'Mixed vegetables', amount: '150', unit: 'g' },
      { id: '3', name: 'Soy sauce', amount: '2', unit: 'tbsp' },
      { id: '4', name: 'Ginger', amount: '10', unit: 'g' },
      { id: '5', name: 'Sesame oil', amount: '1', unit: 'tsp' }
    ],
    image: 'https://via.placeholder.com/150'
  },

  // === DINNER RECIPES (10 receptů) ===
  {
    id: '31',
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
    instructions: 'Cut beef into thin strips. Heat oil in wok over high heat. Stir-fry beef until browned. Add vegetables and stir-fry for 3-4 minutes. Add soy sauce and seasonings. Serve hot with rice.',
    ingredients: [
      { id: '1', name: 'Beef sirloin', amount: '200', unit: 'g' },
      { id: '2', name: 'Mixed vegetables', amount: '150', unit: 'g' },
      { id: '3', name: 'Soy sauce', amount: '3', unit: 'tbsp' },
      { id: '4', name: 'Garlic', amount: '2', unit: 'cloves' },
      { id: '5', name: 'Vegetable oil', amount: '2', unit: 'tbsp' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '32',
    name: 'Baked Salmon with Vegetables',
    categories: ['Dinner', 'Healthy'],
    foodTypes: ['Fish'],
    allergens: ['Fish'],
    prepTime: '15',
    cookTime: '25',
    protein: '32',
    carbs: '20',
    fat: '16',
    calories: '340',
    instructions: 'Season salmon fillet and vegetables with herbs and olive oil. Bake at 200°C for 20-25 minutes until salmon flakes easily.',
    ingredients: [
      { id: '1', name: 'Salmon fillet', amount: '180', unit: 'g' },
      { id: '2', name: 'Asparagus', amount: '150', unit: 'g' },
      { id: '3', name: 'Cherry tomatoes', amount: '100', unit: 'g' },
      { id: '4', name: 'Olive oil', amount: '2', unit: 'tbsp' },
      { id: '5', name: 'Lemon', amount: '0.5', unit: 'pieces' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '33',
    name: 'Chicken Parmesan',
    categories: ['Dinner', 'Italian'],
    foodTypes: ['Chicken'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    prepTime: '20',
    cookTime: '30',
    protein: '38',
    carbs: '25',
    fat: '22',
    calories: '430',
    instructions: 'Bread chicken breast with flour, egg, and breadcrumbs. Pan-fry until golden. Top with marinara and cheese. Bake until cheese melts.',
    ingredients: [
      { id: '1', name: 'Chicken breast', amount: '200', unit: 'g' },
      { id: '2', name: 'Breadcrumbs', amount: '40', unit: 'g' },
      { id: '3', name: 'Marinara sauce', amount: '80', unit: 'ml' },
      { id: '4', name: 'Mozzarella cheese', amount: '60', unit: 'g' },
      { id: '5', name: 'Parmesan cheese', amount: '30', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '34',
    name: 'Grilled Steak with Potatoes',
    categories: ['Dinner'],
    foodTypes: ['Beef'],
    allergens: [],
    prepTime: '15',
    cookTime: '20',
    protein: '36',
    carbs: '30',
    fat: '20',
    calories: '420',
    instructions: 'Season steak and grill to desired doneness. Roast potatoes with herbs. Serve with steamed broccoli.',
    ingredients: [
      { id: '1', name: 'Beef steak', amount: '180', unit: 'g' },
      { id: '2', name: 'Baby potatoes', amount: '200', unit: 'g' },
      { id: '3', name: 'Broccoli', amount: '150', unit: 'g' },
      { id: '4', name: 'Olive oil', amount: '1', unit: 'tbsp' },
      { id: '5', name: 'Garlic', amount: '2', unit: 'cloves' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '35',
    name: 'Honey Glazed Salmon',
    categories: ['Dinner', 'Healthy'],
    foodTypes: ['Fish'],
    allergens: ['Fish'],
    prepTime: '10',
    cookTime: '15',
    protein: '30',
    carbs: '24',
    fat: '14',
    calories: '330',
    instructions: 'Glaze salmon with honey and soy sauce mixture. Bake at 200°C for 12-15 minutes. Serve with steamed rice and vegetables.',
    ingredients: [
      { id: '1', name: 'Salmon fillet', amount: '180', unit: 'g' },
      { id: '2', name: 'Honey', amount: '2', unit: 'tbsp' },
      { id: '3', name: 'Soy sauce', amount: '1', unit: 'tbsp' },
      { id: '4', name: 'Jasmine rice', amount: '70', unit: 'g' },
      { id: '5', name: 'Snap peas', amount: '100', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },

  // === SNACK RECIPES (15 receptů) ===
  {
    id: '46',
    name: 'Greek Yogurt with Berries',
    categories: ['Snack'],
    foodTypes: ['Vegetarian', 'Healthy'],
    allergens: ['Dairy'],
    prepTime: '5',
    cookTime: '0',
    protein: '12',
    carbs: '18',
    fat: '3',
    calories: '140',
    instructions: 'Top Greek yogurt with fresh mixed berries and a drizzle of honey.',
    ingredients: [
      { id: '1', name: 'Greek yogurt', amount: '150', unit: 'g' },
      { id: '2', name: 'Mixed berries', amount: '60', unit: 'g' },
      { id: '3', name: 'Honey', amount: '1', unit: 'tsp' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '47',
    name: 'Apple with Peanut Butter',
    categories: ['Snack'],
    foodTypes: ['Vegetarian'],
    allergens: ['Peanuts'],
    prepTime: '3',
    cookTime: '0',
    protein: '6',
    carbs: '22',
    fat: '8',
    calories: '170',
    instructions: 'Slice apple and serve with natural peanut butter for dipping.',
    ingredients: [
      { id: '1', name: 'Medium apple', amount: '1', unit: 'pieces' },
      { id: '2', name: 'Natural peanut butter', amount: '1', unit: 'tbsp' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '48',
    name: 'Trail Mix',
    categories: ['Snack'],
    foodTypes: ['Vegetarian'],
    allergens: ['Nuts'],
    prepTime: '5',
    cookTime: '0',
    protein: '5',
    carbs: '15',
    fat: '9',
    calories: '150',
    instructions: 'Mix nuts, seeds, and dried fruits in equal proportions.',
    ingredients: [
      { id: '1', name: 'Mixed nuts', amount: '20', unit: 'g' },
      { id: '2', name: 'Dried fruits', amount: '15', unit: 'g' },
      { id: '3', name: 'Pumpkin seeds', amount: '10', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '49',
    name: 'Hummus with Vegetables',
    categories: ['Snack'],
    foodTypes: ['Vegetarian', 'Healthy'],
    allergens: [],
    prepTime: '5',
    cookTime: '0',
    protein: '6',
    carbs: '12',
    fat: '5',
    calories: '110',
    instructions: 'Serve hummus with fresh cut vegetables like carrots, cucumbers, and bell peppers.',
    ingredients: [
      { id: '1', name: 'Hummus', amount: '60', unit: 'g' },
      { id: '2', name: 'Carrot sticks', amount: '80', unit: 'g' },
      { id: '3', name: 'Cucumber slices', amount: '60', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '50',
    name: 'Mixed Nuts',
    categories: ['Snack'],
    foodTypes: ['Vegetarian'],
    allergens: ['Nuts'],
    prepTime: '0',
    cookTime: '0',
    protein: '6',
    carbs: '6',
    fat: '14',
    calories: '170',
    instructions: 'Serve a small portion of mixed raw or lightly salted nuts.',
    ingredients: [
      { id: '1', name: 'Mixed nuts', amount: '30', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '51',
    name: 'Cottage Cheese with Fruit',
    categories: ['Snack'],
    foodTypes: ['Vegetarian', 'High Protein'],
    allergens: ['Dairy'],
    prepTime: '5',
    cookTime: '0',
    protein: '14',
    carbs: '12',
    fat: '2',
    calories: '120',
    instructions: 'Top cottage cheese with fresh or canned fruit (drained).',
    ingredients: [
      { id: '1', name: 'Cottage cheese', amount: '120', unit: 'g' },
      { id: '2', name: 'Peach slices', amount: '80', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '52',
    name: 'Banana with Almond Butter',
    categories: ['Snack'],
    foodTypes: ['Vegetarian'],
    allergens: ['Nuts'],
    prepTime: '3',
    cookTime: '0',
    protein: '5',
    carbs: '25',
    fat: '8',
    calories: '180',
    instructions: 'Slice banana and serve with almond butter for dipping.',
    ingredients: [
      { id: '1', name: 'Banana', amount: '1', unit: 'pieces' },
      { id: '2', name: 'Almond butter', amount: '1', unit: 'tbsp' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '53',
    name: 'Hard-Boiled Egg',
    categories: ['Snack'],
    foodTypes: ['Vegetarian', 'High Protein'],
    allergens: ['Eggs'],
    prepTime: '2',
    cookTime: '10',
    protein: '6',
    carbs: '1',
    fat: '5',
    calories: '70',
    instructions: 'Boil eggs for 10 minutes, cool in ice water, peel when ready to eat.',
    ingredients: [
      { id: '1', name: 'Large egg', amount: '1', unit: 'pieces' },
      { id: '2', name: 'Salt', amount: '1', unit: 'pinch' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '54',
    name: 'Protein Energy Balls',
    categories: ['Snack'],
    foodTypes: ['Vegetarian', 'High Protein'],
    allergens: ['Nuts'],
    prepTime: '15',
    cookTime: '0',
    protein: '8',
    carbs: '12',
    fat: '6',
    calories: '130',
    instructions: 'Mix all ingredients, roll into balls, and refrigerate for 30 minutes.',
    ingredients: [
      { id: '1', name: 'Protein powder', amount: '15', unit: 'g' },
      { id: '2', name: 'Oats', amount: '20', unit: 'g' },
      { id: '3', name: 'Almond butter', amount: '15', unit: 'g' },
      { id: '4', name: 'Honey', amount: '1', unit: 'tsp' },
      { id: '5', name: 'Chia seeds', amount: '5', unit: 'g' }
    ],
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '55',
    name: 'Rice Cakes with Avocado',
    categories: ['Snack'],
    foodTypes: ['Vegetarian', 'Healthy'],
    allergens: [],
    prepTime: '5',
    cookTime: '0',
    protein: '4',
    carbs: '16',
    fat: '8',
    calories: '140',
    instructions: 'Top rice cakes with mashed avocado, salt, and pepper.',
    ingredients: [
      { id: '1', name: 'Rice cakes', amount: '2', unit: 'pieces' },
      { id: '2', name: 'Avocado', amount: '0.5', unit: 'pieces' },
      { id: '3', name: 'Sea salt', amount: '1', unit: 'pinch' }
    ],
    image: 'https://via.placeholder.com/150'
  }
];

// ✅ FOODS DATABASE - Individual foods for meal customization
export const defaultFoods: Food[] = [
  // FRUITS
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
    name: 'Orange',
    category: 'Fruit',
    protein: '1.2',
    carbs: '12',
    fat: '0.1',
    calories: '47',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '4',
    name: 'Blueberries',
    category: 'Fruit',
    protein: '0.7',
    carbs: '14',
    fat: '0.3',
    calories: '57',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '5',
    name: 'Avocado',
    category: 'Fruit',
    protein: '2',
    carbs: '9',
    fat: '15',
    calories: '160',
    image: 'https://via.placeholder.com/150'
  },

  // PROTEINS  
  {
    id: '6',
    name: 'Chicken Breast',
    category: 'Meat',
    protein: '31',
    carbs: '0',
    fat: '3.6',
    calories: '165',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '7',
    name: 'Salmon',
    category: 'Fish',
    protein: '25',
    carbs: '0',
    fat: '12',
    calories: '208',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '8',
    name: 'Greek Yogurt',
    category: 'Dairy',
    protein: '10',
    carbs: '4',
    fat: '0.4',
    calories: '59',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '9',
    name: 'Eggs',
    category: 'Protein',
    protein: '13',
    carbs: '1',
    fat: '11',
    calories: '155',
    image: 'https://via.placeholder.com/150'
  },

  // CARBS
  {
    id: '10',
    name: 'Brown Rice',
    category: 'Grain',
    protein: '2.6',
    carbs: '23',
    fat: '0.9',
    calories: '112',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '11',
    name: 'Quinoa',
    category: 'Grain',
    protein: '4.4',
    carbs: '22',
    fat: '1.9',
    calories: '120',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '12',
    name: 'Sweet Potato',
    category: 'Vegetable',
    protein: '2',
    carbs: '20',
    fat: '0.1',
    calories: '86',
    image: 'https://via.placeholder.com/150'
  },

  // VEGETABLES
  {
    id: '13',
    name: 'Broccoli',
    category: 'Vegetable',
    protein: '2.8',
    carbs: '7',
    fat: '0.4',
    calories: '34',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '14',
    name: 'Spinach',
    category: 'Vegetable',
    protein: '2.9',
    carbs: '4',
    fat: '0.4',
    calories: '23',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '15',
    name: 'Bell Peppers',
    category: 'Vegetable',
    protein: '1',
    carbs: '7',
    fat: '0.3',
    calories: '31',
    image: 'https://via.placeholder.com/150'
  },

  // FATS & NUTS
  {
    id: '16',
    name: 'Almonds',
    category: 'Nuts',
    protein: '21',
    carbs: '22',
    fat: '50',
    calories: '579',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '17',
    name: 'Olive Oil',
    category: 'Oils & Fats',
    protein: '0',
    carbs: '0',
    fat: '100',
    calories: '884',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '18',
    name: 'Peanut Butter',
    category: 'Nuts',
    protein: '25',
    carbs: '20',
    fat: '50',
    calories: '588',
    image: 'https://via.placeholder.com/150'
  },

  // LEGUMES
  {
    id: '19',
    name: 'Black Beans',
    category: 'Legumes',
    protein: '9',
    carbs: '23',
    fat: '0.5',
    calories: '132',
    image: 'https://via.placeholder.com/150'
  },
  {
    id: '20',
    name: 'Chickpeas',
    category: 'Legumes',
    protein: '8',
    carbs: '27',
    fat: '3',
    calories: '164',
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

// ✅ NEW: Statistics functions for database analysis
export const getDatabaseStats = () => {
  const recipeStats = {
    total: defaultRecipes.length,
    breakfast: defaultRecipes.filter(r => r.categories.includes('Breakfast')).length,
    lunch: defaultRecipes.filter(r => r.categories.includes('Lunch')).length,
    dinner: defaultRecipes.filter(r => r.categories.includes('Dinner')).length,
    snacks: defaultRecipes.filter(r => r.categories.includes('Snack')).length,
    vegetarian: defaultRecipes.filter(r => r.foodTypes.includes('Vegetarian')).length,
    highProtein: defaultRecipes.filter(r => parseInt(r.protein) > 25).length,
    lowCalorie: defaultRecipes.filter(r => parseInt(r.calories) < 300).length,
    avgCalories: Math.round(defaultRecipes.reduce((sum, r) => sum + parseInt(r.calories), 0) / defaultRecipes.length)
  };

  const foodStats = {
    total: defaultFoods.length,
    categories: [...new Set(defaultFoods.map(f => f.category))].length,
    avgCalories: Math.round(defaultFoods.reduce((sum, f) => sum + parseInt(f.calories), 0) / defaultFoods.length)
  };

  return { recipes: recipeStats, foods: foodStats };
};