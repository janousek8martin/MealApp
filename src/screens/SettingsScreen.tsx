import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const handleProfileSetup = () => {
    console.log('Profile Setup pressed');
  };

  const handleNutritionGoals = () => {
    console.log('Nutrition Goals pressed');
  };

  const handleMealPreferences = () => {
    console.log('Meal Preferences pressed');
  };

  const handleUnitsSettings = () => {
    console.log('Units Settings pressed');
  };

  const handleDataBackup = () => {
    console.log('Data Backup pressed');
  };

  const handleAbout = () => {
    console.log('About pressed');
  };

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile & Health</Text>
          
          <Button
            title="👤 Profile Setup"
            onPress={handleProfileSetup}
            variant="secondary"
            size="large"
            style={styles.settingButton}
          />
          
          <Button
            title="🎯 Nutrition Goals"
            onPress={handleNutritionGoals}
            variant="secondary"
            size="large"
            style={styles.settingButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <Button
            title="🍽️ Meal Preferences"
            onPress={handleMealPreferences}
            variant="secondary"
            size="large"
            style={styles.settingButton}
          />
          
          <Button
            title="📏 Units & Measurements"
            onPress={handleUnitsSettings}
            variant="secondary"
            size="large"
            style={styles.settingButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Support</Text>
          
          <Button
            title="💾 Backup & Sync"
            onPress={handleDataBackup}
            variant="secondary"
            size="large"
            style={styles.settingButton}
          />
          
          <Button
            title="ℹ️ About MealApp"
            onPress={handleAbout}
            variant="secondary"
            size="large"
            style={styles.settingButton}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Getting Started</Text>
          <Text style={styles.infoText}>
            Complete your profile setup to get personalized meal recommendations and accurate nutrition tracking.
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  settingButton: {
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});