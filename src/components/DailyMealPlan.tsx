// src/components/DailyMealPlan.tsx
// 🔧 OPRAVA: Duplicitní snacky a selectedUser null checks

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  ScrollView,
  Dimensions,
  Modal
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useMealStore } from '../stores/mealStore';
import { useUserStore } from '../stores/userStore';
import { Meal } from '../types/meal';
import { MealContainer } from './MealContainer';

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

// Meal Detail Modal komponenta
const MealDetailModal: React.FC<{
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
}> = ({ visible, meal, onClose }) => {
  if (!visible || !meal) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{meal.name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalText}>Recipe details for {meal.name}</Text>
            <Text style={styles.modalSubtext}>
              Calories: {meal.calories || '--'} | 
              Protein: {meal.protein || '--'}g | 
              Carbs: {meal.carbs || '--'}g | 
              Fat: {meal.fat || '--'}g
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const DailyMealPlan = forwardRef<DailyMealPlanRef, DailyMealPlanProps>(
  ({ selectedDate, onDateChange }, ref) => {
    // Force refresh state
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Swipe state
    const [previewDate, setPreviewDate] = useState<Date | null>(null);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const swipeAnimation = useRef(new Animated.Value(0)).current;
    const isSwipingRef = useRef(false);

    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

    // Store hooks
    const selectedUser = useUserStore((state) => state.selectedUser);
    const { getMealPlan, addMeal, removeMeal } = useMealStore();

    // 🔧 OPRAVA: Null check pro selectedUser
    if (!selectedUser) {
      return (
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No user selected</Text>
            <Text style={styles.emptyStateSubtext}>Please select a user to view meal plan</Text>
          </View>
        </View>
      );
    }

    // 🔧 NOVÉ: Funkce pro odstranění snack kontejneru
    const handleRemoveSnack = (snackMeal: Meal) => {
      const currentDateStr = selectedDate.toISOString().split('T')[0];
      // Najdeme všechny snacky se stejnou pozicí a odstraníme je
      const mealPlan = getMealPlan(selectedUser.id, currentDateStr);
      const snacksToRemove = mealPlan?.meals?.filter(
        m => m.type === 'Snack' && m.position === snackMeal.position
      ) || [];
      
      snacksToRemove.forEach(snack => {
        removeMeal(selectedUser.id, currentDateStr, snack.id);
      });
    };

    // 🔧 NOVÉ: Funkce pro odstranění konkrétního jídla
    const handleDeleteMeal = (meal: Meal) => {
      const currentDateStr = selectedDate.toISOString().split('T')[0];
      removeMeal(selectedUser.id, currentDateStr, meal.id);
    };

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      animateToDate: (newDate: Date, direction: 'left' | 'right') => {
        const animationValue = direction === 'left' ? -windowWidth : windowWidth;
        
        Animated.timing(swipeAnimation, {
          toValue: animationValue,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          swipeAnimation.setValue(0);
          if (onDateChange) {
            onDateChange(newDate);
          }
        });
      },
      forceRefresh: () => {
        setRefreshKey(prev => prev + 1);
      }
    }), [onDateChange]);

    // 🔧 OPRAVA: Odstraněn problematický useEffect který způsoboval duplicitní snacky
    // Snacky by se měly přidávat pouze manuálně nebo přes Generate button, ne automaticky

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

    // Handler pro otevření meal detailů
    const handleViewMealDetails = (meal: Meal) => {
      setSelectedMeal(meal);
      setIsModalVisible(true);
    };

    const handleCloseModal = () => {
      setIsModalVisible(false);
      setSelectedMeal(null);
    };

    // Funkce pro render s MealContainer komponentami
    const renderMealPlanContent = (date: Date, isPreview = false) => {
      const dateStr = date.toISOString().split('T')[0];
      const mealPlan = getMealPlan(selectedUser.id, dateStr);
      const meals = mealPlan?.meals || [];
      
      // Organizace jídel podle typu
      const breakfast = meals.find(m => m.type === 'Breakfast');
      const lunch = meals.find(m => m.type === 'Lunch');
      const dinner = meals.find(m => m.type === 'Dinner');
      const snacks = meals.filter(m => m.type === 'Snack');
      
      // Sorted snacks podle pozice
      const sortedSnacks = [...snacks].sort((a, b) => {
        const getTimeOrder = (meal: Meal) => {
          if (meal.position === 'Before Breakfast') return 0;
          if (meal.position === 'Between Breakfast and Lunch') return 2;
          if (meal.position === 'Between Lunch and Dinner') return 4;
          if (meal.position === 'After Dinner') return 6;
          return 99;
        };
        return getTimeOrder(a) - getTimeOrder(b);
      });

      return (
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={!isPreview}
          scrollEnabled={!isPreview}
          bounces={!isPreview}
        >
          {/* Before Breakfast Snacks */}
          {sortedSnacks.filter(s => s.position === 'Before Breakfast').map((meal, index) => (
            <MealContainer
              key={`${meal.id}-${isPreview ? 'preview' : 'current'}-${refreshKey}`}
              mealType="Snack"
              meal={meal}
              onViewDetails={handleViewMealDetails}
              onRemoveSnack={() => handleRemoveSnack(meal)}
              onDeleteMeal={() => handleDeleteMeal(meal)}
              refreshKey={refreshKey}
            />
          ))}

          {/* BREAKFAST CONTAINER */}
          <MealContainer
            mealType="Breakfast"
            meal={breakfast || null}
            onViewDetails={handleViewMealDetails}
            onDeleteMeal={breakfast ? () => handleDeleteMeal(breakfast) : undefined}
            refreshKey={refreshKey}
          />

          {/* Between Breakfast and Lunch Snacks */}
          {sortedSnacks.filter(s => s.position === 'Between Breakfast and Lunch').map((meal, index) => (
            <MealContainer
              key={`${meal.id}-${isPreview ? 'preview' : 'current'}-${refreshKey}`}
              mealType="Snack"
              meal={meal}
              onViewDetails={handleViewMealDetails}
              onRemoveSnack={() => handleRemoveSnack(meal)}
              onDeleteMeal={() => handleDeleteMeal(meal)}
              refreshKey={refreshKey}
            />
          ))}

          {/* LUNCH CONTAINER */}
          <MealContainer
            mealType="Lunch"
            meal={lunch || null}
            onViewDetails={handleViewMealDetails}
            onDeleteMeal={lunch ? () => handleDeleteMeal(lunch) : undefined}
            refreshKey={refreshKey}
          />

          {/* Between Lunch and Dinner Snacks */}
          {sortedSnacks.filter(s => s.position === 'Between Lunch and Dinner').map((meal, index) => (
            <MealContainer
              key={`${meal.id}-${isPreview ? 'preview' : 'current'}-${refreshKey}`}
              mealType="Snack"
              meal={meal}
              onViewDetails={handleViewMealDetails}
              onRemoveSnack={() => handleRemoveSnack(meal)}
              onDeleteMeal={() => handleDeleteMeal(meal)}
              refreshKey={refreshKey}
            />
          ))}

          {/* DINNER CONTAINER */}
          <MealContainer
            mealType="Dinner"
            meal={dinner || null}
            onViewDetails={handleViewMealDetails}
            onDeleteMeal={dinner ? () => handleDeleteMeal(dinner) : undefined}
            refreshKey={refreshKey}
          />

          {/* After Dinner Snacks */}
          {sortedSnacks.filter(s => s.position === 'After Dinner').map((meal, index) => (
            <MealContainer
              key={`${meal.id}-${isPreview ? 'preview' : 'current'}-${refreshKey}`}
              mealType="Snack"
              meal={meal}
              onViewDetails={handleViewMealDetails}
              onRemoveSnack={() => handleRemoveSnack(meal)}
              onDeleteMeal={() => handleDeleteMeal(meal)}
              refreshKey={refreshKey}
            />
          ))}

          {/* Empty state pokud nejsou žádná jídla */}
          {meals.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No meals planned for this day</Text>
              <Text style={styles.emptyStateSubtext}>
                Use the Generate button to create a meal plan or add meals manually
              </Text>
            </View>
          )}
        </ScrollView>
      );
    };

    // Gesture handlers
    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: swipeAnimation } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: any) => {
      if (event.nativeEvent.state === State.BEGAN) {
        isSwipingRef.current = true;
      } else if (event.nativeEvent.state === State.ACTIVE) {
        const { translationX } = event.nativeEvent;
        
        if (Math.abs(translationX) > 50 && !previewDate) {
          const direction = translationX > 0 ? 'right' : 'left';
          const nextDate = direction === 'left' ? getNextDay(selectedDate) : getPreviousDay(selectedDate);
          
          setPreviewDate(nextDate);
          setSwipeDirection(direction);
        }
      } else if (event.nativeEvent.state === State.END) {
        const { translationX } = event.nativeEvent;
        
        if (Math.abs(translationX) > windowWidth / 3) {
          const direction = translationX > 0 ? 'right' : 'left';
          const newDate = direction === 'right' ? getPreviousDay(selectedDate) : getNextDay(selectedDate);
          
          if (onDateChange) {
            onDateChange(newDate);
          }
          
          const animationValue = direction === 'right' ? windowWidth : -windowWidth;
          
          Animated.timing(swipeAnimation, {
            toValue: animationValue,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            swipeAnimation.setValue(0);
            setPreviewDate(null);
            setSwipeDirection(null);
            isSwipingRef.current = false;
          });
        } else {
          Animated.spring(swipeAnimation, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setPreviewDate(null);
          setSwipeDirection(null);
          isSwipingRef.current = false;
        }
      }
    };

    return (
      <View style={styles.container}>
        {/* Preview container */}
        {previewDate && (
          <Animated.View 
            style={[
              styles.previewContainer,
              {
                transform: [{
                  translateX: swipeDirection === 'left' 
                    ? Animated.add(swipeAnimation, windowWidth)
                    : Animated.add(swipeAnimation, -windowWidth)
                }]
              }
            ]}
          >
            {renderMealPlanContent(previewDate, true)}
          </Animated.View>
        )}

        {/* Current page s gesture handler */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-50, 50]}
          failOffsetY={[-20, 20]}
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
            {renderMealPlanContent(selectedDate, false)}
          </Animated.View>
        </PanGestureHandler>

        {/* Meal Detail Modal */}
        <MealDetailModal
          visible={isModalVisible}
          meal={selectedMeal}
          onClose={handleCloseModal}
        />
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
  previewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: windowWidth,
    height: '100%',
    backgroundColor: '#f8f9fa',
    opacity: 0.9,
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6c757d',
  },
  modalBody: {
    paddingVertical: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 8,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#6c757d',
  },
});