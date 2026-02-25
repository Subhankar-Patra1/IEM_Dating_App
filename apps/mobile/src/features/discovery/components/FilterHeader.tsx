import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '../../../core/theme/typography';
import { colors } from '../../../core/theme/colors';

export const FilterHeader = () => {
  return (
    <View style={styles.header}>
      <Text style={typography.h2}>Discover</Text>
      {/* Settings / Filter Icons would go here */}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
});
