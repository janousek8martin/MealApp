// src/screens/RecipesScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecipeStore, Recipe, Food } from '../stores/recipeStore';
import { RecipeCard } from '../components/RecipeCard';
import { FoodCard } from '../components/FoodCard';
import { FilterModal } from '../components/FilterModal';

type ActiveTab = 'Recipes' | 'Foods';

export const RecipesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ActiveTab>('Recipes');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  
  const {
    searchQuery,
    selectedCategories,
    selectedFoodTypes,
    selectedAllergens,
    selectedRecipes,
    selectedFoods,
    setSearchQuery,
    setSelectedCategories,
    setSelectedFoodTypes,
    setSelectedAllergens,
    clearFilters,
    addRecipe,
    deleteRecipe,
    toggleRecipeSelection,
    clearRecipeSelection,
    addFood,
    deleteFood,
    toggleFoodSelection,
    clearFoodSelection,
    getFilteredRecipes,
    getFilteredFoods
  } = useRecipeStore();

  const filteredRecipes = getFilteredRecipes();
  const filteredFoods = getFilteredFoods();

  const handleAddNew = () => {
    if (activeTab === 'Recipes') {
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: 'New Recipe',
        categories: [],
        foodTypes: [],
        allergens: [],
        prepTime: '0',
        cookTime: '0',
        protein: '0',
        carbs: '0',
        fat: '0',
        calories: '0',
        instructions: '',
        ingredients: [],
        image: 'https://via.placeholder.com/150',
      };
      addRecipe(newRecipe);
      // TODO: Navigate to recipe details
    } else {
      const newFood: Food = {
        id: Date.now().toString(),
        name: 'New Food',
        protein: '0',
        carbs: '0',
        fat: '0',
        calories: '0',
        image: 'https://via.placeholder.com/150',
      };
      addFood(newFood);
      // TODO: Navigate to food details
    }
  };

  const handleDeleteSelected = () => {
    const selectedCount = activeTab === 'Recipes' ? selectedRecipes.length : selectedFoods.length;
    
    Alert.alert(
      `Delete ${activeTab}`,
      `Are you sure you want to delete ${selectedCount} selected ${activeTab.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (activeTab === 'Recipes') {
              selectedRecipes.forEach(id => deleteRecipe(id));
              clearRecipeSelection();
            } else {
              selectedFoods.forEach(id => deleteFood(id));
              clearFoodSelection();
            }
          }
        }
      ]
    );
  };

  const handleRecipePress = (recipe: Recipe) => {
    if (selectedRecipes.length > 0) {
      toggleRecipeSelection(recipe.id);
    } else {
      // TODO: Navigate to recipe details
      console.log('Navigate to recipe details:', recipe.name);
    }
  };

  const handleFoodPress = (food: Food) => {
    if (selectedFoods.length > 0) {
      toggleFoodSelection(food.id);
    } else {
      // TODO: Navigate to food details
      console.log('Navigate to food details:', food.name);
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    // Clear selections when switching tabs
    clearRecipeSelection();
    clearFoodSelection();
  };

  const handleApplyFilters = (filters: {
    categories: string[];
    foodTypes: string[];
    allergens: string[];
  }) => {
    setSelectedCategories(filters.categories);
    setSelectedFoodTypes(filters.foodTypes);
    setSelectedAllergens(filters.allergens);
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedFoodTypes.length > 0 || selectedAllergens.length > 0;
  const hasSelections = (activeTab === 'Recipes' ? selectedRecipes.length : selectedFoods.length) > 0;

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <RecipeCard
      recipe={item}
      isSelected={selectedRecipes.includes(item.id)}
      onPress={() => handleRecipePress(item)}
      onLongPress={() => toggleRecipeSelection(item.id)}
    />
  );

  const renderFoodItem = ({ item }: { item: Food }) => (
    <FoodCard
      food={item}
      isSelected={selectedFoods.includes(item.id)}
      onPress={() => handleFoodPress(item)}
      onLongPress={() => toggleFoodSelection(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      {/* Top Header with Tab Navigation */}
      <View style={styles.topHeader}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Recipes' && styles.activeTab]}
            onPress={() => handleTabChange('Recipes')}
          >
            <Text style={[styles.tabText, activeTab === 'Recipes' && styles.activeTabText]}>
              Recipes
            </Text>
          </TouchableOpacity>
          <Text style={styles.tabSeparator}>|</Text>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Foods' && styles.activeTab]}
            onPress={() => handleTabChange('Foods')}
          >
            <Text style={[styles.tabText, activeTab === 'Foods' && styles.activeTabText]}>
              Foods
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter Row */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={[styles.filterIconButton, hasActiveFilters && styles.activeFilterIconButton]}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Text style={[styles.filterIconText, hasActiveFilters && styles.activeFilterIconText]}>
              ⩪
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionButtonsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity 
            style={[styles.editButton, { opacity: hasSelections ? 1 : 0.3 }]} 
            onPress={() => console.log('Edit selected items')}
            disabled={!hasSelections}
          >
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.deleteButton, { opacity: hasSelections ? 1 : 0.3 }]} 
            onPress={handleDeleteSelected}
            disabled={!hasSelections}
          >
            <Text style={styles.deleteIcon}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content List */}
      <View style={styles.content}>
        <Text style={styles.sectionHeader}>
          {activeTab} ({activeTab === 'Recipes' ? filteredRecipes.length : filteredFoods.length})
        </Text>
        
        {activeTab === 'Recipes' ? (
          <FlatList
            data={filteredRecipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recipes found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery || hasActiveFilters ? 'Try adjusting your search or filters' : 'Add your first recipe to get started'}
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredFoods}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No foods found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery ? 'Try adjusting your search' : 'Add your first food item to get started'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialCategories={selectedCategories}
        initialFoodTypes={selectedFoodTypes}
        initialAllergens={selectedAllergens}
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
  topHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeTab: {
    backgroundColor: '#FFB347',
    borderRadius: 5,
  },
  tabText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#333333',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
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
  filterIconButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: 'transparent',
  },
  activeFilterIconButton: {
    backgroundColor: '#FFB347',
  },
  filterIconText: {
    fontSize: 16,
    color: '#666666',
  },
  activeFilterIconText: {
    color: '#FFFFFF',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 10,
  },
  centerActions: {
    flex: 1,
    alignItems: 'center',
  },
  clearFiltersButton: {
    backgroundColor: '#FFB347',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rightActions: {
    alignItems: 'flex-end',
  },
  addButton: {
    backgroundColor: '#FFB347',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 20,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 16,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 18,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
  },
});