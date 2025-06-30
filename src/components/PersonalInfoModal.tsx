// src/components/PersonalInfoModal.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity } from 'react-native';

interface User {
  id: string;
  name: string;
  age?: string;
  gender?: string;
  height?: string;
  heightUnit?: 'cm' | 'ft';
  heightFeet?: string;
  heightInches?: string;
  weight?: string;
  weightUnit?: 'kg' | 'lbs';
}

interface PersonalInfoModalProps {
  visible: boolean;
  type: 'name' | 'age' | 'gender' | 'height' | 'weight';
  currentUser: User | null;
  onSave: (field: string, value: string | { [key: string]: string }) => void;
  onCancel: () => void;
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  visible,
  type,
  currentUser,
  onSave,
  onCancel
}) => {
  const [value, setValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');

  useEffect(() => {
    if (currentUser && visible) {
      switch (type) {
        case 'name':
          setValue(currentUser.name || '');
          break;
        case 'age':
          setValue(currentUser.age || '');
          break;
        case 'gender':
          setValue(currentUser.gender || '');
          break;
        case 'height':
          setHeightUnit(currentUser.heightUnit || 'cm');
          setValue(currentUser.height || '');
          setHeightFeet(currentUser.heightFeet || '');
          setHeightInches(currentUser.heightInches || '');
          break;
        case 'weight':
          setValue(currentUser.weight || '');
          setWeightUnit(currentUser.weightUnit || 'kg');
          break;
      }
    }
  }, [currentUser, visible, type]);

  const getTitle = () => {
    switch (type) {
      case 'name': return 'Name';
      case 'age': return 'Age';
      case 'gender': return 'Gender';
      case 'height': return 'Height';
      case 'weight': return 'Weight';
      default: return '';
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'name': return 'Enter your name';
      case 'age': return 'Enter your age';
      case 'gender': return 'Select gender';
      case 'height': 
        return heightUnit === 'cm' ? 'Enter height in cm' : 'Enter feet';
      case 'weight': 
        return `Enter weight in ${weightUnit}`;
      default: return '';
    }
  };

  const getKeyboardType = () => {
    switch (type) {
      case 'age':
      case 'height':
      case 'weight':
        return 'numeric' as const;
      default:
        return 'default' as const;
    }
  };

  const handleSave = () => {
    switch (type) {
      case 'height':
        if (heightUnit === 'ft') {
          onSave(type, {
            heightUnit,
            heightFeet,
            heightInches,
            height: '' // Clear cm value when using ft
          });
        } else {
          onSave(type, {
            heightUnit,
            height: value,
            heightFeet: '', // Clear ft values when using cm
            heightInches: ''
          });
        }
        break;
      case 'weight':
        onSave(type, { weight: value, weightUnit });
        break;
      default:
        onSave(type, value);
    }
  };

  const renderGenderButtons = () => {
    if (type !== 'gender') return null;
    
    return (
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[styles.genderButton, value === 'Male' && styles.selectedGenderButton]}
          onPress={() => setValue('Male')}
        >
          <Text style={[styles.genderButtonText, value === 'Male' && styles.selectedGenderText]}>
            Male
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, value === 'Female' && styles.selectedGenderButton]}
          onPress={() => setValue('Female')}
        >
          <Text style={[styles.genderButtonText, value === 'Female' && styles.selectedGenderText]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWeightInput = () => {
    return (
      <View>
        <View style={styles.unitSelector}>
          <TouchableOpacity
            style={[styles.unitButton, weightUnit === 'kg' && styles.selectedUnitButton]}
            onPress={() => setWeightUnit('kg')}
          >
            <Text style={[styles.unitButtonText, weightUnit === 'kg' && styles.selectedUnitText]}>
              kg
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, weightUnit === 'lbs' && styles.selectedUnitButton]}
            onPress={() => setWeightUnit('lbs')}
          >
            <Text style={[styles.unitButtonText, weightUnit === 'lbs' && styles.selectedUnitText]}>
              lbs
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder={getPlaceholder()}
          keyboardType="numeric"
          autoFocus={true}
        />
      </View>
    );
  };

  const renderHeightInput = () => {
    return (
      <View>
        <View style={styles.unitSelector}>
          <TouchableOpacity
            style={[styles.unitButton, heightUnit === 'cm' && styles.selectedUnitButton]}
            onPress={() => setHeightUnit('cm')}
          >
            <Text style={[styles.unitButtonText, heightUnit === 'cm' && styles.selectedUnitText]}>
              cm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, heightUnit === 'ft' && styles.selectedUnitButton]}
            onPress={() => setHeightUnit('ft')}
          >
            <Text style={[styles.unitButtonText, heightUnit === 'ft' && styles.selectedUnitText]}>
              ft/in
            </Text>
          </TouchableOpacity>
        </View>
        
        {heightUnit === 'cm' ? (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder="Enter height in cm"
            keyboardType="numeric"
            autoFocus={true}
          />
        ) : (
          <View style={styles.feetInputContainer}>
            <View style={styles.feetInputWrapper}>
              <TextInput
                style={styles.feetInput}
                value={heightFeet}
                onChangeText={setHeightFeet}
                placeholder="Feet"
                keyboardType="numeric"
                autoFocus={true}
              />
              <Text style={styles.feetLabel}>ft</Text>
            </View>
            <View style={styles.feetInputWrapper}>
              <TextInput
                style={styles.feetInput}
                value={heightInches}
                onChangeText={setHeightInches}
                placeholder="Inches"
                keyboardType="numeric"
              />
              <Text style={styles.feetLabel}>in</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>{getTitle()}</Text>
          
          {type === 'gender' ? (
            renderGenderButtons()
          ) : type === 'height' ? (
            renderHeightInput()
          ) : type === 'weight' ? (
            renderWeightInput()
          ) : (
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={getPlaceholder()}
              keyboardType={getKeyboardType()}
              autoFocus={true}
            />
          )}
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  closeText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB347',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedGenderButton: {
    backgroundColor: '#FFB347',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB347',
  },
  selectedGenderText: {
    color: '#FFFFFF',
  },
  unitSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 2,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedUnitButton: {
    backgroundColor: '#FFB347',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  selectedUnitText: {
    color: '#FFFFFF',
  },
  feetInputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  feetInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  feetInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    paddingRight: 35,
  },
  feetLabel: {
    position: 'absolute',
    right: 12,
    top: 12,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FFB347',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});