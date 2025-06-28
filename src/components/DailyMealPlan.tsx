// src/components/DailyMealPlan.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, PanResponder, Dimensions, Animated } from 'react-native';
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
  const swipeAnimation = useRef(new Animated.Value(0)).current;
  const isSwipingRef = useRef(false);
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  const { getMealPlan, addMeal, removeMeal, resetDay } = useMealStore();
  const selectedUser = useUserStore(state => state.selectedUser);

  if (!selectedUser) return null;

  // Reset animation when date changes externally (from calendar)
  useEffect(() => {
    if (!isSwipingRef.current) {
      swipeAnimation.setValue(0);
      setPreviewDate(null);
      setSwipeDirection(null);
    }
  }, [selectedDate]);

  // Helper functions
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

  const handleAddMeal = (type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', name: string, position?: string) => {
    const currentDateStr = selectedDate.toISOString().split('T')[0];
    addMeal(selectedUser.id, currentDateStr, { type, name, position });
  };

  const handleRemoveMeal = (mealId: string) => {
    const currentDateStr = selectedDate.toISOString().split('T')[0];
    removeMeal(selectedUser.id, currentDateStr, mealId);
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
      const currentDateStr = selectedDate.toISOString().split('T')[0];
      positions.forEach(position => {
        addMeal(selectedUser.id, currentDateStr, { 
          type: 'Snack', 
          name: 'Snack', 
          position 
        });
      });
    }
    setShowSnackModal(false);
  };

  const handleRemoveSnack = (position: SnackPosition) => {
    const currentDateStr = selectedDate.toISOString().split('T')[0];
    const mealPlan = getMealPlan(selectedUser.id, currentDateStr);
    const meals = mealPlan?.meals || [];
    const snacksToRemove = meals.filter(m => m.type === 'Snack' && m.position === position);
    snacksToRemove.forEach(snack => {
      removeMeal(selectedUser.id, currentDateStr, snack.id);
    });
  };

  const handleResetDay = () => {
    Alert.alert(
      'Reset Day',
      'Are you sure you want to remove all meals for this day?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          const currentDateStr = selectedDate.toISOString().split('T')[0];
          resetDay(selectedUser.id, currentDateStr);
        }}
      ]
    );
  };

  // Helper function to render meal plan content
  const renderMealPlanContent = (date: Date, isPreview = false) => {
    const currentDateStr = date.toISOString().split('T')[0];
    const mealPlan = getMealPlan(selectedUser.id, currentDateStr);
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

    const renderSnackSection = (position: SnackPosition, snackMeals: Meal[]) => {
      if (snackMeals.length === 0) return null;
      
      return (
        <MealSection
          key={position}
          type="Snack"
          meals={snackMeals}
          onAddMeal={isPreview ? () => {} : (name) => handleAddMeal('Snack', name, position)}
          onRemoveMeal={isPreview ? () => {} : handleRemoveMeal}
          position={position}
          isSnack={true}
          onRemoveSnack={isPreview ? () => {} : () => handleRemoveSnack(position)}
        />
      );
    };

    return (
      <>
        <View style={styles.header}>
          <Text style={styles.dateTitle}>{formatDate(date)}</Text>
          {!isPreview && (
            <TouchableOpacity style={styles.resetButton} onPress={handleResetDay}>
              <Text style={styles.resetIcon}>↻</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} scrollEnabled={!isPreview}>
          {/* Before Breakfast Snacks */}
          {renderSnackSection('Before Breakfast', snackGroups['Before Breakfast'])}

          {/* Breakfast */}
          <MealSection
            type="Breakfast"
            meals={breakfastMeals}
            onAddMeal={isPreview ? () => {} : (name) => handleAddMeal('Breakfast', name)}
            onRemoveMeal={isPreview ? () => {} : handleRemoveMeal}
          />

          {/* Between Breakfast and Lunch Snacks */}
          {renderSnackSection('Between Breakfast and Lunch', snackGroups['Between Breakfast and Lunch'])}

          {/* Lunch */}
          <MealSection
            type="Lunch"
            meals={lunchMeals}
            onAddMeal={isPreview ? () => {} : (name) => handleAddMeal('Lunch', name)}
            onRemoveMeal={isPreview ? () => {} : handleRemoveMeal}
          />

          {/* Between Lunch and Dinner Snacks */}
          {renderSnackSection('Between Lunch and Dinner', snackGroups['Between Lunch and Dinner'])}

          {/* Dinner */}
          <MealSection
            type="Dinner"
            meals={dinnerMeals}
            onAddMeal={isPreview ? () => {} : (name) => handleAddMeal('Dinner', name)}
            onRemoveMeal={isPreview ? () => {} : handleRemoveMeal}
          />

          {/* After Dinner Snacks */}
          {renderSnackSection('After Dinner', snackGroups['After Dinner'])}

          {/* Add Snack Button */}
          {!isPreview && (
            <TouchableOpacity 
              style={styles.addSnackButton}
              onPress={() => setShowSnackModal(true)}
            >
              <Text style={styles.addSnackText}>+ Add Snack</Text>
            </TouchableOpacity>
          )}

          {/* Generate Button */}
          {!isPreview && (
            <TouchableOpacity style={styles.generateButton}>
              <Text style={styles.generateText}>🎲 Generate This Day</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </>
    );
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to horizontal swipes
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderGrant: () => {
      // Reset animation when starting and mark as swiping
      isSwipingRef.current = true;
      swipeAnimation.setValue(0);
      setPreviewDate(null);
      setSwipeDirection(null);
    },
    onPanResponderMove: (_, gestureState) => {
      // Update animation during swipe (limited to prevent excessive movement)
      const maxTranslation = windowWidth * 0.8; // Increased to 80% to show more of next page
      const clampedValue = Math.max(-maxTranslation, Math.min(maxTranslation, gestureState.dx));
      swipeAnimation.setValue(clampedValue);

      // Set preview date based on swipe direction
      if (gestureState.dx > 50) {
        // Swiping right - show previous day
        if (!previewDate || swipeDirection !== 'right') {
          setPreviewDate(getPreviousDay(selectedDate));
          setSwipeDirection('right');
        }
      } else if (gestureState.dx < -50) {
        // Swiping left - show next day
        if (!previewDate || swipeDirection !== 'left') {
          setPreviewDate(getNextDay(selectedDate));
          setSwipeDirection('left');
        }
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      const SWIPE_THRESHOLD = windowWidth * 0.25; // 25% of screen width
      
      if (gestureState.dx > SWIPE_THRESHOLD) {
        // Swipe right - animate out and go to previous day
        Animated.timing(swipeAnimation, {
          toValue: windowWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          if (onDateChange) {
            onDateChange(getPreviousDay(selectedDate));
          }
          // Reset animation after date change and mark as not swiping
          swipeAnimation.setValue(0);
          isSwipingRef.current = false;
          setPreviewDate(null);
          setSwipeDirection(null);
        });
      } else if (gestureState.dx < -SWIPE_THRESHOLD) {
        // Swipe left - animate out and go to next day
        Animated.timing(swipeAnimation, {
          toValue: -windowWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          if (onDateChange) {
            onDateChange(getNextDay(selectedDate));
          }
          // Reset animation after date change and mark as not swiping
          swipeAnimation.setValue(0);
          isSwipingRef.current = false;
          setPreviewDate(null);
          setSwipeDirection(null);
        });
      } else {
        // Snap back to original position and mark as not swiping
        Animated.spring(swipeAnimation, {
          toValue: 0,
          useNativeDriver: true,
        }).start(() => {
          isSwipingRef.current = false;
          setPreviewDate(null);
          setSwipeDirection(null);
        });
      }
    },
    onPanResponderTerminate: () => {
      // Snap back if terminated and mark as not swiping
      Animated.spring(swipeAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }).start(() => {
        isSwipingRef.current = false;
        setPreviewDate(null);
        setSwipeDirection(null);
      });
    },
  });

  return (
    <View style={styles.swipeContainer} {...panResponder.panHandlers}>
      {/* Preview page (next/previous day) */}
      {previewDate && (
        <Animated.View 
          style={[
            styles.previewContainer,
            {
              left: swipeDirection === 'right' 
                ? Animated.add(swipeAnimation, -windowWidth) 
                : Animated.add(swipeAnimation, windowWidth),
            }
          ]}
        >
          {renderMealPlanContent(previewDate, true)}
        </Animated.View>
      )}

      {/* Current page */}
      <Animated.View 
        style={[
          styles.container, 
          { transform: [{ translateX: swipeAnimation }] }
        ]} 
      >
        {renderMealPlanContent(selectedDate, false)}
      </Animated.View>

      <SnackPositionModal
        visible={showSnackModal}
        onClose={() => setShowSnackModal(false)}
        onConfirm={handleAddSnack}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  previewContainer: {
    position: 'absolute',
    top: 0,
    width: windowWidth,
    height: '100%',
    backgroundColor: '#F8F9FA',
    opacity: 0.8,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    padding: 8,
  },
  resetIcon: {
    fontSize: 28,
    color: '#FFB347',
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