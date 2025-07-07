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
        height: 75, // Zvětšená výška
        paddingBottom: 10, // Zvětšený padding zespodu - posune tab bar výš
        paddingTop: 3, // Zvětšený padding shora
        position: 'absolute', // Absolutní pozice
        bottom: 0, // Odsazení od spodního okraje - posune celý tab bar nahoru
        left: 10, // Odsazení zleva
        right: 10, // Odsazení zprava
        borderRadius: 15, // Zaoblené rohy
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10, // Android stín
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