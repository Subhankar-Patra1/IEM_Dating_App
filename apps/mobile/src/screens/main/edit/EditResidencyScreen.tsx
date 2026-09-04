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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const EditResidencyScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentResidency } = route.params || {};

  // isHosteller: true (Hosteller), false (Day Scholar), null (Unspecified)
  const [selected, setSelected] = useState<boolean | null>(
    currentResidency !== undefined ? currentResidency : null
  );
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
    if (selected === null) return;
    setSaving(true);
    try {
      const response = await api.put('/profile', { isHosteller: selected });
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
        title="Residency" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        saveDisabled={selected === null}
        hasUnsavedChanges={selected !== null && selected !== (currentResidency !== undefined ? currentResidency : null)}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.title}>Where are you staying?</Text>
        <Text style={styles.subtitle}>This is how it'll appear on your profile.</Text>

        <Text style={styles.label}>RESIDENCY</Text>
        <View style={styles.cardsContainer}>
          {/* Hosteller Card */}
          <TouchableOpacity
            style={[
              styles.card,
              selected === true && styles.cardSelected
            ]}
            onPress={() => setSelected(true)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name="home-city-outline" 
                size={36} 
                color={selected === true ? '#F94E27' : 'rgba(255,255,255,0.6)'} 
              />
            </View>
            <Text style={[styles.cardText, selected === true && styles.cardTextSelected]}>
              Hosteller
            </Text>
          </TouchableOpacity>

          {/* Day Scholar Card */}
          <TouchableOpacity
            style={[
              styles.card,
              selected === false && styles.cardSelected
            ]}
            onPress={() => setSelected(false)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name="bus" 
                size={36} 
                color={selected === false ? '#F94E27' : 'rgba(255,255,255,0.6)'} 
              />
            </View>
            <Text style={[styles.cardText, selected === false && styles.cardTextSelected]}>
              Day Scholar
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 32 },
  label: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#94A3B8', 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginBottom: 12 
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  card: {
    width: (SCREEN_WIDTH - 52) / 2, // Accounting for padding and gap
    height: 110,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardSelected: {
    borderColor: '#F94E27',
    backgroundColor: 'rgba(249, 78, 39, 0.04)',
  },
  iconContainer: {
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  cardTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
});
