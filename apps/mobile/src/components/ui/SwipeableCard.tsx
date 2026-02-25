import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../core/theme/colors';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.7;

export interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  imageUrl: string;
  department?: string;
}

interface SwipeableCardProps {
  profile: Profile;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({ profile }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: profile.imageUrl }} style={styles.image} />
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />
      
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}, {profile.age}</Text>
        </View>
        
        {profile.department && (
          <Text style={styles.department}>{profile.department}</Text>
        )}
        
        <Text style={styles.bio} numberOfLines={2}>
          {profile.bio}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    position: 'absolute', // Important for stacking cards
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  department: {
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '600',
    marginBottom: 8,
  },
  bio: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  }
});
