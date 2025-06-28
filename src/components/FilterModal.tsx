// src/components/FilterModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: {
    categories: string[];
    foodTypes: string[];
    allergens: string[];
  }) => void;
  initialCategories: string[];
  initialFoodTypes: string[];
  initialAllergens: string[];
}

const foodCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const foodTypes = ['Fish', 'Chicken', 'Pork', 'Beef', 'Vegetarian', 'Vegan'];
const allergens = ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish'];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialCategories,
  initialFoodTypes,
  initialAllergens
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>(initialFoodTypes);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(initialAllergens);

  useEffect(() => {
    if (visible) {
      setSelectedCategories(initialCategories);
      setSelectedFoodTypes(initialFoodTypes);
      setSelectedAllergens(initialAllergens);
    }
  }, [visible, initialCategories, initialFoodTypes, initialAllergens]);

  const toggleSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleApply = () => {
    onApply({
      categories: selectedCategories,
      foodTypes: selectedFoodTypes,
      allergens: selectedAllergens
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedCategories([]);
    setSelectedFoodTypes([]);
    setSelectedAllergens([]);
  };

  const FilterSection: React.FC<{
    title: string;
    items: string[];
    selected: string[];
    onToggle: (item: string) => void;
  }> = ({ title, items, selected, onToggle }) => (
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
            onPress={() => onToggle(item)}
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
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Filter Recipes</Text>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <FilterSection
              title="Categories"
              items={foodCategories}
              selected={selectedCategories}
              onToggle={(item) => toggleSelection(item, selectedCategories, setSelectedCategories)}
            />

            <FilterSection
              title="Food Types"
              items={foodTypes}
              selected={selectedFoodTypes}
              onToggle={(item) => toggleSelection(item, selectedFoodTypes, setSelectedFoodTypes)}
            />

            <FilterSection
              title="Exclude Allergens"
              items={allergens}
              selected={selectedAllergens}
              onToggle={(item) => toggleSelection(item, selectedAllergens, setSelectedAllergens)}
            />
          </ScrollView>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 20,
    color: '#666666',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  clearButton: {
    padding: 5,
  },
  clearText: {
    fontSize: 16,
    color: '#FFB347',
    fontWeight: '600',
  },
  scrollContent: {
    maxHeight: 400,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterTitle: {
    fontSize: 18,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedFilterItem: {
    backgroundColor: '#FFB347',
    borderColor: '#FF8C00',
  },
  filterItemText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  selectedFilterItemText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#FFB347',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});