import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { useUserStore } from '../stores/userStore';

function UserDropdown() {
  const users = useUserStore((state) => state.users);
  const selectedUser = useUserStore((state) => state.selectedUser);
  const setSelectedUser = useUserStore((state) => state.setSelectedUser);
  const [isOpen, setIsOpen] = useState(false);

  if (!selectedUser) return null;

  return (
    <View style={styles.dropdown}>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.dropdownButtonText}>{selectedUser.name}</Text>
        <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownMenu}>
          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedUser(user);
                setIsOpen(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText,
                selectedUser.id === user.id && styles.selectedDropdownItem
              ]}>
                {user.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export const MealPlannerScreen: React.FC = () => {
  const selectedUser = useUserStore((state) => state.selectedUser);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Status bar separator */}
      <View style={[styles.statusBarSeparator, { paddingTop: insets.top }]} />
      
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          <UserDropdown />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            🍽️ Calendar view will be here
          </Text>
          <Text style={styles.description}>
            Here you'll be able to:
            {'\n'}• View weekly calendar
            {'\n'}• Add meals to specific days
            {'\n'}• See nutrition overview
            {'\n'}• Generate meal plans for {selectedUser?.name || 'selected user'}
          </Text>
        </View>

        <Button
          title="🎲 Generate This Week"
          onPress={() => console.log(`Generate meal plan for ${selectedUser?.name}`)}
          variant="primary"
          size="large"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F8F9FA',
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
  dropdown: {
    position: 'relative',
    minWidth: 120,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    minWidth: 150,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedDropdownItem: {
    color: '#FFB347',
    fontWeight: '600',
  },
});