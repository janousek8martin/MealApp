// src/components/PortionSizesModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface PortionSize {
  category: string;
  icon: string;
  sizes: { key: string; label: string; multiplier: number }[];
}

const portionCategories: PortionSize[] = [
  {
    category: 'Proteins',
    icon: 'set-meal',
    sizes: [
      { key: 'small', label: 'Small', multiplier: 0.75 },
      { key: 'medium', label: 'Medium', multiplier: 1.0 },
      { key: 'large', label: 'Large', multiplier: 1.25 },
      { key: 'extra-large', label: 'Extra Large', multiplier: 1.5 },
    ]
  },
  {
    category: 'Carbohydrates',
    icon: 'grain',
    sizes: [
      { key: 'small', label: 'Small', multiplier: 0.75 },
      { key: 'medium', label: 'Medium', multiplier: 1.0 },
      { key: 'large', label: 'Large', multiplier: 1.25 },
      { key: 'extra-large', label: 'Extra Large', multiplier: 1.5 },
    ]
  },
  {
    category: 'Vegetables',
    icon: 'eco',
    sizes: [
      { key: 'small', label: 'Small', multiplier: 0.75 },
      { key: 'medium', label: 'Medium', multiplier: 1.0 },
      { key: 'large', label: 'Large', multiplier: 1.25 },
      { key: 'extra-large', label: 'Extra Large', multiplier: 1.5 },
    ]
  },
  {
    category: 'Fats',
    icon: 'opacity',
    sizes: [
      { key: 'small', label: 'Small', multiplier: 0.75 },
      { key: 'medium', label: 'Medium', multiplier: 1.0 },
      { key: 'large', label: 'Large', multiplier: 1.25 },
      { key: 'extra-large', label: 'Extra Large', multiplier: 1.5 },
    ]
  },
  {
    category: 'Snacks',
    icon: 'local-cafe',
    sizes: [
      { key: 'small', label: 'Small', multiplier: 0.75 },
      { key: 'medium', label: 'Medium', multiplier: 1.0 },
      { key: 'large', label: 'Large', multiplier: 1.25 },
      { key: 'extra-large', label: 'Extra Large', multiplier: 1.5 },
    ]
  },
];

interface PortionSizesModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (portionSizes: { [key: string]: number }) => void;
}

