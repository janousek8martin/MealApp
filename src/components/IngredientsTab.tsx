// src/components/IngredientsTab.tsx
// 🥕 Ingredients Tab - USDA primary + barcode scanner icon

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
import { USDAIngredients } from '../services/USDAIngredients';
import { OpenFoodFactsService } from '../services/OpenFoodFactsService';
import { UnifiedFoodItem } from '../types/UnifiedFood';
import { UnifiedFoodCard } from './UnifiedFoodCard';

export const IngredientsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredients, setIngredients] = useState<UnifiedFoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({ usda: 0, barcode: 0 });

  const searchIngredients = async (query: string) => {
    if (query.length < 2) {
      setIngredients([]);
      setSearchStats({ usda: 0, barcode: 0 });
      return;
    }
    
    setLoading(true);
    try {
      // PRIMARY: USDA search only (no OpenFoodFacts text search)
      const usdaResult = await USDAIngredients.searchIngredients(query);
      
      if (usdaResult.success) {
        setIngredients(usdaResult.data);
        setSearchStats({
          usda: usdaResult.data.length,
          barcode: 0
        });
        console.log(`🔍 Found: ${usdaResult.data.length} USDA ingredients`);
      } else {
        setIngredients([]);
        setSearchStats({ usda: 0, barcode: 0 });
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search ingredients. Please try again.');
      setIngredients([]);
      setSearchStats({ usda: 0, barcode: 0 });
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
                  // Add barcode result to current ingredients
                  setIngredients(prev => [result.data!, ...prev]);
                  setSearchStats(prev => ({ ...prev, barcode: prev.barcode + 1 }));
                  Alert.alert('Found!', `${result.data.name} added to results`);
                } else {
                  Alert.alert('Not Found', 'Product not found in OpenFoodFacts database');
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

  const handleIngredientSelect = (ingredient: UnifiedFoodItem) => {
    const nutrition = ingredient.nutrition;
    let message = `Per 100g:\n`;
    message += `Calories: ${Math.round(nutrition.calories)} kcal\n`;
    message += `Protein: ${nutrition.protein.toFixed(1)}g\n`;
    message += `Carbs: ${nutrition.carbohydrates.toFixed(1)}g\n`;
    message += `Fat: ${nutrition.fat.toFixed(1)}g`;
    
    if (nutrition.fiber && nutrition.fiber > 0) {
      message += `\nFiber: ${nutrition.fiber.toFixed(1)}g`;
    }
    
    // Add source-specific info
    if (ingredient.source === 'openfoodfacts' && ingredient.openFoodFactsData) {
      const off = ingredient.openFoodFactsData;
      message += `\n\nBarcode: ${off.barcode}`;
      if (off.nutriScore) {
        message += `\nNutri-Score: ${off.nutriScore}`;
      }
      if (off.novaGroup) {
        const novaDescriptions = {
          1: 'Unprocessed/minimally processed',
          2: 'Processed culinary ingredients',
          3: 'Processed foods',
          4: 'Ultra-processed foods'
        };
        message += `\nProcessing: ${novaDescriptions[off.novaGroup as keyof typeof novaDescriptions]}`;
      }
    } else if (ingredient.source === 'usda' && ingredient.usdaData) {
      if (ingredient.usdaData.category) {
        message += `\n\nCategory: ${ingredient.usdaData.category}`;
      }
      message += `\nData: ${ingredient.usdaData.dataType}`;
    }

    Alert.alert(
      ingredient.name,
      message,
      [
        { text: 'Close' },
        { text: 'Add to Meal Plan', onPress: () => addToMealPlan(ingredient) }
      ]
    );
  };

  const addToMealPlan = (ingredient: UnifiedFoodItem) => {
    Alert.alert(
      'Added!', 
      `${ingredient.name} will be added to meal plan (feature coming in Week 4)`
    );
  };

  const renderSearchStats = () => {
    if (!searchQuery && searchStats.barcode === 0) return null;
    
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Found {ingredients.length} ingredients: {searchStats.usda} from USDA
          {searchStats.barcode > 0 && `, ${searchStats.barcode} from barcode`}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search ingredients (chicken, rice, tomato...)"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchIngredients(text);
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
          💡 Search USDA database or scan barcode for packaged ingredients
        </Text>
      </View>

      {renderSearchStats()}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Searching USDA database...</Text>
        </View>
      )}

      <FlatList
        data={ingredients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UnifiedFoodCard
            item={item}
            onPress={() => handleIngredientSelect(item)}
            onAddToMealPlan={() => addToMealPlan(item)}
            showSource={true}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && searchQuery.length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No ingredients found</Text>
              <Text style={styles.emptySubtext}>Try a different search term or scan a barcode</Text>
            </View>
          ) : !loading && !searchQuery ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>🥕 Ready to find ingredients?</Text>
              <Text style={styles.emptySubtext}>Search USDA database for detailed nutrition info</Text>
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
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsText: {
    fontSize: 12,
    color: '#4338CA',
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