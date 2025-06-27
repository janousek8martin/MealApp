import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from "./src/screens/HomeScreen";
import { MealPlannerScreen } from "./src/screens/MealPlannerScreen";
import { RecipesScreen } from "./src/screens/RecipesScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

type Screen = 'Home' | 'MealPlanner' | 'Recipes' | 'Settings';

function AppContent() {
  const [activeScreen, setActiveScreen] = useState<Screen>('Home');
  const insets = useSafeAreaInsets();

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'MealPlanner':
        return <MealPlannerScreen />;
      case 'Recipes':
        return <RecipesScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Main Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.navButton, activeScreen === 'Home' && styles.activeNavButton]}
          onPress={() => setActiveScreen('Home')}
        >
          <Text style={[styles.navIcon, activeScreen === 'Home' ? styles.activeNavIcon : styles.inactiveNavIcon]}>
            🏠
          </Text>
          <Text style={[styles.navText, activeScreen === 'Home' && styles.activeNavText]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeScreen === 'MealPlanner' && styles.activeNavButton]}
          onPress={() => setActiveScreen('MealPlanner')}
        >
          <Text style={[styles.navIcon, activeScreen === 'MealPlanner' ? styles.activeNavIcon : styles.inactiveNavIcon]}>
            📅
          </Text>
          <Text style={[styles.navText, activeScreen === 'MealPlanner' && styles.activeNavText]}>
            Planner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeScreen === 'Recipes' && styles.activeNavButton]}
          onPress={() => setActiveScreen('Recipes')}
        >
          <Text style={[styles.navIcon, activeScreen === 'Recipes' ? styles.activeNavIcon : styles.inactiveNavIcon]}>
            📖
          </Text>
          <Text style={[styles.navText, activeScreen === 'Recipes' && styles.activeNavText]}>
            Recipes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeScreen === 'Settings' && styles.activeNavButton]}
          onPress={() => setActiveScreen('Settings')}
        >
          <Text style={[styles.navIcon, activeScreen === 'Settings' ? styles.activeNavIcon : styles.inactiveNavIcon]}>
            ⚙️
          </Text>
          <Text style={[styles.navText, activeScreen === 'Settings' && styles.activeNavText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeNavButton: {
    backgroundColor: '#FFB347',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  activeNavText: {
    color: '#FFFFFF',
  },
  activeNavIcon: {
    color: '#FFFFFF',
  },
  inactiveNavIcon: {
    color: '#666666',
  },
});