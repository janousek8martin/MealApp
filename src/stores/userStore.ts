// src/stores/userStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
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
  workoutDays?: string[];
  mealPreferences?: {
    mealsPerDay: string; // "Three meals", "Four meals", "Five meals", "Six meals"
    snackPositions: string[]; // ["Before Breakfast", "Between Breakfast and Lunch", etc.]
  };
  portionSizes?: {
    [key: string]: number;
  };
  avoidMeals?: string[];
  maxMealRepetition?: number;
}

interface UserStore {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  
  // Actions
  setSelectedUser: (user: User | null) => void;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loadUsers: () => Promise<void>;
  
  // Helper methods
  getUserById: (id: string) => User | undefined;
}

const STORAGE_KEYS = {
  USERS: 'app_users',
  SELECTED_USER_ID: 'selected_user_id',
};

// Migration function moved outside of create
const migrateFromOldStorage = async () => {
  try {
    // Check if we already have users in new format
    const existingUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    if (existingUsers) return;
    
    // Try to migrate from ProfileSettingsScreen format
    const profileUsers = await AsyncStorage.getItem('profileUsers');
    const selectedUserId = await AsyncStorage.getItem('selectedUserId');
    
    if (profileUsers) {
      const parsedUsers = JSON.parse(profileUsers);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, profileUsers);
      
      if (selectedUserId) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_USER_ID, selectedUserId);
      }
      
      // Clean up old storage
      await AsyncStorage.removeItem('profileUsers');
      await AsyncStorage.removeItem('selectedUserId');
      
      console.log('Migrated users from old ProfileSettings storage');
      return;
    }
    
    // Try to migrate from MealPlanner format
    const userData = await AsyncStorage.getItem('userData');
    const lastSelectedProfileId = await AsyncStorage.getItem('lastSelectedProfileId');
    
    if (userData) {
      const parsedData = JSON.parse(userData);
      const migratedUsers = Object.keys(parsedData).map(key => ({
        id: key,
        name: parsedData[key].name || key,
        ...parsedData[key]
      }));
      
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(migratedUsers));
      
      if (lastSelectedProfileId) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_USER_ID, lastSelectedProfileId);
      }
      
      // Clean up old storage
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('lastSelectedProfileId');
      
      console.log('Migrated users from old MealPlanner storage');
    }
  } catch (error) {
    console.error('Error during migration:', error);
  }
};

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  selectedUser: null,
  isLoading: true,
  
  setSelectedUser: async (user: User | null) => {
    set({ selectedUser: user });
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_USER_ID, user.id);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_USER_ID);
      }
    } catch (error) {
      console.error('Error saving selected user:', error);
    }
  },
  
  addUser: async (user: User) => {
    const { users } = get();
    const newUsers = [...users, user];
    
    set({ users: newUsers, selectedUser: user });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_USER_ID, user.id);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  },
  
  updateUser: async (id: string, updates: Partial<User>) => {
    const { users, selectedUser } = get();
    const updatedUsers = users.map(user => 
      user.id === id ? { ...user, ...updates } : user
    );
    
    const updatedSelectedUser = selectedUser?.id === id 
      ? { ...selectedUser, ...updates } 
      : selectedUser;
    
    set({ users: updatedUsers, selectedUser: updatedSelectedUser });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  },
  
  deleteUser: async (id: string) => {
    const { users, selectedUser } = get();
    const updatedUsers = users.filter(user => user.id !== id);
    
    const newSelectedUser = selectedUser?.id === id 
      ? (updatedUsers.length > 0 ? updatedUsers[0] : null)
      : selectedUser;
    
    set({ users: updatedUsers, selectedUser: newSelectedUser });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      if (newSelectedUser) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_USER_ID, newSelectedUser.id);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_USER_ID);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  },
  
  loadUsers: async () => {
    set({ isLoading: true });
    
    try {
      // Run migration first
      await migrateFromOldStorage();
      
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const selectedUserId = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_USER_ID);
      
      if (usersData) {
        const users: User[] = JSON.parse(usersData);
        const selectedUser = selectedUserId 
          ? users.find(user => user.id === selectedUserId) || null
          : null;
        
        set({ users, selectedUser });
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  getUserById: (id: string) => {
    const { users } = get();
    return users.find(user => user.id === id);
  },
}));