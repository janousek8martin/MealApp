// src/screens/MealPlannerScreen.tsx
// PŮVODNÍ KOMPLETNÍ VERZE - jen s opravenými helper funkcemi

import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../stores/userStore';
import { useMealStore } from '../stores/mealStore';
import { Calendar } from '../components/Calendar';
import { DailyMealPlan } from '../components/DailyMealPlan';
import { updateMealPlansWithSnackPositions } from '../utils/mealPlannerHelper'; // ✅ Helper import
import { getWeekDates, getMonthTitle, getNextDay, getPreviousDay, isSameDay } from '../utils/dateUtils';

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
  const insets = useSafeAreaInsets();
  
  // Reference pro DailyMealPlan komponentu
  const dailyMealPlanRef = useRef<any>(null);

  // 🔄 REAL-TIME SYNCHRONIZATION: Sledování změn v user preferences
  const selectedUser = useUserStore((state) => state.selectedUser);
  const mealStore = useMealStore();
  
  // ⚡ AUTOMATIC UPDATE: Když se změní meal preferences, aktualizuj všechny meal plany
  useEffect(() => {
    if (selectedUser?.mealPreferences) {
        syncMealPlansWithPreferences();
    }
  }, [selectedUser?.mealPreferences]);

  // 🛠️ SYNCHRONIZATION FUNCTION: Hlavní funkce pro synchronizaci
  const syncMealPlansWithPreferences = () => {
    if (!selectedUser?.mealPreferences) return;
    
    const { snackPositions } = selectedUser.mealPreferences;
    
    // ✅ OPRAVENO: Používáme helper funkci místo inline kódu
    const updatedMealPlans = updateMealPlansWithSnackPositions(
      mealStore.mealPlans,    // allMealPlans
      selectedUser.id,        // selectedUserId
      selectedDate,           // selectedDate
      snackPositions          // snackPositions
    );
    
    // 💾 SAVE: Aktualizuj store a vyvolej re-render
    mealStore.setMealPlans(updatedMealPlans);
    
    // 📱 REFRESH UI: Informuj DailyMealPlan komponentu o změnách
    if (dailyMealPlanRef.current?.forceRefresh) {
      dailyMealPlanRef.current.forceRefresh();
    }
  };

  // ✅ Smart meal plan generation
  const handleGeneratePress = async () => {
    if (!selectedUser) return;
    
    console.log('🎯 Starting meal plan generation for:', selectedDate.toISOString().split('T')[0]);
    
    try {
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
    }
  };

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
      
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
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

      <DailyMealPlan 
        ref={dailyMealPlanRef}
        selectedDate={selectedDate} 
        onDateChange={handleDateChange}
        onGeneratePress={handleGeneratePress}
        isGenerating={false} // Můžete přidat state pokud chcete
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
    paddingVertical: 10,
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
    justifyContent: 'flex-end',
  },
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