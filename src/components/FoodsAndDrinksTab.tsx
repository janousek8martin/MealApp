// src/components/FoodsAndDrinksTab.tsx
// 🍽️ Foods & Drinks Tab - OpenFoodFacts primary + USDA fallback + barcode scanner

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { OpenFoodFactsService } from '../services/OpenFoodFactsService';
import { USDAIngredients } from '../services/USDAIngredients';
import { UnifiedFoodItem } from '../types/UnifiedFood';
import { UnifiedFoodCard } from './UnifiedFoodCard';

export const FoodsAndDrinksTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<UnifiedFoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({ openfoodfacts: 0, usda: 0, barcode: 0 });

  const searchFoods = async (query: string) => {
    if (query.length < 2) {
      setFoods([]);
      setSearchStats({ openfoodfacts: 0, usda: 0, barcode: 0 });
      return;
    }
    
    setLoading(true);
    try {
      // PRIMARY: OpenFoodFacts search
      const offResult = await OpenFoodFactsService.searchProducts(query);
      const allItems: UnifiedFoodItem[] = [];
      let stats = { openfoodfacts: 0, usda: 0, barcode: 0 };
      
      if (offResult.success && offResult.data.length > 0) {
        allItems.push(...offResult.data);
        stats.openfoodfacts = offResult.data.length;
        console.log(`🔍 OpenFoodFacts found: ${offResult.data.length} products`);
      }
      
      // SECONDARY: USDA fallback if limited results
      if (allItems.length < 5) {
        console.log('📊 Adding USDA fallback due to limited OpenFoodFacts results');
        const usdaResult = await USDAIngredients.searchIngredients(query);
        
        if (usdaResult.success && usdaResult.data.length > 0) {
          // Filter for food-like items (not just raw ingredients)
          const foodLikeItems = usdaResult.data.filter(item => 
            isFoodLikeItem(item, query)
          );
          allItems.push(...foodLikeItems);
          stats.usda = foodLikeItems.length;
          console.log(`📊 USDA contributed: ${foodLikeItems.length} food-like items`);
        }
      }
      
      setFoods(allItems);
      setSearchStats(stats);
      
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search foods. Please try again.');
      setFoods([]);
      setSearchStats({ openfoodfacts: 0, usda: 0, barcode: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSearch = async () => {
    Alert.prompt(
      'Barcode Scanner',
      'Enter barcode manually (camera scanner coming in Week 2):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Search',
          onPress: async (barcode) => {
            if (barcode && barcode.length >= 8) {
              setLoading(true);
              try {
                const result = await OpenFoodFactsService.getProductByBarcode(barcode);
                if (result.success && result.data) {
                  // Add barcode result to current foods
                  setFoods(prev => [result.data!, ...prev]);
                  setSearchStats(prev => ({ ...prev, barcode: prev.barcode + 1 }));
                  Alert.alert('Found!', `${result.data.name} added to results`);
                } else {
                  Alert.alert('Not Found', 'Product not found. You can add it to the database!');
                  // TODO: Show AddProductModal in Week 3
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to lookup barcode');
              } finally {
                setLoading(false);
              }
            } else {
              Alert.alert('Invalid Barcode', 'Please enter a valid barcode (8+ digits)');
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const isFoodLikeItem = (item: UnifiedFoodItem, query: string): boolean => {
    const name = item.name.toLowerCase();
    const q = query.toLowerCase();
    
    // Favor prepared/processed foods over raw ingredients
    const foodKeywords = [
      'prepared', 'cooked', 'baked', 'fried', 'grilled', 'steamed',
      'sandwich', 'pizza', 'burger', 'meal', 'dish', 'recipe',
      'fast food', 'restaurant', 'frozen', 'canned'
    ];
    
    // Skip very basic raw ingredients unless specifically searched
    const rawKeywords = ['raw', 'fresh', 'uncooked', 'plain'];
    
    const hasFood = foodKeywords.some(keyword => name.includes(keyword));
    const hasRaw = rawKeywords.some(keyword => name.includes(keyword)) && 
                   !foodKeywords.some(keyword => q.includes(keyword));
    
    return hasFood || !hasRaw;
  };

  const handleFoodSelect = (food: UnifiedFoodItem) => {
    const nutrition = food.nutrition;
    let message = `Per 100g:\n`;
    message += `Calories: ${Math.round(nutrition.calories)} kcal\n`;
    message += `Protein: ${nutrition.protein.toFixed(1)}g\n`;
    message += `Carbs: ${nutrition.carbohydrates.toFixed(1)}g\n`;
    message += `Fat: ${nutrition.fat.toFixed(1)}g`;
    
    if (nutrition.fiber && nutrition.fiber > 0) {
      message += `\nFiber: ${nutrition.fiber.toFixed(1)}g`;
    }
    
    // Add barcode info for OpenFoodFacts products
    if (food.source === 'openfoodfacts' && food.openFoodFactsData?.barcode) {
      message += `\n\nBarcode: ${food.openFoodFactsData.barcode}`;
      
      if (food.openFoodFactsData.nutriScore) {
        message += `\nNutri-Score: ${food.openFoodFactsData.nutriScore}`;
      }
      
      if (food.openFoodFactsData.novaGroup) {
        const novaDescriptions = {
          1: 'Unprocessed',
          2: 'Processed ingredients',
          3: 'Processed foods',
          4: 'Ultra-processed'
        };
        message += `\nProcessing: ${novaDescriptions[food.openFoodFactsData.novaGroup as keyof typeof novaDescriptions]}`;
      }

      // Add dietary tags
      if (food.openFoodFactsData?.ingredientAnalysis) {
        const tags = food.openFoodFactsData.ingredientAnalysis;
        const dietaryInfo = [];
        
        if (tags.includes('en:vegetarian')) dietaryInfo.push('Vegetarian');
        if (tags.includes('en:vegan')) dietaryInfo.push('Vegan');
        if (tags.includes('en:palm-oil-free')) dietaryInfo.push('Palm oil free');
        
        if (dietaryInfo.length > 0) {
          message += `\nDietary: ${dietaryInfo.join(', ')}`;
        }
      }
    } else if (food.source === 'usda' && food.usdaData) {
      if (food.usdaData.category) {
        message += `\n\nCategory: ${food.usdaData.category}`;
      }
      if (food.usdaData.dataType) {
        message += `\nData: ${food.usdaData.dataType}`;
      }
    }

    Alert.alert(
      food.name,
      message,
      [
        { text: 'Close' },
        { text: 'Add to Meal Plan', onPress: () => addToMealPlan(food) }
      ]
    );
  };

  const addToMealPlan = (food: UnifiedFoodItem) => {
    Alert.alert(
      'Added!', 
      `${food.name} will be added to meal plan (feature coming in Week 4)`
    );
  };

  const renderSearchStats = () => {
    if (!searchQuery && searchStats.barcode === 0) return null;
    
    const totalFound = foods.length;
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Found {totalFound} products: {searchStats.openfoodfacts} from OpenFoodFacts
          {searchStats.usda > 0 && `, ${searchStats.usda} from USDA`}
          {searchStats.barcode > 0 && `, ${searchStats.barcode} from barcode`}
        </Text>
      </View>
    );
  };

  const renderQuickFilters = () => {
    const quickSearches = [
      { label: '🍕 Pizza', query: 'pizza' },
      { label: '🥤 Drinks', query: 'coca cola' },
      { label: '🧀 Dairy', query: 'yogurt' },
      { label: '🍞 Bread', query: 'bread' },
      { label: '🍫 Snacks', query: 'chocolate' },
      { label: '🥘 Ready meals', query: 'frozen meal' }
    ];

    return (
      <View style={styles.quickFiltersContainer}>
        <Text style={styles.quickFiltersTitle}>Quick searches:</Text>
        <View style={styles.quickFiltersRow}>
          {quickSearches.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickFilterButton}
              onPress={() => {
                setSearchQuery(item.query);
                searchFoods(item.query);
              }}
            >
              <Text style={styles.quickFilterText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods & drinks (pizza, coca cola, yogurt...)"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchFoods(text);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={styles.barcodeButton}
            onPress={handleBarcodeSearch}
          >
            <Text style={styles.barcodeIcon}>📷</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.searchHint}>
          💡 Search OpenFoodFacts for real products or scan barcode
        </Text>
      </View>

      {!searchQuery && renderQuickFilters()}
      {renderSearchStats()}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Searching OpenFoodFacts & USDA...</Text>
        </View>
      )}

      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UnifiedFoodCard
            item={item}
            onPress={() => handleFoodSelect(item)}
            onAddToMealPlan={() => addToMealPlan(item)}
            showSource={true}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && searchQuery.length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No foods found</Text>
              <Text style={styles.emptySubtext}>Try a different search term, use quick searches, or scan a barcode</Text>
            </View>
          ) : !loading && !searchQuery ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>🍽️ Ready to find food?</Text>
              <Text style={styles.emptySubtext}>Search for real products or use quick searches above</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  barcodeButton: {
    width: 48,
    height: 48,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeIcon: {
    fontSize: 20,
  },
  searchHint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  quickFiltersContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  quickFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFilterButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickFilterText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '500',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});