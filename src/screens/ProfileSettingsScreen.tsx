import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/Button';
import { PersonalInfoModal } from '../components/PersonalInfoModal';
import { WeightCompositionModal } from '../components/WeightCompositionModal';
import { GoalWeightModal } from '../components/GoalWeightModal';
import { ProgressionGraphModal } from '../components/ProgressionGraphModal';

interface User {
  id: string;
  name: string;
  age?: string;
  gender?: string;
  height?: string;
  heightUnit?: 'cm' | 'ft';
  heightFeet?: string;
  heightInches?: string;
  weight?: string;
  weightUnit?: 'kg' | 'lbs';
  bodyFat?: string;
  goalWeight?: string;
  goalBodyFat?: string;
}

interface ProfileSettingsScreenProps {
  onBack: () => void;
}

function UserDropdown({ users, selectedUser, onSelectUser, onAddUser }: {
  users: User[];
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onAddUser: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectUser = async (user: User) => {
    onSelectUser(user);
    setIsOpen(false);
    
    // Save selected user immediately
    try {
      await AsyncStorage.setItem('selectedUserId', user.id);
    } catch (error) {
      console.error('Error saving selected user:', error);
    }
  };

  return (
    <View style={styles.dropdown}>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.dropdownButtonText}>
          {selectedUser ? selectedUser.name : 'Select User'}
        </Text>
        <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={[styles.dropdownItem, styles.addUserItem]}
            onPress={() => {
              onAddUser();
              setIsOpen(false);
            }}
          >
            <Text style={styles.addUserText}>+ Add User</Text>
          </TouchableOpacity>
          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.dropdownItem}
              onPress={() => handleSelectUser(user)}
            >
              <Text style={[
                styles.dropdownItemText,
                selectedUser?.id === user.id && styles.selectedDropdownItem
              ]}>
                {user.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'name' | 'age' | 'gender' | 'height' | 'weight'>('name');
  const [isLoading, setIsLoading] = useState(true);
  const [weightCompositionModalVisible, setWeightCompositionModalVisible] = useState(false);
  const [goalWeightModalVisible, setGoalWeightModalVisible] = useState(false);
  const [progressionGraphModalVisible, setProgressionGraphModalVisible] = useState(false);

  // Load data from AsyncStorage on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Save data whenever users array changes
  useEffect(() => {
    if (!isLoading && users.length > 0) {
      saveUserData();
    }
  }, [users, isLoading]);

  // Save selected user whenever it changes
  useEffect(() => {
    if (!isLoading && selectedUser) {
      saveSelectedUser();
    }
  }, [selectedUser, isLoading]);

  const loadUserData = async () => {
    try {
      // Load users data
      const savedUsers = await AsyncStorage.getItem('profileUsers');
      const savedSelectedUserId = await AsyncStorage.getItem('selectedUserId');
      
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        setUsers(parsedUsers);
        
        // Set selected user
        if (savedSelectedUserId) {
          const foundUser = parsedUsers.find((user: User) => user.id === savedSelectedUserId);
          setSelectedUser(foundUser || parsedUsers[0]);
        } else if (parsedUsers.length > 0) {
          setSelectedUser(parsedUsers[0]);
        }
      } else {
        // Create default users if none exist
        const defaultUsers: User[] = [
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' },
          { id: '3', name: 'User 3' },
        ];
        setUsers(defaultUsers);
        setSelectedUser(defaultUsers[0]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to default users
      const defaultUsers: User[] = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
        { id: '3', name: 'User 3' },
      ];
      setUsers(defaultUsers);
      setSelectedUser(defaultUsers[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = async () => {
    try {
      await AsyncStorage.setItem('profileUsers', JSON.stringify(users));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const saveSelectedUser = async () => {
    try {
      if (selectedUser) {
        await AsyncStorage.setItem('selectedUserId', selectedUser.id);
      }
    } catch (error) {
      console.error('Error saving selected user:', error);
    }
  };

  const handleBack = () => {
    onBack();
  };

  const handleAddUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name: `User ${users.length + 1}`,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setSelectedUser(newUser);
  };

  const handleOpenModal = (type: 'name' | 'age' | 'gender' | 'height' | 'weight') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSavePersonalInfo = async (field: string, value: string | { [key: string]: string }) => {
    if (selectedUser) {
      let updatedUser: User;
      
      if (typeof value === 'object') {
        // Handle complex objects like height and weight with units
        updatedUser = { ...selectedUser, ...value };
      } else {
        // Handle simple string values
        updatedUser = { ...selectedUser, [field]: value };
      }
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      // Save immediately after update
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving updated user data:', error);
      }
    }
    setModalVisible(false);
  };

  const handleCancelModal = () => {
    setModalVisible(false);
  };

  const handleDeleteProfile = () => {
    if (!selectedUser) return;

    Alert.alert(
      "Delete Profile",
      `Are you sure you want to delete the profile "${selectedUser.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedUsers = users.filter(user => user.id !== selectedUser.id);
            setUsers(updatedUsers);
            const newSelectedUser = updatedUsers.length > 0 ? updatedUsers[0] : null;
            setSelectedUser(newSelectedUser);
            
            // Save changes immediately
            try {
              await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
              if (newSelectedUser) {
                await AsyncStorage.setItem('selectedUserId', newSelectedUser.id);
              } else {
                await AsyncStorage.removeItem('selectedUserId');
              }
            } catch (error) {
              console.error('Error saving after profile deletion:', error);
            }
          }
        }
      ]
    );
  };

  const getDisplayValue = (field: keyof User) => {
    if (!selectedUser) return '';
    
    if (field === 'height') {
      if (selectedUser.heightUnit === 'ft') {
        const feet = selectedUser.heightFeet || '';
        const inches = selectedUser.heightInches || '';
        return feet && inches ? `${feet}ft ${inches}in` : feet ? `${feet}ft` : '';
      } else {
        return selectedUser.height ? `${selectedUser.height} cm` : '';
      }
    }
    
    if (field === 'weight') {
      const weight = selectedUser.weight || '';
      const unit = selectedUser.weightUnit || 'kg';
      const bodyFat = selectedUser.bodyFat ? ` (${selectedUser.bodyFat}% BF)` : '';
      return weight ? `${weight} ${unit}${bodyFat}` : '';
    }
    
    return selectedUser[field] || '';
  };

  const handleSaveWeightComposition = async (data: { weight: string; bodyFat: string; weightUnit: 'kg' | 'lbs' }) => {
    if (selectedUser) {
      const updatedUser = { 
        ...selectedUser, 
        weight: data.weight,
        bodyFat: data.bodyFat,
        weightUnit: data.weightUnit
      };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving weight composition:', error);
      }
    }
    setWeightCompositionModalVisible(false);
  };

  const handleSaveGoalWeight = async (data: { goalWeight: string; goalBodyFat: string; weightUnit: 'kg' | 'lbs' }) => {
    if (selectedUser) {
      const updatedUser = { 
        ...selectedUser, 
        goalWeight: data.goalWeight,
        goalBodyFat: data.goalBodyFat,
        weightUnit: data.weightUnit
      };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving goal weight:', error);
      }
    }
    setGoalWeightModalVisible(false);
  };

  // Personal Information handlers
  const handleName = () => {
    handleOpenModal('name');
  };

  const handleAge = () => {
    handleOpenModal('age');
  };

  const handleGender = () => {
    handleOpenModal('gender');
  };

  const handleHeight = () => {
    handleOpenModal('height');
  };

  const handleWeight = () => {
    handleOpenModal('weight');
  };

  // Weight Goals handlers
  const handleWeightComposition = () => {
    setWeightCompositionModalVisible(true);
  };

  const handleGoalWeight = () => {
    setGoalWeightModalVisible(true);
  };

  const handleProgressionGraph = () => {
    setProgressionGraphModalVisible(true);
  };

  // Nutritional Goals handlers
  const handleBasalMetabolicRate = () => {
    console.log('Basal Metabolic Rate pressed');
  };

  const handleActivityMultiplier = () => {
    console.log('Activity Multiplier pressed');
  };

  const handleFitnessGoals = () => {
    console.log('Fitness Goals pressed');
  };

  const handleTotalDailyCalorieIntake = () => {
    console.log('Total Daily Calorie Intake pressed');
  };

  const handleMacronutrientRatios = () => {
    console.log('Macronutrient Ratios pressed');
  };

  // Meal Plan Preferences handlers
  const handleWorkoutDays = () => {
    console.log('Workout Days pressed');
  };

  const handleMealPreferences = () => {
    console.log('Meal Preferences pressed');
  };

  const handlePortionSizes = () => {
    console.log('Portion Sizes pressed');
  };

  const handleAvoidMeals = () => {
    console.log('Avoid Meals pressed');
  };

  const handleMaxMealRepetition = () => {
    console.log('Max Meal Repetition pressed');
  };

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      {/* Header with dropdown */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Nutrition</Text>
        <View style={styles.headerDropdown}>
          <UserDropdown
            users={users}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            onAddUser={handleAddUser}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Show loading indicator or content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleName}>
                <Text style={styles.personalInfoLabel}>Name:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('name')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleAge}>
                <Text style={styles.personalInfoLabel}>Age:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('age')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleGender}>
                <Text style={styles.personalInfoLabel}>Gender:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('gender')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleHeight}>
                <Text style={styles.personalInfoLabel}>Height:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('height')}</Text>
              </TouchableOpacity>
            </View>

            {/* Weight Goals */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weight Goals</Text>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleWeightComposition}>
                <Text style={styles.personalInfoLabel}>Weight:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('weight')}</Text>
              </TouchableOpacity>
              
              <Button
                title="Goal Weight"
                onPress={handleGoalWeight}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
              
              <Button
                title="Progression Graph"
                onPress={handleProgressionGraph}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
            </View>

            {/* Nutritional Goals */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutritional Goals</Text>
              
              <Button
                title="Basal Metabolic Rate"
                onPress={handleBasalMetabolicRate}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
              
              <Button
                title="Activity Multiplier"
                onPress={handleActivityMultiplier}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
              
              <Button
                title="Fitness Goals"
                onPress={handleFitnessGoals}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
              
              <Button
                title="Total Daily Calorie Intake"
                onPress={handleTotalDailyCalorieIntake}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
              
              <Button
                title="Macronutrient Ratios"
                onPress={handleMacronutrientRatios}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
            </View>

            {/* Meal Plan Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meal Plan Preferences</Text>
              
              <Button
                title="Workout Days"
                onPress={handleWorkoutDays}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
              
              <Button
                title="Meal Preferences"
                onPress={handleMealPreferences}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
              
              <Button
                title="Portion Sizes"
                onPress={handlePortionSizes}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
              
              <Button
                title="Avoid Meals"
                onPress={handleAvoidMeals}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
              
              <Button
                title="Max Meal Repetition"
                onPress={handleMaxMealRepetition}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
            </View>

            {/* Delete Profile Button */}
            <View style={styles.deleteSection}>
              <Button
                title="Delete Profile"
                onPress={handleDeleteProfile}
                variant="secondary"
                size="large"
                style={styles.deleteButton}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Personal Info Modal */}
      <PersonalInfoModal
        visible={modalVisible}
        type={modalType}
        currentUser={selectedUser}
        onSave={handleSavePersonalInfo}
        onCancel={handleCancelModal}
      />

      {/* Weight Composition Modal */}
      <WeightCompositionModal
        visible={weightCompositionModalVisible}
        onClose={() => setWeightCompositionModalVisible(false)}
        onSave={handleSaveWeightComposition}
        currentUser={selectedUser}
      />

      {/* Goal Weight Modal */}
      <GoalWeightModal
        visible={goalWeightModalVisible}
        onClose={() => setGoalWeightModalVisible(false)}
        onSave={handleSaveGoalWeight}
        currentUser={selectedUser}
      />

      {/* Progression Graph Modal */}
      <ProgressionGraphModal
        visible={progressionGraphModalVisible}
        onClose={() => setProgressionGraphModalVisible(false)}
        currentUser={selectedUser}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusBarSeparator: {
    backgroundColor: '#FFB347',
    height: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minHeight: 60,
  },
  backButton: {
    paddingRight: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#FFB347',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 12,
    textAlignVertical: 'center',
  },
  headerDropdown: {
    flex: 1,
    maxWidth: 150,
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  settingButton: {
    marginBottom: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  personalInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#FFB347',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 12,
    minHeight: 52,
  },
  personalInfoLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFB347',
  },
  personalInfoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  dropdown: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 36,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333333',
  },
  selectedDropdownItem: {
    color: '#FFB347',
    fontWeight: '600',
  },
  addUserItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  addUserText: {
    fontSize: 16,
    color: '#FFB347',
    fontWeight: '600',
  },
  deleteSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
});