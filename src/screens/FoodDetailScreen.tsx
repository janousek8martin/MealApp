// src/screens/FoodDetailScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Food, useRecipeStore } from '../stores/recipeStore';

interface FoodDetailScreenProps {
  food: Food;
  onBack: () => void;
}

const FoodDetailScreen: React.FC<FoodDetailScreenProps> = ({ food, onBack }) => {
  const insets = useSafeAreaInsets();
  const [editedFood, setEditedFood] = useState<Food>(food);
  const [isEditing, setIsEditing] = useState(false);
  const updateFood = useRecipeStore(state => state.updateFood);

  const handleSave = () => {
    updateFood(food.id, editedFood);
    setIsEditing(false);
    Alert.alert('Success', 'Food updated successfully!');
  };

  const handleCancel = () => {
    setEditedFood(food);
    setIsEditing(false);
  };

  const updateField = (field: keyof Food, value: string) => {
    setEditedFood(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Details</Text>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
        >
          <Text style={styles.editText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Food Image */}
        {editedFood.image && editedFood.image !== 'https://via.placeholder.com/150' && (
          <Image source={{ uri: editedFood.image }} style={styles.image} />
        )}

        {/* Food Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedFood.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Food name"
            />
          ) : (
            <Text style={styles.foodTitle}>{editedFood.name}</Text>
          )}
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editedFood.category || ''}
              onChangeText={(text) => updateField('category', text)}
              placeholder="Food category"
            />
          ) : (
            <View style={styles.categoryContainer}>
              {editedFood.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{editedFood.category}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Nutrition Info per 100g */}
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Nutrition (per 100g)</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedFood.calories}
                  onChangeText={(text) => updateField('calories', text)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedFood.calories}</Text>
              )}
              <Text style={styles.nutritionUnit}>kcal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protein</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedFood.protein}
                  onChangeText={(text) => updateField('protein', text)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedFood.protein}</Text>
              )}
              <Text style={styles.nutritionUnit}>g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Carbs</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedFood.carbs}
                  onChangeText={(text) => updateField('carbs', text)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedFood.carbs}</Text>
              )}
              <Text style={styles.nutritionUnit}>g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fat</Text>
              {isEditing ? (
                <TextInput
                  style={styles.nutritionInput}
                  value={editedFood.fat}
                  onChangeText={(text) => updateField('fat', text)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              ) : (
                <Text style={styles.nutritionValue}>{editedFood.fat}</Text>
              )}
              <Text style={styles.nutritionUnit}>g</Text>
            </View>
          </View>
        </View>

        {/* Nutrition Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Nutritional Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Calories:</Text>
            <Text style={styles.summaryValue}>{editedFood.calories} kcal</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Macronutrients:</Text>
            <Text style={styles.summaryValue}>
              P: {editedFood.protein}g | C: {editedFood.carbs}g | F: {editedFood.fat}g
            </Text>
          </View>
          
          {/* Calories from macros */}
          <View style={styles.macroBreakdown}>
            <Text style={styles.breakdownTitle}>Calorie Breakdown:</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>From Protein:</Text>
              <Text style={styles.breakdownValue}>{(parseFloat(editedFood.protein) * 4).toFixed(0)} kcal</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>From Carbs:</Text>
              <Text style={styles.breakdownValue}>{(parseFloat(editedFood.carbs) * 4).toFixed(0)} kcal</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>From Fat:</Text>
              <Text style={styles.breakdownValue}>{(parseFloat(editedFood.fat) * 9).toFixed(0)} kcal</Text>
            </View>
          </View>
        </View>

        {isEditing && (
          <View style={styles.editingActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFB347',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  editButton: {
    backgroundColor: '#FFB347',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  foodTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 4,
  },
  nutritionUnit: {
    fontSize: 12,
    color: '#666666',
  },
  nutritionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    minWidth: 80,
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  macroBreakdown: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666666',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB347',
  },
  editingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FFB347',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FoodDetailScreen;