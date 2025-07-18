// src/components/MealDetailModal.tsx
// 🔧 NOVÝ: Floating modal pro detaily receptu

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Dimensions 
} from 'react-native';
import { Meal } from '../types/meal';
import { Recipe, Food, useRecipeStore } from '../stores/recipeStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MealDetailModalProps {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  visible,
  meal,
  onClose
}) => {
  const [recipeData, setRecipeData] = useState<Recipe | Food | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const recipes = useRecipeStore(state => state.recipes);
  const foods = useRecipeStore(state => state.foods);

  // Načtení dat receptu/food při otevření modalu
  useEffect(() => {
    if (visible && meal) {
      setIsLoading(true);
      
      // Najdi recept nebo food v databázi podle názvu
      const foundRecipe = recipes.find(r => r.name === meal.name);
      const foundFood = foods.find(f => f.name === meal.name);
      
      if (foundRecipe) {
        setRecipeData(foundRecipe);
      } else if (foundFood) {
        setRecipeData(foundFood);
      } else {
        // Fallback pro generované jídla
        setRecipeData({
          id: meal.id,
          name: meal.name,
          calories: meal.calories?.toString() || '0',
          protein: meal.protein?.toString() || '0',
          carbs: meal.carbs?.toString() || '0',
          fat: meal.fat?.toString() || '0',
        } as Food);
      }
      
      setIsLoading(false);
    }
  }, [visible, meal, recipes, foods]);

  const handleClose = () => {
    setRecipeData(null);
    onClose();
  };

  const isRecipe = (item: Recipe | Food): item is Recipe => {
    return 'ingredients' in item && 'instructions' in item;
  };

  if (!visible || !meal) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {meal.name}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : recipeData ? (
              <>
                {/* Image placeholder */}
                <View style={styles.imagePlaceholder}>
                  {recipeData.image ? (
                    <Image 
                      source={{ uri: recipeData.image }} 
                      style={styles.recipeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.imagePlaceholderText}>🍽️</Text>
                  )}
                </View>

                {/* Nutrition info */}
                <View style={styles.nutritionCard}>
                  <Text style={styles.sectionTitle}>Nutrition Information</Text>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                      <Text style={styles.nutritionValue}>{recipeData.calories}</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                      <Text style={styles.nutritionValue}>{recipeData.protein}g</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Carbs</Text>
                      <Text style={styles.nutritionValue}>{recipeData.carbs}g</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>Fat</Text>
                      <Text style={styles.nutritionValue}>{recipeData.fat}g</Text>
                    </View>
                  </View>
                </View>

                {/* Recipe specific info */}
                {isRecipe(recipeData) && (
                  <>
                    {/* Prep/Cook time */}
                    <View style={styles.timeCard}>
                      <Text style={styles.sectionTitle}>Timing</Text>
                      <View style={styles.timeRow}>
                        <View style={styles.timeItem}>
                          <Text style={styles.timeLabel}>Prep Time</Text>
                          <Text style={styles.timeValue}>{recipeData.prepTime}</Text>
                        </View>
                        <View style={styles.timeItem}>
                          <Text style={styles.timeLabel}>Cook Time</Text>
                          <Text style={styles.timeValue}>{recipeData.cookTime}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Ingredients */}
                    {recipeData.ingredients && recipeData.ingredients.length > 0 && (
                      <View style={styles.ingredientsCard}>
                        <Text style={styles.sectionTitle}>Ingredients</Text>
                        {recipeData.ingredients.map((ingredient, index) => (
                          <View key={ingredient.id} style={styles.ingredientItem}>
                            <Text style={styles.ingredientText}>
                              • {ingredient.amount} {ingredient.unit} {ingredient.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Instructions */}
                    {recipeData.instructions && (
                      <View style={styles.instructionsCard}>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                        <Text style={styles.instructionsText}>
                          {recipeData.instructions}
                        </Text>
                      </View>
                    )}

                    {/* Categories */}
                    {recipeData.categories && recipeData.categories.length > 0 && (
                      <View style={styles.categoriesCard}>
                        <Text style={styles.sectionTitle}>Categories</Text>
                        <View style={styles.categoriesRow}>
                          {recipeData.categories.map((category, index) => (
                            <View key={index} style={styles.categoryTag}>
                              <Text style={styles.categoryText}>{category}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                )}

                {/* Food specific info */}
                {!isRecipe(recipeData) && (
                  <View style={styles.foodInfoCard}>
                    <Text style={styles.sectionTitle}>Food Information</Text>
                    <Text style={styles.foodDescription}>
                      This is a simple food item. Nutrition information is displayed above.
                    </Text>
                    {recipeData.category && (
                      <View style={styles.foodCategoryRow}>
                        <Text style={styles.foodCategoryLabel}>Category:</Text>
                        <Text style={styles.foodCategoryValue}>{recipeData.category}</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No recipe data found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#495057',
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  
  // Image
  imagePlaceholder: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePlaceholderText: {
    fontSize: 48,
    opacity: 0.3,
  },
  
  // Cards
  nutritionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timeCard: {
    backgroundColor: '#fff3f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ingredientsCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsCard: {
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  categoriesCard: {
    backgroundColor: '#fef9e7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  foodInfoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  
  // Section titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  
  // Nutrition grid
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#495057',
  },
  
  // Time info
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  
  // Ingredients
  ingredientItem: {
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  
  // Instructions
  instructionsText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
  },
  
  // Categories
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#FFB347',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Food info
  foodDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 12,
  },
  foodCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodCategoryLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginRight: 8,
  },
  foodCategoryValue: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
  },
});