import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfilePersonalityProps {
  user: any;
}

export const ProfilePersonality: React.FC<ProfilePersonalityProps> = ({ user }) => {
  // Personality
  const personalityType = user.preferences?.personality?.personality;
  const loveLanguage = user.preferences?.personality?.love_reception;
  const starSign = user.preferences?.personality?.star_sign;
  
  // Lifestyle
  const drinking = user.preferences?.lifestyle?.drink;
  const smoking = user.preferences?.lifestyle?.smoke;
  const exercise = user.preferences?.lifestyle?.exercise;
  const pets = user.preferences?.lifestyle?.pets;

  // Communication
  const commStyle = user.preferences?.personality?.communication;

  const hasPersonality = personalityType || loveLanguage || starSign;
  const hasLifestyle = drinking || smoking || exercise || pets;
  const hasComm = !!commStyle;

  if (!hasPersonality && !hasLifestyle && !hasComm) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>VIBE & LIFESTYLE</Text>
      
      <View style={styles.grid}>
        {/* Personality Tags (Blue Tint) */}
        {personalityType && (
          <View style={[styles.pill, styles.blueTint]}>
            <Text style={[styles.pillText, { color: '#45aaf2' }]}>🧠 {personalityType}</Text>
          </View>
        )}
        {loveLanguage && (
          <View style={[styles.pill, styles.blueTint]}>
            <Text style={[styles.pillText, { color: '#45aaf2' }]}>💝 {loveLanguage}</Text>
          </View>
        )}
        
        {/* Zodiac/Identity Tags (Red Tint) */}
        {starSign && (
          <View style={[styles.pill, styles.redTint]}>
            <Text style={[styles.pillText, { color: '#ff5c5c' }]}>✨ {starSign}</Text>
          </View>
        )}

        {/* Lifestyle Tags (Green Tint) */}
        {drinking && (
          <View style={[styles.pill, styles.greenTint]}>
            <Text style={[styles.pillText, { color: '#26de81' }]}>🍺 {drinking}</Text>
          </View>
        )}
        {smoking && (
          <View style={[styles.pill, styles.greenTint]}>
            <Text style={[styles.pillText, { color: '#26de81' }]}>🚭 {smoking}</Text>
          </View>
        )}
        {exercise && (
          <View style={[styles.pill, styles.greenTint]}>
            <Text style={[styles.pillText, { color: '#26de81' }]}>🏋️ {exercise}</Text>
          </View>
        )}
        {pets && (
          <View style={[styles.pill, styles.greenTint]}>
             <Text style={[styles.pillText, { color: '#26de81' }]}>🐾 {pets}</Text>
          </View>
        )}

        {/* Communication Tag (Blue Tint) */}
        {commStyle && (
          <View style={[styles.pill, styles.blueTint]}>
            <Text style={[styles.pillText, { color: '#45aaf2' }]}>🗣️ {commStyle}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#13131a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  sectionTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: '#8e8e93',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  blueTint: {
    backgroundColor: 'rgba(69, 170, 242, 0.15)',
    borderColor: 'rgba(69, 170, 242, 0.3)', 
  },
  redTint: {
    backgroundColor: 'rgba(255, 92, 92, 0.15)',
    borderColor: 'rgba(255, 92, 92, 0.3)',
  },
  greenTint: {
    backgroundColor: 'rgba(38, 222, 129, 0.15)',
    borderColor: 'rgba(38, 222, 129, 0.3)',
  },
  pillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  }
});
