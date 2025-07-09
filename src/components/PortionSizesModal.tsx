// src/components/PortionSizesModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../stores/userStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [selectedSnackPercentage, setSelectedSnackPercentage] = useState<number | null>(null);
  const [userModifiedMeals, setUserModifiedMeals] = useState<Set<string>>(new Set());

  // Get user from store if currentUser is not provided
  const selectedUser = useUserStore(state => state.selectedUser);
  const user = currentUser || selectedUser;

  // Calculate adjusted TDCI
  const adjustedTDCI = user?.tdci?.adjustedTDCI || 2000;

  useEffect(() => {
    if (visible) {
      calculateDailyMacros();
      setTimeout(() => {
        loadMealData();
      }, 100);
    }
  }, [visible, user]);

  // Load meal data from storage
  const loadMealData = async () => {
    try {
      const savedMealData = await AsyncStorage.getItem(`mealData_${user?.id}`);
      if (savedMealData) {
        const parsedMealData = JSON.parse(savedMealData);
        // Update with current user's snack positions
        updateSnacksInData(parsedMealData);
      } else {
        resetMealData();
      }
    } catch (error) {
      console.error('Error loading meal data:', error);
      resetMealData();
    }
  };

  // Save meal data to storage
  const saveMealDataToStorage = async (data: MealData[]) => {
    try {
      await AsyncStorage.setItem(`mealData_${user?.id}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving meal data:', error);
    }
  };

  // Update snacks based on current user preferences
  const updateSnacksInData = (currentMealData: MealData[]) => {
    const snackPositions = user?.mealPreferences?.snackPositions || [];
    const mainMeals = currentMealData.filter(meal => ['Breakfast', 'Lunch', 'Dinner'].includes(meal.name));
    let newMealData = [...mainMeals];

    // Add snacks based on selected positions
    snackPositions.forEach((position: string) => {
      const existingSnack = currentMealData.find(meal => meal.name === position);
      if (existingSnack) {
        newMealData.push(existingSnack);
      } else {
        // Create new snack with default percentage
        const snackPercentage = calculateDefaultSnackPercentage(snackPositions.length);
        newMealData.push(calculateMealMacros(position, false, snackPercentage));
      }
    });

    // Sort according to meal order
    const mealOrder = [
      'Before Breakfast',
      'Breakfast', 
      'Between Breakfast and Lunch',
      'Lunch',
      'Between Lunch and Dinner', 
      'Dinner',
      'After Dinner'
    ];

    newMealData.sort((a, b) => {
      const indexA = mealOrder.indexOf(a.name);
      const indexB = mealOrder.indexOf(b.name);
      return indexA - indexB;
    });

    setMealData(newMealData);
  };

  const calculateDefaultSnackPercentage = (snackCount: number) => {
    if (snackCount === 1) return 25;
    if (snackCount === 2) return 12;
    if (snackCount === 3) return 8;
    return 10;
  };

  // Functions from MacronutrientRatiosModal
  const calculateLBM = () => {
    const weight = parseFloat(user?.weight) || 0;
    const bodyFat = parseFloat(user?.bodyFat) || 0;
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
    const bodyFat = parseFloat(user?.bodyFat) || 15;
    const gender = user?.gender || 'Male';

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
    const snackPositions = user?.mealPreferences?.snackPositions || [];

    // Define meal order for proper sorting
    const mealOrder = [
      'Before Breakfast',
      'Breakfast', 
      'Between Breakfast and Lunch',
      'Lunch',
      'Between Lunch and Dinner', 
      'Dinner',
      'After Dinner'
    ];

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
    
    // Sort meals according to daily order
    allMeals.sort((a, b) => {
      const indexA = mealOrder.indexOf(a.name);
      const indexB = mealOrder.indexOf(b.name);
      return indexA - indexB;
    });
    
    // Calculate default percentage distribution
    const snackCount = snackMeals.length;
    const totalSnackPercentage = snackCount * 10; // Each snack gets 10%
    const remainingPercentage = 100 - totalSnackPercentage;
    const mainMealPercentage = remainingPercentage / 3; // Split among 3 main meals
    
    const defaultMealData = allMeals.map((meal) => {
      const percentage = meal.isMainMeal ? mainMealPercentage : 10;
      return calculateMealMacros(meal.name, meal.isMainMeal, percentage);
    });

    setMealData(defaultMealData);
    setSelectedSnackPercentage(null);
  };

  const calculateMealMacros = (name: string, isMainMeal: boolean, percentage: number): MealData => {
    const calories = Math.round(adjustedTDCI * percentage / 100);
    
    // Použijeme daily macros pokud jsou k dispozici, jinak fallback
    const proteinPerc = dailyMacros.proteinPercentage || 25;
    const carbsPerc = dailyMacros.carbsPercentage || 45;
    const fatPerc = dailyMacros.fatPercentage || 30;
    
    const protein = Math.round((calories * proteinPerc / 100) / 4);
    const carbs = Math.round((calories * carbsPerc / 100) / 4);
    const fat = Math.round((calories * fatPerc / 100) / 9);
    
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

  const rebalanceMeals = (newMealData: MealData[], changedMealIndex: number, userModified: Set<string>) => {
    const total = newMealData.reduce((sum, meal) => sum + meal.percentage, 0);
    
    if (Math.abs(total - 100) < 0.1) return newMealData; // Already balanced
    
    const difference = total - 100;
    const changedMeal = newMealData[changedMealIndex];
    
    if (changedMeal.isMainMeal) {
      // Main meal changed - rebalance other NON-USER-MODIFIED main meals first
      const otherMainMeals = newMealData.filter((meal, index) => 
        meal.isMainMeal && index !== changedMealIndex && !userModified.has(meal.name)
      );
      const snacks = newMealData.filter(meal => !meal.isMainMeal);
      
      if (otherMainMeals.length > 0) {
        // Try to rebalance among other non-modified main meals
        const adjustmentPerMeal = difference / otherMainMeals.length;
        
        otherMainMeals.forEach(meal => {
          const mealIndex = newMealData.findIndex(m => m.name === meal.name);
          newMealData[mealIndex].percentage = Math.max(1, meal.percentage - adjustmentPerMeal);
          newMealData[mealIndex] = {
            ...calculateMealMacros(
              newMealData[mealIndex].name,
              newMealData[mealIndex].isMainMeal,
              newMealData[mealIndex].percentage
            ),
            expanded: newMealData[mealIndex].expanded
          };
        });
        
        // Check if we need to adjust snacks too
        const newTotal = newMealData.reduce((sum, meal) => sum + meal.percentage, 0);
        const remainingDifference = newTotal - 100;
        
        if (Math.abs(remainingDifference) > 0.1 && snacks.length > 0) {
          const snackAdjustment = remainingDifference / snacks.length;
          snacks.forEach(snack => {
            const snackIndex = newMealData.findIndex(m => m.name === snack.name);
            newMealData[snackIndex].percentage = Math.max(1, snack.percentage - snackAdjustment);
            newMealData[snackIndex] = {
              ...calculateMealMacros(
                newMealData[snackIndex].name,
                newMealData[snackIndex].isMainMeal,
                newMealData[snackIndex].percentage
              ),
              expanded: newMealData[snackIndex].expanded
            };
          });
        }
      } else if (snacks.length > 0) {
        // Only snacks available for rebalancing
        const adjustmentPerSnack = difference / snacks.length;
        snacks.forEach(snack => {
          const snackIndex = newMealData.findIndex(m => m.name === snack.name);
          newMealData[snackIndex].percentage = Math.max(1, snack.percentage - adjustmentPerSnack);
          newMealData[snackIndex] = {
            ...calculateMealMacros(
              newMealData[snackIndex].name,
              newMealData[snackIndex].isMainMeal,
              newMealData[snackIndex].percentage
            ),
            expanded: newMealData[snackIndex].expanded
          };
        });
      }
    } else {
      // Snack changed - rebalance NON-USER-MODIFIED main meals first
      const nonModifiedMainMeals = newMealData.filter(meal => 
        meal.isMainMeal && !userModified.has(meal.name)
      );
      
      if (nonModifiedMainMeals.length > 0) {
        const adjustmentPerMeal = difference / nonModifiedMainMeals.length;
        
        nonModifiedMainMeals.forEach(meal => {
          const mealIndex = newMealData.findIndex(m => m.name === meal.name);
          newMealData[mealIndex].percentage = Math.max(1, meal.percentage - adjustmentPerMeal);
          newMealData[mealIndex] = {
            ...calculateMealMacros(
              newMealData[mealIndex].name,
              newMealData[mealIndex].isMainMeal,
              newMealData[mealIndex].percentage
            ),
            expanded: newMealData[mealIndex].expanded
          };
        });
      } else {
        // All main meals are user-modified, adjust other snacks
        const otherSnacks = newMealData.filter((meal, index) => 
          !meal.isMainMeal && index !== changedMealIndex
        );
        
        if (otherSnacks.length > 0) {
          const adjustmentPerSnack = difference / otherSnacks.length;
          
          otherSnacks.forEach(snack => {
            const snackIndex = newMealData.findIndex(m => m.name === snack.name);
            newMealData[snackIndex].percentage = Math.max(1, snack.percentage - adjustmentPerSnack);
            newMealData[snackIndex] = {
              ...calculateMealMacros(
                newMealData[snackIndex].name,
                newMealData[snackIndex].isMainMeal,
                newMealData[snackIndex].percentage
              ),
              expanded: newMealData[snackIndex].expanded
            };
          });
        }
      }
    }
    
    return newMealData;
  };

  const handlePercentageChange = (mealIndex: number, change: number) => {
    const newMealData = [...mealData];
    const currentPercentage = newMealData[mealIndex].percentage;
    const newPercentage = Math.max(1, Math.min(99, currentPercentage + change));
    
    // Mark this meal as user-modified
    const newUserModified = new Set(userModifiedMeals);
    newUserModified.add(newMealData[mealIndex].name);
    setUserModifiedMeals(newUserModified);
    
    // Update the changed meal
    newMealData[mealIndex] = calculateMealMacros(
      newMealData[mealIndex].name,
      newMealData[mealIndex].isMainMeal,
      newPercentage
    );
    newMealData[mealIndex].expanded = mealData[mealIndex].expanded;
    
    // Rebalance other meals to maintain 100% total
    const rebalancedData = rebalanceMeals(newMealData, mealIndex, newUserModified);
    
    setMealData(rebalancedData);
    saveMealDataToStorage(rebalancedData);
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
    saveMealDataToStorage(newMealData);
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
      case 'Breakfast': return 'Breakfast';
      case 'Lunch': return 'Lunch';
      case 'Dinner': return 'Dinner';
      default: return name;
    }
  };

  const handleSnackPreset = (percentage: number) => {
    const newMealData = [...mealData];
    
    // Apply percentage to all snacks
    newMealData.forEach((meal, index) => {
      if (!meal.isMainMeal) {
        newMealData[index] = calculateMealMacros(meal.name, meal.isMainMeal, percentage);
        newMealData[index].expanded = meal.expanded;
      }
    });
    
    // Rebalance ONLY non-user-modified main meals to maintain 100% total
    const snacks = newMealData.filter(meal => !meal.isMainMeal);
    const nonModifiedMainMeals = newMealData.filter(meal => 
      meal.isMainMeal && !userModifiedMeals.has(meal.name)
    );
    
    if (nonModifiedMainMeals.length > 0) {
      const totalSnackPercentage = snacks.reduce((sum, snack) => sum + snack.percentage, 0);
      const userModifiedTotal = newMealData
        .filter(meal => meal.isMainMeal && userModifiedMeals.has(meal.name))
        .reduce((sum, meal) => sum + meal.percentage, 0);
      
      const remainingPercentage = 100 - totalSnackPercentage - userModifiedTotal;
      const mainMealPercentage = Math.max(1, remainingPercentage / nonModifiedMainMeals.length);
      
      nonModifiedMainMeals.forEach(meal => {
        const mealIndex = newMealData.findIndex(m => m.name === meal.name);
        newMealData[mealIndex] = calculateMealMacros(meal.name, meal.isMainMeal, mainMealPercentage);
        newMealData[mealIndex].expanded = meal.expanded;
      });
    }
    
    setMealData(newMealData);
    saveMealDataToStorage(newMealData);
    setSelectedSnackPercentage(percentage);
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
    setUserModifiedMeals(new Set()); // Clear all user modifications
    calculateDailyMacros();
    setTimeout(() => {
      resetMealData();
    }, 100);
  };

  const renderMealContainer = (meal: MealData, index: number) => (
    <View key={index} style={styles.mealContainer}>
      <TouchableOpacity 
        style={styles.mealHeader}
        onPress={() => toggleExpanded(index)}
      >
        <Text style={styles.mealName}>{formatMealName(meal.name)}</Text>
        <Text style={[styles.macroValue, { flex: 0.6 }]}>{meal.protein}</Text>
        <Text style={[styles.macroValue, { flex: 1.4 }]}>{meal.carbs}</Text>
        <Text style={[styles.macroValue, { flex: 1 }]}>{meal.fat}</Text>
        <Text style={[styles.macroValue, { flex: 1 }]}>{meal.kcal}</Text>
        <Text style={[styles.macroValue, { flex: 1 }]}>{meal.percentage}</Text>
        <View style={{ flex: 0.6, alignItems: 'center' }}>
          <Icon 
            name={meal.expanded ? "expand-less" : "expand-more"} 
            size={24} 
            color="#FFB347" 
          />
        </View>
      </TouchableOpacity>
      
      {meal.expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.macroControlRow}>
            <Text style={styles.macroLabel}>Protein</Text>
            <View style={styles.macroControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handleMacroChange(index, 'protein', -5)}
              >
                <Text style={styles.controlText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.macroAmount}>{meal.protein}g</Text>
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
            <View style={styles.macroControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handleMacroChange(index, 'fat', -2)}
              >
                <Text style={styles.controlText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.macroAmount}>{meal.fat}g</Text>
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
            <Text style={styles.macroAmount}>{meal.carbs}g</Text>
          </View>
          
          <View style={styles.macroControlRowLast}>
            <Text style={styles.macroLabel}>%TDCI</Text>
            <View style={styles.macroControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handlePercentageChange(index, -1)}
              >
                <Text style={styles.controlText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.macroAmount}>{meal.percentage}%</Text>
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

  // Check if there are any snacks
  const hasSnacks = mealData.some(meal => !meal.isMainMeal);

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Portion Sizes</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>
          </View>

          {/* Daily Overview */}
          <View style={styles.overviewSection}>
            <View style={styles.tdciRow}>
              <Text style={styles.tdciText}>Adjusted TDCI: {adjustedTDCI} kcal</Text>
              <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.macroText}>
              Protein {dailyMacros.protein}g   Fat {dailyMacros.fat}g   Carbohydrates {dailyMacros.carbs}g
            </Text>
            <Text style={styles.infoText}>
              All meal percentages must total 100% TDCI
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 1.6, textAlign: 'left', paddingRight: 10 }]}>Meals</Text>
              <Text style={[styles.headerCell, { flex: 1.3, paddingLeft: 8 }]}>Protein</Text>
              <Text style={[styles.headerCell, { flex: 1, paddingLeft: 8 }]}>Carbs</Text>
              <Text style={[styles.headerCell, { flex: 1, paddingLeft: 8 }]}>Fat</Text>
              <Text style={[styles.headerCell, { flex: 1, paddingLeft: 8 }]}>kcal</Text>
              <Text style={[styles.headerCell, { flex: 1.2, paddingLeft: 8 }]}>%TDCI</Text>
              <View style={{ flex: 0.5 }} />
            </View>

            {/* Meal Containers */}
            {mealData.map((meal, index) => renderMealContainer(meal, index))}

            {/* Snack % Section */}
            {hasSnacks && (
              <View style={styles.presetSection}>
                <Text style={styles.presetTitle}>Snack %</Text>
                <View style={styles.presetButtons}>
                  {[5, 10, 15, 20, 25].map((percentage) => (
                    <TouchableOpacity
                      key={percentage}
                      style={[
                        styles.presetButton,
                        selectedSnackPercentage === percentage && styles.presetButtonSelected
                      ]}
                      onPress={() => handleSnackPreset(percentage)}
                    >
                      <Text style={[
                        styles.presetButtonText,
                        selectedSnackPercentage === percentage && styles.presetButtonTextSelected
                      ]}>
                        {percentage}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={saveMealData}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    padding: 4,
  },
  overviewSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tdciRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tdciText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  resetButton: {
    backgroundColor: '#FFB347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  macroText: {
    fontSize: 14,
    color: '#666666',
  },
  infoText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  content: {
    height: 300,
    paddingHorizontal: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  mealContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    flex: 2,
    textAlign: 'left',
    paddingRight: 10,
    flexWrap: 'wrap',
  },
  macroValue: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    flex: 1,
    paddingLeft: 8,
  },
  expandedContent: {
    paddingTop: 16,
    backgroundColor: '#F8F9FA',
    marginTop: 8,
    borderRadius: 8,
    padding: 16,
  },
  macroControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  macroControlRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingVertical: 4,
  },
  macroLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  macroControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    marginHorizontal: 1,
  },
  controlText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFB347',
  },
  macroAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    minWidth: 50,
    textAlign: 'center',
    marginHorizontal: 2,
  },
  presetSection: {
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  presetButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  presetButtonSelected: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  presetButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  presetButtonTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#FFB347',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});