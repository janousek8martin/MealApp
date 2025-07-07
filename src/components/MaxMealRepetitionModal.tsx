// src/components/MaxMealRepetitionModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface MaxMealRepetitionModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (maxRepetition: number) => void;
}

export const MaxMealRepetitionModal: React.FC<MaxMealRepetitionModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave
}) => {
  const [maxRepetition, setMaxRepetition] = useState(3);

  useEffect(() => {
    // Load current max repetition from user data
    if (currentUser?.maxMealRepetition) {
      setMaxRepetition(currentUser.maxMealRepetition);
    } else {
      setMaxRepetition(3);
    }
  }, [currentUser, visible]);

  const handleMaxRepetitionChange = (increment: boolean) => {
    if (increment && maxRepetition < 7) {
      setMaxRepetition(maxRepetition + 1);
    } else if (!increment && maxRepetition > 1) {
      setMaxRepetition(maxRepetition - 1);
    }
  };

  const handleSave = () => {
    onSave(maxRepetition);
    onClose();
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
            <Text style={styles.title}>Max Meal Repetition</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Set the maximum number of times the same meal can appear in your weekly meal plan:
            </Text>

            {/* Max Repetition Control */}
            <View style={styles.repetitionContainer}>
              <TouchableOpacity
                style={[styles.controlButton, maxRepetition <= 1 && styles.disabledButton]}
                onPress={() => handleMaxRepetitionChange(false)}
                disabled={maxRepetition <= 1}
              >
                <Icon name="remove" size={24} color={maxRepetition <= 1 ? '#CCC' : '#FFB347'} />
              </TouchableOpacity>
              
              <View style={styles.repetitionDisplay}>
                <Text style={styles.repetitionNumber}>{maxRepetition}</Text>
                <Text style={styles.repetitionLabel}>times per week</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.controlButton, maxRepetition >= 7 && styles.disabledButton]}
                onPress={() => handleMaxRepetitionChange(true)}
                disabled={maxRepetition >= 7}
              >
                <Icon name="add" size={24} color={maxRepetition >= 7 ? '#CCC' : '#FFB347'} />
              </TouchableOpacity>
            </View>



            {/* Quick Selection Buttons */}
            <View style={styles.quickSelectionContainer}>
              <Text style={styles.quickSelectionTitle}>Quick Selection</Text>
              <View style={styles.quickButtonsRow}>
                <TouchableOpacity
                  style={[styles.quickButton, maxRepetition === 1 && styles.selectedQuickButton]}
                  onPress={() => setMaxRepetition(1)}
                >
                  <Text style={[styles.quickButtonText, maxRepetition === 1 && styles.selectedQuickButtonText]}>
                    Max Variety
                  </Text>
                  <Text style={[styles.quickButtonSubtext, maxRepetition === 1 && styles.selectedQuickButtonText]}>
                    1x per week
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickButton, maxRepetition === 3 && styles.selectedQuickButton]}
                  onPress={() => setMaxRepetition(3)}
                >
                  <Text style={[styles.quickButtonText, maxRepetition === 3 && styles.selectedQuickButtonText]}>
                    Balanced
                  </Text>
                  <Text style={[styles.quickButtonSubtext, maxRepetition === 3 && styles.selectedQuickButtonText]}>
                    3x per week
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickButton, maxRepetition === 7 && styles.selectedQuickButton]}
                  onPress={() => setMaxRepetition(7)}
                >
                  <Text style={[styles.quickButtonText, maxRepetition === 7 && styles.selectedQuickButtonText]}>
                    No Limit
                  </Text>
                  <Text style={[styles.quickButtonSubtext, maxRepetition === 7 && styles.selectedQuickButtonText]}>
                    7x per week
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Examples */}
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Examples</Text>
              <View style={styles.exampleItem}>
                <Icon name="restaurant" size={20} color="#666666" />
                <Text style={styles.exampleText}>
                  With {maxRepetition} repetition{maxRepetition > 1 ? 's' : ''}, you might have chicken stir-fry {maxRepetition === 1 ? 'once' : `${maxRepetition} times`} this week
                </Text>
              </View>
              <View style={styles.exampleItem}>
                <Icon name="schedule" size={20} color="#666666" />
                <Text style={styles.exampleText}>
                  {maxRepetition === 1 ? 'Every meal will be different' : `Some meals may repeat up to ${maxRepetition} times`}
                </Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Setting</Text>
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
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 22,
  },
  repetitionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 25,
    marginBottom: 20,
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
  disabledButton: {
    opacity: 0.5,
  },
  repetitionDisplay: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  repetitionNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFB347',
  },
  repetitionLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  quickSelectionContainer: {
    marginBottom: 20,
  },
  quickSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedQuickButton: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  quickButtonSubtext: {
    fontSize: 12,
    color: '#666666',
  },
  selectedQuickButtonText: {
    color: '#FFFFFF',
  },
  examplesContainer: {
    marginBottom: 10,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 10,
    flex: 1,
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