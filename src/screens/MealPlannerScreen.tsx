// src/screens/MealPlannerScreen.tsx
// 🔧 UPRAVED: Generate button v header + původní swipe

import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../stores/userStore';
import { useMealStore } from '../stores/mealStore';
import { Calendar } from '../components/Calendar';
import { DailyMealPlan } from '../components/DailyMealPlan';
import { updateMealPlansWithSnackPositions } from '../utils/mealPlannerHelper';
import { getWeekDates, getMonthTitle, getNextDay, getPreviousDay, isSameDay } from '../utils/dateUtils';

// 🔧 UPRAVED UserDropdown s Generate buttonem
function UserDropdown() {
  const users = useUserStore((state) => state.users);
  const selectedUser = useUserStore((state) => state.selectedUser);
  const setSelectedUser = useUserStore((state) => state.setSelectedUser);
  const [isOpen, setIsOpen] = useState(false);

  if (!selectedUser) return null;

  return (
    <View style={styles.dropdown}>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.dropdownButtonText}>{selectedUser.name}</Text>
        <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownMenu}>
          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedUser(user);
                setIsOpen(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                selectedUser.id === user.id && styles.selectedDropdownItem
              ]}>
                {user.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const MealPlannerScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(() => getWeekDates(new Date()));
  const [isGenerating, setIsGenerating] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Reference pro DailyMealPlan komponentu
  const dailyMealPlanRef = useRef<any>(null);

  // Store hooks
  const selectedUser = useUserStore((state) => state.selectedUser);
  const mealStore = useMealStore();

  // Synchronization effect
  useEffect(() => {
    if (selectedUser?.mealPreferences) {
      syncMealPlansWithPreferences();
    }
  }, [selectedUser?.mealPreferences]);

  const syncMealPlansWithPreferences = () => {
    if (!selectedUser?.mealPreferences) return;
    
    const { snackPositions } = selectedUser.mealPreferences;
    
    const updatedMealPlans = updateMealPlansWithSnackPositions(
      mealStore.mealPlans,
      selectedUser.id,
      selectedDate,
      snackPositions
    );
    
    mealStore.setMealPlans(updatedMealPlans);
    
    if (dailyMealPlanRef.current?.forceRefresh) {
      dailyMealPlanRef.current.forceRefresh();
    }
  };

  // 🔧 NOVÝ: Generate meal plan handler
  const handleGeneratePress = async () => {
    if (!selectedUser || isGenerating) return;
    
    console.log('🎯 Starting meal plan generation for:', selectedDate.toISOString().split('T')[0]);
    
    try {
      setIsGenerating(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      const success = await mealStore.generateMealPlan(selectedUser.id, dateString, selectedUser);
      
      if (success) {
        console.log('✅ Meal plan generated successfully');
        
        // Force refresh UI
        if (dailyMealPlanRef.current?.forceRefresh) {
          dailyMealPlanRef.current.forceRefresh();
        }
      } else {
        console.error('❌ Meal plan generation failed');
      }
    } catch (error) {
      console.error('💥 Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to check if date is today or in the future
  const isDateTodayOrFuture = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate >= today;
  };

  // Calendar helpers
  const monthTitle = getMonthTitle(selectedDate);

  const handleDateSelect = (date: Date) => {
    const currentDate = selectedDate;
    const newDate = date;
    
    if (isSameDay(currentDate, newDate)) {
      return;
    }
    
    const isGoingToFuture = newDate > currentDate;
    
    if (dailyMealPlanRef.current && dailyMealPlanRef.current.animateToDate) {
      dailyMealPlanRef.current.animateToDate(newDate, isGoingToFuture ? 'left' : 'right');
    } else {
      setSelectedDate(newDate);
      updateWeekIfNeeded(newDate);
    }
  };

  const updateWeekIfNeeded = (date: Date) => {
    const isDateInCurrentWeek = weekDates.some(weekDate => 
      isSameDay(weekDate, date)
    );
    
    if (!isDateInCurrentWeek) {
      const newWeekDates = getWeekDates(date);
      setWeekDates(newWeekDates);
    }
  };

  const handlePreviousWeek = () => {
    const newDate = getPreviousDay(weekDates[0]);
    const newWeekDates = getWeekDates(newDate);
    setWeekDates(newWeekDates);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = getNextDay(weekDates[6]);
    const newWeekDates = getWeekDates(newDate);
    setWeekDates(newWeekDates);
    setSelectedDate(newDate);
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    updateWeekIfNeeded(newDate);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      {/* 🔧 UPRAVED: Header s Generate buttonem */}
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          {/* 🔧 NOVÝ: Generate button vlevo */}
          {isDateTodayOrFuture(selectedDate) && (
            <TouchableOpacity 
              style={[styles.generateButton, isGenerating && styles.generatingButton]}
              onPress={handleGeneratePress}
              disabled={isGenerating}
              activeOpacity={0.7}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Plan</Text>
              )}
            </TouchableOpacity>
          )}
          
          {/* Spacer */}
          <View style={styles.spacer} />
          
          {/* User dropdown vpravo */}
          <UserDropdown />
        </View>
      </View>

      <Calendar
        key={`${selectedDate.toISOString().split('T')[0]}-${weekDates[0].toISOString().split('T')[0]}`}
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        weekDates={weekDates}
        monthTitle={monthTitle}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
      />

      {/* 🔧 UPRAVED: DailyMealPlan bez Generate button */}
      <DailyMealPlan 
        ref={dailyMealPlanRef}
        selectedDate={selectedDate} 
        onDateChange={handleDateChange}
        // Odstraněno onGeneratePress a isGenerating
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusBarSeparator: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  
  // 🔧 NOVÝ: Generate button styly
  generateButton: {
    backgroundColor: '#FFB347',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  generatingButton: {
    backgroundColor: '#ffa500',
    opacity: 0.8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  spacer: {
    flex: 1,
  },
  
  // Původní dropdown styly
  dropdown: {
    position: 'relative',
    minWidth: 120,
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1001,
    minWidth: 150,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedDropdownItem: {
    color: '#FFB347',
    fontWeight: '600',
  },
});

export default MealPlannerScreen;