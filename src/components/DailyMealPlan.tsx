// src/components/DailyMealPlan.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, PanResponder, Dimensions } from 'react-native';
import { formatDate } from '../utils/dateUtils';
import { MealSection } from './MealSection';
import { SnackPositionModal } from './SnackPositionModal';
import { Meal, SnackPosition } from '../types/meal';
import { useMealStore } from '../stores/mealStore';
import { useUserStore } from '../stores/userStore';

const windowWidth = Dimensions.get('window').width;

interface DailyMealPlanProps {
  selectedDate: Date;
  onDateChange?: (date: Date) => void;
}

export const DailyMealPlan: React.FC<DailyMealPlanProps> = ({ selectedDate, onDateChange }) => {
  const [showSnackModal, setShowSnackModal] = useState(false);
  const { getMealPlan, addMeal, removeMeal, resetDay } = useMealStore();
  const selectedUser = useUserStore(state => state.selectedUser);

  if (!selectedUser) return null;

  // Swipe handling
  const getNextDay = (date: Date): Date => {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    return nextDay;
  };

  const getPreviousDay = (date: Date): Date => {
    const prevDay = new Date(date);
    prevDay.setDate(date.getDate() - 1);
    return prevDay;
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to horizontal swipes
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderGrant: () => {
      // Optional: Add visual feedback when swipe starts
    },
    onPanResponderMove: () => {
      // Optional: Add visual feedback during swipe
    },
    onPanResponderRelease: (_, gestureState) => {
      const SWIPE_THRESHOLD = windowWidth * 0.25; // 25% of screen width
      
      if (gestureState.dx > SWIPE_THRESHOLD) {
        // Swipe right - go to previous day (back in time)
        if (onDateChange) {
          onDateChange(getPreviousDay(selectedDate));
        }
      } else if (gestureState.dx < -SWIPE_THRESHOLD) {
        // Swipe left - go to next day (forward in time)
        if (onDateChange) {
          onDateChange(getNextDay(selectedDate));
        }
      }
    },
    onPanResponderTerminate: () => {
      // Handle termination
    },
  });

  const dateStr = selectedDate.toISOString().split('T')[0];
  const mealPlan = getMealPlan(selectedUser.id, dateStr);
  const meals = mealPlan?.meals || [];

  // Group meals by type and position
  const breakfastMeals = meals.filter(m => m.type === 'Breakfast');
  const lunchMeals = meals.filter(m => m.type === 'Lunch');
  const dinnerMeals = meals.filter(m => m.type === 'Dinner');
  
  const snackGroups = {
    'Before Breakfast': meals.filter(m => m.type === 'Snack' && m.position === 'Before Breakfast'),
    'Between Breakfast and Lunch': meals.filter(m => m.type === 'Snack' && m.position === 'Between Breakfast and Lunch'),
    'Between Lunch and Dinner': meals.filter(m => m.type === 'Snack' && m.position === 'Between Lunch and Dinner'),
    'After Dinner': meals.filter(m => m.type === 'Snack' && m.position === 'After Dinner'),
  };

  const handleAddMeal = (type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', name: string, position?: string) => {
    addMeal(selectedUser.id, dateStr, { type, name, position });
  };

  const handleRemoveMeal = (mealId: string) => {
    removeMeal(selectedUser.id, dateStr, mealId);
  };

  const handleAddSnack = (positions: SnackPosition[], applyToEveryDay: boolean) => {
    if (applyToEveryDay) {
      // Add to entire week
      const startOfWeek = new Date(selectedDate);
      const dayOfWeek = startOfWeek.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        const currentDateStr = currentDate.toISOString().split('T')[0];
        
        positions.forEach(position => {
          addMeal(selectedUser.id, currentDateStr, { 
            type: 'Snack', 
            name: 'Snack', 
            position 
          });
        });
      }
    } else {
      // Add only to selected day
      positions.forEach(position => {
        addMeal(selectedUser.id, dateStr, { 
          type: 'Snack', 
          name: 'Snack', 
          position 
        });
      });
    }
    setShowSnackModal(false);
  };

  const handleRemoveSnack = (position: SnackPosition) => {
    const snacksToRemove = meals.filter(m => m.type === 'Snack' && m.position === position);
    snacksToRemove.forEach(snack => {
      removeMeal(selectedUser.id, dateStr, snack.id);
    });
  };

  const handleResetDay = () => {
    Alert.alert(
      'Reset Day',
      'Are you sure you want to remove all meals for this day?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetDay(selectedUser.id, dateStr) }
      ]
    );
  };

  const renderSnackSection = (position: SnackPosition, snackMeals: Meal[]) => {
    if (snackMeals.length === 0) return null;
    
    return (
      <MealSection
        key={position}
        type="Snack"
        meals={snackMeals}
        onAddMeal={(name) => handleAddMeal('Snack', name, position)}
        onRemoveMeal={handleRemoveMeal}
        position={position}
        isSnack={true}
        onRemoveSnack={() => handleRemoveSnack(position)}
      />
    );
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <Text style={styles.dateTitle}>{formatDate(selectedDate)}</Text>
        <TouchableOpacity style={styles.resetButton} onPress={handleResetDay}>
          <Text style={styles.resetIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Before Breakfast Snacks */}
        {renderSnackSection('Before Breakfast', snackGroups['Before Breakfast'])}

        {/* Breakfast */}
        <MealSection
          type="Breakfast"
          meals={breakfastMeals}
          onAddMeal={(name) => handleAddMeal('Breakfast', name)}
          onRemoveMeal={handleRemoveMeal}
        />

        {/* Between Breakfast and Lunch Snacks */}
        {renderSnackSection('Between Breakfast and Lunch', snackGroups['Between Breakfast and Lunch'])}

        {/* Lunch */}
        <MealSection
          type="Lunch"
          meals={lunchMeals}
          onAddMeal={(name) => handleAddMeal('Lunch', name)}
          onRemoveMeal={handleRemoveMeal}
        />

        {/* Between Lunch and Dinner Snacks */}
        {renderSnackSection('Between Lunch and Dinner', snackGroups['Between Lunch and Dinner'])}

        {/* Dinner */}
        <MealSection
          type="Dinner"
          meals={dinnerMeals}
          onAddMeal={(name) => handleAddMeal('Dinner', name)}
          onRemoveMeal={handleRemoveMeal}
        />

        {/* After Dinner Snacks */}
        {renderSnackSection('After Dinner', snackGroups['After Dinner'])}

        {/* Add Snack Button */}
        <TouchableOpacity 
          style={styles.addSnackButton}
          onPress={() => setShowSnackModal(true)}
        >
          <Text style={styles.addSnackText}>+ Add Snack</Text>
        </TouchableOpacity>

        {/* Generate Button */}
        <TouchableOpacity style={styles.generateButton}>
          <Text style={styles.generateText}>🎲 Generate This Day</Text>
        </TouchableOpacity>
      </ScrollView>

      <SnackPositionModal
        visible={showSnackModal}
        onClose={() => setShowSnackModal(false)}
        onConfirm={handleAddSnack}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  resetButton: {
    padding: 8, // Vráceno na původní velikost
  },
  resetIcon: {
    fontSize: 28, // Zvětšena pouze ikona
    color: '#FFB347', // Vrácena původní barva
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  addSnackButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#FFB347',
    borderStyle: 'dashed',
  },
  addSnackText: {
    color: '#FFB347',
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#FFB347',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 20,
  },
  generateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});