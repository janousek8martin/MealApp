// src/components/GoalWeightModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BodyFatCarousel } from './BodyFatCarousel';

interface GoalWeightModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { goalWeight: string; goalBodyFat: string; weightUnit: 'kg' | 'lbs' }) => void;
  currentUser: any;
}

const bodyFatCharts = {
  male: [
    { age: '18-20', ideal: '6.2 - 10.5', average: '14.3 - 18.9', overweight: '20.2 - 24.1' },
    { age: '21-25', ideal: '7.3 - 11.6', average: '15.4 - 20.0', overweight: '21.2 - 25.6' },
    { age: '26-30', ideal: '8.5 - 12.7', average: '16.4 - 21.0', overweight: '22.3 - 26.8' },
    { age: '31-35', ideal: '9.4 - 13.7', average: '17.5 - 22.1', overweight: '23.4 - 28.0' },
    { age: '36-40', ideal: '10.2 - 14.8', average: '18.6 - 23.2', overweight: '24.5 - 29.2' },
    { age: '41-45', ideal: '11.5 - 15.9', average: '19.8 - 24.7', overweight: '25.6 - 30.4' },
    { age: '46-50', ideal: '12.6 - 16.9', average: '20.7 - 25.3', overweight: '26.6 - 31.5' },
    { age: '51-55', ideal: '13.7 - 17.9', average: '21.6 - 26.0', overweight: '27.6 - 32.5' },
    { age: '56 & UP', ideal: '14.7 - 19.1', average: '22.8 - 27.4', overweight: '28.7 - 33.5' },
  ],
  female: [
    { age: '18-20', ideal: '15.7 - 19.7', average: '23.2 - 27.7', overweight: '29.0 - 34.6' },
    { age: '21-25', ideal: '16.3 - 20.3', average: '23.8 - 28.4', overweight: '29.6 - 35.2' },
    { age: '26-30', ideal: '16.9 - 20.9', average: '24.5 - 29.0', overweight: '30.3 - 35.8' },
    { age: '31-35', ideal: '17.5 - 21.5', average: '25.1 - 29.6', overweight: '30.9 - 36.4' },
    { age: '36-40', ideal: '18.2 - 22.2', average: '25.7 - 30.2', overweight: '31.5 - 37.0' },
    { age: '41-45', ideal: '18.8 - 22.8', average: '26.3 - 30.8', overweight: '32.1 - 37.7' },
    { age: '46-50', ideal: '19.4 - 23.4', average: '26.9 - 31.4', overweight: '32.7 - 38.3' },
    { age: '51-55', ideal: '20.0 - 24.0', average: '27.6 - 32.1', overweight: '33.4 - 38.9' },
    { age: '56 & UP', ideal: '20.7 - 24.6', average: '28.2 - 32.7', overweight: '34.0 - 39.5' },
  ],
};

