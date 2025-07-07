import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { ProfileSettingsScreen } from './ProfileSettingsScreen';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState<'main' | 'profile'>('main');

  const handleProfileSetup = () => {
    setCurrentScreen('profile');
  };

  const handleBackToSettings = () => {
    setCurrentScreen('main');
  };

  const handleNutritionGoals = () => {
    console.log('Nutrition Goals pressed');
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

  // Show ProfileSettingsScreen if selected
  if (currentScreen === 'profile') {
    return <ProfileSettingsScreen onBack={handleBackToSettings} />;
  }

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile & Health</Text>
          
          <Button
            title="👤 Profile & Nutrition"
            onPress={handleProfileSetup}
            variant="secondary"
            size="large"
            style={styles.settingButton}
          />

        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Support</Text>
          
          <Button
            title="🌐 Language"
            onPress={handleUnitsSettings}
            variant="secondary"
            size="large"
            style={styles.settingButton}
          />
          
          <Button
            title="⚙️ Misc"
            onPress={handleUnitsSettings}
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
});