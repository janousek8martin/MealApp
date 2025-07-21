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
  // ✅ MINIMÁLNÍ ZMĚNA: Update onSave to accept optional second parameter
  onSave: (
    portionSizes: { [key: string]: number },
    mealNutritionTargets?: { [key: string]: { calories: number; protein: number; carbs: number; fat: number } }
  ) => void;
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
  // ✅ NEW: Track if data is loading to prevent flickering
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Get user from store if currentUser is not provided
  const selectedUser = useUserStore(state => state.selectedUser);
  const user = currentUser || selectedUser;

  // Calculate adjusted TDCI
  const adjustedTDCI = user?.tdci?.adjustedTDCI || 2000;

  useEffect(() => {
    if (visible) {
      // ✅ RESET loading state when modal opens
      setIsDataLoaded(false);
      // ✅ LOAD DATA SYNCHRONOUSLY - macros are calculated inside loadMealData
      loadMealData();
    } else {
      // ✅ RESET when modal closes
      setIsDataLoaded(false);
    }
  }, [visible, user, adjustedTDCI]);

  // ✅ NEW: Function to recalculate all meals when TDCI changes
  const recalculateAllMealsForNewTDCI = () => {
    if (mealData.length === 0) return;
    
    console.log('🔄 Recalculating all meals for new TDCI...');
    
    const updatedMealData = mealData.map(meal => {
      // Keep the same percentage, but recalculate nutrition values based on new TDCI
      return calculateMealMacros(meal.name, meal.isMainMeal, meal.percentage);
    });
    
    // Preserve expanded states
    updatedMealData.forEach((updatedMeal, index) => {
      if (mealData[index]) {
        updatedMeal.expanded = mealData[index].expanded;
      }
    });
    
    setMealData(updatedMealData);
    saveMealDataToStorage(updatedMealData);
    
    console.log('✅ All meals recalculated for new TDCI');
  };

  // Load meal data from storage
  const loadMealData = async () => {
    try {
      // ✅ CALCULATE MACROS FIRST - before any data loading
      calculateDailyMacros();
      
      const savedMealData = await AsyncStorage.getItem(`mealData_${user?.id}`);
      if (savedMealData) {
        const parsedMealData = JSON.parse(savedMealData);
        
        // ✅ NEW: Check if TDCI changed since last save and auto-recalculate
        const savedTDCI = await AsyncStorage.getItem(`savedTDCI_${user?.id}`);
        const lastSavedTDCI = savedTDCI ? parseFloat(savedTDCI) : null;
        
        if (lastSavedTDCI && Math.abs(lastSavedTDCI - adjustedTDCI) > 10) {
          console.log(`🔄 TDCI changed from ${lastSavedTDCI} to ${adjustedTDCI}, auto-recalculating meals on load...`);
          
          // Recalculate all meals with new TDCI but preserve percentages
          const recalculatedMealData = parsedMealData.map((meal: MealData) => {
            return calculateMealMacros(meal.name, meal.isMainMeal, meal.percentage);
          });
          
          // Preserve expanded states
          recalculatedMealData.forEach((updatedMeal: MealData, index: number) => {
            if (parsedMealData[index]) {
              updatedMeal.expanded = parsedMealData[index].expanded || false;
            }
          });
          
          // Update with current user's snack positions (in case they changed)
          updateSnacksInData(recalculatedMealData);
          
          // Save the updated TDCI reference
          await AsyncStorage.setItem(`savedTDCI_${user?.id}`, adjustedTDCI.toString());
          
          console.log('✅ Meals recalculated on load for new TDCI');
        } else {
          // No TDCI change, just update snacks normally
          updateSnacksInData(parsedMealData);
          
          // Save current TDCI reference if not saved yet
          if (!lastSavedTDCI) {
            await AsyncStorage.setItem(`savedTDCI_${user?.id}`, adjustedTDCI.toString());
          }
        }
      } else {
        // No saved data, create fresh and save TDCI reference
        resetMealData();
        await AsyncStorage.setItem(`savedTDCI_${user?.id}`, adjustedTDCI.toString());
      }
      
      // ✅ MARK DATA AS LOADED - after all processing is complete
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading meal data:', error);
      resetMealData();
      // Save TDCI reference even on error
      try {
        await AsyncStorage.setItem(`savedTDCI_${user?.id}`, adjustedTDCI.toString());
      } catch (saveError) {
        console.error('Error saving TDCI reference:', saveError);
      }
      // ✅ MARK AS LOADED even on error
      setIsDataLoaded(true);
    }
  };

  // Save meal data to storage
  const saveMealDataToStorage = async (data: MealData[]) => {
    try {
      await AsyncStorage.setItem(`mealData_${user?.id}`, JSON.stringify(data));
      // ✅ NEW: Also save current TDCI reference when saving meal data
      await AsyncStorage.setItem(`savedTDCI_${user?.id}`, adjustedTDCI.toString());
    } catch (error) {
      console.error('Error saving meal data:', error);
    }
  };

  // Update snacks based on current user preferences
  const updateSnacksInData = (currentMealData: MealData[]) => {
    const snackPositions = user?.mealPreferences?.snackPositions || [];
    const mainMeals = currentMealData.filter(meal => ['Breakfast', 'Lunch', 'Dinner'].includes(meal.name));
    let newMealData = [...mainMeals];

    // Add snacks based on selected positions with proper meal order
    const mealOrder = [
      'Before Breakfast',
      'Breakfast', 
      'Between Breakfast and Lunch',
      'Lunch',
      'Between Lunch and Dinner', 
      'Dinner',
      'After Dinner'
    ];

    // Add snack meals
    const snackMeals = snackPositions.map((position: string) => {
      // Check if snack already exists
      const existingSnack = currentMealData.find(meal => meal.name === position);
      if (existingSnack) {
        return existingSnack;
      } else {
        // Create new snack with default values
        return calculateMealMacros(position, false, 10); // Default 10% for new snacks
      }
    });

    newMealData = [...newMealData, ...snackMeals];
    
    // Sort according to meal order
    newMealData.sort((a, b) => {
      const indexA = mealOrder.indexOf(a.name);
      const indexB = mealOrder.indexOf(b.name);
      return indexA - indexB;
    });

    setMealData(newMealData);
    saveMealDataToStorage(newMealData);
  };

  const calculateLBM = () => {
    if (!user?.weight || !user?.bodyFat) return 0;
    const weight = parseFloat(user.weight);
    const bodyFat = parseFloat(user.bodyFat);
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

    const proteinPercentageCalc = Math.round((proteinCalories / adjustedTDCI) * 100);
    const carbsPercentage = 100 - proteinPercentageCalc - fatPercentage;

    setDailyMacros({
      protein,
      fat,
      carbs,
      proteinPercentage: proteinPercentageCalc,
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
    saveMealDataToStorage(defaultMealData);
  };

  const calculateMealMacros = (mealName: string, isMainMeal: boolean, percentage: number) => {
    const targetCalories = Math.round(adjustedTDCI * percentage / 100);
    
    // Calculate macros based on daily ratios
    const proteinCalories = Math.round(targetCalories * dailyMacros.proteinPercentage / 100);
    const fatCalories = Math.round(targetCalories * dailyMacros.fatPercentage / 100);
    const carbsCalories = targetCalories - proteinCalories - fatCalories;
    
    const protein = Math.round(proteinCalories / 4);
    const fat = Math.round(fatCalories / 9);
    const carbs = Math.round(carbsCalories / 4);
    
    return {
      name: mealName,
      isMainMeal,
      protein,
      carbs,
      fat,
      kcal: targetCalories,
      percentage: Math.round(percentage),
      expanded: false
    };
  };

  const rebalanceMeals = (newMealData: MealData[], changedMealIndex: number, userModified: Set<string>) => {
    const changedMeal = newMealData[changedMealIndex];
    const currentTotal = newMealData.reduce((sum, meal) => sum + meal.percentage, 0);
    const difference = currentTotal - 100;
    
    if (Math.abs(difference) < 0.1) return newMealData; // Already balanced
    
    if (changedMeal.isMainMeal) {
      // Main meal changed - rebalance NON-USER-MODIFIED main meals first
      const nonModifiedMainMeals = newMealData.filter(meal => 
        meal.isMainMeal && !userModified.has(meal.name) && meal.name !== changedMeal.name
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
        
        // Check if we need to adjust snacks too
        const newTotal = newMealData.reduce((sum, meal) => sum + meal.percentage, 0);
        const remainingDifference = newTotal - 100;
        
        if (Math.abs(remainingDifference) > 0.1) {
          const snacks = newMealData.filter(meal => !meal.isMainMeal);
          if (snacks.length > 0) {
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
        }
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

  // ✅ MINIMÁLNÍ ZMĚNA: Jen update saveMealData() funkce
  const saveMealData = () => {
    try {
      // ✅ BACKWARD COMPATIBILITY: Keep original percentage format
      const portionData: { [key: string]: number } = {};
      mealData.forEach(meal => {
        portionData[meal.name] = meal.percentage / 100; // Convert percentage to decimal
      });
      
      // ✅ NEW: Also create absolute nutrition targets for mealStore
      const mealNutritionTargets: { [key: string]: { calories: number; protein: number; carbs: number; fat: number } } = {};
      mealData.forEach(meal => {
        mealNutritionTargets[meal.name] = {
          calories: meal.kcal,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat
        };
      });
      
      console.log('🍽️ Saving portion sizes with absolute nutrition:', {
        portionData, // Original percentage format
        mealNutritionTargets // New absolute format
      });
      
      // ✅ CHANGE: Pass both formats to parent (ProfileSettingsScreen expects this)
      onSave(portionData, mealNutritionTargets);
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
            name={meal.expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
            size={24} 
            color="#666" 
          />
        </View>
      </TouchableOpacity>

      {meal.expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.macroControlRow}>
            <Text style={styles.macroLabel}>Percentage</Text>
            <View style={styles.macroControls}>
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={() => handlePercentageChange(index, -5)}
              >
                <Text style={styles.controlText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.macroAmount}>{meal.percentage}%</Text>
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={() => handlePercentageChange(index, 5)}
              >
                <Text style={styles.controlText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

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

          <View style={styles.macroControlRowLast}>
            <Text style={styles.macroLabel}>Fat</Text>
            <View style={styles.macroControls}>
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={() => handleMacroChange(index, 'fat', -5)}
              >
                <Text style={styles.controlText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.macroAmount}>{meal.fat}g</Text>
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={() => handleMacroChange(index, 'fat', 5)}
              >
                <Text style={styles.controlText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // Check if there are any snacks to show the preset section
  const hasSnacks = mealData.some(meal => !meal.isMainMeal);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Portion Sizes</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Overview Section */}
          <View style={styles.overviewSection}>
            <View style={styles.tdciRow}>
              <Text style={styles.tdciText}>Adjusted TDCI: {adjustedTDCI} kcal</Text>
              <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.macroText}>
              Protein {dailyMacros.protein}g Fat {dailyMacros.fat}g Carbohydrates {dailyMacros.carbs}g
            </Text>
            <Text style={styles.infoText}>All meal percentages must total 100% TDCI</Text>
          </View>

          {/* ✅ CONDITIONAL RENDERING: Only show content when data is loaded */}
          {!isDataLoaded ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              {/* Content */}
              <ScrollView style={styles.content}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { flex: 2, textAlign: 'left', paddingLeft: 8 }]}>Meals</Text>
                  <Text style={[styles.headerCell, { flex: 0.6, paddingLeft: 8 }]}>Protein</Text>
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
            </>
          )}
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
  // ✅ NEW: Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
});