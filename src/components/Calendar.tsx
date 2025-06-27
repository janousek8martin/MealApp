// src/components/Calendar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
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

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onSelectDate,
  weekDates,
  monthTitle,
  onPreviousWeek,
  onNextWeek
}) => {
  const isSelectedToday = isToday(selectedDate);

  const handleTodayPress = () => {
    onSelectDate(new Date());
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthTitleRow}>
        <Text style={styles.monthTitle}>{monthTitle}</Text>
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
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    flex: 1,
  },
  todayButton: {
    position: 'absolute',
    right: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFB347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16, // Zaoblené rohy
  },
  todayButtonHighlighted: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#FFB347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16, // Zaoblené rohy
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
    width: (windowWidth - 120) / 7,
  },
  dateBox: {
    padding: 8,
    borderRadius: 16, // Zaoblené rohy pro moderní vzhled
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    width: '100%',
  },
  selectedDate: {
    backgroundColor: '#FFB347',
  },
  currentDate: {
    borderWidth: 2,
    borderColor: '#FFB347',
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
  selectedText: {
    color: '#FFFFFF',
  },
});