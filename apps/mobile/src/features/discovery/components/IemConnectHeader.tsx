import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';

export const IemConnectHeader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <MaterialCommunityIcons name="diamond-stone" size={24} color={colors.primary} />
        <Text style={styles.title}>
          IEM <Text style={styles.titleLight}>CONNECT</Text>
        </Text>
      </View>
      
      <TouchableOpacity style={styles.notificationBtn}>
        <Ionicons name="notifications" size={20} color={colors.text.primary} />
        <View style={styles.notificationDot} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  titleLight: {
    fontWeight: '300',
    color: colors.primary,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#111', // Dark border to separate from bell
  },
});
