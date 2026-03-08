import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../core/theme/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  tint?: 'light' | 'dark' | 'default';
  intensity?: number;
}

export const GlassPanel = ({ 
  children, 
  style, 
  tint = 'dark', 
  intensity = 50 
}: Props) => {
  return (
    <BlurView 
      intensity={intensity} 
      tint={tint} 
      style={[styles.container, style]}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 22, 24, 0.4)', // Slate-custom with opacity
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
