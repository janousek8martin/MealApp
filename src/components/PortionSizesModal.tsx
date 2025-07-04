// src/components/PortionSizesModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PortionSizesModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (portionSizes: { [key: string]: number }) => void;
}

interface MealData {
  name: string;
  isMainMeal: boolean;
  protein: number;
  carbs: number;
  fat: number;
  kcal: number;
  percentage: number;
  expanded: boolean;
}

export const PortionSizesModal: React.FC<PortionSizesModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave
}) => {
  const [mealData, setMealData] = useState<MealData[]>([]);
  const [dailyMacros, setDailyMacros] = useState({
    protein: 0,
    fat: 0,
    carbs: 0,
    proteinPercentage: 0,
    fatPercentage: 0,
    carbsPercentage: 0
  });

  // Calculate adjusted TDCI
  const adjustedTDCI = currentUser?.tdci?.adjustedTDCI || 2000;

  useEffect(() => {
    if (visible) {
      calculateDailyMacros();
      resetMealData();
    }
  }, [visible, currentUser]);

  // Functions from MacronutrientRatiosModal
  const calculateLBM = () => {
    const weight = parseFloat(currentUser?.weight) || 0;
    const bodyFat = parseFloat(currentUser?.bodyFat) || 0;
    return weight * (1 - bodyFat / 100);
  };

  const calculateProteinMultiplier = (bodyFat: number, gender: string) => {
    const thresholds = gender === 'Male' 
      ? [8, 12, 15, 20, 25, 30, 35]
      : [15, 20, 25, 30, 35, 40, 45];
    const multipliers = [3.55, 3.40, 3.25, 3.1, 2.95, 2.8, 2.65];
    
    for (let i = 0; i < thresholds.length; i++) {
      if (bodyFat <= thresholds[i]) {
        return multipliers[i];
      }
    }
    return multipliers[multipliers.length - 1];
  };

  const calculateFatPercentage = (bodyFat: number, gender: string) => {
    const maxBodyFat = gender === 'Male' ? 35 : 45;
    const minBodyFat = gender === 'Male' ? 8 : 15;
    const fatRange = maxBodyFat - minBodyFat;
    const userRange = bodyFat - minBodyFat;
    const fatPercentage = 20 + (userRange / fatRange) * 15;
    return Math.min(35, Math.max(20, fatPercentage));
  };

  const calculateDailyMacros = () => {
    const bodyFat = parseFloat(currentUser?.bodyFat) || 15;
    const gender = currentUser?.gender || 'Male';

    const lbm = calculateLBM();
    const proteinMultiplier = calculateProteinMultiplier(bodyFat, gender);
    const protein = Math.round(lbm * proteinMultiplier);
    const fatPercentage = Math.round(calculateFatPercentage(bodyFat, gender));
    const fat = Math.round((adjustedTDCI * fatPercentage / 100) / 9);
    
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const carbsCalories = adjustedTDCI - proteinCalories - fatCalories;
    const carbs = Math.round(carbsCalories / 4);

    const proteinPercentage = Math.round((proteinCalories / adjustedTDCI) * 100);
    const carbsPercentage = 100 - proteinPercentage - fatPercentage;

    setDailyMacros({
      protein,
      fat,
      carbs,
      proteinPercentage,
      fatPercentage,
      carbsPercentage
    });
  };

  const resetMealData = () => {
    // Get snack positions from current user
    const snackPositions = currentUser?.mealPreferences?.snackPositions || [];

    // Base meals
    const baseMeals = [
      { name: 'Breakfast', isMainMeal: true },
      { name: 'Lunch', isMainMeal: true },
      { name: 'Dinner', isMainMeal: true }
    ];

    // Add snacks based on selected positions
    const snackMeals = snackPositions.map((position: string) => ({
      name: position,
      isMainMeal: false
    }));

    const allMeals = [...baseMeals, ...snackMeals];
    
    // Calculate default percentage distribution
    const mealCount = allMeals.length;
    const defaultPercentage = Math.round((100 / mealCount) * 100) / 100; // Round to 2 decimal places
    
    const defaultMealData = allMeals.map((meal, index) => {
      // Adjust last meal to ensure total is 100%
      const percentage = index === allMeals.length - 1 
        ? 100 - (defaultPercentage * (mealCount - 1))
        : defaultPercentage;
      
      return calculateMealMacros(meal.name, meal.isMainMeal, percentage);
    });

    setMealData(defaultMealData);
  };

  const calculateMealMacros = (name: string, isMainMeal: boolean, percentage: number): MealData => {
    const calories = Math.round(adjustedTDCI * percentage / 100);
    const protein = Math.round((calories * dailyMacros.proteinPercentage / 100) / 4);
    const carbs = Math.round((calories * dailyMacros.carbsPercentage / 100) / 4);
    const fat = Math.round((calories * dailyMacros.fatPercentage / 100) / 9);
    
    return {
      name,
      isMainMeal,
      protein,
      carbs,
      fat,
      kcal: calories,
      percentage: Math.round(percentage),
      expanded: false
    };
  };

  const handlePercentageChange = (mealIndex: number, change: number) => {
    const newMealData = [...mealData];
    const currentPercentage = newMealData[mealIndex].percentage;
    const newPercentage = Math.max(1, Math.min(99, currentPercentage + change));
    
    // Recalculate macros for this meal
    newMealData[mealIndex] = calculateMealMacros(
      newMealData[mealIndex].name,
      newMealData[mealIndex].isMainMeal,
      newPercentage
    );
    newMealData[mealIndex].expanded = mealData[mealIndex].expanded;
    
    setMealData(newMealData);
  };

  const handleMacroChange = (mealIndex: number, macroType: 'protein' | 'fat', change: number) => {
    const newMealData = [...mealData];
    const meal = newMealData[mealIndex];
    
    if (macroType === 'protein') {
      meal.protein = Math.max(0, meal.protein + change);
    } else if (macroType === 'fat') {
      meal.fat = Math.max(0, meal.fat + change);
    }
    
    // Recalculate calories and carbs
    const proteinCalories = meal.protein * 4;
    const fatCalories = meal.fat * 9;
    const targetCalories = Math.round(adjustedTDCI * meal.percentage / 100);
    const carbsCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
    
    meal.carbs = Math.round(carbsCalories / 4);
    meal.kcal = proteinCalories + fatCalories + (meal.carbs * 4);
    
    setMealData(newMealData);
  };

  const toggleExpanded = (mealIndex: number) => {
    const newMealData = [...mealData];
    newMealData[mealIndex].expanded = !newMealData[mealIndex].expanded;
    setMealData(newMealData);
  };

  const formatMealName = (name: string) => {
    switch (name) {
      case 'Before Breakfast': return 'Pre-Breakfast Snack';
      case 'Between Breakfast and Lunch': return 'Mid-Morning Snack';
      case 'Between Lunch and Dinner': return 'Afternoon Snack';
      case 'After Dinner': return 'Evening Snack';
      default: return name;
    }
  };

  const saveMealData = () => {
    try {
      // Convert meal data to portion sizes format for saving
      const portionData: { [key: string]: number } = {};
      mealData.forEach(meal => {
        portionData[meal.name] = meal.percentage / 100; // Convert percentage to decimal
      });
      
      onSave(portionData);
      onClose();
    } catch (error) {
      console.error('Error saving meal data:', error);
    }
  };

  const resetToDefaults = () => {
    resetMealData();
  };

  const renderMealRow = (meal: MealData, index: number) => (
    <View key={index}>
      {/* Main row */}
      <View style={styles.mealRow}>
        <Text style={styles.mealNameCell}>{formatMealName(meal.name)}</Text>
        <Text style={styles.macroCell}>{meal.protein}</Text>
        <Text style={styles.macroCell}>{meal.carbs}</Text>
        <Text style={styles.macroCell}>{meal.fat}</Text>
        <Text style={styles.macroCell}>{meal.kcal}</Text>
        <Text style={styles.macroCell}>{meal.percentage}</Text>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => toggleExpanded(index)}
        >
          <Icon 
            name={meal.expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Expanded section */}
      {meal.expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.macroControlRow}>
            <Text style={styles.macroLabel}>Protein</Text>
            <View style={styles.controlContainer}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handleMacroChange(index, 'protein', -5)}
              >
                <Text style={styles.controlText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.controlValue}>{meal.protein}g</Text>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handleMacroChange(index, 'protein', 5)}
              >
                <Text style={styles.controlText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.macroControlRow}>
            <Text style={styles.macroLabel}>Fat</Text>
            <View style={styles.controlContainer}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handleMacroChange(index, 'fat', -2)}
              >
                <Text style={styles.controlText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.controlValue}>{meal.fat}g</Text>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handleMacroChange(index, 'fat', 2)}
              >
                <Text style={styles.controlText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.macroControlRow}>
            <Text style={styles.macroLabel}>Carbohydrates</Text>
            <Text style={styles.controlValue}>{meal.carbs}g</Text>
          </View>
          
          <View style={styles.macroControlRow}>
            <Text style={styles.macroLabel}>%TDCI</Text>
            <View style={styles.controlContainer}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handlePercentageChange(index, -1)}
              >
                <Text style={styles.controlText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.controlValue}>{meal.percentage}%</Text>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handlePercentageChange(index, 1)}
              >
                <Text style={styles.controlText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.title}>Portion Sizes</Text>
          <TouchableOpacity onPress={resetToDefaults}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Daily Overview */}
          <View style={styles.overviewSection}>
            <Text style={styles.tdciText}>Adjusted TDCI: {adjustedTDCI} kcal</Text>
            <Text style={styles.macroText}>
              Protein {dailyMacros.protein}g Fat {dailyMacros.fat}g Carbohydrates {dailyMacros.carbs}g
            </Text>
          </View>

          {/* Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Meals</Text>
              <Text style={styles.headerCell}>Protein</Text>
              <Text style={styles.headerCell}>Carbs</Text>
              <Text style={styles.headerCell}>Fat</Text>
              <Text style={styles.headerCell}>kcal</Text>
              <Text style={styles.headerCell}>%TDCI</Text>
              <Text style={styles.headerCell}></Text>
            </View>

            {/* Meal Rows */}
            {mealData.map((meal, index) => renderMealRow(meal, index))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={saveMealData}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB347',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  overviewSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  tdciText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  macroText: {
    fontSize: 14,
    color: '#666666',
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
  },
  mealRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  mealNameCell: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  macroCell: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  expandButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  macroControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroLabel: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  controlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 30,
    height: 30,
    backgroundColor: '#FFB347',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  controlText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  controlValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    minWidth: 50,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#FFB347',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});