// src/components/generation/QualityIndicator.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { QualityMetrics } from '../../services/mealPlanGenerator';

interface QualityIndicatorProps {
  quality: QualityMetrics;
  compact?: boolean;
  showDetails?: boolean;
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({
  quality,
  compact = false,
  showDetails = false
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getQualityColor = (score: number): string => {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 75) return '#8BC34A'; // Light green
    if (score >= 60) return '#FFB347'; // Orange
    if (score >= 40) return '#FF9800'; // Dark orange
    return '#F44336'; // Red
  };

  const getQualityLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  };

  const getQualityIcon = (score: number): string => {
    if (score >= 90) return '🌟';
    if (score >= 75) return '✅';
    if (score >= 60) return '👍';
    if (score >= 40) return '⚠️';
    return '❌';
  };

  const formatDeviation = (deviation: number): string => {
    const abs = Math.abs(deviation);
    const sign = deviation > 0 ? '+' : deviation < 0 ? '-' : '';
    return `${sign}${abs.toFixed(1)}%`;
  };

  const renderCompactView = () => (
    <TouchableOpacity 
      style={[styles.compactContainer, { borderLeftColor: getQualityColor(quality.overall) }]}
      onPress={() => setShowDetailModal(true)}
    >
      <View style={styles.compactHeader}>
        <Text style={styles.qualityIcon}>{getQualityIcon(quality.overall)}</Text>
        <View style={styles.compactInfo}>
          <Text style={styles.compactScore}>{Math.round(quality.overall)}/100</Text>
          <Text style={styles.compactLabel}>{getQualityLabel(quality.overall)}</Text>
        </View>
        <Text style={styles.detailsArrow}>›</Text>
      </View>
      
      <View style={styles.compactMetrics}>
        <View style={styles.compactMetric}>
          <Text style={styles.metricValue}>{Math.round(quality.nutritionalAccuracy)}</Text>
          <Text style={styles.metricLabel}>Nutrition</Text>
        </View>
        <View style={styles.compactMetric}>
          <Text style={styles.metricValue}>{Math.round(quality.varietyScore)}</Text>
          <Text style={styles.metricLabel}>Variety</Text>
        </View>
        <View style={styles.compactMetric}>
          <Text style={styles.metricValue}>{Math.round(quality.constraintCompliance)}</Text>
          <Text style={styles.metricLabel}>Constraints</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailedView = () => (
    <View style={styles.detailedContainer}>
      <View style={styles.overallScore}>
        <Text style={styles.overallIcon}>{getQualityIcon(quality.overall)}</Text>
        <View style={styles.overallInfo}>
          <Text style={styles.overallValue}>{Math.round(quality.overall)}/100</Text>
          <Text style={styles.overallLabel}>Overall Quality</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.cardTitle}>Nutritional Accuracy</Text>
          <Text style={[styles.cardScore, { color: getQualityColor(quality.nutritionalAccuracy) }]}>
            {Math.round(quality.nutritionalAccuracy)}/100
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.cardTitle}>Variety Score</Text>
          <Text style={[styles.cardScore, { color: getQualityColor(quality.varietyScore) }]}>
            {Math.round(quality.varietyScore)}/100
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.cardTitle}>Constraint Compliance</Text>
          <Text style={[styles.cardScore, { color: getQualityColor(quality.constraintCompliance) }]}>
            {Math.round(quality.constraintCompliance)}/100
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.cardTitle}>User Preferences</Text>
          <Text style={[styles.cardScore, { color: getQualityColor(quality.userPreferenceAlignment) }]}>
            {Math.round(quality.userPreferenceAlignment)}/100
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.detailsButton}
        onPress={() => setShowDetailModal(true)}
      >
        <Text style={styles.detailsButtonText}>View Detailed Breakdown</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDetailModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quality Breakdown</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* Overall Score */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Overall Quality</Text>
              <View style={styles.scoreDisplay}>
                <Text style={styles.largeScore}>{Math.round(quality.overall)}/100</Text>
                <Text style={[styles.qualityBadge, { backgroundColor: getQualityColor(quality.overall) }]}>
                  {getQualityLabel(quality.overall)}
                </Text>
              </View>
            </View>

            {/* Macro Accuracy */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Nutritional Accuracy</Text>
              <View style={styles.macroGrid}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Calories</Text>
                  <Text style={[
                    styles.macroValue,
                    { color: Math.abs(quality.breakdown.macroAccuracy.calories) <= 5 ? '#4CAF50' : '#FF9800' }
                  ]}>
                    {formatDeviation(quality.breakdown.macroAccuracy.calories)}
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={[
                    styles.macroValue,
                    { color: Math.abs(quality.breakdown.macroAccuracy.protein) <= 10 ? '#4CAF50' : '#FF9800' }
                  ]}>
                    {formatDeviation(quality.breakdown.macroAccuracy.protein)}
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={[
                    styles.macroValue,
                    { color: Math.abs(quality.breakdown.macroAccuracy.carbs) <= 10 ? '#4CAF50' : '#FF9800' }
                  ]}>
                    {formatDeviation(quality.breakdown.macroAccuracy.carbs)}
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={[
                    styles.macroValue,
                    { color: Math.abs(quality.breakdown.macroAccuracy.fat) <= 10 ? '#4CAF50' : '#FF9800' }
                  ]}>
                    {formatDeviation(quality.breakdown.macroAccuracy.fat)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Constraints */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Constraint Satisfaction</Text>
              <View style={styles.constraintStats}>
                <View style={styles.constraintItem}>
                  <Text style={styles.constraintLabel}>Satisfied:</Text>
                  <Text style={styles.constraintValue}>
                    {quality.breakdown.constraints.satisfied}/{quality.breakdown.constraints.total}
                  </Text>
                </View>
                <View style={styles.constraintItem}>
                  <Text style={styles.constraintLabel}>Critical:</Text>
                  <Text style={styles.constraintValue}>
                    {quality.breakdown.constraints.critical}/{quality.breakdown.constraints.total}
                  </Text>
                </View>
              </View>
            </View>

            {/* Variety */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Variety Analysis</Text>
              <View style={styles.varietyGrid}>
                <View style={styles.varietyItem}>
                  <Text style={styles.varietyLabel}>Ingredient Diversity</Text>
                  <Text style={styles.varietyValue}>{Math.round(quality.breakdown.variety.ingredientDiversity)}/100</Text>
                </View>
                <View style={styles.varietyItem}>
                  <Text style={styles.varietyLabel}>Recipe Repetition</Text>
                  <Text style={styles.varietyValue}>{Math.round(quality.breakdown.variety.recipeRepetition)}/100</Text>
                </View>
                <View style={styles.varietyItem}>
                  <Text style={styles.varietyLabel}>Category Balance</Text>
                  <Text style={styles.varietyValue}>{Math.round(quality.breakdown.variety.categoryBalance)}/100</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {compact ? renderCompactView() : (showDetails ? renderDetailedView() : renderCompactView())}
      {renderDetailModal()}
    </>
  );
};

const styles = StyleSheet.create({
  // Compact view styles
  compactContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderLeftWidth: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  compactLabel: {
    fontSize: 12,
    color: '#666666',
  },
  detailsArrow: {
    fontSize: 16,
    color: '#999999',
  },
  compactMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  compactMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFB347',
  },
  metricLabel: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },

  // Detailed view styles
  detailedContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  overallScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
  },
  overallIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  overallInfo: {
    flex: 1,
  },
  overallValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  overallLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '45%',
  },
  cardTitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsButton: {
    backgroundColor: '#FFB347',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 18,
    color: '#666666',
  },
  modalScrollView: {
    paddingHorizontal: 20,
  },
  modalSection: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  largeScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroItem: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: '45%',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  constraintStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  constraintItem: {
    alignItems: 'center',
  },
  constraintLabel: {
    fontSize: 12,
    color: '#666666',
  },
  constraintValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 4,
  },
  varietyGrid: {
    gap: 8,
  },
  varietyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 6,
  },
  varietyLabel: {
    fontSize: 14,
    color: '#666666',
  },
  varietyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFB347',
  },
});