// src/components/WorkoutDaysModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = () => {
    onSave(selectedDays);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#FFB347" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Workout Days</Text>
          <ScrollView>
            {weekdays.map((day) => (
              <TouchableOpacity
                key={day}
                style={styles.dayItem}
                onPress={() => toggleDay(day)}
              >
                <View style={[styles.checkbox, selectedDays.includes(day) && styles.checked]}>
                  {selectedDays.includes(day) && <Icon name="check" size={18} color="#FFF" />}
                </View>
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#FFB347',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#FFB347',
  },
  dayText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#FFB347',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});