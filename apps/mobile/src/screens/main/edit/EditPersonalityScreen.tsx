import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';

const TRAIT_SECTIONS = [
  { id: 'communication', title: "Communication style", icon: 'message-text-outline', options: [
    { id: 'whatsapp_all_day', label: 'I stay on WhatsApp all day' }, { id: 'big_time_texter', label: 'Big time texter' },
    { id: 'phone_caller', label: 'Phone caller' }, { id: 'video_chatter', label: 'Video chatter' },
    { id: 'slow_to_answer', label: "I'm slow to answer" }, { id: 'bad_texter', label: 'Bad texter' },
    { id: 'better_in_person', label: 'Better in person' },
  ]},
  { id: 'love_reception', title: 'How do you receive love?', icon: 'heart-outline', options: [
    { id: 'thoughtful_gestures', label: 'Thoughtful gestures' }, { id: 'presents', label: 'Presents' },
    { id: 'touch', label: 'Touch' }, { id: 'compliments', label: 'Compliments' }, { id: 'time_together', label: 'Time together' },
  ]},
  { id: 'education', title: 'Education level', icon: 'business-outline', options: [
    { id: 'bachelor', label: 'Bachelor degree' }, { id: 'at_uni', label: 'At uni' },
    { id: 'high_school', label: 'High school' }, { id: 'phd', label: 'PhD' },
    { id: 'graduate_programme', label: 'Graduate programme' }, { id: 'master', label: 'Master degree' },
    { id: 'trade_college', label: 'Trade college' },
  ]},
  { id: 'star_sign', title: "Star sign", icon: 'moon-waning-crescent', options: [
    { id: 'capricorn', label: 'Capricorn' }, { id: 'aquarius', label: 'Aquarius' }, { id: 'pisces', label: 'Pisces' },
    { id: 'aries', label: 'Aries' }, { id: 'taurus', label: 'Taurus' }, { id: 'gemini', label: 'Gemini' },
    { id: 'cancer', label: 'Cancer' }, { id: 'leo', label: 'Leo' }, { id: 'virgo', label: 'Virgo' },
    { id: 'libra', label: 'Libra' }, { id: 'scorpio', label: 'Scorpio' }, { id: 'sagittarius', label: 'Sagittarius' },
  ]},
  { id: 'personality', title: 'Personality', icon: 'account-outline', options: [
    { id: 'introvert', label: 'Introvert' }, { id: 'extrovert', label: 'Extrovert' },
    { id: 'ambivert', label: 'Ambivert' }, { id: 'chill', label: 'Chill' }, { id: 'energetic', label: 'Energetic' },
  ]},
];

export const EditPersonalityScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentPersonality } = route.params || {};

  const [selections, setSelections] = useState<Record<string, string>>(currentPersonality || {});
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
      const response = await api.put('/profile', { preferences: { personality: selections } });
      if (response.data?.success) dispatch(updateUser(response.data.data));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <EditScreenHeader 
        title="Personality" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        hasUnsavedChanges={Object.keys(selections).some(k => selections[k] !== (currentPersonality || {})[k]) || Object.keys(currentPersonality || {}).some(k => selections[k] !== (currentPersonality || {})[k])}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>What makes you, you?</Text>
          <Text style={styles.subtitle}>Authenticity attracts authenticity.</Text>

          {TRAIT_SECTIONS.map(section => (
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
  pill: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginRight: 8, marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  pillSelected: { borderColor: '#F94E27', backgroundColor: 'rgba(255,255,255,0.1)' },
  pillText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  pillTextSelected: { color: '#FFF' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 10 },
});
