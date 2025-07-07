// src/components/AvoidMealsModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { tagsDatabase, addFoodType, addAllergen } from '../data/tagsDatabase';

const { width } = Dimensions.get('window');

interface AvoidMealsModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (avoidData: { foodTypes: string[]; allergens: string[] }) => void;
}

export const AvoidMealsModal: React.FC<AvoidMealsModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'foodTypes' | 'allergens'>('foodTypes');
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load current avoid data from user
    if (currentUser?.avoidMeals) {
      // Handle both old format (string[]) and new format ({ foodTypes: string[], allergens: string[] })
      if (Array.isArray(currentUser.avoidMeals)) {
        // Old format - split existing data into food types and allergens based on tagsDatabase
        const userFoodTypes = currentUser.avoidMeals.filter((item: string) => 
          tagsDatabase.foodTypes.includes(item)
        );
        const userAllergens = currentUser.avoidMeals.filter((item: string) => 
          tagsDatabase.allergens.includes(item)
        );
        
        setSelectedFoodTypes(userFoodTypes);
        setSelectedAllergens(userAllergens);
      } else {
        // New format
        setSelectedFoodTypes(currentUser.avoidMeals.foodTypes || []);
        setSelectedAllergens(currentUser.avoidMeals.allergens || []);
      }
    } else {
      setSelectedFoodTypes([]);
      setSelectedAllergens([]);
    }
  }, [currentUser, visible]);

  const getCurrentItems = () => {
    return activeTab === 'foodTypes' ? tagsDatabase.foodTypes : tagsDatabase.allergens;
  };

  const getCurrentSelected = () => {
    return activeTab === 'foodTypes' ? selectedFoodTypes : selectedAllergens;
  };

  const setCurrentSelected = (items: string[]) => {
    if (activeTab === 'foodTypes') {
      setSelectedFoodTypes(items);
    } else {
      setSelectedAllergens(items);
    }
  };

  const handleItemToggle = (item: string) => {
    const currentSelected = getCurrentSelected();
    if (currentSelected.includes(item)) {
      setCurrentSelected(currentSelected.filter(i => i !== item));
    } else {
      setCurrentSelected([...currentSelected, item]);
    }
  };

  const handleAddCustomItem = () => {
    if (customItem.trim()) {
      const newItem = customItem.trim();
      
      // Add to appropriate database
      if (activeTab === 'foodTypes') {
        addFoodType(newItem);
        if (!selectedFoodTypes.includes(newItem)) {
          setSelectedFoodTypes(prev => [...prev, newItem]);
        }
      } else {
        addAllergen(newItem);
        if (!selectedAllergens.includes(newItem)) {
          setSelectedAllergens(prev => [...prev, newItem]);
        }
      }
      
      setCustomItem('');
      setShowCustomInput(false);
    }
  };

  const handleSave = () => {
    onSave({
      foodTypes: selectedFoodTypes,
      allergens: selectedAllergens
    });
    onClose();
  };

  const filteredItems = getCurrentItems().filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSelected = getCurrentSelected();
  const totalSelected = selectedFoodTypes.length + selectedAllergens.length;



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

          <Text style={styles.subtitle}>
            Select foods and allergens you want to avoid in your meal plans
          </Text>

          {/* Tab Selector - Recipes Style */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'foodTypes' && styles.activeTab]}
              onPress={() => setActiveTab('foodTypes')}
            >
              <Text style={[styles.tabText, activeTab === 'foodTypes' && styles.activeTabText]}>
                Food Types {selectedFoodTypes.length > 0 && `(${selectedFoodTypes.length})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'allergens' && styles.activeTab]}
              onPress={() => setActiveTab('allergens')}
            >
              <Text style={[styles.tabText, activeTab === 'allergens' && styles.activeTabText]}>
                Allergens {selectedAllergens.length > 0 && `(${selectedAllergens.length})`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab === 'foodTypes' ? 'food types' : 'allergens'}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999999"
            />
          </View>

          {/* ScrollView with fixed height */}
          <ScrollView style={styles.itemsScrollView} showsVerticalScrollIndicator={false}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.itemButton,
                    currentSelected.includes(item) && styles.selectedItemButton
                  ]}
                  onPress={() => handleItemToggle(item)}
                >
                  <Text style={[
                    styles.itemButtonText,
                    currentSelected.includes(item) && styles.selectedItemButtonText
                  ]}>
                    {item}
                  </Text>
                  {currentSelected.includes(item) && (
                    <View style={{ marginLeft: 6 }}>
                      <Icon name="check" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noItemsText}>
                No {activeTab === 'foodTypes' ? 'food types' : 'allergens'} found
              </Text>
            )}
          </ScrollView>

          {/* Add Custom Item */}
          <View style={styles.customSection}>
            {showCustomInput ? (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder={`Enter custom ${activeTab === 'foodTypes' ? 'food type' : 'allergen'}...`}
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
                <Text style={styles.addCustomButtonText}>
                  Add Custom {activeTab === 'foodTypes' ? 'Food Type' : 'Allergen'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              Save Preferences {totalSelected > 0 && `(${totalSelected} selected)`}
            </Text>
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
    marginBottom: 15,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFB347',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
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
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  itemsScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  itemButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 8,
  },
  selectedItemButton: {
    backgroundColor: '#FFB347',
  },
  itemButtonText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  selectedItemButtonText: {
    color: '#FFFFFF',
  },
  customSection: {
    marginBottom: 20,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#FFB347',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addCustomButtonText: {
    fontSize: 16,
    color: '#FFB347',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FFB347',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noItemsText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});