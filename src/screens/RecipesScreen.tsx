import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';

export const RecipesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      {/* Top Header - empty */}
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          {/* Empty header */}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            🍳 Recipe list will be here
          </Text>
          <Text style={styles.description}>
            Here you'll be able to:
            {'\n'}• Browse all recipes
            {'\n'}• Add new recipes
            {'\n'}• Edit existing recipes
            {'\n'}• Filter by category
            {'\n'}• Search recipes
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="➕ Add New Recipe"
            onPress={() => console.log('Add recipe')}
            variant="primary"
            size="large"
            style={styles.button}
          />
          <Button
            title="📋 Import Recipes"
            onPress={() => console.log('Import recipes')}
            variant="secondary"
            size="large"
            style={styles.button}
          />
        </View>
      </View>
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
  topHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginBottom: 0,
  },
});