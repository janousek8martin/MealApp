// src/components/Calendar.tsx
// 🔧 OPRAVENO: Stabilní layout - žádné poskakování

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
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date: Date) => {
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

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.monthDay}
                  onPress={() => handleDateSelect(day)}
                >
                  <View style={[
                    styles.monthDayContent,
                    isSelected && styles.selectedMonthDay,
                    isCurrent && !isSelected && styles.currentMonthDay,
                  ]}>
                    <Text style={[
                      styles.monthDayText,
                      isSelected && styles.selectedMonthDayText,
                      isCurrent && !isSelected && styles.currentMonthDayText,
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

  return (
    <View style={styles.container}>
      <View style={styles.monthTitleRow}>
        <TouchableOpacity style={styles.monthTitleButton} onPress={() => setShowMonthView(true)}>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        {/* ✅ OPRAVENO: Stabilní today button - vždy stejné rozměry */}
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
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.dayContainer}
                onPress={() => onSelectDate(date)}
              >
                {/* ✅ OPRAVENO: Stabilní dateBox - vždy stejné rozměry */}
                <View style={[
                  styles.dateBox,
                  isSelected && styles.selectedDate,
                  isCurrent && !isSelected && styles.currentDate,
                ]}>
                  <Text style={[
                    styles.dayText,
                    isSelected && styles.selectedText,
                  ]}>
                    {date.toLocaleString('default', { weekday: 'short' }).slice(0, 3)}
                  </Text>
                  <Text style={[
                    styles.dateText,
                    isSelected && styles.selectedText,
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
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  monthTitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  monthTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 6,
  },
  // ✅ OPRAVENO: Today button - identické rozměry pro obě stavy
  todayButton: {
    position: 'absolute',
    right: 0,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFB347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,  // ✅ ZMĚNĚNO: z 16 na 6
  },
  todayButtonHighlighted: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#FFB347',
    borderWidth: 1,           // ✅ PŘIDÁNO: stejný border
    borderColor: '#FFB347',   // ✅ PŘIDÁNO: border stejné barvy jako background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,  // ✅ ZMĚNĚNO: z 16 na 6
  },
  todayButtonText: {
    color: '#FFB347',
    fontSize: 14,
    fontWeight: '600',
  },
  todayButtonTextHighlighted: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  weekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrowButton: {
    padding: 10,
    width: 40,
    alignItems: 'center',
  },
  arrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFB347',
  },
  daysContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  dayContainer: {
    alignItems: 'center',
    width: (windowWidth - 90) / 7,
  },
  // ✅ OPRAVENO: dateBox - stabilní rozměry pro všechny stavy
  dateBox: {
    padding: 2,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 65,
    width: '85%',
    borderWidth: 1.75,              // ✅ PŘIDÁNO: vždy má border
    borderColor: 'transparent',  // ✅ PŘIDÁNO: defaultně průhledný
  },
  selectedDate: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',  // ✅ ZMĚNĚNO: border stejné barvy jako background
  },
  currentDate: {
    borderColor: '#FFB347',  // ✅ ZACHOVÁNO: jen změní barvu existujícího borderu
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  // Month calendar styles - beze změny
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
});