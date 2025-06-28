// src/screens/RecipesScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMealStore } from '../stores/mealStore';
import { RecipeCard } from '../components/RecipeCard';
import { FilterModal } from '../components/FilterModal';
import { Recipe } from '../types/meal';

interface RecipesScreenProps {
  navigation?: {
    navigate: (screen: string, params?: any) => void;
  };
}

export const RecipesScreen: React.FC<RecipesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    getFilteredRecipes,
    addRecipe,
    deleteRecipes,
    clearFilters,
    selectedCategories,
    selectedFoodTypes,
    selectedAllergens
  } = useMealStore();

  const filteredRecipes = getFilteredRecipes();
  const hasActiveFilters = selectedCategories.length > 0 || selectedFoodTypes.length > 0 || selectedAllergens.length > 0;

  const handleRecipePress = (recipe: Recipe) => {
    if (selectionMode) {
      toggleRecipeSelection(recipe.id);
    } else {
      // Navigate to recipe details
      if (navigation) {
        navigation.navigate('RecipeDetails', { recipeId: recipe.id });
      } else {
        console.log('Navigate to recipe details:', recipe.id);
      }
    }
  };

  const handleRecipeLongPress = (recipe: Recipe) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedRecipes([recipe.id]);
    }
  };

  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipes(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const handleAddRecipe = () => {
    // Create a new basic recipe
    const newRecipe = {
      name: 'New Recipe',
      description: 'Tap to edit this recipe',
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      categories: ['Breakfast'],
      ingredients: [],
      instructions: [],
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      image: 'https://via.placeholder.com/150x100/E0E0E0/999999?text=New+Recipe'
    };
    
    addRecipe(newRecipe);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Recipes',
      `Are you sure you want to delete ${selectedRecipes.length} recipe${selectedRecipes.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRecipes(selectedRecipes);
            setSelectedRecipes([]);
            setSelectionMode(false);
          }
        }
      ]
    );
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedRecipes([]);
  };

  const renderRecipe = ({ item, index }: { item: Recipe; index: number }) => (
    <View style={[styles.recipeCardContainer, index % 2 === 1 && styles.recipeCardRight]}>
      <RecipeCard
        recipe={item}
        isSelected={selectedRecipes.includes(item.id)}
        selectionMode={selectionMode}
        onPress={() => handleRecipePress(item)}
        onLongPress={() => handleRecipeLongPress(item)}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📖</Text>
      <Text style={styles.emptyTitle}>No Recipes Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery || hasActiveFilters
          ? 'Try adjusting your search or filters'
          : 'Start by adding your first recipe!'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />

      {/* Header */}
      <View style={styles.header}>
        {selectionMode ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={exitSelectionMode}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.selectionTitle}>
              {selectedRecipes.length} selected
            </Text>
            <TouchableOpacity 
              style={[styles.deleteButton, selectedRecipes.length === 0 && styles.disabledButton]}
              onPress={handleDeleteSelected}
              disabled={selectedRecipes.length === 0}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>Recipes</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddRecipe}>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Search and Filter Bar */}
      {!selectionMode && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={[styles.filterIcon, hasActiveFilters && styles.filterIconActive]}>⚙️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clear Filters Button */}
      {!selectionMode && hasActiveFilters && (
        <View style={styles.clearFiltersContainer}>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recipe List */}
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  statusBarSeparator: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#FFB347',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFB347',
    fontWeight: 'bold',
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 18,
  },
  disabledButton: {
    opacity: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  clearSearchIcon: {
    fontSize: 16,
    color: '#999999',
    marginLeft: 10,
  },
  filterButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FFB347',
  },
  filterIcon: {
    fontSize: 18,
  },
  filterIconActive: {
    fontSize: 18,
  },
  clearFiltersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  clearFiltersButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFB347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  recipeCardContainer: {
    flex: 0.48,
  },
  recipeCardRight: {
    marginLeft: '4%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});