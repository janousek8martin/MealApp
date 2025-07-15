// src/components/generation/GenerateButton.tsx
// 🔧 FIXED: Style type errors resolved

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ViewStyle } from 'react-native';
import { useMealPlanGeneration } from '../../hooks/useMealPlanGeneration';
import { useUserStore } from '../../stores/userStore';

interface GenerateButtonProps {
  date: string;
  onGenerationStart?: () => void;
  onGenerationComplete?: (success: boolean) => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
  showAdvancedOptions?: boolean;
}

// ===== QUICK PRESETS =====
export const quickPresets = {
  quickAndEasy: (user: any, date: string) => ({
    user,
    date,
    mode: 'speed' as const,
    preferences: {
      varietyLevel: 'low' as const,
      maxPrepTime: 20,
      avoidIngredients: user.avoidMeals || []
    }
  }),
  
  gourmet: (user: any, date: string) => ({
    user,
    date,
    mode: 'quality' as const,
    preferences: {
      varietyLevel: 'high' as const,
      maxPrepTime: 90,
      avoidIngredients: user.avoidMeals || []
    }
  }),
  
  highProtein: (user: any, date: string) => ({
    user,
    date,
    mode: 'balanced' as const,
    preferences: {
      varietyLevel: 'medium' as const,
      maxPrepTime: 45,
      minProtein: user.tdci?.adjustedTDCI ? user.tdci.adjustedTDCI * 0.35 / 4 : 180, // 35% protein
      avoidIngredients: user.avoidMeals || []
    }
  })
};

// ===== TIME ESTIMATION =====
interface EstimationResult {
  estimatedSeconds: number;
  factors: string[];
}

