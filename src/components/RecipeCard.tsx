// src/components/RecipeCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Recipe } from '../types/meal';

const windowWidth = Dimensions.get('window').width;
const cardWidth = (windowWidth - 45) / 2; // 15px margin each side + 15px gap between cards

interface RecipeCardProps {
  recipe: Recipe;
  isSelected?: boolean;
  selectionMode?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isSelected = false,
  selectionMode = false,
  onPress,
  onLongPress
}) => {
  const formatTime = (prepTime?: number, cookTime?: number) => {
    const total = (prepTime || 0) + (cookTime || 0);
    if (total === 0) return '';
    return `${total} min`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        selectionMode && !isSelected && styles.unselectedInSelectionMode
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.8}
    >
      {/* Recipe Image */}
      <Image
        source={{ uri: recipe.image || 'https://via.placeholder.com/150x100/E0E0E0/999999?text=No+Image' }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {/* Selection Indicator */}
      {selectionMode && (
        <View style={[styles.selectionIndicator, isSelected && styles.selectedIndicator]}>
          {isSelected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      )}
      
      {/* Recipe Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.recipeName} numberOfLines={2}>
          {recipe.name}
        </Text>
        
        {recipe.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}
        
        <View style={styles.metaContainer}>
          {/* Time */}
          {formatTime(recipe.prepTime, recipe.cookTime) && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>
                {formatTime(recipe.prepTime, recipe.cookTime)}
              </Text>
            </View>
          )}
          
          {/* Servings */}
          {recipe.servings && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>👥</Text>
              <Text style={styles.metaText}>{recipe.servings}</Text>
            </View>
          )}
        </View>
        
        {/* Categories */}
        {recipe.categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {recipe.categories.slice(0, 2).map((category, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ))}
            {recipe.categories.length > 2 && (
              <Text style={styles.moreCategoriesText}>+{recipe.categories.length - 2}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
    overflow: 'hidden',
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: '#FFB347',
    backgroundColor: '#FFF8F0',
  },
  unselectedInSelectionMode: {
    opacity: 0.7,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 12,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: '#FFE4B5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 10,
    color: '#FFB347',
    fontWeight: '600',
  },
  moreCategoriesText: {
    fontSize: 10,
    color: '#999999',
    fontWeight: '500',
  },
});