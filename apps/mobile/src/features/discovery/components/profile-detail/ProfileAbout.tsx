import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
        <View style={styles.aboutCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="format-quote-open" size={20} color="#8e8e93" />
              <Text style={styles.cardTitle}>About me</Text>
            </View>
          </View>
          
          <Text style={styles.bioText}>{bio}</Text>

          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.replyButton} activeOpacity={0.8}>
              <Ionicons name="send" size={16} color="#45aaf2" />
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2. REFINED ORIENTATION (ROW-BASED) */}
      {(orientation && user.showOrientation) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag-outline" size={22} color="#8e8e93" />
            <Text style={styles.sectionTitleHeader}>Orientation</Text>
          </View>
          <View style={styles.lifestyleRow}>
            <View style={styles.rowValueContainer}>
              <Text style={styles.orientationText}>🏳️‍🌈 {orientation}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 2,
    paddingVertical: 0,
    marginTop: 0,
    marginBottom: 8,
  },
  aboutCard: {
    backgroundColor: '#13131a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  section: {
    backgroundColor: '#13131a',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitleHeader: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lifestyleRow: {
    paddingVertical: 4,
  },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#FFF',
    fontWeight: '700',
  },
  bioText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 32, 36, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  replyText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#FFF',
  },
  orientationText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15, // Increased from 13
    color: '#ff5c5c',
  },
});
