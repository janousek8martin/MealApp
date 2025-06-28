// src/components/FilterModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useMealStore, foodCategories, foodTypes, allergens } from '../stores/mealStore';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose }) => {
  const {
    selectedCategories,
    selectedFoodTypes,
    selectedAllergens,
    setSelectedCategories,
    setSelectedFoodTypes,
    setSelectedAllergens,
    clearFilters
  } = useMealStore();

  // Local state for filters (applied on confirm)
  const [localCategories, setLocalCategories] = useState<string[]>([]);
  const [localFoodTypes, setLocalFoodTypes] = useState<string[]>([]);
  const [localAllergens, setLocalAllergens] = useState<string[]>([]);

  // Update local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalCategories([...selectedCategories]);
      setLocalFoodTypes([...selectedFoodTypes]);
      setLocalAllergens([...selectedAllergens]);
    }
  }, [visible, selectedCategories, selectedFoodTypes, selectedAllergens]);

  const toggleSelection = (item: string, selected: string[], setSelected: (items: string[]) => void) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const applyFilters = () => {
    setSelectedCategories(localCategories);
    setSelectedFoodTypes(localFoodTypes);
    setSelectedAllergens(localAllergens);
    onClose();
  };

  const clearAllFilters = () => {
    setLocalCategories([]);
    setLocalFoodTypes([]);
    setLocalAllergens([]);
    clearFilters();
    onClose();
  };

  const hasAnyFilters = localCategories.length > 0 || localFoodTypes.length > 0 || localAllergens.length > 0;

  const FilterSection: React.FC<{
    title: string;
    items: string[];
    selected: string[];
    setSelected: (items: string[]) => void;
  }> = ({ title, items, selected, setSelected }) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterItemsContainer}>
        {items.map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterItem,
              selected.includes(item) && styles.selectedFilterItem
            ]}
            onPress={() => toggleSelection(item, selected, setSelected)}
          >
            <Text style={[
              styles.filterItemText,
              selected.includes(item) && styles.selectedFilterItemText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Recipes</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <FilterSection 
              title="Categories" 
              items={foodCategories} 
              selected={localCategories} 
              setSelected={setLocalCategories} 
            />
            
            <FilterSection 
              title="Food Types" 
              items={foodTypes} 
              selected={localFoodTypes} 
              setSelected={setLocalFoodTypes} 
            />
            
            <FilterSection 
              title="Allergens to Avoid" 
              items={allergens} 
              selected={localAllergens} 
              setSelected={setLocalAllergens} 
            />
          </ScrollView>

          <View style={styles.buttonContainer}>
            {hasAnyFilters && (
              <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.applyButton, !hasAnyFilters && styles.applyButtonFull]} 
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>
                {hasAnyFilters ? 'Apply Filters' : 'Close'}
              </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 20,
    color: '#666666',
  },
  scrollContainer: {
    maxHeight: 400,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  filterItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterItem: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedFilterItem: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  filterItemText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  selectedFilterItemText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#FFB347',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonFull: {
    flex: 1,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});