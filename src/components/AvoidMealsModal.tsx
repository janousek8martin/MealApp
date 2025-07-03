// src/components/AvoidMealsModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

// Common foods/ingredients that users might want to avoid
const commonAvoidItems = [
  'Dairy', 'Gluten', 'Nuts', 'Eggs', 'Shellfish', 'Fish', 'Soy', 'Peanuts',
  'Beef', 'Pork', 'Chicken', 'Lamb', 'Mushrooms', 'Onions', 'Garlic',
  'Tomatoes', 'Spicy Food', 'Coconut', 'Sesame', 'Wheat', 'Corn',
  'Avocado', 'Citrus', 'Chocolate', 'Coffee', 'Alcohol'
];

interface AvoidMealsModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (avoidMeals: string[]) => void;
}

export const AvoidMealsModal: React.FC<AvoidMealsModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load current avoid meals from user data
    if (currentUser?.avoidMeals) {
      setSelectedItems(currentUser.avoidMeals);
    } else {
      setSelectedItems([]);
    }
  }, [currentUser, visible]);

  const handleItemToggle = (item: string) => {
    setSelectedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleAddCustomItem = () => {
    if (customItem.trim()) {
      const newItem = customItem.trim();
      if (!selectedItems.includes(newItem)) {
        setSelectedItems(prev => [...prev, newItem]);
      }
      setCustomItem('');
      setShowCustomInput(false);
    }
  };

  const handleRemoveCustomItem = (item: string) => {
    Alert.alert(
      'Remove Item',
      `Remove "${item}" from your avoid list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setSelectedItems(prev => prev.filter(i => i !== item));
          }
        }
      ]
    );
  };

  const handleSave = () => {
    onSave(selectedItems);
    onClose();
  };

  const filteredCommonItems = commonAvoidItems.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const customItems = selectedItems.filter(item => !commonAvoidItems.includes(item));

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
            <Text style={styles.title}>Avoid Meals</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Select foods, ingredients, or meal types you want to avoid in your meal plans:
            </Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#666666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search foods to avoid..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999999"
              />
            </View>

            {/* Selected Items Summary */}
            {selectedItems.length > 0 && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>
                  Currently avoiding ({selectedItems.length} items):
                </Text>
                <View style={styles.selectedItemsContainer}>
                  {selectedItems.map((item, index) => (
                    <View key={index} style={styles.selectedItemChip}>
                      <Text style={styles.selectedItemText}>{item}</Text>
                      <TouchableOpacity
                        onPress={() => handleItemToggle(item)}
                        style={styles.removeChipButton}
                      >
                        <Icon name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Common Items */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Common Items</Text>
              <View style={styles.itemsGrid}>
                {filteredCommonItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.itemButton,
                      selectedItems.includes(item) && styles.selectedItemButton
                    ]}
                    onPress={() => handleItemToggle(item)}
                  >
                    <Text style={[
                      styles.itemButtonText,
                      selectedItems.includes(item) && styles.selectedItemButtonText
                    ]}>
                      {item}
                    </Text>
                    {selectedItems.includes(item) && (
                      <Icon name="check" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Items */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Custom Items</Text>
              
              {customItems.length > 0 && (
                <View style={styles.customItemsList}>
                  {customItems.map((item, index) => (
                    <View key={index} style={styles.customItemRow}>
                      <Text style={styles.customItemText}>{item}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveCustomItem(item)}
                        style={styles.removeItemButton}
                      >
                        <Icon name="delete" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {showCustomInput ? (
                <View style={styles.customInputContainer}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Enter food or ingredient..."
                    value={customItem}
                    onChangeText={setCustomItem}
                    placeholderTextColor="#999999"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddCustomItem}
                    disabled={!customItem.trim()}
                  >
                    <Icon name="add" size={20} color={customItem.trim() ? "#FFFFFF" : "#CCC"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowCustomInput(false);
                      setCustomItem('');
                    }}
                  >
                    <Icon name="close" size={20} color="#666666" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addCustomButton}
                  onPress={() => setShowCustomInput(true)}
                >
                  <Icon name="add" size={20} color="#FFB347" />
                  <Text style={styles.addCustomButtonText}>Add Custom Item</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Icon name="info" size={20} color="#1976D2" />
              <Text style={styles.infoText}>
                These items will be excluded from your meal plans. You can always modify this list later.
              </Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
  },
  summaryContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 10,
  },
  selectedItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB347',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 2,
  },
  selectedItemText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginRight: 6,
  },
  removeChipButton: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginVertical: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedItemButton: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  itemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  selectedItemButtonText: {
    color: '#FFFFFF',
  },
  customItemsList: {
    marginBottom: 10,
  },
  customItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginVertical: 2,
  },
  customItemText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  removeItemButton: {
    padding: 4,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFB347',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
  },
  addCustomButtonText: {
    fontSize: 14,
    color: '#FFB347',
    marginLeft: 8,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  infoText: {
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