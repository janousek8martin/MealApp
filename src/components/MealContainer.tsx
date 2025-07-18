// src/components/MealContainer.tsx
// 🔧 KOMPLETNÍ: Expandable kontejner pro jedno jídlo s Remove snack a Delete buttons

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Meal } from '../types/meal';

interface MealContainerProps {
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  meal: Meal | null;
  onViewDetails: (meal: Meal) => void;
  onRemoveSnack?: () => void; // 🔧 NOVÉ: Callback pro odstranění snack kontejneru
  onDeleteMeal?: () => void;   // 🔧 NOVÉ: Callback pro odstranění konkrétního jídla
  refreshKey?: number;
}

export const MealContainer: React.FC<MealContainerProps> = ({
  mealType,
  meal,
  onViewDetails,
  onRemoveSnack,
  onDeleteMeal,
  refreshKey
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMealIcon = () => {
    switch (mealType) {
      case 'Breakfast': return '🥐';
      case 'Lunch': return '🥗';
      case 'Dinner': return '🍽️';
      case 'Snack': return '🍎';
      default: return '🍽️';
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleViewDetails = () => {
    if (meal) {
      onViewDetails(meal);
    }
  };

  const handleRemoveSnack = () => {
    if (onRemoveSnack) {
      onRemoveSnack();
    }
  };

  const handleDeleteMeal = () => {
    if (onDeleteMeal) {
      onDeleteMeal();
    }
  };

  return (
    <View style={styles.mealContainer}>
      {/* Header - vždy viditelný */}
      <View style={styles.mealContainerHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.mealIcon}>{getMealIcon()}</Text>
          <Text style={styles.mealType}>{mealType}</Text>
        </View>
        
        <View style={styles.headerRight}>
          {/* Název jídla v collapsed stavu */}
          {!isExpanded && meal && (
            <Text style={styles.collapsedMealName}>{meal.name}</Text>
          )}
          
          {/* 🔧 NOVÉ: Remove snack button - pouze pro snacky v expanded stavu */}
          {isExpanded && mealType === 'Snack' && onRemoveSnack && (
            <TouchableOpacity
              style={styles.removeSnackButton}
              onPress={handleRemoveSnack}
            >
              <Text style={styles.removeSnackButtonText}>Remove snack</Text>
            </TouchableOpacity>
          )}
          
          {/* Add/Collapse button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              !meal && styles.addButton,
              meal && isExpanded && styles.collapseButton,
              meal && !isExpanded && styles.expandButton
            ]}
            onPress={toggleExpanded}
          >
            <Text style={styles.actionButtonText}>
              {!meal ? '+' : isExpanded ? '–' : '+'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.mealContent}>
          {meal ? (
            <>
              {/* Název jídla a buttons row */}
              <View style={styles.mealNameRow}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <View style={styles.mealButtons}>
                  {/* View button */}
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={handleViewDetails}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                  
                  {/* 🔧 NOVÉ: Delete button - vpravo od View button */}
                  {onDeleteMeal && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={handleDeleteMeal}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Placeholder pro fotku */}
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>📷</Text>
              </View>

              {/* Nutrition info */}
              <View style={styles.mealNutrition}>
                <Text style={styles.nutritionText}>
                  Calories: {meal.calories || '--'} | 
                  Protein: {meal.protein || '--'}g | 
                  Carbs: {meal.carbs || '--'}g | 
                  Fat: {meal.fat || '--'}g
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyMealContent}>
              <Text style={styles.emptyMealText}>No {mealType.toLowerCase()} planned</Text>
              <Text style={styles.emptyMealSubtext}>Use Generate button to create meal plan</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mealContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB347',
  },
  mealContainerHeader: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapsedMealName: {
    fontSize: 14,
    color: '#6c757d',
    marginRight: 8,
    maxWidth: 120,
  },
  // 🔧 NOVÉ: Styly pro Remove snack button
  removeSnackButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  removeSnackButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#FFB347',
  },
  expandButton: {
    backgroundColor: '#FFB347',
  },
  collapseButton: {
    backgroundColor: '#FFB347',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealContent: {
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  mealNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
    marginRight: 12,
  },
  // 🔧 UPRAVENO: Container pro buttons
  mealButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    backgroundColor: '#FFB347',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // 🔧 NOVÉ: Styly pro Delete button
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  imagePlaceholderText: {
    fontSize: 32,
    color: '#6c757d',
  },
  mealNutrition: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  nutritionText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  emptyMealContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyMealText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
  },
  emptyMealSubtext: {
    fontSize: 12,
    color: '#adb5bd',
    textAlign: 'center',
  },
});