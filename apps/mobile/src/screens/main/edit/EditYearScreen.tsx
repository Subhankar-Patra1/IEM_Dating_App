import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';
import { colors } from '../../../core/theme/colors';

const yearOptions = [
  { label: '1st YR', value: 1 },
  { label: '2nd YR', value: 2 },
  { label: '3rd YR', value: 3 },
  { label: '4th YR', value: 4 },
];

export const EditYearScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentYearOfStudy } = route.params || {};

  const [selected, setSelected] = useState<number | null>(currentYearOfStudy || null);
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await api.put('/profile', { yearOfStudy: selected });
      if (response.data?.success) {
        dispatch(updateUser(response.data.data));
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <EditScreenHeader 
        title="Year of Study" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        saveDisabled={!selected}
        hasUnsavedChanges={selected !== null && selected !== (currentYearOfStudy || null)}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.title}>Which year is it?</Text>
        <Text style={styles.subtitle}>Help us display your academic year correctly on your profile.</Text>

        <Text style={styles.label}>YEAR OF STUDY</Text>
        <View style={styles.pillsContainer}>
          {yearOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.pill,
                selected === option.value && styles.pillSelected
              ]}
              onPress={() => setSelected(option.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, selected === option.value && styles.pillTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 22, marginBottom: 32 },
  label: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#F94E27', // Matching User Image color for label if needed, or stick to slate
    letterSpacing: 1, 
    marginBottom: 16 
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24, // High border radius for pill shape
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    borderColor: '#F94E27',
    backgroundColor: 'rgba(249, 78, 39, 0.04)',
  },
  pillText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  pillTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
});
