// src/components/DailyMealPlan.tsx
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
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

export interface DailyMealPlanRef {
  animateToDate: (newDate: Date, direction: 'left' | 'right') => void;
}

// Helper function to check if date is today or in the future
const isDateTodayOrFuture = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= today;
};

// Helper function to add snacks according to meal preferences
const applyMealPreferencesToDate = (
  userId: string, 
  date: Date, 
  mealPreferences: any, 
  addMeal: Function
) => {
  if (!mealPreferences?.snackPositions || !Array.isArray(mealPreferences.snackPositions)) {
    return;
  }

  const dateString = date.toISOString().split('T')[0];
  
  // Add snacks according to preferences
  mealPreferences.snackPositions.forEach((position: string) => {
    addMeal(userId, dateString, {
      type: 'Snack',
      name: 'Snack',
      position: position
    });
  });
};

export const DailyMealPlan = forwardRef<DailyMealPlanRef, DailyMealPlanProps>(
  ({ selectedDate, onDateChange }, ref) => {
    const [showSnackModal, setShowSnackModal] = useState(false);
    const swipeAnimation = useRef(new Animated.Value(0)).current;
    const isSwipingRef = useRef(false);
    const [previewDate, setPreviewDate] = useState<Date | null>(null);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    
    const { getMealPlan, addMeal, removeMeal, resetDay } = useMealStore();
    const selectedUser = useUserStore(state => state.selectedUser);

    if (!selectedUser) return null;

    // Apply meal preferences when component loads for today and future dates
    useEffect(() => {
      if (selectedUser?.mealPreferences?.snackPositions && isDateTodayOrFuture(selectedDate)) {
        const currentDateStr = selectedDate.toISOString().split('T')[0];
        const mealPlan = getMealPlan(selectedUser.id, currentDateStr);
        
        // If no meal plan exists for this date, apply preferences
        if (!mealPlan || !mealPlan.meals || mealPlan.meals.length === 0) {
          applyMealPreferencesToDate(selectedUser.id, selectedDate, selectedUser.mealPreferences, addMeal);
        }
      }
    }, [selectedDate, selectedUser, addMeal, getMealPlan]);

    // Expose animateToDate method through ref
    useImperativeHandle(ref, () => ({
      animateToDate: (newDate: Date, direction: 'left' | 'right') => {
        isSwipingRef.current = true;
        setPreviewDate(newDate);
        setSwipeDirection(direction);
        
        // Animate to the target direction
        const targetValue = direction === 'left' ? -windowWidth : windowWidth;
        
        Animated.timing(swipeAnimation, {
          toValue: targetValue,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          // Set the new date immediately without showing old content
          if (onDateChange) {
            onDateChange(newDate);
          }
          // Reset everything after date change
          setTimeout(() => {
            swipeAnimation.setValue(0);
            isSwipingRef.current = false;
            setPreviewDate(null);
            setSwipeDirection(null);
          }, 0);
        });
      }
    }));

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
        // Add to entire week (but only to today and future dates)
        const startOfWeek = new Date(selectedDate);
        const dayOfWeek = startOfWeek.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(startOfWeek);
          currentDate.setDate(startOfWeek.getDate() + i);
          
          // Only apply to today and future dates
          if (isDateTodayOrFuture(currentDate)) {
            const currentDateStr = currentDate.toISOString().split('T')[0];
            positions.forEach(position => {
              addMeal(selectedUser.id, currentDateStr, { 
                type: 'Snack', 
                name: 'Snack', 
                position 
              });
            });
          }
        }
      } else {
        // Add only to selected day (if it's today or future)
        if (isDateTodayOrFuture(selectedDate)) {
          const currentDateStr = selectedDate.toISOString().split('T')[0];
          positions.forEach(position => {
            addMeal(selectedUser.id, currentDateStr, { 
              type: 'Snack', 
              name: 'Snack', 
              position 
            });
          });
        }
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
          {/* Header se stejnou šířkou pro preview i aktuální */}
          <View style={styles.header}>
            <Text style={styles.dateTitle}>{formatDate(date)}</Text>
            {/* Reset button se zobrazuje vždy, ale v preview je neaktivní */}
            <TouchableOpacity 
              style={[styles.resetButton, isPreview && styles.disabledButton]}
              onPress={isPreview ? () => {} : handleResetDay}
            >
              <Text style={styles.resetIcon}>↻</Text>
            </TouchableOpacity>
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

            {/* Add Snack Button - zobrazit vždy, jen v preview vypnout akci */}
            <TouchableOpacity 
              style={[styles.addSnackButton, isPreview && styles.disabledButton]}
              onPress={isPreview ? () => {} : () => setShowSnackModal(true)}
            >
              <Text style={styles.addSnackText}>+ Add Snack</Text>
            </TouchableOpacity>

            {/* Generate Button - zobrazit vždy, jen v preview vypnout akci */}
            <TouchableOpacity 
              style={[styles.generateButton, isPreview && styles.disabledButton]}
              onPress={isPreview ? () => {} : () => {}}
            >
              <Text style={styles.generateText}>🎲 Generate This Day</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      );
    };

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Méně agresivní podmínky pro snížení stutteru
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
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

        // Set preview date based on swipe direction - snížený threshold
        if (gestureState.dx > 30) {
          // Swiping right - show previous day
          if (!previewDate || swipeDirection !== 'right') {
            setPreviewDate(getPreviousDay(selectedDate));
            setSwipeDirection('right');
          }
        } else if (gestureState.dx < -30) {
          // Swiping left - show next day
          if (!previewDate || swipeDirection !== 'left') {
            setPreviewDate(getNextDay(selectedDate));
            setSwipeDirection('left');
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = windowWidth * 0.25; // Threshold for completing swipe
        
        if (Math.abs(gestureState.dx) > swipeThreshold && Math.abs(gestureState.vx) > 0.3) {
          // Complete the swipe
          const direction = gestureState.dx > 0 ? 'right' : 'left';
          const newDate = direction === 'right' ? getPreviousDay(selectedDate) : getNextDay(selectedDate);
          
          const targetValue = direction === 'right' ? windowWidth : -windowWidth;
          
          Animated.timing(swipeAnimation, {
            toValue: targetValue,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            if (onDateChange) {
              onDateChange(newDate);
            }
            // Reset after completing the swipe
            setTimeout(() => {
              swipeAnimation.setValue(0);
              isSwipingRef.current = false;
              setPreviewDate(null);
              setSwipeDirection(null);
            }, 0);
          });
        } else {
          // Bounce back
          Animated.spring(swipeAnimation, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }).start(() => {
            isSwipingRef.current = false;
            setPreviewDate(null);
            setSwipeDirection(null);
          });
        }
      },
    });

    return (
      <View style={styles.container} {...panResponder.panHandlers}>
        <Animated.View 
          style={[
            styles.mealPlanContainer,
            {
              transform: [{ translateX: swipeAnimation }]
            }
          ]}
        >
          {renderMealPlanContent(selectedDate)}
        </Animated.View>

        {/* Preview containers */}
        {previewDate && swipeDirection === 'right' && (
          <Animated.View 
            style={[
              styles.mealPlanContainer,
              styles.previewContainer,
              styles.leftPreview,
              {
                transform: [{ 
                  translateX: swipeAnimation.interpolate({
                    inputRange: [0, windowWidth * 0.8],
                    outputRange: [-windowWidth, 0],
                    extrapolate: 'clamp'
                  })
                }]
              }
            ]}
          >
            {renderMealPlanContent(previewDate, true)}
          </Animated.View>
        )}

        {previewDate && swipeDirection === 'left' && (
          <Animated.View 
            style={[
              styles.mealPlanContainer,
              styles.previewContainer,
              styles.rightPreview,
              {
                transform: [{ 
                  translateX: swipeAnimation.interpolate({
                    inputRange: [-windowWidth * 0.8, 0],
                    outputRange: [0, windowWidth],
                    extrapolate: 'clamp'
                  })
                }]
              }
            ]}
          >
            {renderMealPlanContent(previewDate, true)}
          </Animated.View>
        )}

        {/* Snack Position Modal */}
        <SnackPositionModal
          visible={showSnackModal}
          onClose={() => setShowSnackModal(false)}
          onConfirm={handleAddSnack}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mealPlanContainer: {
    flex: 1,
    width: windowWidth,
  },
  previewContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    opacity: 0.7,
  },
  leftPreview: {
    left: 0,
  },
  rightPreview: {
    right: 0,
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
  },
  dateTitle: {
    fontSize: 20,
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
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 30,
  },
  generateText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});