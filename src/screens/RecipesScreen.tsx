// src/screens/RecipesScreen.tsx
// 🍽️ Recipes Screen - Recipes + Ingredients + Foods & Drinks tabs

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

// Import the corrected tabs
import { IngredientsTab } from '../components/IngredientsTab';
import { FoodsAndDrinksTab } from '../components/FoodsAndDrinksTab';

type TabType = 'recipes' | 'ingredients' | 'foods';

export const RecipesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('recipes');

  const renderTabButton = (tabType: TabType, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabType && styles.activeTabButton
      ]}
      onPress={() => setActiveTab(tabType)}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[
        styles.tabLabel,
        activeTab === tabType && styles.activeTabLabel
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRecipesTab = () => (
    <ScrollView style={styles.recipesContainer} contentContainerStyle={styles.recipesContent}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>📚</Text>
        <Text style={styles.placeholderTitle}>Recipe Collection</Text>
        <Text style={styles.placeholderText}>
          Discover and save your favorite recipes
        </Text>
        <Text style={styles.placeholderSubtext}>
          (Recipe functionality coming soon)
        </Text>
      </View>

      {/* Placeholder recipe cards */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.recipeCard}>
          <View style={styles.recipeImage}>
            <Text style={styles.recipeImageText}>🍳</Text>
          </View>
          <View style={styles.recipeContent}>
            <Text style={styles.recipeTitle}>Sample Recipe {i}</Text>
            <Text style={styles.recipeDescription}>
              A delicious recipe that will be available once we implement the recipe system
            </Text>
            <View style={styles.recipeStats}>
              <Text style={styles.recipeStat}>⏱️ 30 min</Text>
              <Text style={styles.recipeStat}>👥 4 servings</Text>
              <Text style={styles.recipeStat}>🔥 Easy</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'recipes':
        return renderRecipesTab();
      case 'ingredients':
        return <IngredientsTab />;
      case 'foods':
        return <FoodsAndDrinksTab />;
      default:
        return renderRecipesTab();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recipes & Food Database</Text>
        <Text style={styles.subtitle}>
          Find recipes, ingredients, and food products
        </Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('recipes', 'Recipes', '📚')}
        {renderTabButton('ingredients', 'Ingredients', '🥕')}
        {renderTabButton('foods', 'Foods & Drinks', '🍽️')}
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tabIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabLabel: {
    color: '#4338CA',
  },
  content: {
    flex: 1,
  },
  // Recipes tab styles
  recipesContainer: {
    flex: 1,
  },
  recipesContent: {
    padding: 16,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recipeImage: {
    height: 120,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeImageText: {
    fontSize: 48,
  },
  recipeContent: {
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  recipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipeStat: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});