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

const collegeOptions = [
  "Institute Of Engineering and Managment,Kolkata",
  "University of Engineering and Managment,Newtown",
  "University of Engineering and Managment,Jaipur",
];

export const EditCollegeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentCollege } = route.params || {};

  const [selected, setSelected] = useState<string | null>(currentCollege || null);
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
      const response = await api.put('/profile', { college: selected });
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
        title="College" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        saveDisabled={!selected}
        hasUnsavedChanges={selected !== null && selected !== (currentCollege || null)}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.title}>If studying is your thing...</Text>
        <Text style={styles.subtitle}>This is how it'll appear on your profile.</Text>

        {collegeOptions.map((college) => (
          <TouchableOpacity
            key={college}
            style={[styles.collegeItem, selected === college && styles.collegeItemSelected]}
            onPress={() => setSelected(college)}
            activeOpacity={0.7}
          >
            <Text style={[styles.collegeText, selected === college && styles.collegeTextSelected]}>{college}</Text>
            <View style={[styles.radioButton, selected === college && styles.radioButtonSelected]}>
              {selected === college && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 24 },
  collegeItem: {
    paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  collegeItemSelected: {},
  collegeText: { fontSize: 16, color: '#FFF', flex: 1, marginRight: 10 },
  collegeTextSelected: { fontWeight: '700' },
  radioButton: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  radioButtonSelected: { borderColor: '#F94E27' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F94E27' },
});
