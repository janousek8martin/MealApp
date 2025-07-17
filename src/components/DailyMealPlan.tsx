// src/components/DailyMealPlan.tsx
// 🔧 OPRAVED: Původní swipe přes celou obrazovku, bez Generate button

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  ScrollView,
  Dimensions
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useMealStore } from '../stores/mealStore';
import { useUserStore } from '../stores/userStore';

const { width: windowWidth } = Dimensions.get('window');

interface DailyMealPlanProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export interface DailyMealPlanRef {
  animateToDate: (newDate: Date, direction: 'left' | 'right') => void;
  forceRefresh: () => void;
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
    // Force refresh state
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Swipe state
    const swipeAnimation = useRef(new Animated.Value(0)).current;
    const isSwipingRef = useRef(false);
    const [previewDate, setPreviewDate] = useState<Date | null>(null);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    
    // Store hooks
    const { getMealPlan, addMeal, removeMeal, resetDay } = useMealStore();
    const selectedUser = useUserStore(state => state.selectedUser);

    if (!selectedUser) {
      return (
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No user selected</Text>
            <Text style={styles.emptyStateSubtext}>Please select a user profile to view meal plans</Text>
          </View>
        </View>
      );
    }

    // useImperativeHandle
    useImperativeHandle(ref, () => ({
      animateToDate: (newDate: Date, direction: 'left' | 'right') => {
        if (isSwipingRef.current) return;
        
        isSwipingRef.current = true;
        setPreviewDate(newDate);
        setSwipeDirection(direction);
        
        const targetValue = direction === 'left' ? -windowWidth : windowWidth;
        
        Animated.timing(swipeAnimation, {
          toValue: targetValue,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          if (onDateChange) {
            onDateChange(newDate);
          }
          setTimeout(() => {
            swipeAnimation.setValue(0);
            isSwipingRef.current = false;
            setPreviewDate(null);
            setSwipeDirection(null);
          }, 0);
        });
      },
      
      forceRefresh: () => {
        console.log('🔄 DailyMealPlan: Force refresh triggered');
        setRefreshKey(prev => prev + 1);
      }
    }));

    // Reset animation when date changes externally
    useEffect(() => {
      if (!isSwipingRef.current) {
        swipeAnimation.setValue(0);
        setPreviewDate(null);
        setSwipeDirection(null);
      }
    }, [selectedDate]);

    // Apply meal preferences when date changes
    useEffect(() => {
      if (selectedUser?.mealPreferences?.snackPositions && isDateTodayOrFuture(selectedDate)) {
        const currentDateStr = selectedDate.toISOString().split('T')[0];
        const mealPlan = getMealPlan(selectedUser.id, currentDateStr);
        
        if (!mealPlan || !mealPlan.meals || mealPlan.meals.length === 0) {
          console.log('📅 Applying meal preferences for date:', currentDateStr);
          applyMealPreferencesToDate(selectedUser.id, selectedDate, selectedUser.mealPreferences, addMeal);
        }
      }
    }, [selectedDate, selectedUser, addMeal, getMealPlan, refreshKey]);

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

    const handleRemoveMeal = (mealId: string) => {
      const currentDateStr = selectedDate.toISOString().split('T')[0];
      removeMeal(selectedUser.id, currentDateStr, mealId);
    };

    // Get current meal plan
    const currentDateStr = selectedDate.toISOString().split('T')[0];
    const currentMealPlan = getMealPlan(selectedUser.id, currentDateStr);
    const currentMeals = currentMealPlan?.meals || [];

    // Správné řazení meals podle časového pořadí
    const sortedMeals = [...currentMeals].sort((a, b) => {
      const getTimeOrder = (meal: any) => {
        if (meal.type === 'Breakfast') return 1;
        if (meal.type === 'Snack' && meal.position === 'Between Breakfast and Lunch') return 2;
        if (meal.type === 'Lunch') return 3;
        if (meal.type === 'Snack' && meal.position === 'Between Lunch and Dinner') return 4;
        if (meal.type === 'Dinner') return 5;
        if (meal.type === 'Snack' && meal.position === 'Before Breakfast') return 0;
        if (meal.type === 'Snack' && meal.position === 'After Dinner') return 6;
        return 99;
      };
      return getTimeOrder(a) - getTimeOrder(b);
    });