export const GoalWeightModal: React.FC<GoalWeightModalProps> = ({
  visible,
  onClose,
  onSave,
  currentUser
}) => {
  const [goalWeight, setGoalWeight] = useState('');
  const [goalBodyFat, setGoalBodyFat] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [showChart, setShowChart] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const gender = currentUser?.gender || 'Male';
  const bodyFatPercentages = gender === 'Male' 
    ? [8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60]
    : [15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40, 42, 45, 47, 50, 52, 55, 57, 60];

  useEffect(() => {
    if (visible && currentUser) {
      setGoalWeight(currentUser.goalWeight || '');
      setGoalBodyFat(currentUser.goalBodyFat || '');
      setWeightUnit(currentUser.weightUnit || 'kg');
      loadCarouselIndex();
    }
  }, [visible, currentUser]);

  const loadCarouselIndex = async () => {
    try {
      const savedIndex = await AsyncStorage.getItem(`goalCarouselIndex_${currentUser?.id}`);
      if (savedIndex) {
        setCarouselIndex(parseInt(savedIndex));
      }
    } catch (error) {
      console.error('Error loading goal carousel index:', error);
    }
  };

  const saveCarouselIndex = async (index: number) => {
    try {
      await AsyncStorage.setItem(`goalCarouselIndex_${currentUser?.id}`, index.toString());
    } catch (error) {
      console.error('Error saving goal carousel index:', error);
    }
  };

  const handleSave = async () => {
    const bodyFatValue = parseFloat(goalBodyFat);
    const minValue = gender === 'Male' ? 8 : 15;
    const maxValue = 60;

    if (isNaN(bodyFatValue) || bodyFatValue < minValue || bodyFatValue > maxValue) {
      setErrorMessage(`Goal body fat percentage must be between ${minValue}% and ${maxValue}% for ${gender}s.`);
      return;
    }

    if (!goalWeight || parseFloat(goalWeight) <= 0) {
      setErrorMessage('Please enter a valid goal weight.');
      return;
    }

    try {
      await saveCarouselIndex(carouselIndex);
      onSave({ goalWeight, goalBodyFat, weightUnit });
      setErrorMessage('');
    } catch (error) {
      console.error('Error saving goal weight:', error);
    }
  };

  const handleCarouselChange = (index: number) => {
    setCarouselIndex(index);
    setGoalBodyFat(bodyFatPercentages[index].toString());
    setErrorMessage('');
  };

  const renderWeightInput = () => (
    <View style={styles.inputSection}>
      <Text style={styles.title}>Goal Weight</Text>
      <View style={styles.unitSelector}>
        <TouchableOpacity
          style={[styles.unitButton, weightUnit === 'kg' && styles.selectedUnitButton]}
          onPress={() => setWeightUnit('kg')}
        >
          <Text style={[styles.unitButtonText, weightUnit === 'kg' && styles.selectedUnitText]}>
            kg
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.unitButton, weightUnit === 'lbs' && styles.selectedUnitButton]}
          onPress={() => setWeightUnit('lbs')}
        >
          <Text style={[styles.unitButtonText, weightUnit === 'lbs' && styles.selectedUnitText]}>
            lbs
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={goalWeight}
          onChangeText={setGoalWeight}
          keyboardType="numeric"
          maxLength={5}
          placeholder={`Enter goal weight in ${weightUnit}`}
        />
        <Text style={styles.unit}>{weightUnit}</Text>
      </View>
    </View>
  );

  const renderBodyFatSection = () => (
    <View style={styles.inputSection}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Goal Composition</Text>
        <TouchableOpacity style={styles.infoButton} onPress={() => setShowChart(true)}>
          <Icon name="info" size={24} color="#FFB347" />
        </TouchableOpacity>
      </View>
      
      <BodyFatCarousel
        bodyFatPercentages={bodyFatPercentages}
        gender={gender}
        initialIndex={carouselIndex}
        onIndexChange={handleCarouselChange}
        onCopyToBar={(value) => {
          setGoalBodyFat(value);
          setErrorMessage('');
        }}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={goalBodyFat}
          onChangeText={(text) => {
            setGoalBodyFat(text);
            setErrorMessage('');
          }}
          keyboardType="numeric"
          maxLength={4}
          placeholder="Enter goal fat %"
        />
        <Text style={styles.unit}>%</Text>
      </View>
    </View>
  );

  const renderChart = () => {
    const chart = bodyFatCharts[gender.toLowerCase() as 'male' | 'female'];
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showChart}
        onRequestClose={() => setShowChart(false)}
      >
        <View style={styles.chartModalOverlay}>
          <View style={styles.chartModalContent}>
            <TouchableOpacity
              style={styles.closeChartButton}
              onPress={() => setShowChart(false)}
            >
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>
            
            <Text style={styles.chartTitle}>Body Fat Percentage Chart ({gender})</Text>
            
            <ScrollView style={styles.chartScrollView}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartHeaderText}>Age</Text>
                <Text style={styles.chartHeaderText}>Ideal</Text>
                <Text style={styles.chartHeaderText}>Average</Text>
                <Text style={styles.chartHeaderText}>Overweight</Text>
              </View>
              
              {chart.map((row, index) => (
                <View key={index} style={styles.chartRow}>
                  <Text style={styles.chartCell}>{row.age}</Text>
                  <Text style={styles.chartCell}>{row.ideal}</Text>
                  <Text style={styles.chartCell}>{row.average}</Text>
                  <Text style={styles.chartCell}>{row.overweight}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
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
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {renderWeightInput()}
              {renderBodyFatSection()}
              
              {errorMessage ? (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              ) : null}
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {renderChart()}
    </>
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
    width: '90%',
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  scrollView: {
    marginTop: 10,
  },
  inputSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333333',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoButton: {
    padding: 5,
  },
  unitSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 2,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedUnitButton: {
    backgroundColor: '#FFB347',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  selectedUnitText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  unit: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    marginLeft: 8,
  },
  errorMessage: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
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
  chartModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '95%',
    maxHeight: '80%',
  },
  closeChartButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
    color: '#333333',
  },
  chartScrollView: {
    maxHeight: 400,
  },
  chartHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFB347',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginBottom: 5,
  },
  chartHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  chartRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chartCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#333333',
  },
});