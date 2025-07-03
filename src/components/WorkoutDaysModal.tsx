// src/components/WorkoutDaysModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const daysOfWeek = [
  { key: 'Monday', label: 'Monday', icon: 'fitness-center' },
  { key: 'Tuesday', label: 'Tuesday', icon: 'fitness-center' },
  { key: 'Wednesday', label: 'Wednesday', icon: 'fitness-center' },
  { key: 'Thursday', label: 'Thursday', icon: 'fitness-center' },
  { key: 'Friday', label: 'Friday', icon: 'fitness-center' },
  { key: 'Saturday', label: 'Saturday', icon: 'fitness-center' },
  { key: 'Sunday', label: 'Sunday', icon: 'fitness-center' },
];

interface WorkoutDaysModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (workoutDays: string[]) => void;
}

export const WorkoutDaysModal: React.FC<WorkoutDaysModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave
}) => {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    // Load current workout days from user data
    if (currentUser?.workoutDays) {
      setSelectedDays(currentUser.workoutDays);
    } else {
      setSelectedDays([]);
    }
  }, [currentUser, visible]);

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleSave = () => {
    onSave(selectedDays);
    onClose();
  };

  const handleSelectAll = () => {
    if (selectedDays.length === daysOfWeek.length) {
      setSelectedDays([]);
    } else {
      setSelectedDays(daysOfWeek.map(day => day.key));
    }
  };

  const isAllSelected = selectedDays.length === daysOfWeek.length;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Workout Days</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Select the days when you usually work out:
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Select All Button */}
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={handleSelectAll}
            >
              <Text style={styles.selectAllButtonText}>
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>

            {/* Days Container */}
            <View style={styles.daysContainer}>
              {daysOfWeek.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(day.key) && styles.selectedDayButton
                  ]}
                  onPress={() => handleDayToggle(day.key)}
                >
                  <Icon 
                    name={day.icon} 
                    size={20} 
                    color={selectedDays.includes(day.key) ? '#FFFFFF' : '#FFB347'} 
                  />
                  <Text style={[
                    styles.dayButtonText,
                    selectedDays.includes(day.key) && styles.selectedDayButtonText
                  ]}>
                    {day.label}
                  </Text>
                  {selectedDays.includes(day.key) && (
                    <Icon name="check" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Selected Days:</Text>
              <Text style={styles.summaryText}>
                {selectedDays.length === 0 
                  ? 'No workout days selected' 
                  : `${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''} selected: ${selectedDays.join(', ')}`
                }
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxHeight: '80%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectAllButton: {
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectAllButtonText: {
    fontSize: 16,
    color: '#FFB347',
    fontWeight: '600',
  },
  daysContainer: {
    marginBottom: 20,
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginVertical: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDayButton: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  selectedDayButtonText: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#FFB347',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});