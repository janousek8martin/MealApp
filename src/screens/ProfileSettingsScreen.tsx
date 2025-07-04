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
// Import nových komponent s named export
import { ActivityMultiplierModal } from '../components/ActivityMultiplierModal';
import { FitnessGoalsModal } from '../components/FitnessGoalsModal'; 
import { TotalDailyCalorieModal } from '../components/TotalDailyCalorieModal';
// import { MacronutrientRatiosModal } from '../components/MacronutrientRatiosModal'; // ODSTRANĚNO
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
  
  // New modal states for nutritional goals
  const [activityMultiplierModalVisible, setActivityMultiplierModalVisible] = useState(false);
  const [fitnessGoalsModalVisible, setFitnessGoalsModalVisible] = useState(false);
  const [totalDailyCalorieModalVisible, setTotalDailyCalorieModalVisible] = useState(false);
  // const [macronutrientRatiosModalVisible, setMacronutrientRatiosModalVisible] = useState(false); // ODSTRANĚNO
  
  // New Meal Plan Preferences modal states
  const [workoutDaysModalVisible, setWorkoutDaysModalVisible] = useState(false);
  const [mealPreferencesModalVisible, setMealPreferencesModalVisible] = useState(false);
  const [portionSizesModalVisible, setPortionSizesModalVisible] = useState(false);
  const [avoidMealsModalVisible, setAvoidMealsModalVisible] = useState(false);
  const [maxMealRepetitionModalVisible, setMaxMealRepetitionModalVisible] = useState(false);
  
  // Warning state for TDCI update
  const [needsTDCIUpdate, setNeedsTDCIUpdate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      checkTDCIUpdateNeeded();
    }
  }, [selectedUser]);

  const loadData = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('profileUsers');
      const selectedUserId = await AsyncStorage.getItem('selectedUserId');
      
      if (storedUsers) {
        const parsedUsers: User[] = JSON.parse(storedUsers);
        setUsers(parsedUsers);
        
        if (selectedUserId) {
          const foundUser = parsedUsers.find(user => user.id === selectedUserId);
          if (foundUser) {
            setSelectedUser(foundUser);
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  };

  const calculateBMR = (user: User | null) => {
    if (!user?.age || !user?.gender || !user?.weight) return 0;
    
    const age = parseInt(user.age);
    const weight = parseFloat(user.weight);
    let height = 0;
    
    if (user.heightUnit === 'cm' && user.height) {
      height = parseFloat(user.height);
    } else if (user.heightUnit === 'ft' && user.heightFeet && user.heightInches) {
      const feet = parseFloat(user.heightFeet);
      const inches = parseFloat(user.heightInches);
      height = (feet * 12 + inches) * 2.54;
    }
    
    if (user.gender === 'Male') {
      return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
    } else {
      return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
    }
  };

  const calculateCurrentTDCI = (user: User | null) => {
    if (!user) return { baseTDCI: 0, adjustedTDCI: 0, bmr: 0 };
    
    const bmr = calculateBMR(user);
    const activityMultiplier = user.activityMultiplier || 1.2;
    const baseTDCI = Math.round(bmr * activityMultiplier);
    
    const calorieAdjustment = user.fitnessGoal?.calorieValue ? parseFloat(user.fitnessGoal.calorieValue) : 0;
    const adjustedTDCI = Math.round(baseTDCI * (1 + calorieAdjustment / 100));
    
    return {
      baseTDCI,
      adjustedTDCI,
      bmr
    };
  };

  const checkTDCIUpdateNeeded = () => {
    if (!selectedUser) {
      setNeedsTDCIUpdate(false);
      return;
    }

    const currentCalculation = calculateCurrentTDCI(selectedUser);
    const storedTDCI = selectedUser.tdci;

    if (!storedTDCI) {
      setNeedsTDCIUpdate(true);
      return;
    }

    // Check if any key values have changed
    const baseTDCIChanged = Math.abs(currentCalculation.baseTDCI - storedTDCI.baseTDCI) > 5;
    const adjustedTDCIChanged = Math.abs(currentCalculation.adjustedTDCI - storedTDCI.adjustedTDCI) > 5;

    setNeedsTDCIUpdate(baseTDCIChanged || adjustedTDCIChanged);
  };

  const handleOpenModal = (type: 'name' | 'age' | 'gender' | 'height' | 'weight') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleCancelModal = () => {
    setModalVisible(false);
  };

  const handleSavePersonalInfo = async (data: any) => {
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
      `Are you sure you want to delete ${selectedUser.name}'s profile? This action cannot be undone.`,
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

  const getDisplayValue = (field: string) => {
    if (!selectedUser) return 'Not set';
    
    switch (field) {
      case 'name':
        return selectedUser.name || 'Not set';
      case 'age':
        return selectedUser.age || 'Not set';
      case 'gender':
        return selectedUser.gender || 'Not set';
      case 'height':
        if (selectedUser.heightUnit === 'cm' && selectedUser.height) {
          return `${selectedUser.height} cm`;
        } else if (selectedUser.heightUnit === 'ft' && selectedUser.heightFeet && selectedUser.heightInches) {
          return `${selectedUser.heightFeet}'${selectedUser.heightInches}"`;
        }
        return 'Not set';
      case 'weight':
        if (selectedUser.weight) {
          const unit = selectedUser.weightUnit || 'kg';
          return `${selectedUser.weight} ${unit}`;
        }
        return 'Not set';
      case 'basalMetabolicRate':
        const bmr = calculateBMR(selectedUser);
        return bmr > 0 ? `${bmr} kcal` : 'Complete profile first';
      case 'activityMultiplier':
        return selectedUser.activityMultiplier ? `${selectedUser.activityMultiplier}` : 'Not set';
      case 'fitnessGoals':
        return selectedUser.fitnessGoal?.goal || 'Not set';
      case 'totalDailyCalorieIntake':
        return selectedUser.tdci?.adjustedTDCI ? `${selectedUser.tdci.adjustedTDCI} kcal` : 'Not set';
      case 'workoutDays':
        if (selectedUser.workoutDays && selectedUser.workoutDays.length > 0) {
          // Define the correct order of days
          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          
          // Sort the selected days according to the week order
          const sortedDays = selectedUser.workoutDays.sort((a, b) => {
            return dayOrder.indexOf(a) - dayOrder.indexOf(b);
          });
          
          // Convert to abbreviations
          const dayAbbreviations = sortedDays.map(day => {
            switch (day) {
              case 'Monday': return 'Mon';
              case 'Tuesday': return 'Tue';
              case 'Wednesday': return 'Wed';
              case 'Thursday': return 'Thu';
              case 'Friday': return 'Fri';
              case 'Saturday': return 'Sat';
              case 'Sunday': return 'Sun';
              default: return day.substring(0, 3);
            }
          });
          return dayAbbreviations.join(', ');
        }
        return 'Not set';
      case 'mealPreferences':
        if (selectedUser.mealPreferences) {
          const { mealsPerDay, snackPositions } = selectedUser.mealPreferences;
          const snacksCount = snackPositions ? snackPositions.length : 0;
          
          if (mealsPerDay === 3) {
            return '3 meals, 0 snacks';
          } else if (mealsPerDay === 4) {
            return `4 meals, ${snacksCount} snack`;
          } else if (mealsPerDay >= 5) {
            return `${mealsPerDay} meals, ${snacksCount} snack${snacksCount !== 1 ? 's' : ''}`;
          } else {
            return `${mealsPerDay} meals`;
          }
        }
        return 'Not set';
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
    setActivityMultiplierModalVisible(true);
  };

  const handleFitnessGoals = () => {
    setFitnessGoalsModalVisible(true);
  };

  const handleTotalDailyCalorieIntake = () => {
    setTotalDailyCalorieModalVisible(true);
  };

  // Meal Plan Preferences handlers
  const handleWorkoutDays = () => {
    setWorkoutDaysModalVisible(true);
  };

  const handleMealPreferences = () => {
    setMealPreferencesModalVisible(true);
  };

  const handlePortionSizes = () => {
    setPortionSizesModalVisible(true);
  };

  const handleAvoidMeals = () => {
    setAvoidMealsModalVisible(true);
  };

  const handleMaxMealRepetition = () => {
    setMaxMealRepetitionModalVisible(true);
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

      {/* Activity Multiplier Modal */}
      <ActivityMultiplierModal
        visible={activityMultiplierModalVisible}
        onClose={() => setActivityMultiplierModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveActivityMultiplier}
      />

      {/* Fitness Goals Modal */}
      <FitnessGoalsModal
        visible={fitnessGoalsModalVisible}
        onClose={() => setFitnessGoalsModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveFitnessGoals}
      />

      {/* Total Daily Calorie Modal */}
      <TotalDailyCalorieModal
        visible={totalDailyCalorieModalVisible}
        onClose={() => setTotalDailyCalorieModalVisible(false)}
        currentUser={selectedUser}
        onSave={handleSaveTotalDailyCalorie}
        bmr={calculateBMR(selectedUser)}
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
  calorieIntakeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  warningIcon: {
    marginLeft: 8,
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