    // 🔧 OPRAVENO: Lepší rozlišení mezi swipe a scroll
    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: swipeAnimation } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX, translationY, velocityX, velocityY } = event.nativeEvent;
        
        // Rozlišení mezi horizontálním swipe a vertikálním scrollem
        const horizontalDistance = Math.abs(translationX);
        const verticalDistance = Math.abs(translationY);
        const horizontalVelocity = Math.abs(velocityX);
        const verticalVelocity = Math.abs(velocityY);
        
        // Je to horizontální gesto?
        const isHorizontalGesture = horizontalDistance > verticalDistance * 1.5;
        
        // Je to vertikální gesto (scroll)?
        const isVerticalGesture = verticalDistance > horizontalDistance * 1.5;
        
        // Pokud je to jasně vertikální, ignoruj
        if (isVerticalGesture) {
          Animated.spring(swipeAnimation, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          return;
        }
        
        // Pro swipe potřebujeme: horizontální gesto + dostatečnou vzdálenost NEBO rychlost
        const threshold = windowWidth * 0.35; // Zvýšený threshold - méně citlivé
        const velocityThreshold = 1200; // Zvýšený velocity threshold
        
        const hasEnoughDistance = horizontalDistance > threshold;
        const hasEnoughVelocity = horizontalVelocity > velocityThreshold;
        const shouldSwipe = isHorizontalGesture && (hasEnoughDistance || hasEnoughVelocity);

        if (shouldSwipe) {
          const direction = translationX > 0 ? 'right' : 'left';
          const targetDate = direction === 'right' ? getPreviousDay(selectedDate) : getNextDay(selectedDate);
          
          isSwipingRef.current = true;
          setPreviewDate(targetDate);
          setSwipeDirection(direction);
          
          const targetValue = direction === 'right' ? windowWidth : -windowWidth;
          
          Animated.timing(swipeAnimation, {
            toValue: targetValue,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDateChange?.(targetDate);
            setTimeout(() => {
              swipeAnimation.setValue(0);
              isSwipingRef.current = false;
              setPreviewDate(null);
              setSwipeDirection(null);
            }, 0);
          });
        } else {
          Animated.spring(swipeAnimation, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      }
    };

    return (
      <View style={styles.container}>
        {/* 🔧 OPRAVENO: PanGestureHandler s lepší konfigurací pro scroll + swipe */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-50, 50]}    // Větší offset - méně citlivé na horizontální pohyb
          failOffsetY={[-20, 20]}      // Menší offset - rychleji pustí vertikální scroll
          shouldCancelWhenOutside={true}
        >
          <Animated.View 
            style={[
              styles.animatedContainer,
              {
                transform: [{ translateX: swipeAnimation }]
              }
            ]}
          >
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {sortedMeals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>🍽️</Text>
                  <Text style={styles.emptyStateText}>No meals planned for this day</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Use the Generate button in the header to create an optimized meal plan
                  </Text>
                  
                  {selectedUser && (
                    <View style={styles.debugInfo}>
                      <Text style={styles.debugTitle}>User Setup Status:</Text>
                      <Text style={styles.debugItem}>
                        TDCI: {selectedUser.tdci?.adjustedTDCI ? '✅' : '❌'} 
                        {selectedUser.tdci?.adjustedTDCI && ` (${Math.round(selectedUser.tdci.adjustedTDCI)} cal)`}
                      </Text>
                      <Text style={styles.debugItem}>
                        Meal Preferences: {selectedUser.mealPreferences ? '✅' : '❌'} 
                        {selectedUser.mealPreferences?.snackPositions && ` (${selectedUser.mealPreferences.snackPositions.length} snacks)`}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  {/* Meal Items */}
                  {sortedMeals.map((meal, index) => (
                    <View key={`${meal.id}-${refreshKey}`} style={styles.mealItem}>
                      <View style={styles.mealHeader}>
                        <View style={styles.mealTypeContainer}>
                          <Text style={styles.mealIcon}>
                            {meal.type === 'Breakfast' ? '🥐' : 
                             meal.type === 'Lunch' ? '🥗' : 
                             meal.type === 'Dinner' ? '🍽️' : '🍎'}
                          </Text>
                          <Text style={styles.mealType}>{meal.type}</Text>
                        </View>
                        
                        {meal.position && meal.position !== meal.type && (
                          <Text style={styles.mealPosition}>({meal.position})</Text>
                        )}
                      </View>
                      
                      <Text style={styles.mealName}>
                        {meal.name || 'Not planned yet'}
                      </Text>
                      
                      <View style={styles.mealNutrition}>
                        <Text style={styles.nutritionText}>
                          Calories: {meal.calories || '--'} | 
                          Protein: {meal.protein || '--'}g | 
                          Carbs: {meal.carbs || '--'}g | 
                          Fat: {meal.fat || '--'}g
                        </Text>
                      </View>
                      
                      <View style={styles.mealActions}>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => console.log('Edit meal:', meal.id)}
                        >
                          <Text style={styles.editButtonText}>✏️ Edit</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => {
                            handleRemoveMeal(meal.id);
                            setRefreshKey(prev => prev + 1);
                          }}
                        >
                          <Text style={styles.deleteButtonText}>🗑️ Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  
                  {/* Daily totals */}
                  <View style={styles.dailyTotals}>
                    <Text style={styles.dailyTotalsTitle}>Daily Totals</Text>
                    <Text style={styles.dailyTotalsText}>
                      Calories: {sortedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0)} | 
                      Protein: {sortedMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0)}g | 
                      Carbs: {sortedMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0)}g | 
                      Fat: {sortedMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0)}g
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  }
);

DailyMealPlan.displayName = 'DailyMealPlan';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  animatedContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    minHeight: 400,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  debugInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  debugItem: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  mealItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#ff7f50',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeContainer: {
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
  mealPosition: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  mealName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 8,
  },
  mealNutrition: {
    marginBottom: 12,
  },
  nutritionText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  editButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  dailyTotals: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  dailyTotalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  dailyTotalsText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
});

export default DailyMealPlan;