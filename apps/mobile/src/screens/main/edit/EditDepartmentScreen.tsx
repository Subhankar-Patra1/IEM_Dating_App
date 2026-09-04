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
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';

const COURSE_DATA = [
  {
    title: "Undergraduate (B.Tech)",
    courses: [
      "Computer Science & Engineering (CSE)", "CSE (AI & ML)", "CSE (IoT & Cyber Security)",
      "CSE (Internet of Things)", "Computer Science & Business Systems", "Information Technology (IT)",
      "Electronics & Communication Engineering (ECE)", "Electrical Engineering (EE)",
      "Electrical & Electronics Engineering (EEE)", "Mechanical Engineering (ME)", "Biotechnology",
    ],
  },
  {
    title: "Other Undergraduate",
    courses: [
      "BBA (3 years)", "BCA (3 years)", "BBA LLB (Hons) (5 years)",
      "Bachelor of Hotel Management (BHMCT)", "B.Sc in Hospitality & Hotel Admin",
    ],
  },
  {
    title: "Postgraduate",
    courses: [
      "MBA / General Management", "MCA", "M.Tech in CSE", "M.Tech in ECE", "M.Tech in CSBS",
    ],
  },
];

export const EditDepartmentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentDepartment, currentYearOfStudy } = route.params || {};

  const [selectedCourse, setSelectedCourse] = useState<string | null>(currentDepartment || null);
  const [selectedYearOfStudy, setSelectedYearOfStudy] = useState<number | null>(currentYearOfStudy ? parseInt(currentYearOfStudy) : null);
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
    if (!selectedCourse) return;
    setSaving(true);
    try {
      const data: any = { department: selectedCourse };
      if (selectedYearOfStudy) data.yearOfStudy = selectedYearOfStudy;
      const response = await api.put('/profile', data);
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
        title="Department" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        saveDisabled={!selectedCourse}
        hasUnsavedChanges={
          (selectedCourse !== null && selectedCourse !== (currentDepartment || null)) ||
          (selectedYearOfStudy !== null && selectedYearOfStudy !== (currentYearOfStudy ? parseInt(currentYearOfStudy) : null))
        }
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>What do you study?</Text>
          <Text style={styles.subtitle}>This helps us find people with similar academic vibes.</Text>

          {COURSE_DATA.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.courses.map((course) => (
                <TouchableOpacity
                  key={course}
                  style={[styles.courseItem, selectedCourse === course && styles.courseItemSelected]}
                  onPress={() => setSelectedCourse(course)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.courseText, selectedCourse === course && styles.courseTextSelected]}>{course}</Text>
                  <View style={[styles.radioButton, selectedCourse === course && styles.radioButtonSelected]}>
                    {selectedCourse === course && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {selectedCourse && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Year of Study</Text>
              <View style={styles.yearGrid}>
                {[1, 2, 3, 4].map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[styles.yearPill, selectedYearOfStudy === year && styles.yearPillSelected]}
                    onPress={() => setSelectedYearOfStudy(year)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.yearText, selectedYearOfStudy === year && styles.yearTextSelected]}>
                      {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} YR
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 22, marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#F94E27', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  courseItem: {
    paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  courseItemSelected: {},
  courseText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', flex: 1, marginRight: 10 },
  courseTextSelected: { color: '#FFF', fontWeight: '700' },
  radioButton: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  radioButtonSelected: { borderColor: '#F94E27' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F94E27' },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  yearPill: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)',
  },
  yearPillSelected: { borderColor: '#F94E27', backgroundColor: 'rgba(249, 78, 39, 0.15)' },
  yearText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 14 },
  yearTextSelected: { color: '#FFF' },
});
