// src/components/MealSection.tsx
// 🔧 OPRAVED: Import Recipe a Food z recipeStore místo types/meal

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput } from 'react-native';
import { Meal } from '../types/meal';
import { Recipe, Food, useRecipeStore } from '../stores/recipeStore';
import { useMealStore } from '../stores/mealStore';

interface MealSectionProps {
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  meals: Meal[];
  onAddMeal: (name: string, position?: string) => void;
  onRemoveMeal: (mealId: string) => void;
  position?: string;
  isSnack?: boolean;
  onRemoveSnack?: () => void;
}

export const MealSection: React.FC<MealSectionProps> = ({
  type,
  meals,
  onAddMeal,
  onRemoveMeal,
  position,
  isSnack = false,
  onRemoveSnack
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingRecipe, setIsAddingRecipe] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Recipe | Food | null>(null);
  
  const recipes = useRecipeStore(state => state.recipes);
  const foods = useRecipeStore(state => state.foods);

  const getMealIcon = () => {
    switch (type) {
      case 'Breakfast': return '🍳';
      case 'Lunch': return '🥗';
      case 'Dinner': return '🍽️';
      case 'Snack': return '🍎';
      default: return '🍽️';
    }
  };

  const getFilteredItems = (): (Recipe | Food)[] => {
    if (isAddingRecipe) {
      return recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (type === 'Snack' || recipe.categories.includes(type))
      );
    } else {
      return foods.filter(food => 
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  };

  const filteredItems = getFilteredItems();

  const handleAddMeal = () => {
    if (selectedItem) {
      onAddMeal(selectedItem.name, position);
      setShowAddModal(false);
      setSelectedItem(null);
      setSearchQuery('');
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setSelectedItem(null);
    setSearchQuery('');
  };

  // Získání prvního jídla pro zobrazení v collapsed stavu
  const firstMeal = meals.length > 0 ? meals[0] : null;
  const remainingMealsCount = meals.length > 1 ? meals.length - 1 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{getMealIcon()}</Text>
          <Text style={styles.title}>{type}</Text>
        </View>
        
        {/* Zobrazení prvního jídla v collapsed stavu */}
        {firstMeal && !isExpanded && (
          <View style={styles.mealPreview}>
            <Text style={styles.mealPreviewText}>{firstMeal.name}</Text>
            {remainingMealsCount > 0 && (
              <Text style={styles.mealCount}>+{remainingMealsCount}</Text>
            )}
          </View>
        )}
        
        <View style={styles.headerRight}>
          {isSnack && onRemoveSnack && (
            <TouchableOpacity style={styles.deleteButton} onPress={onRemoveSnack}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.content}>
          {meals.length > 0 ? (
            <View style={styles.mealsList}>
              {meals.map((meal, index) => (
                <View key={meal.id} style={styles.mealItem}>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    {meal.position && meal.position !== type && (
                      <Text style={styles.mealPosition}>({meal.position})</Text>
                    )}
                    <View style={styles.mealNutrition}>
                      <Text style={styles.nutritionText}>
                        Calories: {meal.calories || '--'} | 
                        Protein: {meal.protein || '--'}g | 
                        Carbs: {meal.carbs || '--'}g | 
                        Fat: {meal.fat || '--'}g
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.mealActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => console.log('Edit meal:', meal.id)}
                    >
                      <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => onRemoveMeal(meal.id)}
                    >
                      <Text style={styles.removeButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No {type.toLowerCase()} planned</Text>
              <Text style={styles.emptyStateSubtext}>
                Add meals manually or use the Generate button
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add {type}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Meal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {type}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Toggle between recipes and foods */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, isAddingRecipe && styles.toggleButtonActive]}
                onPress={() => setIsAddingRecipe(true)}
              >
                <Text style={[styles.toggleButtonText, isAddingRecipe && styles.toggleButtonTextActive]}>
                  Recipes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isAddingRecipe && styles.toggleButtonActive]}
                onPress={() => setIsAddingRecipe(false)}
              >
                <Text style={[styles.toggleButtonText, !isAddingRecipe && styles.toggleButtonTextActive]}>
                  Foods
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${isAddingRecipe ? 'recipes' : 'foods'}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Items list */}
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.itemRow,
                    selectedItem?.id === item.id && styles.itemRowSelected
                  ]}
                  onPress={() => setSelectedItem(item)}
                >
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemNutrition}>
                      {item.calories} cal | {item.protein}g protein
                    </Text>
                  </View>
                  
                  {selectedItem?.id === item.id && (
                    <Text style={styles.selectedIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.itemsList}
            />

            {/* Add button */}
            <TouchableOpacity
              style={[styles.modalAddButton, !selectedItem && styles.modalAddButtonDisabled]}
              onPress={handleAddMeal}
              disabled={!selectedItem}
            >
              <Text style={styles.modalAddButtonText}>
                Add {selectedItem?.name || 'Selected Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  mealPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  mealPreviewText: {
    fontSize: 14,
    color: '#6c757d',
    marginRight: 4,
  },
  mealCount: {
    fontSize: 12,
    color: '#ff7f50',
    fontWeight: '600',
    backgroundColor: '#fff3f0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#f8d7da',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  deleteText: {
    fontSize: 14,
    color: '#721c24',
  },
  expandButton: {
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expandIcon: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  mealsList: {
    marginBottom: 16,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  mealPosition: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  mealNutrition: {
    // Container for nutrition info
  },
  nutritionText: {
    fontSize: 12,
    color: '#6c757d',
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 12,
    color: '#495057',
  },
  removeButton: {
    backgroundColor: '#f8d7da',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#721c24',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#adb5bd',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#ff7f50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
  },
  modalCloseButton: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#ff7f50',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  itemsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  itemRowSelected: {
    backgroundColor: '#fff3f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  itemNutrition: {
    fontSize: 12,
    color: '#6c757d',
  },
  selectedIcon: {
    fontSize: 16,
    color: '#ff7f50',
    fontWeight: '600',
  },
  modalAddButton: {
    backgroundColor: '#ff7f50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalAddButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
  modalAddButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});