export const getEstimatedTime = (mode: 'speed' | 'balanced' | 'quality', user: any): EstimationResult => {
  let baseTime = 3; // 3 seconds base
  const factors: string[] = [];
  
  // Mode factor
  switch (mode) {
    case 'speed':
      baseTime *= 0.5;
      factors.push('Quick mode');
      break;
    case 'balanced':
      baseTime *= 1;
      factors.push('Balanced optimization');
      break;
    case 'quality':
      baseTime *= 2.5;
      factors.push('High-quality optimization');
      break;
  }
  
  // User complexity factors
  if (user?.avoidMeals && user.avoidMeals.length > 5) {
    baseTime *= 1.2;
    factors.push('Many avoided ingredients');
  }
  
  if (user?.mealPreferences?.snackPositions && user.mealPreferences.snackPositions.length > 2) {
    baseTime *= 1.1;
    factors.push('Multiple snacks');
  }
  
  if (user?.allergens && user.allergens.length > 0) {
    baseTime *= 1.1;
    factors.push('Allergen filtering');
  }
  
  return {
    estimatedSeconds: Math.round(baseTime),
    factors
  };
};

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  date,
  onGenerationStart,
  onGenerationComplete,
  size = 'large',
  variant = 'primary',
  showAdvancedOptions = false
}) => {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'speed' | 'balanced' | 'quality'>('balanced');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  const { generateDayPlan, isGenerating, canGenerate, lastError } = useMealPlanGeneration();
  const selectedUser = useUserStore(state => state.selectedUser);

  const handleQuickGenerate = async () => {
    if (!selectedUser || !canGenerate) return;
    
    onGenerationStart?.();
    
    try {
      const result = await generateDayPlan(date, { mode: 'balanced' });
      onGenerationComplete?.(result.success);
    } catch (error) {
      console.error('Generation failed:', error);
      onGenerationComplete?.(false);
    }
  };

  const handlePresetGenerate = async (presetKey: string) => {
    if (!selectedUser || !canGenerate) return;
    
    setShowOptionsModal(false);
    onGenerationStart?.();
    
    try {
      let options;
      switch (presetKey) {
        case 'quickAndEasy':
          options = quickPresets.quickAndEasy(selectedUser, date);
          break;
        case 'gourmet':
          options = quickPresets.gourmet(selectedUser, date);
          break;
        case 'highProtein':
          options = quickPresets.highProtein(selectedUser, date);
          break;
        default:
          options = { mode: 'balanced' as const };
      }
      
      const result = await generateDayPlan(date, options);
      onGenerationComplete?.(result.success);
    } catch (error) {
      console.error('Generation failed:', error);
      onGenerationComplete?.(false);
    }
  };

  // ✅ FIXED: Return proper ViewStyle objects
  const getButtonSize = (): ViewStyle => {
    switch (size) {
      case 'small': return { paddingHorizontal: 12, paddingVertical: 8 };
      case 'medium': return { paddingHorizontal: 16, paddingVertical: 10 };
      case 'large': return { paddingHorizontal: 20, paddingVertical: 12 };
    }
  };

  // ✅ FIXED: Properly construct style array with correct types
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.generateButton, getButtonSize()];
    
    if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    }
    
    if (!canGenerate || isGenerating) {
      baseStyle.push(styles.disabledButton);
    }
    
    return baseStyle;
  };

  const getButtonText = () => {
    if (isGenerating) return 'Generating...';
    if (!canGenerate) return 'Setup Required';
    return 'Generate Meal Plan';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={showAdvancedOptions ? () => setShowOptionsModal(true) : handleQuickGenerate}
        disabled={!canGenerate || isGenerating}
      >
        <Text style={[
          styles.generateButtonText,
          variant === 'secondary' && styles.secondaryButtonText,
          (!canGenerate || isGenerating) && styles.disabledButtonText
        ]}>
          {getButtonText()}
        </Text>
        
        {showAdvancedOptions && canGenerate && !isGenerating && (
          <Text style={styles.advancedIcon}>⚙️</Text>
        )}
      </TouchableOpacity>

      {/* Error Display */}
      {lastError && (
        <Text style={styles.errorText}>{lastError}</Text>
      )}

      {/* Advanced Options Modal */}
      <Modal
        visible={showOptionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generation Options</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOptionsModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Quick Presets */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Presets</Text>
                
                <TouchableOpacity
                  style={styles.presetOption}
                  onPress={() => handlePresetGenerate('quickAndEasy')}
                >
                  <Text style={styles.presetTitle}>🚀 Quick & Easy</Text>
                  <Text style={styles.presetDescription}>Fast generation, simple recipes, max 20min prep</Text>
                  <View style={styles.estimateContainer}>
                    <Text style={styles.timeEstimate}>
                      ~{getEstimatedTime('speed', selectedUser).estimatedSeconds} seconds
                    </Text>
                    <Text style={styles.timeFactors}>
                      {getEstimatedTime('speed', selectedUser).factors.join(' • ')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetOption}
                  onPress={() => handlePresetGenerate('gourmet')}
                >
                  <Text style={styles.presetTitle}>👨‍🍳 Gourmet</Text>
                  <Text style={styles.presetDescription}>High-quality recipes, maximum variety, up to 90min prep</Text>
                  <View style={styles.estimateContainer}>
                    <Text style={styles.timeEstimate}>
                      ~{getEstimatedTime('quality', selectedUser).estimatedSeconds} seconds
                    </Text>
                    <Text style={styles.timeFactors}>
                      {getEstimatedTime('quality', selectedUser).factors.join(' • ')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetOption}
                  onPress={() => handlePresetGenerate('highProtein')}
                >
                  <Text style={styles.presetTitle}>💪 High Protein</Text>
                  <Text style={styles.presetDescription}>Optimized for protein intake, ideal for workouts</Text>
                  <View style={styles.estimateContainer}>
                    <Text style={styles.timeEstimate}>
                      ~{getEstimatedTime('balanced', selectedUser).estimatedSeconds} seconds
                    </Text>
                    <Text style={styles.timeFactors}>
                      {getEstimatedTime('balanced', selectedUser).factors.join(' • ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Mode Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Generation Mode</Text>
                {(['speed', 'balanced', 'quality'] as const).map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeOption,
                      selectedMode === mode && styles.selectedModeOption
                    ]}
                    onPress={() => setSelectedMode(mode)}
                  >
                    <Text style={[
                      styles.modeTitle,
                      selectedMode === mode && styles.selectedModeTitle
                    ]}>
                      {mode === 'speed' && '⚡ Speed'}
                      {mode === 'balanced' && '⚖️ Balanced'}
                      {mode === 'quality' && '🎯 Quality'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.generateCustomButton}
                onPress={() => handlePresetGenerate('custom')}
              >
                <Text style={styles.generateCustomButtonText}>
                  Generate with {selectedMode} mode
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  generateButton: {
    backgroundColor: '#FFB347',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  // ✅ FIXED: Properly typed style objects
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFB347',
  } as ViewStyle,
  disabledButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  } as ViewStyle,
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#FFB347',
  },
  disabledButtonText: {
    color: '#999999',
  },
  advancedIcon: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666666',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
  },
  presetOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  estimateContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
  },
  timeEstimate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB347',
  },
  timeFactors: {
    fontSize: 11,
    color: '#999999',
    marginTop: 2,
  },
  modeOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedModeOption: {
    backgroundColor: '#FFF4E6',
    borderColor: '#FFB347',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  selectedModeTitle: {
    color: '#FFB347',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  generateCustomButton: {
    backgroundColor: '#FFB347',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  generateCustomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default GenerateButton;