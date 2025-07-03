// src/screens/RecipeDetailScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Recipe, useRecipeStore } from '../stores/recipeStore';
import { getCommonUnits } from '../utils/units';
import { tagsDatabase } from '../data/tagsDatabase';

interface RecipeDetailScreenProps {
  recipe: Recipe;
  onBack: () => void;
}

const RecipeDetailScreen: React.FC<RecipeDetailScreenProps> = ({ recipe, onBack }) => {
  const insets = useSafeAreaInsets();
  const [editedRecipe, setEditedRecipe] = useState<Recipe>(recipe);
  const [isEditing, setIsEditing] = useState(false);
  const updateRecipe = useRecipeStore(state => state.updateRecipe);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagType, setTagType] = useState<'categories' | 'foodTypes' | 'allergens'>('categories');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const handleSave = () => {
    updateRecipe(recipe.id, editedRecipe);
    setIsEditing(false);
    Alert.alert('Success', 'Recipe updated successfully!');
  };

  const handleCancel = () => {
    setEditedRecipe(recipe);
    setIsEditing(false);
  };

  const updateField = (field: keyof Recipe, value: string | string[]) => {
    setEditedRecipe(prev => ({ ...prev, [field]: value }));
  };

  const updateIngredient = (ingredientId: string, field: 'amount' | 'unit' | 'name', value: string) => {
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(ingredient =>
        ingredient.id === ingredientId
          ? { ...ingredient, [field]: value }
          : ingredient
      )
    }));
  };

  const addIngredient = () => {
    const newIngredient = {
      id: Date.now().toString(),
      name: '',
      amount: '',
      unit: 'g'
    };
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
  };

  const removeIngredient = (ingredientId: string) => {
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ingredient => ingredient.id !== ingredientId)
    }));
  };

  const handleAddImage = () => {
    // TODO: Implementovat přidání obrázku
    Alert.alert('Add Image', 'Image selection functionality will be implemented later');
  };

  const handlePrint = () => {
    // TODO: Implementovat tisk receptu
    Alert.alert('Print Recipe', 'Print functionality will be implemented later');
  };

  const addTag = (type: 'categories' | 'foodTypes' | 'allergens') => {
    setTagType(type);
    const currentTags = editedRecipe[type] as string[];
    const available = tagsDatabase[type].filter(tag => !currentTags.includes(tag));
    setAvailableTags(available);
    setShowTagModal(true);
  };

  const removeTag = (type: 'categories' | 'foodTypes' | 'allergens', index: number) => {
    const currentTags = [...editedRecipe[type] as string[]];
    currentTags.splice(index, 1);
    updateField(type, currentTags);
  };

  const selectTag = (tag: string) => {
    const currentTags = [...editedRecipe[tagType] as string[]];
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      updateField(tagType, currentTags);
    }
    setShowTagModal(false);
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
        <Text style={styles.headerTitle}>{editedRecipe.name}</Text>
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
        {/* Recipe Image */}
        <View style={styles.imageContainer}>
          {editedRecipe.image && editedRecipe.image !== 'https://via.placeholder.com/150' ? (
            <Image source={{ uri: editedRecipe.image }} style={styles.image} />
          ) : (
            <TouchableOpacity style={styles.imagePlaceholder} onPress={handleAddImage}>
              <Text style={styles.addImageIcon}>📷</Text>
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nutrition Info */}
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedRecipe.calories}
                  onChangeText={(text) => updateField('calories', text)}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedRecipe.calories}</Text>
              )}
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protein</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedRecipe.protein}
                  onChangeText={(text) => updateField('protein', text)}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedRecipe.protein}g</Text>
              )}
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Carbs</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedRecipe.carbs}
                  onChangeText={(text) => updateField('carbs', text)}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedRecipe.carbs}g</Text>
              )}
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fat</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedRecipe.fat}
                  onChangeText={(text) => updateField('fat', text)}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedRecipe.fat}g</Text>
              )}
            </View>
          </View>
        </View>

        {/* Time Info */}
        <View style={styles.timeCard}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Prep Time</Text>
            {isEditing ? (
              <TextInput
                style={styles.timeInput}
                value={editedRecipe.prepTime}
                onChangeText={(text) => updateField('prepTime', text)}
                keyboardType="numeric"
                placeholder="0"
              />
            ) : (
              <Text style={styles.timeValue}>{editedRecipe.prepTime} min</Text>
            )}
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Cook Time</Text>
            {isEditing ? (
              <TextInput
                style={styles.timeInput}
                value={editedRecipe.cookTime}
                onChangeText={(text) => updateField('cookTime', text)}
                keyboardType="numeric"
                placeholder="0"
              />
            ) : (
              <Text style={styles.timeValue}>{editedRecipe.cookTime} min</Text>
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {isEditing && (
              <TouchableOpacity style={styles.addTagButton} onPress={() => addTag('categories')}>
                <Text style={styles.addTagText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.tagsContainer}>
            {editedRecipe.categories.map((category, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{category}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => removeTag('categories', index)}>
                    <Text style={styles.removeTagText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Food Types */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Food Types</Text>
            {isEditing && (
              <TouchableOpacity style={styles.addTagButton} onPress={() => addTag('foodTypes')}>
                <Text style={styles.addTagText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.tagsContainer}>
            {editedRecipe.foodTypes.map((type, index) => (
              <View key={index} style={[styles.tag, styles.typeTag]}>
                <Text style={[styles.tagText, styles.typeTagText]}>{type}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => removeTag('foodTypes', index)}>
                    <Text style={styles.removeTagText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Allergens */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Allergens</Text>
            {isEditing && (
              <TouchableOpacity style={styles.addTagButton} onPress={() => addTag('allergens')}>
                <Text style={styles.addTagText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.tagsContainer}>
            {editedRecipe.allergens.map((allergen, index) => (
              <View key={index} style={[styles.tag, styles.allergenTag]}>
                <Text style={[styles.tagText, styles.allergenTagText]}>{allergen}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => removeTag('allergens', index)}>
                    <Text style={styles.removeTagText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {isEditing && (
              <TouchableOpacity style={styles.addIngredientButton} onPress={addIngredient}>
                <Text style={styles.addIngredientText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          {editedRecipe.ingredients.map((ingredient, index) => (
            <View key={ingredient.id} style={styles.ingredientItem}>
              {isEditing ? (
                <View style={styles.ingredientEditRow}>
                  <TextInput
                    style={[styles.ingredientInput, styles.ingredientNameInput]}
                    value={ingredient.name}
                    onChangeText={(text) => updateIngredient(ingredient.id, 'name', text)}
                    placeholder="Ingredient name"
                  />
                  <TextInput
                    style={[styles.ingredientInput, styles.ingredientAmountInput]}
                    value={ingredient.amount}
                    onChangeText={(text) => updateIngredient(ingredient.id, 'amount', text)}
                    placeholder="Amount"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.ingredientInput, styles.ingredientUnitInput]}
                    value={ingredient.unit}
                    onChangeText={(text) => updateIngredient(ingredient.id, 'unit', text)}
                    placeholder="Unit"
                  />
                  <TouchableOpacity 
                    style={styles.removeIngredientButton}
                    onPress={() => removeIngredient(ingredient.id)}
                  >
                    <Text style={styles.removeIngredientText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ingredientDisplayRow}>
                  <Text style={styles.ingredientText}>{ingredient.name}</Text>
                  <View style={styles.ingredientAmountContainer}>
                    <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
                    <Text style={styles.ingredientUnit}>{ingredient.unit}</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {isEditing ? (
            <TextInput
              style={styles.instructionsInput}
              value={editedRecipe.instructions}
              onChangeText={(text) => updateField('instructions', text)}
              placeholder="Enter cooking instructions..."
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={styles.instructionsText}>{editedRecipe.instructions}</Text>
          )}
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

      {/* Tag Selection Modal */}
      <Modal
        visible={showTagModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowTagModal(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Add {tagType}</Text>
            
            <ScrollView style={styles.tagList}>
              {availableTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tagOption}
                  onPress={() => selectTag(tag)}
                >
                  <Text style={styles.tagOptionText}>{tag}</Text>
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
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
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
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB347',
  },
  nutritionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    minWidth: 50,
  },
  timeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    minWidth: 60,
  },
  addIngredientButton: {
    backgroundColor: '#FFB347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addIngredientText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addTagButton: {
    backgroundColor: '#FFB347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ingredientItem: {
    marginBottom: 8,
  },
  ingredientEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingredientDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB347',
  },
  ingredientInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  ingredientNameInput: {
    flex: 2,
  },
  ingredientAmountInput: {
    flex: 1,
    textAlign: 'center',
  },
  ingredientUnitInput: {
    flex: 1,
    textAlign: 'center',
  },
  removeIngredientButton: {
    backgroundColor: '#FF6B6B',
    padding: 8,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  removeIngredientText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ingredientText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  ingredientAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ingredientAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB347',
  },
  ingredientUnit: {
    fontSize: 14,
    color: '#666666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeTag: {
    backgroundColor: '#E3F2FD',
  },
  allergenTag: {
    backgroundColor: '#FFEBEE',
  },
  tagText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  typeTagText: {
    color: '#1565C0',
  },
  allergenTagText: {
    color: '#C62828',
  },
  removeTagText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: 'bold',
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  instructionsText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
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
  tagList: {
    maxHeight: 200,
  },
  tagOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tagOptionText: {
    fontSize: 16,
    color: '#333333',
  },
});

export default RecipeDetailScreen;