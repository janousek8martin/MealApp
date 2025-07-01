// src/components/ProgressionGraphModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Alert, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface WeightEntry {
  date: string;
  weight: number;
  bodyFat?: number;
}

interface ProgressionGraphModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
}

export const ProgressionGraphModal: React.FC<ProgressionGraphModalProps> = ({
  visible,
  onClose,
  currentUser
}) => {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'weight' | 'bodyFat'>('weight');
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M');

  useEffect(() => {
    if (visible && currentUser) {
      loadWeightEntries();
    }
  }, [visible, currentUser]);

  const loadWeightEntries = async () => {
    try {
      const savedEntries = await AsyncStorage.getItem(`weightEntries_${currentUser?.id}`);
      if (savedEntries) {
        const entries = JSON.parse(savedEntries);
        setWeightEntries(entries.sort((a: WeightEntry, b: WeightEntry) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
      } else {
        // Add initial entry if user has current weight
        if (currentUser.weight) {
          const initialEntry: WeightEntry = {
            date: new Date().toISOString().split('T')[0],
            weight: parseFloat(currentUser.weight),
            bodyFat: currentUser.bodyFat ? parseFloat(currentUser.bodyFat) : undefined
          };
          setWeightEntries([initialEntry]);
          await saveWeightEntries([initialEntry]);
        }
      }
    } catch (error) {
      console.error('Error loading weight entries:', error);
    }
  };

  const saveWeightEntries = async (entries: WeightEntry[]) => {
    try {
      await AsyncStorage.setItem(`weightEntries_${currentUser?.id}`, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving weight entries:', error);
    }
  };

  const addWeightEntry = async () => {
    if (!newWeight || parseFloat(newWeight) <= 0) {
      Alert.alert('Error', 'Please enter a valid weight.');
      return;
    }

    const bodyFatValue = newBodyFat ? parseFloat(newBodyFat) : undefined;
    if (newBodyFat && (isNaN(bodyFatValue!) || bodyFatValue! < 0 || bodyFatValue! > 60)) {
      Alert.alert('Error', 'Body fat percentage must be between 0% and 60%.');
      return;
    }

    const newEntry: WeightEntry = {
      date: selectedDate,
      weight: parseFloat(newWeight),
      bodyFat: bodyFatValue
    };

    // Check if entry for this date already exists
    const existingIndex = weightEntries.findIndex(entry => entry.date === selectedDate);
    let updatedEntries: WeightEntry[];

    if (existingIndex >= 0) {
      // Update existing entry
      updatedEntries = [...weightEntries];
      updatedEntries[existingIndex] = newEntry;
    } else {
      // Add new entry
      updatedEntries = [...weightEntries, newEntry].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    setWeightEntries(updatedEntries);
    await saveWeightEntries(updatedEntries);
    
    setShowAddEntry(false);
    setNewWeight('');
    setNewBodyFat('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const deleteEntry = async (index: number) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedEntries = weightEntries.filter((_, i) => i !== index);
            setWeightEntries(updatedEntries);
            await saveWeightEntries(updatedEntries);
          }
        }
      ]
    );
  };

  const getFilteredEntries = () => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
        return weightEntries;
    }

    return weightEntries.filter(entry => new Date(entry.date) >= cutoffDate);
  };

  const renderChart = () => {
    const filteredEntries = getFilteredEntries();
    
    if (filteredEntries.length < 2) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Not enough data to display chart. Add at least 2 weight entries.
          </Text>
        </View>
      );
    }

    const data = viewMode === 'weight' 
      ? filteredEntries.map(entry => entry.weight)
      : filteredEntries.filter(entry => entry.bodyFat).map(entry => entry.bodyFat!);

    if (data.length < 2) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Not enough {viewMode === 'weight' ? 'weight' : 'body fat'} data to display chart.
          </Text>
        </View>
      );
    }

    const labels = filteredEntries.map(entry => {
      const date = new Date(entry.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }).slice(-data.length);

    const chartData = {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(255, 179, 71, ${opacity})`,
          strokeWidth: 3
        }
      ]
    };

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={width - 60}
          height={220}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 179, 71, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#FFB347'
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && styles.selectedTimeRangeButton
          ]}
          onPress={() => setTimeRange(range)}
        >
          <Text style={[
            styles.timeRangeText,
            timeRange === range && styles.selectedTimeRangeText
          ]}>
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderViewModeSelector = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'weight' && styles.selectedViewModeButton
        ]}
        onPress={() => setViewMode('weight')}
      >
        <Text style={[
          styles.viewModeText,
          viewMode === 'weight' && styles.selectedViewModeText
        ]}>
          Weight
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'bodyFat' && styles.selectedViewModeButton
        ]}
        onPress={() => setViewMode('bodyFat')}
      >
        <Text style={[
          styles.viewModeText,
          viewMode === 'bodyFat' && styles.selectedViewModeText
        ]}>
          Body Fat %
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEntryList = () => (
    <View style={styles.entryListContainer}>
      <Text style={styles.entryListTitle}>Recent Entries</Text>
      <ScrollView style={styles.entryList} showsVerticalScrollIndicator={false}>
        {weightEntries.slice(-5).reverse().map((entry, index) => (
          <View key={entry.date} style={styles.entryItem}>
            <View style={styles.entryInfo}>
              <Text style={styles.entryDate}>
                {new Date(entry.date).toLocaleDateString()}
              </Text>
              <Text style={styles.entryValues}>
                {entry.weight} {currentUser?.weightUnit || 'kg'}
                {entry.bodyFat && ` • ${entry.bodyFat}% BF`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteEntry(weightEntries.length - 1 - index)}
            >
              <Icon name="delete" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderAddEntryModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAddEntry}
      onRequestClose={() => setShowAddEntry(false)}
    >
      <View style={styles.addEntryOverlay}>
        <View style={styles.addEntryContent}>
          <TouchableOpacity
            style={styles.closeAddEntryButton}
            onPress={() => setShowAddEntry(false)}
          >
            <Icon name="close" size={24} color="#FFB347" />
          </TouchableOpacity>

          <Text style={styles.addEntryTitle}>Add Weight Entry</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.dateInput}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight ({currentUser?.weightUnit || 'kg'})</Text>
            <TextInput
              style={styles.input}
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="numeric"
              placeholder="Enter weight"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Body Fat % (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newBodyFat}
              onChangeText={setNewBodyFat}
              keyboardType="numeric"
              placeholder="Enter body fat percentage"
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={addWeightEntry}>
            <Text style={styles.addButtonText}>Add Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#FFB347" />
            </TouchableOpacity>

            <Text style={styles.title}>Progress Tracking</Text>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {renderViewModeSelector()}
              {renderTimeRangeSelector()}
              {renderChart()}
              {renderEntryList()}

              <TouchableOpacity
                style={styles.addEntryButton}
                onPress={() => setShowAddEntry(true)}
              >
                <Icon name="add" size={24} color="#FFFFFF" />
                <Text style={styles.addEntryButtonText}>Add New Entry</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {renderAddEntryModal()}
    </>
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
    width: '95%',
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  scrollView: {
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333333',
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedViewModeButton: {
    backgroundColor: '#FFB347',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  selectedViewModeText: {
    color: '#FFFFFF',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  timeRangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
  },
  selectedTimeRangeButton: {
    backgroundColor: '#FFB347',
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  selectedTimeRangeText: {
    color: '#FFFFFF',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  entryListContainer: {
    marginBottom: 20,
  },
  entryListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  entryList: {
    maxHeight: 150,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 5,
  },
  entryInfo: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  entryValues: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  deleteButton: {
    padding: 5,
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB347',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  addEntryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addEntryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addEntryContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '85%',
  },