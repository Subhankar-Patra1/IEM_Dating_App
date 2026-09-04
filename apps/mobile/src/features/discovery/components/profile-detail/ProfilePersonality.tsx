import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

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
  
  const education = user.degree || user.preferences?.personality?.education;

  const hasPersonality = personalityType || loveLanguage || starSign;
  const hasLifestyle = drinking || smoking || exercise || pets;
  const hasComm = !!commStyle;
  const hasEducation = !!education;

  const formatValue = (val: string) => {
    if (!val) return '';
    return val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!hasPersonality && !hasLifestyle && !hasComm && !hasEducation) return null;

  return (
    <View style={styles.container}>
      {/* 1. MORE ABOUT ME SECTION (ROWS) */}
      {(hasPersonality || hasComm) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="label" size={24} color="#8e8e93" />
            <Text style={styles.sectionTitle}>More about me</Text>
          </View>
          
          <View style={styles.lifestyleCard}>
            {commStyle && (
              <View style={styles.lifestyleRow}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabelText}>Communication style</Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#8e8e93" style={styles.rowIcon} />
                  <Text style={styles.rowValueText}>{formatValue(commStyle)}</Text>
                </View>
              </View>
            )}

            {loveLanguage && (
              <View style={[styles.lifestyleRow, commStyle && styles.rowBorder]}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabelText}>Love style</Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <Ionicons name="heart-outline" size={18} color="#8e8e93" style={styles.rowIcon} />
                  <Text style={styles.rowValueText}>{formatValue(loveLanguage)}</Text>
                </View>
              </View>
            )}

            {hasEducation && (
              <View style={[styles.lifestyleRow, (commStyle || loveLanguage) && styles.rowBorder]}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabelText}>Education</Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <Ionicons name="school-outline" size={18} color="#8e8e93" style={styles.rowIcon} />
                  <Text style={styles.rowValueText}>{formatValue(education)}</Text>
                </View>
              </View>
            )}

            {starSign && (
              <View style={[styles.lifestyleRow, (commStyle || loveLanguage || hasEducation) && styles.rowBorder]}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabelText}>Zodiac</Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <MaterialCommunityIcons name="moon-waning-crescent" size={18} color="#8e8e93" style={styles.rowIcon} />
                  <Text style={styles.rowValueText}>{formatValue(starSign)}</Text>
                </View>
              </View>
            )}

            {personalityType && (
              <View style={[styles.lifestyleRow, (commStyle || loveLanguage || hasEducation || starSign) && styles.rowBorder]}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabelText}>Personality</Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <Ionicons name="person-outline" size={18} color="#8e8e93" style={styles.rowIcon} />
                  <Text style={styles.rowValueText}>{formatValue(personalityType)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 2. LIFESTYLE SECTION (ROWS) */}
      {hasLifestyle && (
        <View style={[styles.section, (hasPersonality || hasComm) && styles.sectionTopMargin]}>
          <View style={styles.lifestyleHeader}>
            <MaterialCommunityIcons name="label" size={24} color="#8e8e93" />
            <Text style={styles.sectionTitle}>Lifestyle</Text>
          </View>
          
          <View style={styles.lifestyleCard}>
            {drinking && (
              <View style={styles.lifestyleRow}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabelText}>Drinking</Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <MaterialCommunityIcons name="glass-wine" size={18} color="#8e8e93" style={styles.rowIcon} />
                  <Text style={styles.rowValueText}>{formatValue(drinking)}</Text>
                </View>
              </View>
            )}
            
            {smoking && (
              <View style={[styles.lifestyleRow, styles.rowBorder]}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabelText}>How often do you smoke?</Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <MaterialCommunityIcons name="smoking" size={18} color="#8e8e93" style={styles.rowIcon} />
                  <Text style={styles.rowValueText}>{formatValue(smoking)}</Text>
                </View>
              </View>
            )}
            
            {exercise && (
              <View style={[styles.lifestyleRow, styles.rowBorder]}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabelText}>Workout</Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <Ionicons name="barbell-outline" size={18} color="#8e8e93" style={styles.rowIcon} />
                  <Text style={styles.rowValueText}>{formatValue(exercise)}</Text>
                </View>
              </View>
            )}
            
            {pets && (
              <View style={[styles.lifestyleRow, styles.rowBorder]}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabelText}>Pets</Text>
                </View>
                <View style={styles.rowValueContainer}>
                  <Ionicons name="paw-outline" size={18} color="#8e8e93" style={styles.rowIcon} />
                  <Text style={styles.rowValueText}>{formatValue(pets)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 2,
    paddingVertical: 8,
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#13131a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  sectionTopMargin: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: '#8e8e93',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  lifestyleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  lifestyleCard: {
    marginTop: 0,
  },
  lifestyleRow: {
    paddingVertical: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rowHeader: {
    marginBottom: 6,
  },
  rowLabelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  rowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 10,
  },
  rowValueText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#FFF',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
  blueTint: {
    backgroundColor: 'rgba(69, 170, 242, 0.12)',
    borderColor: 'rgba(69, 170, 242, 0.25)', 
  },
  redTint: {
    backgroundColor: 'rgba(255, 92, 92, 0.12)',
    borderColor: 'rgba(255, 92, 92, 0.25)',
  },
  greenTint: {
    backgroundColor: 'rgba(38, 222, 129, 0.12)',
    borderColor: 'rgba(38, 222, 129, 0.25)',
  },
});
