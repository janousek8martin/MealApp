// src/components/UnifiedFoodCard.tsx
// 🎴 Universal food card component that adapts to different data sources

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet 
} from 'react-native';
import { UnifiedFoodItem } from '../types/UnifiedFood';
import { OpenFoodFactsService } from '../services/OpenFoodFactsService';

interface UnifiedFoodCardProps {
  item: UnifiedFoodItem;
  onPress: () => void;
  onAddToMealPlan: () => void;
  showSource?: boolean;
}

export const UnifiedFoodCard: React.FC<UnifiedFoodCardProps> = ({ 
  item, 
  onPress, 
  onAddToMealPlan,
  showSource = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get appropriate image URLs based on source
  const getImageUrls = (): string[] => {
    if (item.source === 'openfoodfacts' && item.openFoodFactsData?.barcode) {
      return OpenFoodFactsService.getImageURL(item.openFoodFactsData.barcode, 'front');
    } else if (item.metadata?.image) { // ← FIXED: Safe access
      return [item.metadata.image, getDefaultImage()];
    } else {
      return [getDefaultImage()];
    }
  };

  const getDefaultImage = (): string => {
    const sourceEmojis = {
      'usda': '🥕',
      'openfoodfacts': '📦',
      'user': '👤'
    };
    const emoji = sourceEmojis[item.source as keyof typeof sourceEmojis] || '🍽️';
    return `https://via.placeholder.com/200x200/4ECDC4/FFFFFF?text=${emoji}`;
  };

  const imageUrls = getImageUrls();

  const handleImageError = () => {
    if (currentImageIndex < imageUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      setImageError(true);
    }
  };

  const getSourceColor = (): string => {
    const colors = {
      'usda': '#22C55E',        // Green for USDA
      'openfoodfacts': '#FF6B35', // Orange for OpenFoodFacts
      'user': '#8B5CF6'         // Purple for user uploads
    };
    return colors[item.source as keyof typeof colors] || '#6B7280';
  };

  const getSourceLabel = (): string => {
    const labels = {
      'usda': 'USDA',
      'openfoodfacts': 'OpenFoodFacts',
      'user': 'User Added'
    };
    return labels[item.source as keyof typeof labels] || item.source.toUpperCase();
  };

  const getTypeIcon = (): string => {
    return item.type === 'ingredient' ? '🥕' : '🍽️';
  };

  const getNutriScoreColor = (score?: string): string => {
    if (!score) return '#E0E0E0';
    const colors = { 
      'A': '#008450', 'B': '#85BB2F', 'C': '#FFBA08', 
      'D': '#FF6500', 'E': '#E31E24' 
    };
    return colors[score as keyof typeof colors] || '#E0E0E0';
  };

  const getNovaColor = (level?: number): string => {
    if (!level) return '#E0E0E0';
    const colors = { 1: '#22C55E', 2: '#F59E0B', 3: '#EF4444', 4: '#DC2626' };
    return colors[level as keyof typeof colors] || '#E0E0E0';
  };

  const formatNutrition = (value: number): string => {
    return value < 1 ? value.toFixed(1) : Math.round(value).toString();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {!imageError ? (
            <Image
              source={{ uri: imageUrls[currentImageIndex] }}
              style={styles.image}
              onError={handleImageError}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>{getTypeIcon()}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {item.name}
            </Text>
            {showSource && (
              <View style={[styles.sourceBadge, { backgroundColor: getSourceColor() }]}>
                <Text style={styles.sourceText}>{getSourceLabel()}</Text>
              </View>
            )}
          </View>

          {item.metadata?.description && ( // ← FIXED: Safe access
            <Text style={styles.description} numberOfLines={1}>
              {item.metadata.description}
            </Text>
          )}

          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {formatNutrition(item.nutrition.calories)}
              </Text>
              <Text style={styles.nutritionLabel}>cal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {formatNutrition(item.nutrition.protein)}g
              </Text>
              <Text style={styles.nutritionLabel}>protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {formatNutrition(item.nutrition.carbohydrates)}g
              </Text>
              <Text style={styles.nutritionLabel}>carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>
                {formatNutrition(item.nutrition.fat)}g
              </Text>
              <Text style={styles.nutritionLabel}>fat</Text>
            </View>
          </View>
        </View>
      </View>

      {/* OpenFoodFacts specific indicators */}
      {item.openFoodFactsData && (
        <View style={styles.indicators}>
          {item.openFoodFactsData.nutriScore && (
            <View style={[
              styles.indicator, 
              { backgroundColor: getNutriScoreColor(item.openFoodFactsData.nutriScore) }
            ]}>
              <Text style={styles.indicatorText}>
                Nutri-Score {item.openFoodFactsData.nutriScore}
              </Text>
            </View>
          )}
          
          {item.openFoodFactsData.novaGroup && (
            <View style={[
              styles.indicator, 
              { backgroundColor: getNovaColor(item.openFoodFactsData.novaGroup) }
            ]}>
              <Text style={styles.indicatorText}>
                NOVA {item.openFoodFactsData.novaGroup}
              </Text>
            </View>
          )}

          {item.openFoodFactsData?.ingredientAnalysis?.includes('en:vegetarian') && ( // ← FIXED: Safe access
            <View style={[styles.indicator, { backgroundColor: '#22C55E' }]}>
              <Text style={styles.indicatorText}>🌱 Vegetarian</Text>
            </View>
          )}

          {item.openFoodFactsData?.ingredientAnalysis?.includes('en:vegan') && ( // ← FIXED: Safe access
            <View style={[styles.indicator, { backgroundColor: '#16A34A' }]}>
              <Text style={styles.indicatorText}>🌿 Vegan</Text>
            </View>
          )}
        </View>
      )}

      {/* USDA specific indicators */}
      {item.usdaData && (
        <View style={styles.indicators}>
          {item.usdaData.category && (
            <View style={[styles.indicator, { backgroundColor: '#22C55E' }]}>
              <Text style={styles.indicatorText}>
                {item.usdaData.category}
              </Text>
            </View>
          )}
          
          {item.usdaData.dataType && (
            <View style={[styles.indicator, { backgroundColor: '#6B7280' }]}>
              <Text style={styles.indicatorText}>
                {item.usdaData.dataType}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={onAddToMealPlan}
        >
          <Text style={styles.addButtonText}>Add to Meal Plan</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  indicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  indicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});