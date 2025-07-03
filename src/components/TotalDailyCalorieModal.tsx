import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, SafeAreaView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TotalDailyCalorieModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (data: { baseTDCI: number; adjustedTDCI: number; weightChange: number; manualAdjustment: number }) => void;
  bmr: number;
}

export const TotalDailyCalorieModal: React.FC<TotalDailyCalorieModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave,
  bmr
}) => {
  const [baseTDCI, setBaseTDCI] = useState(2423);
  const [adjustedTDCI, setAdjustedTDCI] = useState(2523);
  const [weightChange, setWeightChange] = useState(0.00);
  const [manualAdjustment, setManualAdjustment] = useState(0);
  const [weightChangeLabel, setWeightChangeLabel] = useState('Gained');

  useEffect(() => {
    if (currentUser) {
      const calculatedTDCI = calculateTotalDailyCalorie(currentUser);
      setBaseTDCI(calculatedTDCI);
      loadSavedData();
    }
  }, [currentUser]);

  useEffect(() => {
    updateAdjustedTDCI();
  }, [weightChange, manualAdjustment, baseTDCI, weightChangeLabel]);

  const loadSavedData = async () => {
    try {
      const savedWeightChange = await AsyncStorage.getItem(`weightChange_${currentUser?.id}`);
      const savedManualAdjustment = await AsyncStorage.getItem(`manualAdjustment_${currentUser?.id}`);
      if (savedWeightChange) setWeightChange(parseFloat(savedWeightChange));
      if (savedManualAdjustment) setManualAdjustment(parseInt(savedManualAdjustment));
      
      // Set weightChangeLabel based on fitness goal
      if (currentUser?.fitnessGoal?.goal === 'Lose Fat') {
        setWeightChangeLabel('Gained');
      } else if (currentUser?.fitnessGoal?.goal === 'Build Muscle') {
        setWeightChangeLabel('Lost');
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(`weightChange_${currentUser?.id}`, weightChange.toString());
      await AsyncStorage.setItem(`manualAdjustment_${currentUser?.id}`, manualAdjustment.toString());
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const calculateTotalDailyCalorie = (user: any) => {
    const activityMultiplier = parseFloat(user.activityMultiplier) || 1;
    const fitnessGoal = user.fitnessGoal?.goal || '';
    const calorieAdjustment = parseFloat(user.fitnessGoal?.calorieValue) || 0;
    
    let tdee = bmr * activityMultiplier;
    
    if (fitnessGoal === 'Lose Fat' || calorieAdjustment < 0) {
      tdee -= (tdee * Math.abs(calorieAdjustment) / 100);
    } else if (fitnessGoal === 'Build Muscle' && calorieAdjustment > 0) {
      tdee += (tdee * calorieAdjustment / 100);
    }
    
    return Math.round(tdee);
  };

  const updateAdjustedTDCI = () => {
    const weightChangeCalories = weightChange * 500;
    const totalAdjustment = weightChangeCalories + (manualAdjustment * 100);
    let newAdjustedTDCI;
    
    if (weightChangeLabel === 'Gained') {
      newAdjustedTDCI = Math.round(baseTDCI - totalAdjustment);
    } else {
      newAdjustedTDCI = Math.round(baseTDCI + totalAdjustment);
    }
    
    setAdjustedTDCI(newAdjustedTDCI);
    saveData();
  };

  const handleWeightChange = (increment: number) => {
    setWeightChange(prevChange => Math.max(0, prevChange + increment));
  };

  const handleManualAdjustment = (increment: number) => {
    setManualAdjustment(prevAdjustment => prevAdjustment + increment);
  };

  const handleSave = () => {
    onSave({
      baseTDCI,
      adjustedTDCI,
      weightChange,
      manualAdjustment,
    });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Total Daily Calorie Intake</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Base TDCI:</Text>
              <Text style={styles.value}>{baseTDCI} kcal</Text>
            </View>

            <View style={styles.adjustmentContainer}>
              <View style={styles.labelColumn}>
                <Text style={styles.label}>{weightChangeLabel}:</Text>
                <Text style={styles.label}>Manual adjustment:</Text>
              </View>
              <View style={styles.adjustmentColumn}>
                <TouchableOpacity onPress={() => handleWeightChange(-0.25)}>
                  <Icon name="remove" size={24} color="#FFB347" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleManualAdjustment(-1)}>
                  <Icon name="remove" size={24} color="#FFB347" />
                </TouchableOpacity>
              </View>
              <View style={styles.valueColumn}>
                <Text style={styles.adjustmentText}>{weightChange.toFixed(2)}</Text>
                <Text style={styles.adjustmentText}>{manualAdjustment}</Text>
              </View>
              <View style={styles.adjustmentColumn}>
                <TouchableOpacity onPress={() => handleWeightChange(0.25)}>
                  <Icon name="add" size={24} color="#FFB347" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleManualAdjustment(1)}>
                  <Icon name="add" size={24} color="#FFB347" />
                </TouchableOpacity>
              </View>
              <View style={styles.unitColumn}>
                <Text style={styles.unit}>kgs</Text>
                <Text style={styles.unit}>{manualAdjustment < 0 ? '- ' : ''}100 kcal</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Adjusted TDCI:</Text>
              <Text style={styles.value}>{adjustedTDCI} kcal</Text>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleSave}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  adjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  labelColumn: {
    flex: 2,
    justifyContent: 'space-between',
    height: 60,
  },
  adjustmentColumn: {
    justifyContent: 'space-between',
    height: 60,
    alignItems: 'center',
  },
  valueColumn: {
    width: 50,
    justifyContent: 'space-between',
    height: 60,
    alignItems: 'center',
  },
  unitColumn: {
    justifyContent: 'space-between',
    height: 60,
    alignItems: 'flex-start',
    marginLeft: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
  },
  adjustmentText: {
    fontSize: 16,
    textAlign: 'center',
  },
  unit: {
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#FFB347',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 5,
  },
});