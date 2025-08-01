// src/components/MealPreferencesModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const snackPositions = [
  { key: 'Before Breakfast', label: 'Before Breakfast', icon: 'wb-sunny' },
  { key: 'Between Breakfast and Lunch', label: 'Between Breakfast and Lunch', icon: 'schedule' },
  { key: 'Between Lunch and Dinner', label: 'Between Lunch and Dinner', icon: 'schedule' },
  { key: 'After Dinner', label: 'After Dinner', icon: 'brightness-2' },
];

interface MealPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (data: { mealsPerDay: number; snackPositions: string[] }) => void;
}

export const MealPreferencesModal: React.FC<MealPreferencesModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave
}) => {
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [selectedSnackPositions, setSelectedSnackPositions] = useState<string[]>([]);

  useEffect(() => {
    // Load current meal preferences from user data
    if (currentUser?.mealPreferences) {
      setMealsPerDay(currentUser.mealPreferences.mealsPerDay || 3);
      setSelectedSnackPositions(currentUser.mealPreferences.snackPositions || []);
    } else {
      setMealsPerDay(3);
      setSelectedSnackPositions([]);
    }
  }, [currentUser, visible]);

  const handleMealsPerDayChange = (increment: boolean) => {
    if (increment && mealsPerDay < 6) {
      setMealsPerDay(mealsPerDay + 1);
    } else if (!increment && mealsPerDay > 1) {
      const newMealsPerDay = mealsPerDay - 1;
      setMealsPerDay(newMealsPerDay);
      
      // Clear snack positions if meals become less than 4
      if (newMealsPerDay < 4) {
        setSelectedSnackPositions([]);
      } else {
        // Trim snack positions if exceeding new limit
        const maxSnacks = newMealsPerDay - 3;
        setSelectedSnackPositions(prev => prev.slice(0, maxSnacks));
      }
    }
  };

  const handleSnackPositionToggle = (position: string) => {
    if (mealsPerDay < 4) return; // Disable interaction when less than 4 meals
    
    setSelectedSnackPositions(prev => {
      const maxSnacks = mealsPerDay - 3; // 4 meals = 1 snack, 5 meals = 2 snacks, 6 meals = 3 snacks
      
      if (prev.includes(position)) {
        return prev.filter(p => p !== position);
      } else {
        // Only allow adding if under the limit
        if (prev.length < maxSnacks) {
          return [...prev, position];
        }
        return prev; // Don't add if at limit
      }
    });
  };

  const handleSave = () => {
    onSave({
      mealsPerDay,
      snackPositions: selectedSnackPositions
    });
    onClose();
  };

  const getMealBreakdown = () => {
    const mainMeals = ['Breakfast', 'Lunch', 'Dinner'];
    const snacks = selectedSnackPositions.length;
    const totalMeals = mainMeals.length + snacks;
    
    if (mealsPerDay <= 3) {
      return `${mealsPerDay} main meals`;
    } else {
      const extraMeals = mealsPerDay - 3;
      return `3 main meals + ${extraMeals} snack${extraMeals > 1 ? 's' : ''}`;
    }
  };

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
            <Text style={styles.title}>Meal Preferences</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Meals Per Day */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Meals Per Day</Text>
              <View style={styles.mealsPerDayContainer}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleMealsPerDayChange(false)}
                  disabled={mealsPerDay <= 1}
                >
                  <Icon name="remove" size={24} color={mealsPerDay <= 1 ? '#CCC' : '#FFB347'} />
                </TouchableOpacity>
                
                <View style={styles.mealsPerDayDisplay}>
                  <Text style={styles.mealsPerDayNumber}>{mealsPerDay}</Text>
                  <Text style={styles.mealsPerDayLabel}>meals</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleMealsPerDayChange(true)}
                  disabled={mealsPerDay >= 6}
                >
                  <Icon name="add" size={24} color={mealsPerDay >= 6 ? '#CCC' : '#FFB347'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Snack Positions */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Snack Positions</Text>
              <Text style={[styles.sectionDescription, mealsPerDay < 4 && styles.disabledText]}>
                {mealsPerDay < 4 
                  ? 'To select snack positions, you need at least 4 meals per day'
                  : `Select when you prefer to have snacks (max ${mealsPerDay - 3}):`
                }
              </Text>
              
              <View style={styles.snackPositionsContainer}>
                {snackPositions.map((position, index) => {
                  const maxSnacks = mealsPerDay - 3;
                  const isSelected = selectedSnackPositions.includes(position.key);
                  const canSelect = mealsPerDay >= 4 && (isSelected || selectedSnackPositions.length < maxSnacks);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.snackPositionButton,
                        isSelected && styles.selectedSnackPositionButton,
                        !canSelect && styles.disabledSnackPositionButton
                      ]}
                      onPress={() => canSelect && handleSnackPositionToggle(position.key)}
                      disabled={!canSelect}
                    >
                      <Icon 
                        name={position.icon} 
                        size={20} 
                        color={
                          !canSelect 
                            ? '#CCC' 
                            : isSelected 
                              ? '#FFFFFF' 
                              : '#FFB347'
                        } 
                      />
                      <Text style={[
                        styles.snackPositionButtonText,
                        isSelected && styles.selectedSnackPositionButtonText,
                        !canSelect && styles.disabledSnackPositionButtonText
                      ]}>
                        {position.label}
                      </Text>
                      {isSelected && canSelect && (
                        <Icon name="check" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Preferences</Text>
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
    maxHeight: '85%',
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
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
    lineHeight: 20,
  },
  mealsPerDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealsPerDayDisplay: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  mealsPerDayNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFB347',
  },
  mealsPerDayLabel: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  mealBreakdown: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  snackPositionsContainer: {
    marginBottom: 10,
  },
  snackPositionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginVertical: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSnackPositionButton: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  snackPositionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  selectedSnackPositionButtonText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#999999',
  },
  disabledSnackPositionButton: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  disabledSnackPositionButtonText: {
    color: '#CCC',
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