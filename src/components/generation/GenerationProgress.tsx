// src/components/generation/GenerationProgress.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { GenerationProgress as ProgressType } from '../../hooks/useMealPlanGeneration';

interface GenerationProgressProps {
  progress: ProgressType;
  onCancel?: () => void;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  progress,
  onCancel
}) => {
  const getStageIcon = (stage: string): string => {
    switch (stage) {
      case 'initializing': return '🚀';
      case 'pre-filtering': return '🔍';
      case 'optimization': return '⚙️';
      case 'constraint-satisfaction': return '🎯';
      case 'local-search': return '🔄';
      case 'ml-refinement': return '🧠';
      case 'finalization': return '✨';
      case 'complete': return '✅';
      case 'cancelled': return '❌';
      case 'error': return '⚠️';
      default: return '📊';
    }
  };

  const getStageDescription = (stage: string): string => {
    switch (stage) {
      case 'initializing': return 'Preparing meal generation...';
      case 'pre-filtering': return 'Filtering recipes by preferences...';
      case 'optimization': return 'Optimizing nutritional balance...';
      case 'constraint-satisfaction': return 'Satisfying meal constraints...';
      case 'local-search': return 'Improving variety and quality...';
      case 'ml-refinement': return 'Applying learning preferences...';
      case 'finalization': return 'Finalizing meal plan...';
      case 'complete': return 'Meal plan generated successfully!';
      case 'cancelled': return 'Generation cancelled';
      case 'error': return 'Generation failed';
      default: return 'Processing...';
    }
  };

  const formatTime = (seconds?: number): string => {
    if (!seconds) return '';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stageInfo}>
          <Text style={styles.stageIcon}>{getStageIcon(progress.currentStage)}</Text>
          <View style={styles.stageText}>
            <Text style={styles.stageName}>{progress.currentStage.replace('-', ' ')}</Text>
            <Text style={styles.stageDescription}>{getStageDescription(progress.currentStage)}</Text>
          </View>
        </View>
        
        {onCancel && progress.isGenerating && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View 
            style={[
              styles.progressFill,
              { width: `${progress.completion}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress.completion)}%</Text>
      </View>

      {/* Stage Details */}
      {Object.keys(progress.stageDetails).length > 0 && (
        <View style={styles.detailsContainer}>
          {progress.stageDetails.recipesFiltered && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Recipes Filtered:</Text>
              <Text style={styles.detailValue}>{progress.stageDetails.recipesFiltered}</Text>
            </View>
          )}
          {progress.stageDetails.recipesEvaluated && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Evaluated:</Text>
              <Text style={styles.detailValue}>{progress.stageDetails.recipesEvaluated}</Text>
            </View>
          )}
          {progress.stageDetails.constraintsChecked && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Constraints:</Text>
              <Text style={styles.detailValue}>{progress.stageDetails.constraintsChecked}</Text>
            </View>
          )}
          {progress.stageDetails.optimizationIterations && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Iterations:</Text>
              <Text style={styles.detailValue}>{progress.stageDetails.optimizationIterations}</Text>
            </View>
          )}
        </View>
      )}

      {/* Time Estimate */}
      {progress.estimatedTimeRemaining && progress.isGenerating && (
        <View style={styles.timeContainer}>
          <Text style={styles.timeLabel}>Estimated time remaining:</Text>
          <Text style={styles.timeValue}>{formatTime(progress.estimatedTimeRemaining)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stageIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  stageText: {
    flex: 1,
  },
  stageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    textTransform: 'capitalize',
  },
  stageDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB347',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    minWidth: 40,
    textAlign: 'right',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666666',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB347',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666666',
    marginRight: 6,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
});