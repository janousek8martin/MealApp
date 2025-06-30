// src/utils/units.ts

export interface Unit {
  name: string;
  conversion: number;
  reference: string;
  alias?: string[];
}

export interface UnitsConfig {
  volume: Unit[];
  weight: Unit[];
  count: Unit[];
  fractional: Unit[];
}

export const defaultUnits: UnitsConfig = {
  volume: [
    { name: 'milliliters', conversion: 1, reference: 'ml', alias: ['ml'] },
    { name: 'liters', conversion: 1000, reference: 'ml', alias: ['l'] },
    { name: 'čajová lžička', conversion: 5, reference: 'ml', alias: ['tsp', 'teaspoon'] },
    { name: 'polévková lžíce', conversion: 15, reference: 'ml', alias: ['tbsp', 'tablespoon'] },
    { name: 'hrnek', conversion: 240, reference: 'ml', alias: ['cup'] },
    { name: 'fluid ounce', conversion: 29.5735, reference: 'ml', alias: ['fl oz'] },
    { name: 'pint', conversion: 473.176, reference: 'ml', alias: ['pt'] },
    { name: 'quart', conversion: 946.353, reference: 'ml', alias: ['qt'] },
    { name: 'gallon', conversion: 3785.41, reference: 'ml', alias: ['gal'] }
  ],
  weight: [
    { name: 'grams', conversion: 1, reference: 'g', alias: ['g'] },
    { name: 'kilograms', conversion: 1000, reference: 'g', alias: ['kg'] },
    { name: 'ounce', conversion: 28.3495, reference: 'g', alias: ['oz'] },
    { name: 'pound', conversion: 453.592, reference: 'g', alias: ['lb'] }
  ],
  count: [
    { name: 'piece', conversion: 1, reference: 'pc', alias: ['pc', 'pieces'] },
    { name: 'serving', conversion: 1, reference: 'serving', alias: ['servings'] }
  ],
  fractional: [
    { name: '1/2 hrnku', conversion: 120, reference: 'ml', alias: ['1/2 cup'] },
    { name: '1/3 hrnku', conversion: 80, reference: 'ml', alias: ['1/3 cup'] },
    { name: '1/4 hrnku', conversion: 60, reference: 'ml', alias: ['1/4 cup'] },
    { name: '1/8 hrnku', conversion: 30, reference: 'ml', alias: ['1/8 cup'] },
    { name: '2/3 hrnku', conversion: 160, reference: 'ml', alias: ['2/3 cup'] }
  ]
};

// Helper function to get all available units as a flat array
export const getAllUnits = (): string[] => {
  const allUnits: string[] = [];
  
  // Explicitly iterate over known keys to maintain type safety
  const categories: (keyof UnitsConfig)[] = ['volume', 'weight', 'count', 'fractional'];
  
  categories.forEach(category => {
    defaultUnits[category].forEach(unit => {
      allUnits.push(unit.reference);
      if (unit.alias) {
        allUnits.push(...unit.alias);
      }
    });
  });
  
  return [...new Set(allUnits)]; // Remove duplicates
};

// Helper function to get common units for dropdown
export const getCommonUnits = (): string[] => {
  return [
    'g', 'kg', 'ml', 'l', 'pc', 'pieces',
    'tsp', 'tbsp', 'cup', 'oz', 'lb'
  ];
};