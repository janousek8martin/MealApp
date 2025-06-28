// src/components/RecipeCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Recipe } from '../stores/recipeStore';

interface RecipeCardProps {
  recipe: Recipe;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isSelected,
  onPress,
  onLongPress
}) => {
  const hasValidImage = recipe.image && recipe.image !== 'https://via.placeholder.com/150';

  return (
    <TouchableOpacity 
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {hasValidImage && (
        <Image source={{ uri: recipe.image }} style={styles.image} />
      )}
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{recipe.name}</Text>
        
        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.calories}</Text>
            <Text style={styles.nutritionLabel}>kcal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.protein}g</Text>
            <Text style={styles.nutritionLabel}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.carbs}g</Text>
            <Text style={styles.nutritionLabel}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.fat}g</Text>
            <Text style={styles.nutritionLabel}>fat</Text>
          </View>
        </View>
        
        <View style={styles.tagsContainer}>
          {recipe.categories.slice(0, 2).map((category, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{category}</Text>
            </View>
          ))}
          {recipe.foodTypes.slice(0, 1).map((type, index) => (
            <View key={`type-${index}`} style={[styles.tag, styles.typeTag]}>
              <Text style={[styles.tagText, styles.typeTagText]}>{type}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 15,
    marginVertical: 6,
    overflow: 'hidden',
  },
  selectedContainer: {
    backgroundColor: '#FFE4B5',
    borderColor: '#FFB347',
    borderWidth: 2,
  },
  image: {
    width: '100%',
    height: 100,
    backgroundColor: '#F0F0F0',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFB347',
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#666666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeTag: {
    backgroundColor: '#E3F2FD',
  },
  tagText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '500',
  },
  typeTagText: {
    color: '#1565C0',
  },
});