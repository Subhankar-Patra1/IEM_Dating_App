import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Alert, Platform, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';

const HABIT_SECTIONS = [
  { id: 'drink', title: 'How often do you drink?', icon: 'glass-wine', options: [
    { id: 'not_for_me', label: 'Not for me' }, { id: 'newly_teetotal', label: 'Newly teetotal' },
    { id: 'sober_curious', label: 'Sober curious' }, { id: 'special_occasions', label: 'On special occasions' },
    { id: 'socially', label: 'Socially, at the weekend' }, { id: 'most_nights', label: 'Most nights' },
  ]},
  { id: 'smoke', title: 'How often do you smoke?', icon: 'cigar', options: [
    { id: 'social_smoker', label: 'Social smoker' }, { id: 'smoker_drinking', label: 'Smoker when drinking' },
    { id: 'non_smoker', label: 'Non-smoker' }, { id: 'smoker', label: 'Smoker' }, { id: 'trying_to_quit', label: 'Trying to quit' },
  ]},
  { id: 'exercise', title: 'Do you exercise?', icon: 'dumbbell', options: [
    { id: 'every_day', label: 'Every day' }, { id: 'often', label: 'Often' },
    { id: 'sometimes', label: 'Sometimes' }, { id: 'never', label: 'Never' },
  ]},
  { id: 'pets', title: 'Do you have any pets?', icon: 'paw', options: [
    { id: 'dog', label: 'Dog' }, { id: 'cat', label: 'Cat' }, { id: 'reptile', label: 'Reptile' },
    { id: 'bird', label: 'Bird' }, { id: 'fish', label: 'Fish' }, { id: 'love_pets', label: "Don't have, but love" },
    { id: 'other', label: 'Other' }, { id: 'turtle', label: 'Turtle' }, { id: 'hamster', label: 'Hamster' },
    { id: 'rabbit', label: 'Rabbit' }, { id: 'pet_free', label: 'Pet-free' }, { id: 'want_pet', label: 'Want a pet' },
    { id: 'allergic', label: 'Allergic to pets' },
  ]},
];

export const EditLifestyleScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentLifestyle } = route.params || {};

  const [selections, setSelections] = useState<Record<string, string>>(currentLifestyle || {});
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSelect = (sectionId: string, optionId: string) => {
    setSelections(prev => ({ ...prev, [sectionId]: optionId }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/profile', { preferences: { lifestyle: selections } });
      if (response.data?.success) dispatch(updateUser(response.data.data));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <EditScreenHeader 
        title="Lifestyle" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        hasUnsavedChanges={Object.keys(selections).some(k => selections[k] !== (currentLifestyle || {})[k]) || Object.keys(currentLifestyle || {}).some(k => selections[k] !== (currentLifestyle || {})[k])}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Lifestyle habits</Text>
          <Text style={styles.subtitle}>Do their habits match yours? You go first.</Text>

          {HABIT_SECTIONS.map(section => (
            <View key={section.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name={section.icon as any} size={20} color="rgba(255,255,255,0.6)" />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <View style={styles.optionsContainer}>
                {section.options.map(option => (
                  <TouchableOpacity key={option.id} style={[styles.pill, selections[section.id] === option.id && styles.pillSelected]} onPress={() => handleSelect(section.id, option.id)} activeOpacity={0.7}>
                    <Text style={[styles.pillText, selections[section.id] === option.id && styles.pillTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.divider} />
            </View>
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
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 30 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginLeft: 12 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  pill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginRight: 8, marginBottom: 10 },
  pillSelected: { borderColor: '#F94E27', backgroundColor: 'rgba(255,255,255,0.1)' },
  pillText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  pillTextSelected: { color: '#FFF' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 10 },
});
