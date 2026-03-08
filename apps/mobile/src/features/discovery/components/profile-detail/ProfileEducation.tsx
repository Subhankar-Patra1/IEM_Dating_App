import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileEducationProps {
  user: any;
}

export const ProfileEducation: React.FC<ProfileEducationProps> = ({ user }) => {
  const education = user.degree || user.preferences?.personality?.education;

  if (!education) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>EDUCATION LEVEL</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>🎓 {education}</Text>
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 12,
    color: '#8e8e93',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  }
});
