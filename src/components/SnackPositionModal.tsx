// src/components/SnackPositionModal.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SnackPosition } from '../types/meal';

interface SnackPositionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (positions: SnackPosition[], applyToEveryDay: boolean) => void;
}

const snackPositions: SnackPosition[] = [
  'Before Breakfast',
  'Between Breakfast and Lunch',
  'Between Lunch and Dinner',
  'After Dinner'
];

export const SnackPositionModal: React.FC<SnackPositionModalProps> = ({
  visible,
  onClose,
  onConfirm
}) => {
  const [selectedPositions, setSelectedPositions] = useState<SnackPosition[]>([]);
  const [applyToEveryDay, setApplyToEveryDay] = useState(false);

  const togglePosition = (position: SnackPosition) => {
    setSelectedPositions(prev => 
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const handleConfirm = () => {
    if (selectedPositions.length > 0) {
      onConfirm(selectedPositions, applyToEveryDay);
      setSelectedPositions([]);
      setApplyToEveryDay(false);
    }
  };

  const handleClose = () => {
    setSelectedPositions([]);
    setApplyToEveryDay(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Add Snack</Text>
          <Text style={styles.subtitle}>Select when you want to have a snack</Text>

          <View style={styles.positionsContainer}>
            {snackPositions.map((position) => (
              <TouchableOpacity
                key={position}
                style={[
                  styles.positionButton,
                  selectedPositions.includes(position) && styles.selectedPosition
                ]}
                onPress={() => togglePosition(position)}
              >
                <Text style={[
                  styles.positionText,
                  selectedPositions.includes(position) && styles.selectedPositionText
                ]}>
                  {position}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.optionButton, applyToEveryDay && styles.selectedOption]}
            onPress={() => setApplyToEveryDay(!applyToEveryDay)}
          >
            <Text style={[
              styles.optionText,
              applyToEveryDay && styles.selectedOptionText
            ]}>
              Apply to every day this week
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton,
                selectedPositions.length === 0 && styles.disabledButton
              ]}
              onPress={handleConfirm}
              disabled={selectedPositions.length === 0}
            >
              <Text style={styles.confirmText}>Add Snack</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
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
    maxHeight: '80%',
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    color: '#666666',
  },
  positionsContainer: {
    marginBottom: 25,
  },
  positionButton: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
  },
  selectedPosition: {
    backgroundColor: '#FFB347',
  },
  positionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333333',
    fontWeight: '500',
  },
  selectedPositionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optionButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 25,
  },
  selectedOption: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666666',
  },
  selectedOptionText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#FFB347',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});