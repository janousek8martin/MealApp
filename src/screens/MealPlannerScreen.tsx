import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../stores/userStore';
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

export const MealPlannerScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(() => getWeekDates(new Date()));
  const insets = useSafeAreaInsets();
  
  // Reference pro DailyMealPlan komponentu
  const dailyMealPlanRef = useRef<any>(null);

  const monthTitle = getMonthTitle(selectedDate);

  const handleDateSelect = (date: Date) => {
    const currentDate = selectedDate;
    const newDate = date;
    
    // Pokud je to stejné datum, neděláme nic
    if (isSameDay(currentDate, newDate)) {
      return;
    }
    
    // Porovnání dat pro určení směru animace
    const isGoingToFuture = newDate > currentDate;
    
    // Spustíme animaci přes DailyMealPlan komponentu
    if (dailyMealPlanRef.current && dailyMealPlanRef.current.animateToDate) {
      dailyMealPlanRef.current.animateToDate(newDate, isGoingToFuture ? 'left' : 'right');
    } else {
      // Fallback pokud ref není dostupný
      setSelectedDate(newDate);
      updateWeekIfNeeded(newDate);
    }
  };

  const updateWeekIfNeeded = (date: Date) => {
    // Check if the selected date is outside current week
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

  // Handle date change from swipe or animation
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    updateWeekIfNeeded(newDate);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          <UserDropdown />
        </View>
      </View>

      {/* Calendar */}
      <Calendar
        key={`${selectedDate.toISOString().split('T')[0]}-${weekDates[0].toISOString().split('T')[0]}`}
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        weekDates={weekDates}
        monthTitle={monthTitle}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
      />

      {/* Daily Meal Plan */}
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