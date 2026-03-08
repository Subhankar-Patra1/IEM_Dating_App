import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';

const { width } = Dimensions.get('window');

const CAMPUS_DATA = [
  { id: 'Management', label: 'Management House Campus', icon: 'office-building' },
  { id: 'Gurukul', label: 'Gurukul Campus', icon: 'book-open-variant' },
  { id: 'Ashram', label: 'Ashram Campus', icon: 'domain' },
  { id: 'UEM_NewTown', label: 'UEM NewTown Campus', icon: 'city-variant' },
  { id: 'UEM_Jaipur', label: 'UEM Jaipur Campus', icon: 'map-marker' },
];

export const EditCampusScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentCampus } = route.params || {};

  const [selectedCampus, setSelectedCampus] = useState<string | null>(currentCampus || null);
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
    if (!selectedCampus) return;
    setSaving(true);
    try {
      const response = await api.put('/profile', { campus: selectedCampus });
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
        title="Campus" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        saveDisabled={!selectedCampus}
        hasUnsavedChanges={selectedCampus !== null && selectedCampus !== (currentCampus || null)}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Where are you located?</Text>
          <Text style={styles.subtitle}>This helps for quick coffee invites during breaks.</Text>

          <Text style={styles.sectionLabel}>Primary Campus</Text>
          {CAMPUS_DATA.map((campus) => (
            <TouchableOpacity
              key={campus.id}
              style={[styles.optionItem, selectedCampus === campus.id && styles.optionItemSelected]}
              onPress={() => setSelectedCampus(campus.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <MaterialCommunityIcons
                  name={campus.icon as any}
                  size={24}
                  color={selectedCampus === campus.id ? '#F94E27' : 'rgba(255,255,255,0.6)'}
                />
                <Text style={[styles.optionText, selectedCampus === campus.id && styles.optionTextSelected]}>
                  {campus.label}
                </Text>
              </View>
              {selectedCampus === campus.id && (
                <MaterialCommunityIcons name="check-circle" size={24} color="#F94E27" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 22, marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#F94E27', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  optionItem: {
    height: 70, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12,
  },
  optionItemSelected: { borderColor: '#F94E27', backgroundColor: 'rgba(249, 78, 39, 0.05)' },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginLeft: 15 },
  optionTextSelected: { color: '#FFF', fontWeight: '700' },
});
