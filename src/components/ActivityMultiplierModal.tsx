// src/components/ActivityMultiplierModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const activityLevels = [
  { name: 'Sedentary', range: [1.2, 1.3, 1.4] },
  { name: 'Lightly Active', range: [1.5, 1.6, 1.7] },
  { name: 'Moderately Active', range: [1.8, 1.9, 2.0] },
  { name: 'Highly Active', range: [2.0, 2.1, 2.2] },
];

interface ActivityMultiplierModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  onSave: (multiplier: number) => void;
}

export const ActivityMultiplierModal: React.FC<ActivityMultiplierModalProps> = ({
  visible,
  onClose,
  currentUser,
  onSave
}) => {
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
  const [showActivityChart, setShowActivityChart] = useState(false);

  useEffect(() => {
    if (currentUser?.activityMultiplier) {
      const activity = activityLevels.find(level => 
        level.range.includes(currentUser.activityMultiplier)
      );
      if (activity) {
        setSelectedActivity(activity);
        setSelectedMultiplier(currentUser.activityMultiplier);
      }
    }
  }, [currentUser]);

  const handleSave = () => {
    if (selectedMultiplier) {
      onSave(selectedMultiplier);
    }
  };

  const renderActivityButtons = () => {
    return activityLevels.map((activity, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.activityButton,
          selectedActivity?.name === activity.name && styles.selectedActivityButton,
        ]}
        onPress={() => {
          setSelectedActivity(selectedActivity?.name === activity.name ? null : activity);
          setSelectedMultiplier(null);
        }}
      >
        <Text style={[
          styles.activityButtonText,
          selectedActivity?.name === activity.name && styles.selectedActivityButtonText
        ]}>{activity.name}</Text>
      </TouchableOpacity>
    ));
  };

  const renderMultiplierDots = () => {
    return selectedActivity?.range.map((multiplier: number, index: number) => (
      <View key={index} style={styles.multiplierDotContainer}>
        <Text style={styles.multiplierValue}>{multiplier.toFixed(1)}</Text>
        <TouchableOpacity
          style={[
            styles.multiplierDot,
            selectedMultiplier === multiplier && styles.selectedMultiplierDot,
          ]}
          onPress={() => setSelectedMultiplier(multiplier)}
        />
        <Text style={styles.multiplierLabel}>
          {index === 0 ? 'Low' : index === 1 ? 'Medium' : 'High'}
        </Text>
      </View>
    ));
  };

  const renderChart = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showActivityChart}
      onRequestClose={() => setShowActivityChart(false)}
    >
      <View style={styles.chartModalOverlay}>
        <View style={styles.chartModalContent}>
          <TouchableOpacity
            style={styles.closeChartButton}
            onPress={() => setShowActivityChart(false)}
          >
            <Icon name="close" size={24} color="#FFB347" />
          </TouchableOpacity>
          <Text style={styles.chartTitle}>Activity Level Guide</Text>
          <ScrollView>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Sedentary</Text>
              <Text style={styles.levelDescription}>
                Little to no exercise, desk job
              </Text>
            </View>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Lightly Active</Text>
              <Text style={styles.levelDescription}>
                Light exercise/sports 1-3 days per week
              </Text>
            </View>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Moderately Active</Text>
              <Text style={styles.levelDescription}>
                Moderate exercise/sports 3-5 days per week
              </Text>
            </View>
            <View style={styles.levelSection}>
              <Text style={styles.levelTitle}>Highly Active</Text>
              <Text style={styles.levelDescription}>
                Hard exercise/sports 6-7 days per week
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Activity Level</Text>
            <TouchableOpacity style={styles.infoButton} onPress={() => setShowActivityChart(true)}>
              <View style={styles.infoIcon}>
                <Icon name="info" size={20} color="#FFB347" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>Select your activity level:</Text>
            
            <View style={styles.activitiesContainer}>
              {renderActivityButtons()}
            </View>

            {selectedActivity && (
              <View style={styles.multipliersContainer}>
                <Text style={styles.multiplierTitle}>Choose multiplier:</Text>
                <View style={styles.multiplierDotsContainer}>
                  {renderMultiplierDots()}
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveButton, !selectedMultiplier && styles.disabledButton]}
            onPress={handleSave}
            disabled={!selectedMultiplier}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {renderChart()}
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
    width: width * 0.9,
    maxHeight: '80%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  infoButton: {
    padding: 5,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 15,
    textAlign: 'center',
  },
  activitiesContainer: {
    marginBottom: 20,
  },
  activityButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginVertical: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedActivityButton: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  activityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  selectedActivityButtonText: {
    color: '#FFFFFF',
  },
  multipliersContainer: {
    marginBottom: 20,
  },
  multiplierTitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 15,
    textAlign: 'center',
  },
  multiplierDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  multiplierDotContainer: {
    alignItems: 'center',
  },
  multiplierValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  multiplierDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#DDD',
    marginBottom: 8,
  },
  selectedMultiplierDot: {
    backgroundColor: '#FFB347',
    borderColor: '#FFB347',
  },
  multiplierLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#FFB347',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  chartModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: width * 0.85,
    maxHeight: '70%',
  },
  closeChartButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  levelSection: {
    marginBottom: 20,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 5,
  },
  levelDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});