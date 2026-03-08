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
const CARD_WIDTH = (width - 60) / 3;

const seekingOptions = [
  { id: 'Long-term partner', title: 'Long-term partner', emoji: '💘' },
  { id: 'Long-term, but short-term OK', title: 'Long-term, but short-term OK', emoji: '😍' },
  { id: 'Short-term, but long-term OK', title: 'Short-term, but long-term OK', emoji: '🥂' },
  { id: 'Short-term fun', title: 'Short-term fun', emoji: '🎉' },
  { id: 'New friends', title: 'New friends', emoji: '👋' },
  { id: 'Still figuring it out', title: 'Still figuring it out', emoji: '🤔' },
];

export const EditSeekingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentSeeking } = route.params || {};

  const [selected, setSelected] = useState<string | null>(currentSeeking || null);
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
      const response = await api.put('/profile', { seeking: selected });
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
        title="Looking For" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        saveDisabled={!selected}
        hasUnsavedChanges={selected !== (currentSeeking || null)}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.title}>What are you looking for?</Text>
        <Text style={styles.subtitle}>All good if it changes. There's something for everyone.</Text>

        <View style={styles.gridContainer}>
          {seekingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, selected === option.id && styles.optionCardSelected]}
              onPress={() => setSelected(option.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{option.emoji}</Text>
              <Text style={styles.optionTitle}>{option.title}</Text>
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
  title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 22, marginBottom: 24 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  optionCard: {
    width: CARD_WIDTH, aspectRatio: 0.85, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, paddingHorizontal: 6, paddingVertical: 14, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  optionCardSelected: { borderColor: '#F94E27', backgroundColor: 'rgba(255,255,255,0.08)' },
  emojiText: { fontSize: 36, marginBottom: 8 },
  optionTitle: { fontSize: 12, fontWeight: '700', color: '#FFF', textAlign: 'center', lineHeight: 16 },
});
