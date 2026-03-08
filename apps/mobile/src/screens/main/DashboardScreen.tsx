import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../core/theme/colors';

import SwipeDeck from '../../components/discover/SwipeDeck';
import { ActionBar } from '../../components/discover/ActionBar';
import DiscoverTutorial from '../../components/discover/DiscoverTutorial';

export const DashboardScreen = () => {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Show tutorial on first mount for testing purposes
    // In production we would use AsyncStorage
    setShowTutorial(true);
  }, []);

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>
      
      <View style={styles.cardsContainer}>
        <SwipeDeck />
      </View>

      <ActionBar />

      <DiscoverTutorial 
        visible={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20, // adjust vertical alignment
  },
});
