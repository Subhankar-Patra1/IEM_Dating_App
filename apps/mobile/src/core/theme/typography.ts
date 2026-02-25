import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  h2: { fontSize: 24, fontWeight: '600', color: colors.text.primary },
  bodyLarge: { fontSize: 16, color: colors.text.primary, lineHeight: 24 },
  bodyMedium: { fontSize: 14, color: colors.text.secondary, lineHeight: 20 },
  caption: { fontSize: 12, color: colors.text.secondary },
});