export const PortionSizesModal: React.FC<PortionSizesModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave
}) => {
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Load current portion sizes from user data
    if (currentUser?.portionSizes) {
      setSelectedSizes(currentUser.portionSizes);
    } else {
      // Set default medium sizes
      const defaultSizes: { [key: string]: number } = {};
      portionCategories.forEach(category => {
        defaultSizes[category.category] = 1.0; // Medium = 1.0 multiplier
      });
      setSelectedSizes(defaultSizes);
    }
  }, [currentUser, visible]);

  const handleSizeSelection = (category: string, multiplier: number) => {
    setSelectedSizes(prev => ({
      ...prev,
      [category]: multiplier
    }));
  };

  const handleSave = () => {
    onSave(selectedSizes);
    onClose();
  };

  const getSizeLabel = (multiplier: number) => {
    const size = portionCategories[0].sizes.find(s => s.multiplier === multiplier);
    return size ? size.label : 'Medium';
  };

  const getTotalCalorieAdjustment = () => {
    const values = Object.values(selectedSizes);
    if (values.length === 0) return 1.0;
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return average;
  };

  const getCalorieAdjustmentText = () => {
    const adjustment = getTotalCalorieAdjustment();
    const percentage = Math.round((adjustment - 1) * 100);
    
    if (percentage === 0) return 'No adjustment';
    if (percentage > 0) return `+${percentage}% calories`;
    return `${percentage}% calories`;
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
            <Text style={styles.title}>Portion Sizes</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Customize your preferred portion sizes for different food categories:
            </Text>

            {/* Overall Calorie Impact */}
            <View style={styles.calorieImpactContainer}>
              <Text style={styles.calorieImpactTitle}>Overall Calorie Impact</Text>
              <Text style={styles.calorieImpactValue}>
                {getCalorieAdjustmentText()}
              </Text>
            </View>

            {/* Portion Categories */}
            {portionCategories.map((category, categoryIndex) => (
              <View key={categoryIndex} style={styles.categoryContainer}>
                <View style={styles.categoryHeader}>
                  <Icon name={category.icon} size={24} color="#FFB347" />
                  <Text style={styles.categoryTitle}>{category.category}</Text>
                </View>
                
                <View style={styles.sizesContainer}>
                  {category.sizes.map((size, sizeIndex) => (
                    <TouchableOpacity
                      key={sizeIndex}
                      style={[
                        styles.sizeButton,
                        selectedSizes[category.category] === size.multiplier && styles.selectedSizeButton
                      ]}
                      onPress={() => handleSizeSelection(category.category, size.multiplier)}
                    >
                      <Text style={[
                        styles.sizeButtonText,
                        selectedSizes[category.category] === size.multiplier && styles.selectedSizeButtonText
                      ]}>
                        {size.label}
                      </Text>
                      <Text style={[
                        styles.sizeMultiplierText,
                        selectedSizes[category.category] === size.multiplier && styles.selectedSizeMultiplierText
                      ]}>
                        {size.multiplier}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Quick Presets */}
            <View style={styles.presetsContainer}>
              <Text style={styles.presetsTitle}>Quick Presets</Text>
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => {
                    const smallSizes: { [key: string]: number } = {};
                    portionCategories.forEach(cat => {
                      smallSizes[cat.category] = 0.75;
                    });
                    setSelectedSizes(smallSizes);
                  }}
                >
                  <Text style={styles.presetButtonText}>All Small</Text>
                  <Text style={styles.presetButtonSubtext}>0.75x</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => {
                    const mediumSizes: { [key: string]: number } = {};
                    portionCategories.forEach(cat => {
                      mediumSizes[cat.category] = 1.0;
                    });
                    setSelectedSizes(mediumSizes);
                  }}
                >
                  <Text style={styles.presetButtonText}>All Medium</Text>
                  <Text style={styles.presetButtonSubtext}>1.0x</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => {
                    const largeSizes: { [key: string]: number } = {};
                    portionCategories.forEach(cat => {
                      largeSizes[cat.category] = 1.25;
                    });
                    setSelectedSizes(largeSizes);
                  }}
                >
                  <Text style={styles.presetButtonText}>All Large</Text>
                  <Text style={styles.presetButtonSubtext}>1.25x</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Examples */}
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Examples</Text>
              <View style={styles.exampleItem}>
                <Icon name="info" size={20} color="#1976D2" />
                <Text style={styles.exampleText}>
                  Small portions are about 25% less than standard serving sizes
                </Text>
              </View>
              <View style={styles.exampleItem}>
                <Icon name="info" size={20} color="#1976D2" />
                <Text style={styles.exampleText}>
                  Large portions are about 25% more than standard serving sizes
                </Text>
              </View>
              <View style={styles.exampleItem}>
                <Icon name="info" size={20} color="#1976D2" />
                <Text style={styles.exampleText}>
                  These settings will adjust recipe servings and calorie calculations
                </Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Portion Sizes</Text>
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
    maxHeight: '90%',
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
  calorieImpactContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  calorieImpactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 5,
  },
  calorieImpactValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 10,
  },
  sizesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sizeButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSizeButton: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  selectedSizeButtonText: {
    color: '#FFFFFF',
  },
  sizeMultiplierText: {
    fontSize: 12,
    color: '#666666',
  },
  selectedSizeMultiplierText: {
    color: '#FFFFFF',
  },
  presetsContainer: {
    marginBottom: 20,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB347',
    marginBottom: 2,
  },
  presetButtonSubtext: {
    fontSize: 12,
    color: '#FFB347',
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
    color: '#1976D2',
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