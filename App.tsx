// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { Text } from 'react-native';

// Screens 
import { HomeScreen } from './src/screens/HomeScreen';
import MealPlannerScreen from './src/screens/MealPlannerScreen'; // default import
import { RecipesScreen } from './src/screens/RecipesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

// Stores
import { useUserStore } from './src/stores/userStore';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  const { loadUsers } = useUserStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      // Load users into store
      await loadUsers();
      console.log('Users loaded successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#FFB347" barStyle="light-content" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let emoji: string;

              if (route.name === 'Home') {
                emoji = '🏠';
              } else if (route.name === 'Plan Meals') {
                emoji = '📅';
              } else if (route.name === 'Recipes') {
                emoji = '📖';
              } else if (route.name === 'Settings') {
                emoji = '⚙️';
              } else {
                emoji = '❓';
              }

              return <Text style={{ fontSize: size }}>{emoji}</Text>;
            },
            tabBarActiveTintColor: '#FFB347',
            tabBarInactiveTintColor: '#999999',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E0E0E0',
              paddingBottom: 20,
              height: 75,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              paddingTop: 2,
            },
            headerShown: false,
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              tabBarLabel: 'Home',
            }}
          />
          <Tab.Screen 
            name="Plan Meals" 
            component={MealPlannerScreen}
            options={{
              tabBarLabel: 'Plan Meals',
            }}
          />
          <Tab.Screen 
            name="Recipes" 
            component={RecipesScreen}
            options={{
              tabBarLabel: 'Recipes',
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Settings',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
};

// Add displayName to prevent the error
App.displayName = 'App';

export default App;