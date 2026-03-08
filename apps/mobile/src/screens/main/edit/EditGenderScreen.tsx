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
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';
import { colors } from '../../../core/theme/colors';

const { width } = Dimensions.get('window');

const genderOptions = [
  { id: 'Man', label: 'Man' },
  { id: 'Woman', label: 'Woman' },
  { id: 'Beyond binary', label: 'Beyond binary' },
];

const subGenderData: Record<string, { label: string; description: string }[]> = {
  Man: [
    { label: 'Cis man', description: 'A man whose gender aligns with the sex they were assigned at birth.' },
    { label: 'Intersex man', description: "A man born with variations of sex characteristics that don't fit into the binary categorisation of male and female bodies" },
    { label: 'Trans man', description: 'A man who is transgender and whose gender is different from the sex assigned to them at birth.' },
    { label: 'Transmasculine', description: 'A person who was assigned female at birth, but presents as masculine and identifies with masculinity.' },
  ],
  Woman: [
    { label: 'Cis woman', description: 'A woman whose gender aligns with the sex they were assigned at birth.' },
    { label: 'Intersex woman', description: "A woman born with variations of sex characteristics that don't fit into the binary categorisation of male and female bodies" },
    { label: 'Trans woman', description: 'A woman who is transgender and whose gender is different from the sex assigned to them at birth.' },
    { label: 'Transfeminine', description: 'A person who was assigned male at birth, but presents as feminine and identifies with femininity.' },
  ],
  'Beyond binary': [
    { label: 'Agender', description: 'A person who does not have a gender.' },
    { label: 'Bigender', description: 'A person who has two or more genders.' },
    { label: 'Gender fluid', description: 'A person who does not have a single fixed gender.' },
    { label: 'Gender questioning', description: 'A person who is questioning their current gender.' },
    { label: 'Genderqueer', description: 'A person who does not identify within the gender binary.' },
    { label: 'Intersex', description: 'An umbrella term for people born with variations in sex characteristics.' },
    { label: 'Non-binary', description: 'A person whose gender is beyond the exclusive categories of man and woman.' },
    { label: 'Pangender', description: 'A person who experiences multiple genders.' },
    { label: 'Trans person', description: 'A person who is transgender.' },
    { label: 'Two-spirit', description: 'An umbrella term used by US Native American and Canadian First Nations communities.' },
  ],
};

export const EditGenderScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentGender, currentShowGender } = route.params || {};

  // Determine the primary gender category from the current value
  const getPrimaryGender = (val: string | null) => {
    if (!val) return null;
    if (val === 'Man' || val === 'Woman' || val === 'Beyond binary') return val;
    // Check sub-options
    for (const [key, subs] of Object.entries(subGenderData)) {
      if (subs.some((s) => s.label === val)) return key;
    }
    return null;
  };

  const [gender, setGender] = useState<string | null>(getPrimaryGender(currentGender) || null);
  const [specificGender, setSpecificGender] = useState<string | null>(
    currentGender && currentGender !== 'Man' && currentGender !== 'Woman' && currentGender !== 'Beyond binary'
      ? currentGender
      : null
  );
  const [showGender, setShowGender] = useState(currentShowGender ?? true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(!!specificGender);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const expandAnim = useRef(new Animated.Value(specificGender ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.spring(expandAnim, { toValue, friction: 8, useNativeDriver: false }).start();
  };

  useEffect(() => {
    setSpecificGender(null);
    if (expanded) {
      setExpanded(false);
      Animated.spring(expandAnim, { toValue: 0, friction: 8, useNativeDriver: false }).start();
    }
  }, [gender]);

  const handleSave = async () => {
    if (!gender) return;
    setSaving(true);
    try {
      const finalGender = specificGender || gender;
      const response = await api.put('/profile', { gender: finalGender, showGender });
      if (response.data?.success) {
        dispatch(updateUser(response.data.data));
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update gender');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <EditScreenHeader 
        title="Gender" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        saveDisabled={!gender}
        hasUnsavedChanges={(specificGender || gender) !== currentGender || showGender !== (currentShowGender ?? true)}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>My gender</Text>
          <Text style={styles.subtitle}>Select all that describe you to help us show your profile to the right people.</Text>

          {genderOptions.map((option) => (
            <View key={option.id}>
              <TouchableOpacity
                style={[styles.genderOption, gender === option.id && styles.genderOptionSelected]}
                onPress={() => setGender(option.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.primaryGenderText, gender === option.id && styles.primaryGenderTextSelected]}>{option.label}</Text>
                {gender === option.id && <MaterialCommunityIcons name="check" size={24} color="#F94E27" />}
              </TouchableOpacity>

              {gender === option.id && (
                <View style={styles.subContainer}>
                  <TouchableOpacity style={styles.moreOptionsHeader} onPress={toggleExpand} activeOpacity={0.7}>
                    <Text style={styles.moreOptionsText}>Add more about your gender (optional)</Text>
                    <Animated.View style={{ transform: [{ rotate: expandAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
                      <MaterialCommunityIcons name="chevron-down" size={24} color="#FFF" />
                    </Animated.View>
                  </TouchableOpacity>
                  <Animated.View style={{ maxHeight: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1200] }), opacity: expandAnim, overflow: 'hidden' }}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: gender === 'Beyond binary' ? 500 : 400 }} contentContainerStyle={{ paddingHorizontal: 8 }} indicatorStyle="white">
                      {subGenderData[option.id]?.map((sub) => (
                        <TouchableOpacity
                          key={sub.label}
                          style={[styles.subOptionCard, specificGender === sub.label && styles.subOptionCardSelected]}
                          onPress={() => setSpecificGender(specificGender === sub.label ? null : sub.label)}
                        >
                          <Text style={[styles.subOptionLabel, specificGender === sub.label && { color: '#FFF' }]}>{sub.label}</Text>
                          <Text style={styles.subOptionDescription}>{sub.description}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Animated.View>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.visibilityToggle} onPress={() => setShowGender(!showGender)} activeOpacity={0.7}>
            <Text style={styles.visibilityToggleText}>Show my gender on my profile</Text>
            <View style={[styles.checkbox, showGender && styles.checkboxSelected]}>
              {showGender && <MaterialCommunityIcons name="check" size={18} color="#FFF" />}
            </View>
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
  genderOption: {
    height: 60, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12,
  },
  genderOptionSelected: { borderColor: '#F94E27' },
  primaryGenderText: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  primaryGenderTextSelected: { color: '#FFF' },
  subContainer: { backgroundColor: '#000', borderRadius: 12, padding: 10, marginBottom: 12 },
  moreOptionsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 10 },
  moreOptionsText: { fontSize: 16, color: '#FFF', fontWeight: '600', flex: 1 },
  subOptionCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  subOptionCardSelected: { borderColor: '#454D59', backgroundColor: 'rgba(255,255,255,0.1)' },
  subOptionLabel: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 6 },
  subOptionDescription: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  visibilityToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, marginTop: 20 },
  visibilityToggleText: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#F94E27', borderColor: '#F94E27' },
});
