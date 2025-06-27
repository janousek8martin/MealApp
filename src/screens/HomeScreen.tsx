import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const handlePlanMeals = () => {
    console.log('Plan Meals pressed');
  };

  const handleManageRecipes = () => {
    console.log('Manage Recipes pressed');
  };

  const handleSettings = () => {
    console.log('Settings pressed');
  };

  const handleShoppingList = () => {
    console.log('Shopping List pressed - to be implemented');
  };

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>MealApp</Text>
          <Text style={styles.subtitle}>Your personal meal planning assistant</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Today's Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1,847</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Meals Planned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Items to Buy</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Main Features</Text>
          
          <Button
            title="📅 Plan Meals"
            onPress={handlePlanMeals}
            variant="primary"
            size="large"
            style={styles.actionButton}
          />
          
          <Button
            title="📖 Manage Recipes"
            onPress={handleManageRecipes}
            variant="secondary"
            size="large"
            style={styles.actionButton}
          />
          
          <Button
            title="🛒 Shopping List"
            onPress={handleShoppingList}
            variant="secondary"
            size="large"
            style={styles.actionButton}
          />
          
          <Button
            title="⚙️ Settings"
            onPress={handleSettings}
            variant="secondary"
            size="medium"
            style={styles.actionButton}
          />
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Quick Tip</Text>
          <Text style={styles.tipsText}>
            Start by setting up your profile in Settings to get personalized meal recommendations!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  statusBarSeparator: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  actionsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  tipsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#388E3C',
    lineHeight: 20,
  },
});