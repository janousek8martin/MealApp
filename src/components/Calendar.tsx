// src/components/Calendar.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal } from 'react-native';
import { isSameDay, isToday } from '../utils/dateUtils';

const windowWidth = Dimensions.get('window').width;

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekDates: Date[];
  monthTitle: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

// Helper function to check if date is within allowed range (current month + previous month)
const isDateInAllowedRange = (date: Date): boolean => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // First day of previous month
  const firstDayOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
  
  // Date must be >= first day of previous month
  return date >= firstDayOfPreviousMonth;
};

const MonthCalendar: React.FC<{
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}> = ({ selectedDate, onSelectDate, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth()));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get first day of week (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    
    // Check if the new month would go beyond allowed range
    const firstDayOfNewMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    if (!isDateInAllowedRange(firstDayOfNewMonth)) {
      return; // Block navigation if it would go too far back
    }
    
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date: Date) => {
    // Check if date is in allowed range before selecting
    if (!isDateInAllowedRange(date)) {
      return;
    }
    
    onSelectDate(date);
    onClose();
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.monthModalOverlay}>
        <View style={styles.monthModalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goToPreviousMonth}>
              <Text style={styles.monthArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.modalMonthTitle}>{monthName}</Text>
            <TouchableOpacity onPress={goToNextMonth}>
              <Text style={styles.monthArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysHeader}>
            {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day, index) => (
              <Text key={index} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {days.map((day, index) => {
              if (!day) {
                return <View key={index} style={styles.emptyDay} />;
              }

              const isSelected = isSameDay(selectedDate, day);
              const isCurrent = isToday(day);
              const isAllowed = isDateInAllowedRange(day);

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.monthDay}
                  onPress={() => handleDateSelect(day)}
                  disabled={!isAllowed}
                >
                  <View style={[
                    styles.monthDayContent,
                    isSelected && styles.selectedMonthDay,
                    isCurrent && !isSelected && styles.currentMonthDay,
                    !isAllowed && styles.disabledMonthDay,
                  ]}>
                    <Text style={[
                      styles.monthDayText,
                      isSelected && styles.selectedMonthDayText,
                      isCurrent && !isSelected && styles.currentMonthDayText,
                      !isAllowed && styles.disabledMonthDayText,
                    ]}>
                      {day.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onSelectDate,
  weekDates,
  monthTitle,
  onPreviousWeek,
  onNextWeek
}) => {
  const [showMonthView, setShowMonthView] = useState(false);
  const isSelectedToday = isToday(selectedDate);

  const handleTodayPress = () => {
    onSelectDate(new Date());
  };

  const handleDateSelect = (date: Date) => {
    // Check if date is in allowed range before selecting
    if (!isDateInAllowedRange(date)) {
      return;
    }
    
    onSelectDate(date);
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthTitleRow}>
        <TouchableOpacity style={styles.monthTitleButton} onPress={() => setShowMonthView(true)}>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        {!isSelectedToday && (
          <TouchableOpacity style={styles.todayButton} onPress={handleTodayPress}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        )}
        {isSelectedToday && (
          <TouchableOpacity style={styles.todayButtonHighlighted} onPress={handleTodayPress}>
            <Text style={styles.todayButtonTextHighlighted}>Today</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.weekContainer}>
        <TouchableOpacity onPress={onPreviousWeek} style={styles.arrowButton}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.daysContainer}>
          {weekDates.map((date, index) => {
            const isSelected = isSameDay(selectedDate, date);
            const isCurrent = isToday(date);
            const isAllowed = isDateInAllowedRange(date);
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.dayContainer}
                onPress={() => handleDateSelect(date)}
                disabled={!isAllowed}
              >
                <View style={[
                  styles.dateBox,
                  isSelected && styles.selectedDate,
                  isCurrent && !isSelected && styles.currentDate,
                  !isAllowed && styles.disabledDate,
                ]}>
                  <Text style={[
                    styles.dayText,
                    isSelected && styles.selectedText,
                    !isAllowed && styles.disabledText,
                  ]}>
                    {date.toLocaleString('default', { weekday: 'short' }).slice(0, 3)}
                  </Text>
                  <Text style={[
                    styles.dateText,
                    isSelected && styles.selectedText,
                    !isAllowed && styles.disabledText,
                  ]}>
                    {date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <TouchableOpacity onPress={onNextWeek} style={styles.arrowButton}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {showMonthView && (
        <MonthCalendar
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onClose={() => setShowMonthView(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
  },
  monthTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  monthTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 5,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB347',
  },
  todayButtonText: {
    color: '#FFB347',
    fontSize: 14,
    fontWeight: '600',
  },
  todayButtonHighlighted: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFB347',
  },
  todayButtonTextHighlighted: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  arrowButton: {
    padding: 10,
  },
  arrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  daysContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dateBox: {
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  selectedDate: {
    backgroundColor: '#FFB347',
  },
  currentDate: {
    borderWidth: 2,
    borderColor: '#FFB347',
  },
  disabledDate: {
    opacity: 0.3,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#CCCCCC',
  },
  // Month calendar styles
  monthModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  closeText: {
    fontSize: 20,
    color: '#666666',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  monthArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    paddingHorizontal: 15,
  },
  modalMonthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    width: 40,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    height: 40,
  },
  monthDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDayContent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMonthDay: {
    backgroundColor: '#FFB347',
  },
  currentMonthDay: {
    borderWidth: 1,
    borderColor: '#FFB347',
  },
  disabledMonthDay: {
    opacity: 0.3,
  },
  monthDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  selectedMonthDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  currentMonthDayText: {
    color: '#FFB347',
    fontWeight: 'bold',
  },
  disabledMonthDayText: {
    color: '#CCCCCC',
  },
});