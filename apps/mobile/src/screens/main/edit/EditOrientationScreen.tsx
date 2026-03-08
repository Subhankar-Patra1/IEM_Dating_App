import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';

const orientationOptions = [
  { id: 'Straight', label: 'Straight', description: 'Attracted to members of the opposite gender' },
  { id: 'Gay', label: 'Gay', description: 'Attracted to members of their gender' },
  { id: 'Lesbian', label: 'Lesbian', description: 'A woman attracted to other women and non-binary people' },
  { id: 'Bisexual', label: 'Bisexual', description: 'Attracted to people of more than one gender' },
  { id: 'Asexual', label: 'Asexual', description: 'May not experience sexual attraction' },
  { id: 'Demisexual', label: 'Demisexual', description: 'Needs strong emotional connection first' },
  { id: 'Pansexual', label: 'Pansexual', description: 'Attracted to people regardless of gender' },
  { id: 'Queer', label: 'Queer', description: 'An umbrella term for non-heterosexual orientations' },
  { id: 'Bicurious', label: 'Bicurious', description: '' },
  { id: 'Aromantic', label: 'Aromantic', description: 'Does not experience romantic attraction' },
];

export const EditOrientationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentOrientation, currentShowOrientation } = route.params || {};

  const [selected, setSelected] = useState<string[]>(currentOrientation || []);
  const [showOrientation, setShowOrientation] = useState(currentShowOrientation ?? true);
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    } else {
      Alert.alert('Limit', 'You can select up to 3 orientations.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/profile', { orientation: selected, showOrientation });
      if (response.data?.success) dispatch(updateUser(response.data.data));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <EditScreenHeader 
        title="Orientation" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        hasUnsavedChanges={
          selected.length !== (currentOrientation || []).length || 
          selected.some(i => !(currentOrientation || []).includes(i)) ||
          showOrientation !== (currentShowOrientation ?? true)
        }
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Sexual orientation</Text>
          <Text style={styles.subtitle}>Select up to 3 that describe you.</Text>

          {orientationOptions.map((opt) => (
            <TouchableOpacity key={opt.id} style={[styles.card, selected.includes(opt.id) && styles.cardSelected]} onPress={() => toggle(opt.id)} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <Text style={[styles.label, selected.includes(opt.id) && { color: '#FFF' }]}>{opt.label}</Text>
                {selected.includes(opt.id) && <MaterialCommunityIcons name="check" size={24} color="#F94E27" />}
              </View>
              {opt.description ? <Text style={styles.description}>{opt.description}</Text> : null}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.visibilityToggle} onPress={() => setShowOrientation(!showOrientation)} activeOpacity={0.7}>
            <View style={[styles.checkbox, showOrientation && styles.checkboxSelected]}>
              {showOrientation && <MaterialCommunityIcons name="check" size={18} color="#FFF" />}
            </View>
            <Text style={styles.visibilityText}>Show sexual orientation on profile</Text>
          </TouchableOpacity>
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
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  cardSelected: { borderColor: '#F94E27', backgroundColor: 'rgba(255,255,255,0.08)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  description: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  visibilityToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, marginTop: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxSelected: { backgroundColor: '#F94E27', borderColor: '#F94E27' },
  visibilityText: { fontSize: 16, color: '#FFF', fontWeight: '600' },
});
