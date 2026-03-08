import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileAboutProps {
  user: any;
}

export const ProfileAbout: React.FC<ProfileAboutProps> = ({ user }) => {
  const bio = user.preferences?.bio;
  const intent = user.seeking;
  const orientation = user.orientation?.join(', ');

  const hasContent = bio || intent || (orientation && user.showOrientation);
  if (!hasContent) return null;

  return (
    <View style={styles.container}>
      {bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT ME</Text>
          <Text style={styles.bioText}>"{bio}"</Text>
        </View>
      )}

      {(intent || (orientation && user.showOrientation)) && (
        <View style={styles.chipsContainer}>
          {intent && (
            <View style={styles.intentBadge}>
              <Text style={styles.intentText}>💕 {intent}</Text>
            </View>
          )}
          {orientation && user.showOrientation && (
            <View style={styles.orientationBadge}>
              <Text style={styles.orientationText}>🏳️‍🌈 {orientation}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: '#13131a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: '#8e8e93',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  bioText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intentBadge: {
    backgroundColor: 'rgba(255, 159, 67, 0.15)', // Amber tint
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 67, 0.3)',
  },
  intentText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#ff9f43',
  },
  orientationBadge: {
    backgroundColor: 'rgba(255, 92, 92, 0.15)', // Red tint
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.3)',
  },
  orientationText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#ff5c5c',
  }
});
