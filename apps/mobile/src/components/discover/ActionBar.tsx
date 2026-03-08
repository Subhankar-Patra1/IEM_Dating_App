import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { swipeCard } from '../../store/discoverSlice';

export const ActionBar = () => {
  const dispatch = useDispatch<AppDispatch>();

  const handleAction = (action: 'like' | 'pass' | 'super_like') => {
    // In the future this might trigger the swipe animation first,
    // but for now it directly updates redux.
    dispatch(swipeCard(action));
  };

  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity 
        style={[styles.smallButton]}
        onPress={() => console.log('Rewind')}
      >
        <Ionicons name="arrow-undo" size={24} color="#F59E0B" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.nopeButton]}
        onPress={() => handleAction('pass')}
      >
        <Ionicons name="close" size={32} color="#EF4444" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.smallButton]}
        onPress={() => handleAction('super_like')}
      >
        <Ionicons name="star" size={24} color="#3B82F6" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.likeButton]}
        onPress={() => handleAction('like')}
      >
        <Ionicons name="heart" size={32} color="#10B981" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.smallButton]}
        onPress={() => console.log('Boost')}
      >
        <Ionicons name="flash" size={24} color="#8B5CF6" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingBottom: 40,
    paddingTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  smallButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  nopeButton: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  likeButton: {
    borderWidth: 2,
    borderColor: '#D1FAE5',
  }
});
