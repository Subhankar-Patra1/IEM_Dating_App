import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { SwipeCard } from '../components/SwipeCard';
import { FilterHeader } from '../components/FilterHeader';
import { colors } from '../../../core/theme/colors';

export const DiscoverScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <FilterHeader />
      
      <View style={styles.cardContainer}>
        <SwipeCard 
          user={{
            id: '1',
            name: 'Priya',
            year: '2nd Year',
            department: 'Computer Science',
            imageUri: 'https://...',
            intent: 'Friendship'
          }}
          onLike={() => console.log('Liked')}
          onPass={() => console.log('Passed')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: 'center',
  },
});
