// src/screens/ProfileSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../components/Button';
import { PersonalInfoModal } from '../components/PersonalInfoModal';
import { WeightCompositionModal } from '../components/WeightCompositionModal';
import { GoalWeightModal } from '../components/GoalWeightModal';
import { ProgressionGraphModal } from '../components/ProgressionGraphModal';
// Import nových komponent s named export - zatím zakomentováno
import { ActivityMultiplierModal } from '../components/ActivityMultiplierModal';
import { FitnessGoalsModal } from '../components/FitnessGoalsModal'; 
import { TotalDailyCalorieModal } from '../components/TotalDailyCalorieModal';
import { MacronutrientRatiosModal } from '../components/MacronutrientRatiosModal';
import { WorkoutDaysModal } from '../components/WorkoutDaysModal';
import { MealPreferencesModal } from '../components/MealPreferencesModal';
import { MaxMealRepetitionModal } from '../components/MaxMealRepetitionModal';
import { AvoidMealsModal } from '../components/AvoidMealsModal';
import { PortionSizesModal } from '../components/PortionSizesModal';

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
  // New nutritional goals fields
  activityMultiplier?: number;
  fitnessGoal?: {
    goal: string;
    fitnessLevel?: string | null;
    calorieValue: string;
  };
  tdci?: {
    baseTDCI: number;
    adjustedTDCI: number;
    weightChange: number;
    manualAdjustment: number;
  };
  macronutrients?: {
    protein: number;
    fat: number;
    carbs: number;
    proteinPercentage: number;
    fatPercentage: number;
    carbsPercentage: number;
  };
  // New Meal Plan Preferences fields
  workoutDays?: string[];
  mealPreferences?: {
    mealsPerDay: number;
    snackPositions: string[];
  };
  portionSizes?: {
    [key: string]: number;
  };
  avoidMeals?: string[];
  maxMealRepetition?: number;
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
          <ScrollView style={styles.dropdownScroll}>
            {users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.dropdownItem,
                  selectedUser?.id === user.id && styles.selectedDropdownItem
                ]}
                onPress={() => handleSelectUser(user)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedUser?.id === user.id && styles.selectedDropdownItemText
                ]}>
                  {user.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.addUserButton}
              onPress={onAddUser}
            >
              <Icon name="add" size={20} color="#FFB347" />
              <Text style={styles.addUserText}>Add New User</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'name' | 'age' | 'gender' | 'height' | 'weight'>('name');
  const [currentValue, setCurrentValue] = useState('');
  const [weightCompositionModalVisible, setWeightCompositionModalVisible] = useState(false);
  const [goalWeightModalVisible, setGoalWeightModalVisible] = useState(false);
  const [progressionGraphModalVisible, setProgressionGraphModalVisible] = useState(false);
  const [activityMultiplierModalVisible, setActivityMultiplierModalVisible] = useState(false);
  const [fitnessGoalsModalVisible, setFitnessGoalsModalVisible] = useState(false);
  const [totalDailyCalorieModalVisible, setTotalDailyCalorieModalVisible] = useState(false);
  const [macronutrientRatiosModalVisible, setMacronutrientRatiosModalVisible] = useState(false);
  const [needsTDCIUpdate, setNeedsTDCIUpdate] = useState(false);
  
  // New Meal Plan Preferences modal states
  const [workoutDaysModalVisible, setWorkoutDaysModalVisible] = useState(false);
  const [mealPreferencesModalVisible, setMealPreferencesModalVisible] = useState(false);
  const [portionSizesModalVisible, setPortionSizesModalVisible] = useState(false);
  const [avoidMealsModalVisible, setAvoidMealsModalVisible] = useState(false);
  const [maxMealRepetitionModalVisible, setMaxMealRepetitionModalVisible] = useState(false);

  // Load users and selected user on component mount
  useEffect(() => {
    loadUsersAndSelectedUser();
  }, []);

  const loadUsersAndSelectedUser = async () => {
    setIsLoading(true);
    try {
      const storedUsers = await AsyncStorage.getItem('profileUsers');
      const storedSelectedUserId = await AsyncStorage.getItem('selectedUserId');
      
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        setUsers(parsedUsers);
        
        if (storedSelectedUserId) {
          const selectedUser = parsedUsers.find((user: User) => user.id === storedSelectedUserId);
          setSelectedUser(selectedUser || parsedUsers[0]);
        } else {
          setSelectedUser(parsedUsers[0]);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if TDCI needs update when relevant fields change
  useEffect(() => {
    if (selectedUser) {
      const hasRelevantData = selectedUser.age && selectedUser.gender && selectedUser.height && selectedUser.weight && selectedUser.activityMultiplier;
      const hasTDCI = selectedUser.tdci;
      
      if (hasRelevantData && !hasTDCI) {
        setNeedsTDCIUpdate(true);
      } else {
        setNeedsTDCIUpdate(false);
      }
    }
  }, [selectedUser]);

  const calculateBMR = (user: User): number => {
    if (!user.age || !user.gender || !user.height || !user.weight) {
      return 0;
    }

    const age = parseInt(user.age);
    const height = parseFloat(user.height);
    let weight = parseFloat(user.weight);
    
    // Convert weight to kg if needed
    if (user.weightUnit === 'lbs') {
      weight = weight * 0.453592;
    }

    // Mifflin-St Jeor Equation
    if (user.gender === 'Male') {
      return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
    } else {
      return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
    }
  };

  const handleOpenModal = (type: 'name' | 'age' | 'gender' | 'height' | 'weight', value: string = '') => {
    setModalType(type);
    setCurrentValue(value);
    setModalVisible(true);
  };

  const getDisplayValue = (field: string): string => {
    if (!selectedUser) return 'Not set';
    
    switch (field) {
      case 'basalMetabolicRate':
        const bmr = calculateBMR(selectedUser);
        return bmr > 0 ? `${bmr} kcal` : 'Complete profile first';
      case 'activityMultiplier':
        return selectedUser.activityMultiplier ? `${selectedUser.activityMultiplier}` : 'Not set';
      case 'fitnessGoals':
        return selectedUser.fitnessGoal?.goal || 'Not set';
      case 'totalDailyCalorieIntake':
        return selectedUser.tdci?.adjustedTDCI ? `${selectedUser.tdci.adjustedTDCI} kcal` : 'Not set';
      case 'macronutrientRatios':
        if (selectedUser.macronutrients) {
          const { proteinPercentage, fatPercentage, carbsPercentage } = selectedUser.macronutrients;
          return `P: ${proteinPercentage}% F: ${fatPercentage}% C: ${carbsPercentage}%`;
        }
        return 'Not set';
      case 'workoutDays':
        return selectedUser.workoutDays?.length ? selectedUser.workoutDays.join(', ') : 'Not set';
      case 'mealPreferences':
        return selectedUser.mealPreferences?.mealsPerDay ? `${selectedUser.mealPreferences.mealsPerDay} meals/day` : 'Not set';
      case 'portionSizes':
        return selectedUser.portionSizes ? 'Configured' : 'Not set';
      case 'avoidMeals':
        return selectedUser.avoidMeals?.length ? `${selectedUser.avoidMeals.length} items` : 'Not set';
      case 'maxMealRepetition':
        return selectedUser.maxMealRepetition ? `${selectedUser.maxMealRepetition} times/week` : 'Not set';
      default:
        return 'Not set';
    }
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
    // BMR is calculated and displayed only, no modal needed
  };

  const handleActivityMultiplier = () => {
    console.log('Activity Multiplier pressed');
    // setActivityMultiplierModalVisible(true);
  };

  const handleFitnessGoals = () => {
    console.log('Fitness Goals pressed');
    // setFitnessGoalsModalVisible(true);
  };

  const handleTotalDailyCalorieIntake = () => {
    console.log('Total Daily Calorie Intake pressed');
    // setTotalDailyCalorieModalVisible(true);
  };

  const handleMacronutrientRatios = () => {
    console.log('Macronutrient Ratios pressed');
    // setMacronutrientRatiosModalVisible(true);
  };

  // Meal Plan Preferences handlers
  const handleWorkoutDays = () => {
    console.log('Workout Days pressed');
    // setWorkoutDaysModalVisible(true);
  };

  const handleMealPreferences = () => {
    console.log('Meal Preferences pressed');
    // setMealPreferencesModalVisible(true);
  };

  const handlePortionSizes = () => {
    console.log('Portion Sizes pressed');
    // setPortionSizesModalVisible(true);
  };

  const handleAvoidMeals = () => {
    console.log('Avoid Meals pressed');
    // setAvoidMealsModalVisible(true);
  };

  const handleMaxMealRepetition = () => {
    console.log('Max Meal Repetition pressed');
    // setMaxMealRepetitionModalVisible(true);
  };

  // Save handlers
  const handleSavePersonalInfo = async (field: string, value: string) => {
    if (selectedUser) {
      const updatedUser = { ...selectedUser, [field]: value };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving personal info:', error);
      }
    }
    setModalVisible(false);
  };

  const handleSaveWeightComposition = async (data: { weight: string; weightUnit: 'kg' | 'lbs'; bodyFat: string }) => {
    if (selectedUser) {
      const updatedUser = { ...selectedUser, ...data };
      
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

  const handleSaveGoalWeight = async (data: { goalWeight: string; goalBodyFat: string }) => {
    if (selectedUser) {
      const updatedUser = { ...selectedUser, ...data };
      
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

  const handleSaveActivityMultiplier = async (multiplier: number) => {
    if (selectedUser) {
      const updatedUser: User = { ...selectedUser, activityMultiplier: multiplier };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving activity multiplier:', error);
      }
    }
    setActivityMultiplierModalVisible(false);
  };

  const handleSaveFitnessGoals = async (data: { goal: string; fitnessLevel: string | null; calorieValue: string }) => {
    if (selectedUser) {
      const updatedUser: User = { ...selectedUser, fitnessGoal: data };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving fitness goals:', error);
      }
    }
    setFitnessGoalsModalVisible(false);
  };

  const handleSaveTotalDailyCalorie = async (data: { baseTDCI: number; adjustedTDCI: number; weightChange: number; manualAdjustment: number }) => {
    if (selectedUser) {
      const updatedUser = { ...selectedUser, tdci: data };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving total daily calorie:', error);
      }
      
      // Clear the update warning after saving
      setNeedsTDCIUpdate(false);
    }
    setTotalDailyCalorieModalVisible(false);
  };

  const handleSaveMacronutrients = async (data: { protein: number; fat: number; carbs: number; proteinPercentage: number; fatPercentage: number; carbsPercentage: number }) => {
    if (selectedUser) {
      const updatedUser = { ...selectedUser, macronutrients: data };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving macronutrients:', error);
      }
    }
    setMacronutrientRatiosModalVisible(false);
  };

  // New Meal Plan Preferences save handlers
  const handleSaveWorkoutDays = async (workoutDays: string[]) => {
    if (selectedUser) {
      const updatedUser: User = { ...selectedUser, workoutDays };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving workout days:', error);
      }
    }
    setWorkoutDaysModalVisible(false);
  };

  const handleSaveMealPreferences = async (data: { mealsPerDay: number; snackPositions: string[] }) => {
    if (selectedUser) {
      const updatedUser: User = { ...selectedUser, mealPreferences: data };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving meal preferences:', error);
      }
    }
    setMealPreferencesModalVisible(false);
  };

  const handleSavePortionSizes = async (portionSizes: { [key: string]: number }) => {
    if (selectedUser) {
      const updatedUser: User = { ...selectedUser, portionSizes };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving portion sizes:', error);
      }
    }
    setPortionSizesModalVisible(false);
  };

  const handleSaveAvoidMeals = async (avoidMeals: string[]) => {
    if (selectedUser) {
      const updatedUser: User = { ...selectedUser, avoidMeals };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving avoid meals:', error);
      }
    }
    setAvoidMealsModalVisible(false);
  };

  const handleSaveMaxMealRepetition = async (maxRepetition: number) => {
    if (selectedUser) {
      const updatedUser: User = { ...selectedUser, maxMealRepetition: maxRepetition };
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      try {
        await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
        await AsyncStorage.setItem('selectedUserId', updatedUser.id);
      } catch (error) {
        console.error('Error saving max meal repetition:', error);
      }
    }
    setMaxMealRepetitionModalVisible(false);
  };

  const handleAddUser = () => {
    Alert.prompt(
      'Add New User',
      'Enter the name for the new user:',
      (name) => {
        if (name && name.trim()) {
          const newUser: User = {
            id: Date.now().toString(),
            name: name.trim(),
          };
          
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          setSelectedUser(newUser);
          
          AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
          AsyncStorage.setItem('selectedUserId', newUser.id);
        }
      }
    );
  };

  const handleDeleteProfile = () => {
    if (!selectedUser) return;
    
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete ${selectedUser.name}'s profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedUsers = users.filter(user => user.id !== selectedUser.id);
            setUsers(updatedUsers);
            setSelectedUser(updatedUsers.length > 0 ? updatedUsers[0] : null);
            
            try {
              await AsyncStorage.setItem('profileUsers', JSON.stringify(updatedUsers));
              if (updatedUsers.length > 0) {
                await AsyncStorage.setItem('selectedUserId', updatedUsers[0].id);
              } else {
                await AsyncStorage.removeItem('selectedUserId');
              }
            } catch (error) {
              console.error('Error deleting profile:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={styles.headerDropdown}>
          <UserDropdown 
            users={users} 
            selectedUser={selectedUser} 
            onSelectUser={setSelectedUser}
            onAddUser={handleAddUser}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <View style={styles.sectionsContainer}>
            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleName}>
                <Text style={styles.personalInfoLabel}>Name:</Text>
                <Text style={styles.personalInfoValue}>{selectedUser?.name || 'Not set'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleAge}>
                <Text style={styles.personalInfoLabel}>Age:</Text>
                <Text style={styles.personalInfoValue}>{selectedUser?.age || 'Not set'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleGender}>
                <Text style={styles.personalInfoLabel}>Gender:</Text>
                <Text style={styles.personalInfoValue}>{selectedUser?.gender || 'Not set'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleHeight}>
                <Text style={styles.personalInfoLabel}>Height:</Text>
                <Text style={styles.personalInfoValue}>{selectedUser?.height || 'Not set'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleWeight}>
                <Text style={styles.personalInfoLabel}>Weight:</Text>
                <Text style={styles.personalInfoValue}>
                  {selectedUser?.weight ? `${selectedUser.weight} ${selectedUser.weightUnit || 'kg'}` : 'Not set'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Weight Goals */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weight Goals</Text>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleWeightComposition}>
                <Text style={styles.personalInfoLabel}>Weight & Composition:</Text>
                <Text style={styles.personalInfoValue}>
                  {selectedUser?.weight ? `${selectedUser.weight} ${selectedUser.weightUnit || 'kg'}` : 'Not set'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleGoalWeight}>
                <Text style={styles.personalInfoLabel}>Goal Weight:</Text>
                <Text style={styles.personalInfoValue}>{selectedUser?.goalWeight || 'Not set'}</Text>
              </TouchableOpacity>
              
              <Button
                title="📈 Progression Graph"
                onPress={handleProgressionGraph}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
            </View>

            {/* Nutritional Goals */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutritional Goals</Text>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleBasalMetabolicRate}>
                <Text style={styles.personalInfoLabel}>Basal Metabolic Rate:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('basalMetabolicRate')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleActivityMultiplier}>
                <Text style={styles.personalInfoLabel}>Activity Multiplier:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('activityMultiplier')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleFitnessGoals}>
                <Text style={styles.personalInfoLabel}>Fitness Goals:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('fitnessGoals')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleTotalDailyCalorieIntake}>
                <Text style={styles.personalInfoLabel}>Calorie Intake:</Text>
                <View style={styles.calorieIntakeContainer}>
                  <Text style={styles.personalInfoValue}>{getDisplayValue('totalDailyCalorieIntake')}</Text>
                  {needsTDCIUpdate && (
                    <Icon name="warning" size={20} color="#FF6B6B" style={styles.warningIcon} />
                  )}
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleMacronutrientRatios}>
                <Text style={styles.personalInfoLabel}>Macro Ratios:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('macronutrientRatios')}</Text>
              </TouchableOpacity>
            </View>

            {/* Meal Plan Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meal Plan Preferences</Text>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleWorkoutDays}>
                <Text style={styles.personalInfoLabel}>Workout Days:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('workoutDays')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleMealPreferences}>
                <Text style={styles.personalInfoLabel}>Meal Preferences:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('mealPreferences')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handlePortionSizes}>
                <Text style={styles.personalInfoLabel}>Portion Sizes:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('portionSizes')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleAvoidMeals}>
                <Text style={styles.personalInfoLabel}>Avoid Meals:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('avoidMeals')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.personalInfoItem} onPress={handleMaxMealRepetition}>
                <Text style={styles.personalInfoLabel}>Max Repetition:</Text>
                <Text style={styles.personalInfoValue}>{getDisplayValue('maxMealRepetition')}</Text>
              </TouchableOpacity>
            </View>

            {/* Delete Profile Button */}
            <View style={styles.section}>
              <Button
                title="🗑️ Delete Profile"
                onPress={handleDeleteProfile}
                variant="secondary"
                size="large"
                style={styles.settingButton}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <PersonalInfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalType}
        currentValue={currentValue}
        onSave={handleSavePersonalInfo}
      />

      <WeightCompositionModal
        visible={weightCompositionModalVisible}
        onClose={() => setWeightCompositionModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveWeightComposition}
      />

      <GoalWeightModal
        visible={goalWeightModalVisible}
        onClose={() => setGoalWeightModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveGoalWeight}
      />

      <ProgressionGraphModal
        visible={progressionGraphModalVisible}
        onClose={() => setProgressionGraphModalVisible(false)}
        currentUser={selectedUser}
      />

      <ActivityMultiplierModal
        visible={activityMultiplierModalVisible}
        onClose={() => setActivityMultiplierModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveActivityMultiplier}
      />

      <FitnessGoalsModal
        visible={fitnessGoalsModalVisible}
        onClose={() => setFitnessGoalsModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveFitnessGoals}
      />

      <TotalDailyCalorieModal
        visible={totalDailyCalorieModalVisible}
        onClose={() => setTotalDailyCalorieModalVisible(false)}
        currentUser={selectedUser}
        bmr={calculateBMR(selectedUser || {} as User)}
        onSave={handleSaveTotalDailyCalorie}
      />

      <MacronutrientRatiosModal
        visible={macronutrientRatiosModalVisible}
        onClose={() => setMacronutrientRatiosModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveMacronutrients}
      />

      {/* New Meal Plan Preferences Modals */}
      <WorkoutDaysModal
        visible={workoutDaysModalVisible}
        onClose={() => setWorkoutDaysModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveWorkoutDays}
      />

      <MealPreferencesModal
        visible={mealPreferencesModalVisible}
        onClose={() => setMealPreferencesModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveMealPreferences}
      />

      <PortionSizesModal
        visible={portionSizesModalVisible}
        onClose={() => setPortionSizesModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSavePortionSizes}
      />

      <AvoidMealsModal
        visible={avoidMealsModalVisible}
        onClose={() => setAvoidMealsModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveAvoidMeals}
      />

      <MaxMealRepetitionModal
        visible={maxMealRepetitionModalVisible}
        onClose={() => setMaxMealRepetitionModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveMaxMealRepetition}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statusBarSeparator: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFB347',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  headerDropdown: {
    minWidth: 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  sectionsContainer: {
    paddingVertical: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  personalInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  personalInfoLabel: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  personalInfoValue: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'right',
    flex: 1,
  },
  calorieIntakeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  warningIcon: {
    marginLeft: 8,
  },
  settingButton: {
    marginVertical: 4,
  },
  // Dropdown styles
  dropdown: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDropdownItem: {
    backgroundColor: '#FFB347',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedDropdownItemText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9F9F9',
  },
  addUserText: {
    fontSize: 14,
    color: '#FFB347',
    marginLeft: 8,
    fontWeight: '600',
  },
});