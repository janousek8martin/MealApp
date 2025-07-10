// ===== 1. UPDATED MealPlannerScreen.tsx =====
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../stores/userStore';
import { useMealStore } from '../stores/mealStore';
import { Calendar } from '../components/Calendar';
import { DailyMealPlan } from '../components/DailyMealPlan';
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
    
    // Získej všechny meal plany
    const allMealPlans = { ...mealStore.mealPlans };
    
    // 🏗️ HELPER: Vytvoř default meal plan pro datum
    const createDefaultMealPlan = (dateStr: string) => {
      const mainMeals = [
        { 
          id: `breakfast-${dateStr}`, 
          userId: selectedUser.id, 
          date: dateStr, 
          type: 'Breakfast' as const, 
          name: '', 
          position: 'Breakfast' 
        },
        { 
          id: `lunch-${dateStr}`, 
          userId: selectedUser.id, 
          date: dateStr, 
          type: 'Lunch' as const, 
          name: '', 
          position: 'Lunch' 
        },
        { 
          id: `dinner-${dateStr}`, 
          userId: selectedUser.id, 
          date: dateStr, 
          type: 'Dinner' as const, 
          name: '', 
          position: 'Dinner' 
        }
      ];
      
      const snacks = snackPositions.map((position, index) => ({
        id: `snack-${position.replace(/\s+/g, '')}-${dateStr}-${index}`,
        userId: selectedUser.id,
        date: dateStr,
        type: 'Snack' as const,
        name: 'Snack',
        position: position
      }));
      
      return {
        id: `${selectedUser.id}-${dateStr}`,
        userId: selectedUser.id,
        date: dateStr,
        meals: [...mainMeals, ...snacks]
      };
    };
    
    // 🔄 UPDATE EXISTING: Aktualizuj existující meal plany
    Object.keys(allMealPlans).forEach(key => {
      if (key.startsWith(selectedUser.id + '-')) {
        const dateStr = key.split('-')[1];
        const currentMealPlan = allMealPlans[key];
        
        // Zachovej existující hlavní jídla a jejich obsah
        const existingMainMeals = currentMealPlan.meals.filter(meal => 
          meal.type !== 'Snack'
        );
        
        // Vytvoř nové snacky podle aktuálních preferences
        const newSnacks = snackPositions.map((position, index) => ({
          id: `snack-${position.replace(/\s+/g, '')}-${dateStr}-${index}`,
          userId: selectedUser.id,
          date: dateStr,
          type: 'Snack' as const,
          name: 'Snack',
          position: position
        }));
        
        // Aktualizuj meal plan
        allMealPlans[key] = {
          ...currentMealPlan,
          meals: [...existingMainMeals, ...newSnacks]
        };
      }
    });
    
    // 🏗️ CREATE MISSING: Vytvoř meal plany pro aktuální týden pokud neexistují
    const currentDate = new Date(selectedDate);
    for (let i = -7; i <= 7; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const key = `${selectedUser.id}-${dateStr}`;
      
      if (!allMealPlans[key]) {
        allMealPlans[key] = createDefaultMealPlan(dateStr);
}
    }
    
    // 💾 SAVE: Aktualizuj store a vyvolej re-render
    mealStore.setMealPlans(allMealPlans);
    
    // 📱 REFRESH UI: Informuj DailyMealPlan komponentu o změnách
    if (dailyMealPlanRef.current?.forceRefresh) {
      dailyMealPlanRef.current.forceRefresh();
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

// ===== 2. REQUIRED UPDATE: mealStore.ts - Add setMealPlans method =====
/*
Add this method to your mealStore.ts:

setMealPlans: (newMealPlans) => {
  set({ mealPlans: newMealPlans });
},
*/

// ===== 3. REQUIRED UPDATE: DailyMealPlan.tsx - Add forceRefresh method =====
/*
Add this to your DailyMealPlan component's useImperativeHandle:

useImperativeHandle(ref, () => ({
  animateToDate: (newDate: Date, direction: 'left' | 'right') => {
    // ... existing code
  },
  forceRefresh: () => {
    // Force component re-render by updating local state
    setRefreshKey(prev => prev + 1);
  }
}));

And add this state at the top of DailyMealPlan component:
const [refreshKey, setRefreshKey] = useState(0);
*/