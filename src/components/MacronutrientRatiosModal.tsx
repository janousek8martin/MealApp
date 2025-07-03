// src/components/MacronutrientRatiosModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface MacronutrientRatiosModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (data: { protein: number; fat: number; carbs: number; proteinPercentage: number; fatPercentage: number; carbsPercentage: number }) => void;
}

export const MacronutrientRatiosModal: React.FC<MacronutrientRatiosModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave
}) => {
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [proteinPercentage, setProteinPercentage] = useState(0);
  const [fatPercentage, setFatPercentage] = useState(0);
  const [carbsPercentage, setCarbsPercentage] = useState(0);

  useEffect(() => {
    if (currentUser) {
      calculateMacros();
    }
  }, [currentUser]);

  const calculateLBM = () => {
    const weight = parseFloat(currentUser?.weight) || 0;
    const bodyFat = parseFloat(currentUser?.bodyFat) || 0;
    return weight * (1 - bodyFat / 100);
  };

  const calculateProteinMultiplier = (bodyFat: number, gender: string) => {
    const thresholds = gender === 'Male' 
      ? [8, 12, 15, 20, 25, 30, 35]
      : [15, 20, 25, 30, 35, 40, 45];
    const multipliers = [3.55, 3.40, 3.25, 3.1, 2.95, 2.8, 2.65];
    
    for (let i = 0; i < thresholds.length; i++) {
      if (bodyFat <= thresholds[i]) {
        return multipliers[i];
      }
    }
    return multipliers[multipliers.length - 1];
  };

  const calculateFatPercentage = (bodyFat: number, gender: string) => {
    const maxBodyFat = gender === 'Male' ? 35 : 45;
    const minBodyFat = gender === 'Male' ? 8 : 15;
    const fatRange = maxBodyFat - minBodyFat;
    const userRange = bodyFat - minBodyFat;
    const fatPercentage = 20 + (userRange / fatRange) * 15;
    return Math.min(35, Math.max(20, fatPercentage));
  };

  const calculateMacros = () => {
    const adjustedTDCI = currentUser?.tdci?.adjustedTDCI || 2000;
    const bodyFat = parseFloat(currentUser?.bodyFat) || 15;
    const gender = currentUser?.gender || 'Male';

    const lbm = calculateLBM();
    const proteinMultiplier = calculateProteinMultiplier(bodyFat, gender);
    const newProtein = Math.round(lbm * proteinMultiplier);
    const newFatPercentage = Math.round(calculateFatPercentage(bodyFat, gender));
    const newFat = Math.round((adjustedTDCI * newFatPercentage / 100) / 9);
    
    const proteinCalories = newProtein * 4;
    const fatCalories = newFat * 9;
    const carbsCalories = adjustedTDCI - proteinCalories - fatCalories;
    const newCarbs = Math.round(carbsCalories / 4);

    const newProteinPercentage = Math.round((proteinCalories / adjustedTDCI) * 100);
    const newCarbsPercentage = 100 - newProteinPercentage - newFatPercentage;

    setProteinPercentage(newProteinPercentage);
    setFatPercentage(newFatPercentage);
    setCarbsPercentage(newCarbsPercentage);
    setProtein(newProtein);
    setFat(newFat);
    setCarbs(newCarbs);
  };

  const adjustMacroPercentage = (macro: string, change: number) => {
    const adjustedTDCI = currentUser?.tdci?.adjustedTDCI || 2000;
    let newProteinPercentage = proteinPercentage;
    let newFatPercentage = fatPercentage;
    let newCarbsPercentage = carbsPercentage;

    if (macro === 'protein') {
      newProteinPercentage = Math.max(10, Math.min(50, proteinPercentage + change));
    } else if (macro === 'fat') {
      newFatPercentage = Math.max(15, Math.min(45, fatPercentage + change));
    } else if (macro === 'carbs') {
      newCarbsPercentage = Math.max(10, Math.min(70, carbsPercentage + change));
    }

    const totalPercentage = newProteinPercentage + newFatPercentage + newCarbsPercentage;
    if (totalPercentage !== 100) {
      const difference = 100 - totalPercentage;
      if (macro === 'protein') {
        const adjustment = difference / 2;
        newFatPercentage = Math.max(15, Math.min(45, newFatPercentage + adjustment));
        newCarbsPercentage = 100 - newProteinPercentage - newFatPercentage;
      } else if (macro === 'fat') {
        const adjustment = difference / 2;
        newProteinPercentage = Math.max(10, Math.min(50, newProteinPercentage + adjustment));
        newCarbsPercentage = 100 - newProteinPercentage - newFatPercentage;
      } else if (macro === 'carbs') {
        const adjustment = difference / 2;
        newProteinPercentage = Math.max(10, Math.min(50, newProteinPercentage + adjustment));
        newFatPercentage = 100 - newProteinPercentage - newCarbsPercentage;
      }
    }

    const newProteinGrams = Math.round((adjustedTDCI * newProteinPercentage / 100) / 4);
    const newFatGrams = Math.round((adjustedTDCI * newFatPercentage / 100) / 9);
    const newCarbsGrams = Math.round((adjustedTDCI * newCarbsPercentage / 100) / 4);

    setProteinPercentage(newProteinPercentage);
    setFatPercentage(newFatPercentage);
    setCarbsPercentage(newCarbsPercentage);
    setProtein(newProteinGrams);
    setFat(newFatGrams);
    setCarbs(newCarbsGrams);
  };

  const handleSave = () => {
    onSave({
      protein,
      fat,
      carbs,
      proteinPercentage,
      fatPercentage,
      carbsPercentage
    });
    onClose();
  };

  const renderMacroSection = (
    title: string,
    percentage: number,
    grams: number,
    color: string,
    macro: string
  ) => (
    <View style={styles.macroSection}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroTitle}>{title}</Text>
        <View style={styles.macroControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => adjustMacroPercentage(macro, -1)}
          >
            <Icon name="remove" size={20} color="#FFB347" />
          </TouchableOpacity>
          <Text style={styles.macroPercentage}>{percentage}%</Text>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => adjustMacroPercentage(macro, 1)}
          >
            <Icon name="add" size={20} color="#FFB347" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.macroBarContainer}>
        <View style={[styles.macroBar, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      
      <Text style={styles.macroGrams}>{grams}g</Text>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#FFB347" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Macronutrient Ratios</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Daily Targets</Text>
              <Text style={styles.summaryText}>
                Total: {currentUser?.tdci?.adjustedTDCI || 0} kcal
              </Text>
            </View>

            <View style={styles.macrosContainer}>
              {renderMacroSection('Protein', proteinPercentage, protein, '#FF6B6B', 'protein')}
              {renderMacroSection('Fat', fatPercentage, fat, '#4ECDC4', 'fat')}
              {renderMacroSection('Carbohydrates', carbsPercentage, carbs, '#45B7D1', 'carbs')}
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={calculateMacros}>
              <Text style={styles.resetButtonText}>Reset to Calculated Values</Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Calculation Info</Text>
              <Text style={styles.infoText}>
                • Protein: Based on lean body mass and body fat percentage
              </Text>
              <Text style={styles.infoText}>
                • Fat: Calculated from body fat percentage (20-35% range)
              </Text>
              <Text style={styles.infoText}>
                • Carbs: Remaining calories after protein and fat
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 14,
    color: '#666666',
  },
  macrosContainer: {
    marginBottom: 20,
  },
  macroSection: {
    marginBottom: 20,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  macroControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginHorizontal: 5,
  },
  macroPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    minWidth: 40,
    textAlign: 'center',
  },
  macroBarContainer: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 5,
  },
  macroBar: {
    height: 20,
    borderRadius: 10,
  },
  macroGrams: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
  },
  resetButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#E8F4FD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#FFB347',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});