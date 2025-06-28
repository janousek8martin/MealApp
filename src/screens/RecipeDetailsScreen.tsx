// src/screens/RecipeDetailsScreen.tsx
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Alert 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMealStore, foodCategories } from '../stores/mealStore';
import { Recipe, Ingredient } from '../types/meal';

interface RecipeDetailsScreenProps {
  route: {
    params: {
      recipeId: string;
    };
  };
  navigation: {
    goBack: () => void;
  };
}

export const RecipeDetailsScreen: React.FC<RecipeDetailsScreenProps> = ({ route, navigation }) => {
  const { recipeId } = route.params;
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  
  const { getRecipe, updateRecipe, deleteRecipe } = useMealStore();
  const recipe = getRecipe(recipeId);
  
  // Local state for editing
  const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(recipe || null);

  if (!recipe || !editedRecipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Recipe not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    if (editedRecipe) {
      updateRecipe(recipeId, editedRecipe);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedRecipe(recipe);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRecipe(recipeId);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const updateField = (field: keyof Recipe, value: any) => {
    setEditedRecipe(prev => prev ? { ...prev, [field]: value } : null);
  };

  const addIngredient = () => {
    if (editedRecipe) {
      const newIngredient: Ingredient = {
        id: Date.now().toString(),
        name: '',
        amount: 0,
        unit: ''
      };
      updateField('ingredients', [...editedRecipe.ingredients, newIngredient]);
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    if (editedRecipe) {
      const updatedIngredients = [...editedRecipe.ingredients];
      updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
      updateField('ingredients', updatedIngredients);
    }
  };

  const removeIngredient = (index: number) => {
    if (editedRecipe) {
      const updatedIngredients = editedRecipe.ingredients.filter((_, i) => i !== index);
      updateField('ingredients', updatedIngredients);
    }
  };

  const addInstruction = () => {
    if (editedRecipe) {
      updateField('instructions', [...editedRecipe.instructions, '']);
    }
  };

  const updateInstruction = (index: number, value: string) => {
    if (editedRecipe) {
      const updatedInstructions = [...editedRecipe.instructions];
      updatedInstructions[index] = value;
      updateField('instructions', updatedInstructions);
    }
  };

  const removeInstruction = (index: number) => {
    if (editedRecipe) {
      const updatedInstructions = editedRecipe.instructions.filter((_, i) => i !== index);
      updateField('instructions', updatedInstructions);
    }
  };

  const toggleCategory = (category: string) => {
    if (editedRecipe) {
      const categories = editedRecipe.categories.includes(category)
        ? editedRecipe.categories.filter(c => c !== category)
        : [...editedRecipe.categories, category];
      updateField('categories', categories);
    }
  };

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Recipe' : 'Recipe Details'}
        </Text>
        
        <View style={styles.headerButtons}>
          {isEditing ? (
            <>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recipe Image */}
        <Image
          source={{ uri: editedRecipe.image || 'https://via.placeholder.com/400x200/E0E0E0/999999?text=No+Image' }}
          style={styles.recipeImage}
          resizeMode="cover"
        />

        {/* Basic Info */}
        <View style={styles.section}>
          {isEditing ? (
            <TextInput
              style={styles.titleInput}
              value={editedRecipe.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Recipe name"
              multiline
            />
          ) : (
            <Text style={styles.title}>{editedRecipe.name}</Text>
          )}

          {isEditing ? (
            <TextInput
              style={styles.descriptionInput}
              value={editedRecipe.description || ''}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Recipe description"
              multiline
            />
          ) : (
            editedRecipe.description && (
              <Text style={styles.description}>{editedRecipe.description}</Text>
            )
          )}
        </View>

        {/* Time and Servings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Prep Time</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={editedRecipe.prepTime?.toString() || '0'}
                  onChangeText={(text) => updateField('prepTime', parseInt(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.detailValue}>{editedRecipe.prepTime || 0} min</Text>
              )}
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cook Time</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={editedRecipe.cookTime?.toString() || '0'}
                  onChangeText={(text) => updateField('cookTime', parseInt(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.detailValue}>{editedRecipe.cookTime || 0} min</Text>
              )}
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Servings</Text>
              {isEditing ? (
                <TextInput
                  style={styles.detailInput}
                  value={editedRecipe.servings?.toString() || '1'}
                  onChangeText={(text) => updateField('servings', parseInt(text) || 1)}
                  keyboardType="numeric"
                  placeholder="1"
                />
              ) : (
                <Text style={styles.detailValue}>{editedRecipe.servings || 1}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {isEditing ? (
            <View style={styles.categoriesContainer}>
              {foodCategories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    editedRecipe.categories.includes(category) && styles.categoryChipSelected
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    editedRecipe.categories.includes(category) && styles.categoryChipTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.categoriesContainer}>
              {editedRecipe.categories.map((category, index) => (
                <View key={index} style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{category}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {isEditing && (
              <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {editedRecipe.ingredients.map((ingredient, index) => (
            <View key={ingredient.id} style={styles.ingredientRow}>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.ingredientInput, styles.ingredientAmount]}
                    value={ingredient.amount.toString()}
                    onChangeText={(text) => updateIngredient(index, 'amount', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TextInput
                    style={[styles.ingredientInput, styles.ingredientUnit]}
                    value={ingredient.unit}
                    onChangeText={(text) => updateIngredient(index, 'unit', text)}
                    placeholder="unit"
                  />
                  <TextInput
                    style={[styles.ingredientInput, styles.ingredientName]}
                    value={ingredient.name}
                    onChangeText={(text) => updateIngredient(index, 'name', text)}
                    placeholder="ingredient name"
                  />
                  <TouchableOpacity onPress={() => removeIngredient(index)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.ingredientText}>
                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {isEditing && (
              <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {editedRecipe.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <Text style={styles.instructionNumber}>{index + 1}.</Text>
              {isEditing ? (
                <View style={styles.instructionEditContainer}>
                  <TextInput
                    style={styles.instructionInput}
                    value={instruction}
                    onChangeText={(text) => updateInstruction(index, text)}
                    placeholder="Enter instruction"
                    multiline
                  />
                  <TouchableOpacity onPress={() => removeInstruction(index)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.instructionText}>{instruction}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Nutrition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              <Text style={styles.nutritionValue}>{editedRecipe.nutrition.calories}</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protein</Text>
              <Text style={styles.nutritionValue}>{editedRecipe.nutrition.protein}g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Carbs</Text>
              <Text style={styles.nutritionValue}>{editedRecipe.nutrition.carbs}g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fat</Text>
              <Text style={styles.nutritionValue}>{editedRecipe.nutrition.fat}g</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#FFB347',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 16,
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
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginVertical: 5,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#666666',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  detailInput: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    minWidth: 60,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#FFE4B5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#FFB347',
    fontWeight: '600',
  },
  categoryChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipSelected: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#FFB347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  ingredientInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  ingredientAmount: {
    width: 60,
    textAlign: 'center',
  },
  ingredientUnit: {
    width: 80,
  },
  ingredientName: {
    flex: 1,
  },
  removeButton: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB347',
    marginRight: 12,
    marginTop: 2,
    minWidth: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
    lineHeight: 22,
  },
  instructionEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  instructionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 50,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 50,
  },
});