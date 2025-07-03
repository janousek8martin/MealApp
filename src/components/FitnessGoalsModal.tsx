// src/components/FitnessGoalsModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const fitnessLevels = ['Beginner', 'Intermediate', 'Advanced'];
const goals = ['Lose Fat', 'Maintenance', 'Build Muscle', 'Lose Fat & Build Muscle'];

interface FitnessGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (data: { goal: string; fitnessLevel: string | null; calorieValue: string }) => void;
}

export const FitnessGoalsModal: React.FC<FitnessGoalsModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave
}) => {
  const [selectedGoal, setSelectedGoal] = useState('Lose Fat');
  const [selectedFitnessLevel, setSelectedFitnessLevel] = useState<string | null>(null);
  const [showFitnessChart, setShowFitnessChart] = useState(false);
  const [showGoalInfo, setShowGoalInfo] = useState(false);
  const [calorieValue, setCalorieValue] = useState('');
  const [bodyFatComparison, setBodyFatComparison] = useState('');

  const currentBodyFat = currentUser?.bodyFat || '0';
  const goalBodyFat = currentUser?.goalBodyFat || '0';
  const gender = currentUser?.gender || 'Male';
  const activityMultiplier = currentUser?.activityMultiplier;

  useEffect(() => {
    loadSavedData();
    checkBodyFatGoal();
  }, [currentBodyFat, goalBodyFat]);

  useEffect(() => {
    updateCalorieValue();
  }, [selectedGoal, selectedFitnessLevel, activityMultiplier]);

  useEffect(() => {
    if (activityMultiplier === undefined || activityMultiplier === null) {
      setSelectedFitnessLevel(null);
      if (selectedGoal === 'Build Muscle' || selectedGoal === 'Lose Fat & Build Muscle') {
        setSelectedGoal('Lose Fat');
      }
    }
  }, [activityMultiplier]);

  const loadSavedData = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem(`selectedGoal_${currentUser?.id}`);
      const savedFitnessLevel = await AsyncStorage.getItem(`selectedFitnessLevel_${currentUser?.id}`);
      const savedCalorieValue = await AsyncStorage.getItem(`calorieValue_${currentUser?.id}`);
      
      if (savedGoal) setSelectedGoal(savedGoal);
      if (savedFitnessLevel) setSelectedFitnessLevel(savedFitnessLevel);
      if (savedCalorieValue) setCalorieValue(savedCalorieValue);
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const checkBodyFatGoal = () => {
    const currentBF = parseFloat(currentBodyFat);
    const goalBF = parseFloat(goalBodyFat);
    
    if (goalBF < currentBF) {
      setBodyFatComparison('loseFat');
      // Pouze nastavit automaticky při prvním načtení, pokud není uložený cíl
      AsyncStorage.getItem(`selectedGoal_${currentUser?.id}`).then(savedGoal => {
        if (!savedGoal) {
          setSelectedGoal('Lose Fat');
        }
      });
    } else if (goalBF > currentBF) {
      setBodyFatComparison('buildMuscle');
      // Pouze nastavit automaticky při prvním načtení, pokud není uložený cíl
      AsyncStorage.getItem(`selectedGoal_${currentUser?.id}`).then(savedGoal => {
        if (!savedGoal) {
          setSelectedGoal('Build Muscle');
        }
      });
    } else {
      setBodyFatComparison('maintain');
      // Pouze nastavit automaticky při prvním načtení, pokud není uložený cíl
      AsyncStorage.getItem(`selectedGoal_${currentUser?.id}`).then(savedGoal => {
        if (!savedGoal) {
          setSelectedGoal('Maintenance');
        }
      });
    }
  };

  const updateCalorieValue = () => {
    let value = '';
    if (!activityMultiplier) {
      if (selectedGoal === 'Lose Fat') {
        value = '-25';
      } else {
        value = '0';
      }
    } else {
      if (selectedGoal === 'Lose Fat') {
        value = '-20';
      } else if (selectedGoal === 'Build Muscle') {
        if (selectedFitnessLevel === 'Beginner') {
          value = '25';
        } else if (selectedFitnessLevel === 'Intermediate') {
          value = '20';
        } else if (selectedFitnessLevel === 'Advanced') {
          value = '15';
        }
      } else if (selectedGoal === 'Lose Fat & Build Muscle') {
        value = '0';
      } else {
        value = '0';
      }
    }
    setCalorieValue(value);
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(`selectedGoal_${currentUser?.id}`, selectedGoal);
      await AsyncStorage.setItem(`selectedFitnessLevel_${currentUser?.id}`, selectedFitnessLevel || '');
      await AsyncStorage.setItem(`calorieValue_${currentUser?.id}`, calorieValue);
      
      onSave({ goal: selectedGoal, fitnessLevel: selectedFitnessLevel, calorieValue });
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const isGoalButtonHighlighted = (goal: string) => {
    // Pouze zvýrazni skutečně vybraný cíl
    return selectedGoal === goal;
  };

  const handleFitnessLevelSelection = (level: string) => {
    if (activityMultiplier === undefined || activityMultiplier === null) {
      return;
    }
    if (selectedFitnessLevel === level) {
      setSelectedFitnessLevel(null);
    } else {
      setSelectedFitnessLevel(level);
    }
  };

  const handleGoalSelection = (goal: string) => {
    if (activityMultiplier === undefined || activityMultiplier === null) {
      if (goal === 'Lose Fat' || goal === 'Maintenance') {
        setSelectedGoal(goal);
      }
    } else {
      setSelectedGoal(goal);
    }
  };

  const renderFitnessChart = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showFitnessChart}
      onRequestClose={() => setShowFitnessChart(false)}
    >
      <View style={styles.chartModalOverlay}>
        <View style={styles.chartModalContent}>
          <TouchableOpacity
            style={styles.closeChartButton}
            onPress={() => setShowFitnessChart(false)}
          >
            <Icon name="close" size={24} color="#FFB347" />
          </TouchableOpacity>
          <Text style={styles.chartTitle}>Fitness Level Guide</Text>
          <ScrollView>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Beginner (0-1 years)</Text>
              <Text style={styles.levelDescription}>
                New to consistent training, learning proper form, rapid initial gains
              </Text>
            </View>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Intermediate (1-3 years)</Text>
              <Text style={styles.levelDescription}>
                Consistent training history, good form, slower but steady progress
              </Text>
            </View>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Advanced (3+ years)</Text>
              <Text style={styles.levelDescription}>
                Years of consistent training, very slow progress, advanced techniques needed
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderGoalInfo = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showGoalInfo}
      onRequestClose={() => setShowGoalInfo(false)}
    >
      <View style={styles.chartModalOverlay}>
        <View style={styles.chartModalContent}>
          <TouchableOpacity
            style={styles.closeChartButton}
            onPress={() => setShowGoalInfo(false)}
          >
            <Icon name="close" size={24} color="#FFB347" />
          </TouchableOpacity>
          <Text style={styles.chartTitle}>Fitness Goals Guide</Text>
          <ScrollView>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Lose Fat</Text>
              <Text style={styles.levelDescription}>
                Focus on reducing body fat percentage through caloric deficit
              </Text>
            </View>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Maintenance</Text>
              <Text style={styles.levelDescription}>
                Maintain current weight and body composition
              </Text>
            </View>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Build Muscle</Text>
              <Text style={styles.levelDescription}>
                Focus on gaining lean muscle mass through caloric surplus
              </Text>
            </View>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Lose Fat & Build Muscle</Text>
              <Text style={styles.levelDescription}>
                Body recomposition - simultaneous fat loss and muscle gain
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Fitness Goals</Text>
            <TouchableOpacity style={styles.infoButton} onPress={() => setShowGoalInfo(true)}>
              <View style={styles.infoIcon}>
                <Icon name="info" size={20} color="#FFB347" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>Select your primary goal:</Text>
            
            <View style={styles.goalsContainer}>
              {goals.map((goal, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.goalButton,
                    selectedGoal === goal && styles.selectedGoalButton,
                    isGoalButtonHighlighted(goal) && styles.highlightedGoalButton,
                    (!activityMultiplier && (goal === 'Build Muscle' || goal === 'Lose Fat & Build Muscle')) && styles.disabledGoalButton
                  ]}
                  onPress={() => handleGoalSelection(goal)}
                  disabled={!activityMultiplier && (goal === 'Build Muscle' || goal === 'Lose Fat & Build Muscle')}
                >
                  <Text style={[
                    styles.goalButtonText,
                    selectedGoal === goal && styles.selectedGoalButtonText,
                    isGoalButtonHighlighted(goal) && styles.highlightedGoalButtonText,
                    (!activityMultiplier && (goal === 'Build Muscle' || goal === 'Lose Fat & Build Muscle')) && styles.disabledGoalButtonText
                  ]}>
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {(selectedGoal === 'Build Muscle') && activityMultiplier && (
              <View style={styles.fitnessLevelContainer}>
                <View style={styles.fitnessLevelTitleContainer}>
                  <Text style={styles.fitnessLevelTitle}>Select your fitness level:</Text>
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => setShowFitnessChart(true)}
                  >
                    <View style={styles.infoIcon}>
                      <Icon name="info" size={16} color="#FFB347" />
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={styles.fitnessLevelsContainer}>
                  {fitnessLevels.map((level, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.fitnessLevelButton,
                        selectedFitnessLevel === level && styles.selectedFitnessLevelButton
                      ]}
                      onPress={() => handleFitnessLevelSelection(level)}
                    >
                      <Text style={[
                        styles.fitnessLevelButtonText,
                        selectedFitnessLevel === level && styles.selectedFitnessLevelButtonText
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.calorieEditContainer}>
              <Text style={styles.calorieEditTitle}>Calorie adjustment:</Text>
              <View style={styles.calorieInputContainer}>
                <TouchableOpacity
                  style={styles.calorieControlButton}
                  onPress={() => {
                    const currentValue = parseFloat(calorieValue) || 0;
                    setCalorieValue((currentValue - 1).toString());
                  }}
                >
                  <Icon name="remove" size={20} color="#FFB347" />
                </TouchableOpacity>
                <Text style={styles.calorieInputValue}>{calorieValue}%</Text>
                <TouchableOpacity
                  style={styles.calorieControlButton}
                  onPress={() => {
                    const currentValue = parseFloat(calorieValue) || 0;
                    setCalorieValue((currentValue + 1).toString());
                  }}
                >
                  <Icon name="add" size={20} color="#FFB347" />
                </TouchableOpacity>
              </View>
            </View>

            {!activityMultiplier && (
              <View style={styles.warningContainer}>
                <Icon name="warning" size={20} color="#FF6B6B" />
                <Text style={styles.warningText}>
                  Please set Activity Multiplier first to unlock all fitness goals
                </Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {renderFitnessChart()}
      {renderGoalInfo()}
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
  infoButton: {
    padding: 5,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 15,
    textAlign: 'center',
  },
  goalsContainer: {
    marginBottom: 20,
  },
  goalButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginVertical: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedGoalButton: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  highlightedGoalButton: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  disabledGoalButton: {
    backgroundColor: '#E0E0E0',
    opacity: 0.5,
  },
  goalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  selectedGoalButtonText: {
    color: '#FFFFFF',
  },
  highlightedGoalButtonText: {
    color: '#FFFFFF',
  },
  disabledGoalButtonText: {
    color: '#999999',
  },
  fitnessLevelContainer: {
    marginBottom: 20,
  },
  fitnessLevelTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fitnessLevelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  fitnessLevelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fitnessLevelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFitnessLevelButton: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  fitnessLevelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  selectedFitnessLevelButtonText: {
    color: '#FFFFFF',
  },
  fitnessChartButton: {
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  fitnessChartButtonText: {
    fontSize: 14,
    color: '#FFB347',
    textAlign: 'center',
  },
  calorieInfo: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  calorieInfoText: {
    fontSize: 16,
    color: '#1976D2',
    textAlign: 'center',
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 10,
    flex: 1,
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
  chartModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: width * 0.85,
    maxHeight: '70%',
  },
  closeChartButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  levelSection: {
    marginBottom: 20,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 5,
  },
  calorieEditContainer: {
    marginBottom: 20,
  },
  calorieEditTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  calorieInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
  },
  calorieControlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  calorieInputValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    minWidth: 60,
    textAlign: 'center',
  },
  levelDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});