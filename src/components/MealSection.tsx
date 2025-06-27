// src/components/MealSection.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput } from 'react-native';
import { Meal, Recipe, Food } from '../types/meal';
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
  
  const recipes = useMealStore(state => state.recipes);
  const foods = useMealStore(state => state.foods);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{getMealIcon()}</Text>
          <Text style={styles.title}>{type}</Text>
        </View>
        
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
            meals.map((meal) => (
              <View key={meal.id} style={styles.mealItem}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <TouchableOpacity onPress={() => onRemoveMeal(meal.id)}>
                  <Text style={styles.removeMeal}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add {type}</Text>
            </TouchableOpacity>
          )}
          
          {meals.length > 0 && (
            <TouchableOpacity 
              style={styles.addMoreButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addMoreText}>+ Add more</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Add Meal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Add {type}</Text>
            
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isAddingRecipe && styles.activeTab]}
                onPress={() => setIsAddingRecipe(true)}
              >
                <Text style={[styles.tabText, isAddingRecipe && styles.activeTabText]}>
                  Recipes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isAddingRecipe && styles.activeTab]}
                onPress={() => setIsAddingRecipe(false)}
              >
                <Text style={[styles.tabText, !isAddingRecipe && styles.activeTabText]}>
                  Foods
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${isAddingRecipe ? 'recipes' : 'foods'}...`}
            />

            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              style={styles.itemList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.itemRow,
                    selectedItem?.id === item.id && styles.selectedItem
                  ]}
                  onPress={() => setSelectedItem(item)}
                >
                  <Text style={styles.itemName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity 
              style={[styles.confirmButton, !selectedItem && styles.disabledButton]}
              onPress={handleAddMeal}
              disabled={!selectedItem}
            >
              <Text style={styles.confirmText}>Add Meal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginRight: 10,
    padding: 5,
  },
  deleteText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  expandButton: {
    backgroundColor: '#FFB347',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    color: '#333333',
  },
  removeMeal: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 15,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFB347',
    fontSize: 16,
    fontWeight: '600',
  },
  addMoreButton: {
    padding: 10,
    alignItems: 'center',
  },
  addMoreText: {
    color: '#FFB347',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeText: {
    fontSize: 20,
    color: '#666666',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333333',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#FFB347',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  itemList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  itemRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedItem: {
    backgroundColor: '#FFE4B5',
  },
  itemName: {
    fontSize: 16,
    color: '#333333',
  },
  confirmButton: {
    backgroundColor: '#FFB347',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});