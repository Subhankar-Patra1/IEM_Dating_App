import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface EmptyDiscoverStateProps {
  onRefresh: () => void;
  onAdjustFilters: () => void;
}

const EmptyDiscoverState: React.FC<EmptyDiscoverStateProps> = ({ onRefresh, onAdjustFilters }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <Text style={styles.title}>No New Profiles</Text>
      <Text style={styles.subtitle}>
        We couldn't find anyone new nearby. Try adjusting your filters or check back later.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onAdjustFilters}>
          <Text style={styles.primaryButtonText}>Adjust Filters</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={onRefresh}>
          <Text style={styles.secondaryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#FF4B4B',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4B4B',
  },
  secondaryButtonText: {
    color: '#FF4B4B',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default EmptyDiscoverState;
