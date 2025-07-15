// src/components/DailyMealPlan.tsx
// VAŠE PŮVODNÍ VERZE + pouze generateMealPlan funkcionalita

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
// ✅ OPRAVENO: Správné importy pro gesture handling
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useMealStore } from '../stores/mealStore';
import { useUserStore } from '../stores/userStore';

const { width: windowWidth } = Dimensions.get('window');

interface DailyMealPlanProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onGeneratePress?: () => void;
  isGenerating?: boolean;
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
  ({ selectedDate, onDateChange, onGeneratePress, isGenerating }, ref) => {
    // ✅ FORCE REFRESH STATE
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Existing state
    const [showSnackModal, setShowSnackModal] = useState(false);
    const swipeAnimation = useRef(new Animated.Value(0)).current;
    const isSwipingRef = useRef(false);
    const [previewDate, setPreviewDate] = useState<Date | null>(null);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    
    // ✅ PŘIDÁNO: generateMealPlan z mealStore
    const { getMealPlan, addMeal, removeMeal, resetDay, generateMealPlan } = useMealStore();
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

    // ✅ UPDATED useImperativeHandle with forceRefresh + ORIGINAL animateToDate
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
      },
      
      // ✅ NEW forceRefresh METHOD
      forceRefresh: () => {
        console.log('🔄 DailyMealPlan: Force refresh triggered');
        setRefreshKey(prev => prev + 1);
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

    // ✅ UPDATED useEffect with refreshKey dependency + ORIGINAL meal preferences logic
    useEffect(() => {
      if (selectedUser?.mealPreferences?.snackPositions && isDateTodayOrFuture(selectedDate)) {
        const currentDateStr = selectedDate.toISOString().split('T')[0];
        const mealPlan = getMealPlan(selectedUser.id, currentDateStr);
        
        // If no meal plan exists for this date, apply preferences
        if (!mealPlan || !mealPlan.meals || mealPlan.meals.length === 0) {
          console.log('📅 Applying meal preferences for date:', currentDateStr);
          applyMealPreferencesToDate(selectedUser.id, selectedDate, selectedUser.mealPreferences, addMeal);
        }
      }
    }, [selectedDate, selectedUser, addMeal, getMealPlan, refreshKey]); // ← Added refreshKey

    // ORIGINAL Helper functions
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

    // Get current meal plan
    const currentDateStr = selectedDate.toISOString().split('T')[0];
    const currentMealPlan = getMealPlan(selectedUser.id, currentDateStr);
    const currentMeals = currentMealPlan?.meals || [];

    // Sort meals by logical order
    const sortedMeals = currentMeals.sort((a: any, b: any) => {
      const mealOrder = { 'Breakfast': 1, 'Lunch': 3, 'Dinner': 5, 'Snack': 2 };
      const aOrder = mealOrder[a.type as keyof typeof mealOrder] || 4;
      const bOrder = mealOrder[b.type as keyof typeof mealOrder] || 4;
      return aOrder - bOrder;
    });

    // ORIGINAL Pan gesture handler for swipe functionality
    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: swipeAnimation } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX, velocityX } = event.nativeEvent;
        const threshold = windowWidth * 0.25;
        const shouldSwipe = Math.abs(translationX) > threshold || Math.abs(velocityX) > 1000;

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
      <GestureHandlerRootView style={styles.container}>
        {/* ✅ PŘIDÁNO: Generation Button */}
        {onGeneratePress && (
          <View style={styles.generateContainer}>
            <TouchableOpacity
              style={[
                styles.generateButton,
                isGenerating && styles.generatingButton
              ]}
              onPress={onGeneratePress}
              disabled={isGenerating}
            >
              <View style={styles.generateButtonContent}>
                {isGenerating ? (
                  <>
                    <ActivityIndicator 
                      size="small" 
                      color="#FFFFFF" 
                      style={styles.generateButtonIcon}
                    />
                    <Text style={[styles.generateButtonText, styles.generatingButtonText]}>
                      Generating...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.generateButtonIcon}>🎯</Text>
                    <Text style={styles.generateButtonText}>
                      Generate Meal Plan
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Debug info during development */}
            <Text style={styles.debugText}>
              Date: {currentDateStr} | Meals: {currentMeals.length} | Refresh: {refreshKey}
            </Text>
          </View>
        )}

        {/* ORIGINAL PanGestureHandler for swipe functionality */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View 
            style={[
              styles.mealListContainer,
              {
                transform: [{ translateX: swipeAnimation }]
              }
            ]}
          >
            <ScrollView style={styles.mealList} showsVerticalScrollIndicator={false}>
              {sortedMeals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>🍽️</Text>
                  <Text style={styles.emptyStateText}>No meals planned for this day</Text>
                  <Text style={styles.emptyStateSubtext}>
                    {onGeneratePress 
                      ? 'Tap "Generate Meal Plan" to create an optimized meal plan' 
                      : 'Add meals to get started with your daily plan'
                    }
                  </Text>
                  
                  {/* User info for debugging */}
                  {selectedUser && (
                    <View style={styles.debugInfo}>
                      <Text style={styles.debugTitle}>User Setup Status:</Text>
                      <Text style={styles.debugItem}>
                        TDCI: {selectedUser.tdci?.adjustedTDCI ? '✅' : '❌'} 
                        {selectedUser.tdci?.adjustedTDCI && ` (${Math.round(selectedUser.tdci.adjustedTDCI)} cal)`}
                      </Text>
                      <Text style={styles.debugItem}>
                        Meal Preferences: {selectedUser.mealPreferences ? '✅' : '❌'}
                        {selectedUser.mealPreferences?.snackPositions && 
                          ` (${selectedUser.mealPreferences.snackPositions.length} snacks)`
                        }
                      </Text>
                      <Text style={styles.debugItem}>
                        Avoid Meals: {selectedUser.avoidMeals ? `${selectedUser.avoidMeals.length} items` : 'None'}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                sortedMeals.map((meal: any, index: number) => (
                  <View key={`${meal.id}-${refreshKey}`} style={styles.mealItem}>
                    <View style={styles.mealHeader}>
                      <View style={styles.mealTypeContainer}>
                        <Text style={styles.mealTypeIcon}>
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
                    
                    {/* ✅ UPRAVENO: Zobrazuje skutečné nutrition info nebo placeholder */}
                    <View style={styles.mealNutrition}>
                      <Text style={styles.nutritionText}>
                        Calories: {meal.calories || '--'} | Protein: {meal.protein || '--'}g | Carbs: {meal.carbs || '--'}g | Fat: {meal.fat || '--'}g
                      </Text>
                    </View>
                    
                    {/* Action buttons */}
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
                          removeMeal(selectedUser.id, currentDateStr, meal.id);
                          setRefreshKey(prev => prev + 1); // ✅ PŘIDÁNO: Force refresh při smazání
                        }}
                      >
                        <Text style={styles.deleteButtonText}>🗑️ Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // ✅ PŘIDÁNO: Styly pro Generation Button
  generateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  generateButton: {
    backgroundColor: '#FFB347',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generatingButton: {
    backgroundColor: '#FF8C00',
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  generatingButtonText: {
    color: '#FFFFFF',
  },
  debugText: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
    marginTop: 5,
  },
  // PŮVODNÍ STYLY
  mealListContainer: {
    flex: 1,
  },
  mealList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  debugInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  debugItem: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 3,
  },
  mealItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB347',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  mealTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  mealPosition: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  mealName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  mealNutrition: {
    marginBottom: 12,
  },
  nutritionText: {
    fontSize: 12,
    color: '#888888',
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 12,
    color: '#1976D2',
    textAlign: 'center',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#D32F2F',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default DailyMealPlan;