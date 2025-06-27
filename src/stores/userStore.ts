import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  age?: number;
  gender?: 'Male' | 'Female';
  height?: number; // cm
  weight?: number; // kg
  bodyFat?: number; // %
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

interface UserStore {
  users: User[];
  selectedUser: User | null;
  setSelectedUser: (user: User) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
}

// Default users for demo
const defaultUsers: User[] = [
  { id: '1', name: 'John Doe', age: 30, gender: 'Male', height: 180, weight: 75 },
  { id: '2', name: 'Jane Smith', age: 28, gender: 'Female', height: 165, weight: 60 },
  { id: '3', name: 'Mike Johnson', age: 35, gender: 'Male', height: 175, weight: 80 },
];

export const useUserStore = create<UserStore>((set) => ({
  users: defaultUsers,
  selectedUser: defaultUsers[0],
  
  setSelectedUser: (user: User) => set({ selectedUser: user }),
  
  addUser: (user: User) => set((state) => ({
    users: [...state.users, user]
  })),
  
  updateUser: (id: string, updates: Partial<User>) => set((state) => ({
    users: state.users.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ),
    selectedUser: state.selectedUser?.id === id 
      ? { ...state.selectedUser, ...updates } 
      : state.selectedUser
  })),
}));