// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { MealPlannerScreen } from './src/screens/MealPlannerScreen';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Simple Tab Icon Component
interface TabIconProps {
  name: string;
  color: string;
  size: number;
}

const TabIcon: React.FC<TabIconProps> = ({ name, color, size }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: size, color }}>
      {name}
    </Text>
  </View>
);

// Bottom Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarActiveTintColor: '#FFB347',
      tabBarInactiveTintColor: '#999999',
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <TabIcon name="🏠" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen 
      name="Plan Meals" 
      component={MealPlannerScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <TabIcon name="📅" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen 
      name="Recipes" 
      component={RecipesScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <TabIcon name="📖" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <TabIcon name="⚙️" color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}