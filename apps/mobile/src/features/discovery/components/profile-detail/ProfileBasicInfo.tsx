import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ProfileBasicInfoProps {
  user: any;
}

export const ProfileBasicInfo: React.FC<ProfileBasicInfoProps> = ({ user }) => {
  const matchPercentage = user.matchPercentage || 98;
  const getBadgeColor = (percentage: number) => {
    if (percentage >= 60) return '#4ade80';
    if (percentage >= 40) return '#facc15';
    return '#f87171';
  };

  const getAge = (dob: string | Date | undefined) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)).toString();
  };

  const age = user.age || getAge(user.dob) || user.year?.replace(' Year', '') || '';
  const college = user.college || 'IEM Kolkata';

  // Animations
  const pillScale = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Match pill bounce
    Animated.spring(pillScale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
      delay: 300,
    }).start();

    // Infinite pulsing dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Row: Name, Age, Verification, Online, Match % */}
      <View style={styles.topRow}>
        <View style={styles.nameContainer}>
          <Text style={styles.nameText}>{user.name?.split(' ')[0]}{age ? `, ${age}` : ''}</Text>
          {user.isVerified && <Ionicons name="checkmark-circle" size={26} color="#26de81" style={styles.iconMargin} />}
          <Animated.View style={[styles.onlineDot, { opacity: dotOpacity }]} />
        </View>
        <View style={styles.rightBadgesContainer}>
          <Animated.View style={[styles.matchBadge, { transform: [{ scale: pillScale }] }]}>
            <LinearGradient
              colors={['#ff5c5c', '#ff9f43']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.matchText}>
              Match {matchPercentage}%
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Online Status */}
      <View style={styles.activeStatusContainer}>
        <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.6)" />
        <Text style={styles.activeText}>{user.lastActiveAt ? 'Active recently' : 'Active recently'}</Text>
      </View>

      {/* Structured Info Row (Editorial Cards) */}
      <View style={styles.infoCard}>
        {user.showGender && user.gender && (
          <View style={styles.infoRow}>
            <View style={[styles.iconTile, { backgroundColor: 'rgba(38, 222, 129, 0.15)' }]}>
              <Ionicons name="person" size={14} color="#26de81"/>
            </View>
            <Text style={styles.infoText}>{user.gender}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <View style={[styles.iconTile, { backgroundColor: 'rgba(69, 170, 242, 0.15)' }]}>
            <Ionicons name="business" size={14} color="#45aaf2"/>
          </View>
          <Text style={styles.infoText}>{college}</Text>
        </View>
        {user.department && (
          <View style={styles.infoRow}>
            <View style={[styles.iconTile, { backgroundColor: 'rgba(69, 170, 242, 0.15)' }]}>
              <Ionicons name="laptop-outline" size={14} color="#45aaf2"/>
            </View>
            <Text style={styles.infoText}>{user.department}</Text>
          </View>
        )}
        {(user.year) && (
          <View style={styles.infoRow}>
            <View style={[styles.iconTile, { backgroundColor: 'rgba(255, 159, 67, 0.15)' }]}>
              <Ionicons name="calendar-outline" size={14} color="#ff9f43"/>
            </View>
            <Text style={styles.infoText}>{user.year ? `Class of ${user.year}` : ''}</Text>
          </View>
        )}
        {user.isHosteller !== null && user.isHosteller !== undefined && (
          <View style={styles.infoRow}>
            <View style={[styles.iconTile, { backgroundColor: 'rgba(38, 222, 129, 0.15)' }]}>
              <Ionicons name="book-outline" size={14} color="#26de81"/>
            </View>
            <Text style={styles.infoText}>{user.isHosteller ? 'Hosteller' : 'Day Scholar'}</Text>
          </View>
        )}
        {user.degree && (
          <View style={styles.infoRow}>
            <View style={[styles.iconTile, { backgroundColor: 'rgba(69, 170, 242, 0.15)' }]}>
              <Ionicons name="school" size={14} color="#45aaf2"/>
            </View>
            <Text style={styles.infoText}>{user.degree || 'Bachelor'}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: -80,
    paddingBottom: 24,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameText: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 36,
    color: '#FFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  iconMargin: {
    marginLeft: 8,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#26de81',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.5)',
    marginLeft: 6,
  },
  matchBadge: {
    borderWidth: 0, // removed border, using gradient
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: '#ff5c5c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  matchText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: '#FFF',
  },
  rightBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muteIcon: {
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#13131a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 28,
    height: 28,
    borderRadius: 12, // 12px border-radius square
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  }
});
