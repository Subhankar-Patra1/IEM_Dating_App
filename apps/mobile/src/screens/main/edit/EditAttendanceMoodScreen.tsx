import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';

const { width } = Dimensions.get('window');

const moodOptions = [
  { id: '75% Maintainer', label: '75% Maintainer' },
  { id: 'Front Bencher', label: 'Front Bencher' },
  { id: 'Bunker', label: 'Bunker' },
  { id: 'Risk Taker', label: 'Risk Taker' },
];

export const EditAttendanceMoodScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentMood } = route.params || {};

  const [selected, setSelected] = useState<string | null>(currentMood || null);
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
      const response = await api.put('/profile', { attendanceMood: selected });
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
        title="Attendance Style" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        saveDisabled={!selected}
        hasUnsavedChanges={selected !== null && selected !== currentMood}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.title}>Attendance Style</Text>
        <Text style={styles.subtitle}>How do you usually show up to class?</Text>

        <View style={styles.gridContainer}>
          {moodOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, selected === option.id && styles.optionCardSelected]}
              onPress={() => setSelected(option.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionTitle, selected === option.id && styles.optionTitleSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const CARD_WIDTH = (width - 50) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 22, marginBottom: 30 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  optionCard: {
    width: CARD_WIDTH,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: '#F94E27',
    backgroundColor: 'rgba(249, 78, 39, 0.08)',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  optionTitleSelected: {
    color: '#FFF',
  },
});
