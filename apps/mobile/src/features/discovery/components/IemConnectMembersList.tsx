import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../core/theme/colors';

const MEMBERS = [
  { id: '1', name: 'Julian', imageUri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', isPremium: true },
  { id: '2', name: 'Isabella', imageUri: 'https://i.pravatar.cc/150?u=a04258a2462d826712d', isPremium: true },
  { id: '3', name: 'Max', imageUri: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', isPremium: false },
  { id: '4', name: 'Sophia', imageUri: 'https://i.pravatar.cc/150?u=a04258114e29026702d', isPremium: true },
  { id: '5', name: 'Alex', imageUri: 'https://i.pravatar.cc/150?u=a048581f4e29026701d', isPremium: false },
];

export const IemConnectMembersList = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>IEM Connect Members Nearby</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MEMBERS.map((member) => (
          <View key={member.id} style={styles.memberContainer}>
            {member.isPremium ? (
              <LinearGradient
                colors={[colors.primary, colors.accent, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBorder}
              >
                <View style={styles.imageInnerContainer}>
                  <Image source={{ uri: member.imageUri }} style={styles.image} />
                </View>
              </LinearGradient>
            ) : (
              <View style={[styles.gradientBorder, styles.regularBorder]}>
                <View style={styles.imageInnerContainer}>
                  <Image source={{ uri: member.imageUri }} style={styles.image} />
                </View>
              </View>
            )}
            <Text style={styles.name} numberOfLines={1}>
              {member.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.text.secondary,
    letterSpacing: 2,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  memberContainer: {
    alignItems: 'center',
    width: 68,
  },
  gradientBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    marginBottom: 8,
  },
  regularBorder: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  imageInnerContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: colors.background, // Creates the gap between border and image
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2, // Inner gap
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  name: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.primary,
  },
});
