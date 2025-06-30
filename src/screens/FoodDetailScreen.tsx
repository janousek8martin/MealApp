// src/screens/FoodDetailScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Food, useRecipeStore } from '../stores/recipeStore';

// Import food categories database with fallback
let foodCategories: string[];
try {
  const { getFoodCategories } = require('../data/recipesFoodsDatabase');
  foodCategories = getFoodCategories();
} catch (error) {
  // Fallback categories
  foodCategories = [
    'Fruit', 'Vegetable', 'Meat', 'Fish', 'Dairy', 'Grain', 'Nuts', 'Legumes', 'Herbs & Spices', 'Oils & Fats'
  ];
}

interface FoodDetailScreenProps {
  food: Food;
  onBack: () => void;
}

const FoodDetailScreen: React.FC<FoodDetailScreenProps> = ({ food, onBack }) => {
  const insets = useSafeAreaInsets();
  const [editedFood, setEditedFood] = useState<Food>(food);
  const [isEditing, setIsEditing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const updateFood = useRecipeStore(state => state.updateFood);

  const handleSave = () => {
    updateFood(food.id, editedFood);
    setIsEditing(false);
    Alert.alert('Success', 'Food updated successfully!');
  };

  const handleCancel = () => {
    setEditedFood(food);
    setIsEditing(false);
  };

  const updateField = (field: keyof Food, value: string) => {
    setEditedFood(prev => ({ ...prev, [field]: value }));
  };

  const handleAddImage = () => {
    // TODO: Implementovat přidání obrázku
    Alert.alert('Add Image', 'Image selection functionality will be implemented later');
  };

  const handlePrint = () => {
    // TODO: Implementovat tisk jídla
    Alert.alert('Print Food Info', 'Print functionality will be implemented later');
  };

  const openCategoryModal = () => {
    const currentCategory = editedFood.category || '';
    const available = foodCategories.filter(cat => cat !== currentCategory);
    setAvailableCategories(available);
    setShowCategoryModal(true);
  };

  const selectCategory = (category: string) => {
    updateField('category', category);
    setShowCategoryModal(false);
  };

  const removeCategory = () => {
    updateField('category', '');
  };

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editedFood.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
            <Text style={styles.printIcon}>🖨️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={isEditing ? handleSave : () => setIsEditing(true)}
          >
            <Text style={styles.editText}>{isEditing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Food Image */}
        <View style={styles.imageContainer}>
          {editedFood.image && editedFood.image !== 'https://via.placeholder.com/150' ? (
            <Image source={{ uri: editedFood.image }} style={styles.image} />
          ) : (
            <TouchableOpacity style={styles.imagePlaceholder} onPress={handleAddImage}>
              <Text style={styles.addImageIcon}>📷</Text>
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category</Text>
            {isEditing && (
              <TouchableOpacity style={styles.addCategoryButton} onPress={openCategoryModal}>
                <Text style={styles.addCategoryText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.categoryContainer}>
            {editedFood.category ? (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{editedFood.category}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={removeCategory}>
                    <Text style={styles.removeCategoryText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.noCategoryText}>No category assigned</Text>
            )}
          </View>
        </View>

        {/* Nutrition Info per 100g */}
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Nutrition (per 100g)</Text>
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedFood.calories}
                  onChangeText={(text) => updateField('calories', text)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedFood.calories}</Text>
              )}
              <Text style={styles.nutritionUnit}>kcal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protein</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedFood.protein}
                  onChangeText={(text) => updateField('protein', text)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedFood.protein}</Text>
              )}
              <Text style={styles.nutritionUnit}>g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Carbs</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedFood.carbs}
                  onChangeText={(text) => updateField('carbs', text)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedFood.carbs}</Text>
              )}
              <Text style={styles.nutritionUnit}>g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fat</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedFood.fat}
                  onChangeText={(text) => updateField('fat', text)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedFood.fat}</Text>
              )}
              <Text style={styles.nutritionUnit}>g</Text>
            </View>
          </View>
        </View>



        {isEditing && (
          <View style={styles.editingActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Select Category</Text>
            
            <ScrollView style={styles.categoryList}>
              {availableCategories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.categoryOption}
                  onPress={() => selectCategory(category)}
                >
                  <Text style={styles.categoryOptionText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFB347',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  printButton: {
    padding: 8,
  },
  printIcon: {
    fontSize: 20,
  },
  editButton: {
    backgroundColor: '#FFB347',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  imagePlaceholder: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addImageIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  addImageText: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  addCategoryButton: {
    backgroundColor: '#FFB347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addCategoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  removeCategoryText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: 'bold',
  },
  noCategoryText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 4,
  },
  nutritionUnit: {
    fontSize: 10,
    color: '#666666',
  },
  nutritionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    minWidth: 60,
    marginBottom: 4,
  },

  editingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FFB347',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
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
    width: '80%',
    maxHeight: '60%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeText: {
    fontSize: 18,
    color: '#666666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333333',
  },
  categoryList: {
    maxHeight: 200,
  },
  categoryOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333333',
  },
});

export default FoodDetailScreen;