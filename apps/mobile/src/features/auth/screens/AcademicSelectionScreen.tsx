import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const COURSE_DATA = [
  {
    title: "Undergraduate (B.Tech)",
    courses: [
      "Computer Science & Engineering (CSE)",
      "CSE (AI & ML)",
      "CSE (IoT & Cyber Security)",
      "CSE (Internet of Things)",
      "Computer Science & Business Systems",
      "Information Technology (IT)",
      "Electronics & Communication Engineering (ECE)",
      "Electrical Engineering (EE)",
      "Electrical & Electronics Engineering (EEE)",
      "Mechanical Engineering (ME)",
      "Biotechnology",
    ],
  },
  {
    title: "Other Undergraduate",
    courses: [
      "BBA (3 years)",
      "BCA (3 years)",
      "BBA LLB (Hons) (5 years)",
      "Bachelor of Hotel Management (BHMCT)",
      "B.Sc in Hospitality & Hotel Admin",
    ],
  },
  {
    title: "Postgraduate",
    courses: [
      "MBA / General Management",
      "MCA",
      "M.Tech in CSE",
      "M.Tech in ECE",
      "M.Tech in CSBS",
    ],
  },
];

export const AcademicSelectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, token, ...profileData } = route.params || {};

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedDegree, setSelectedDegree] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    if (!selectedCourse || !selectedYear) return;
    
    navigation.navigate("BatchSelection", {
      ...route.params,
      degree: selectedDegree,
      department: selectedCourse,
      year: selectedYear,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.navigate("CollegeSelection")}>
            <MaterialCommunityIcons name="arrow-left" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>What do you study?</Text>
            <Text style={styles.subtitle}>
              This helps us find people with similar academic vibes or complementary goals.
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.optionsContainer}>
            {COURSE_DATA.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.courses.map((course) => (
                  <TouchableOpacity
                    key={course}
                    style={[
                      styles.courseItem,
                      selectedCourse === course && styles.courseItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCourse(course);
                      setSelectedDegree(section.title);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.courseText,
                      selectedCourse === course && styles.courseTextSelected
                    ]}>
                      {course}
                    </Text>
                    <View style={[styles.radioButton, selectedCourse === course && styles.radioButtonSelected]}>
                      {selectedCourse === course && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>

          {/* Year Selection Section placed below the course list/scroll view */}
          {selectedCourse && (
            <Animated.View style={{ marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Year of Study</Text>
              <View style={styles.yearGrid}>
                {[1, 2, 3, 4].map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearPill,
                      selectedYear === year && styles.yearPillSelected
                    ]}
                    onPress={() => setSelectedYear(year)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.yearText,
                      selectedYear === year && styles.yearTextSelected
                    ]}>
                      {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} YR
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.nextButton, (!selectedCourse || !selectedYear) && styles.disabledNextButton]}
              onPress={handleNext}
              disabled={!selectedCourse || !selectedYear}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1115",
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 25,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 24,
  },
  optionsContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F94E27",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 15,
  },
  courseItem: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  courseItemSelected: {
    // optional
  },
  courseText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    flex: 1,
    marginRight: 10,
  },
  courseTextSelected: {
    color: "#FFF",
    fontWeight: "700",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#F94E27',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F94E27',
  },
  footer: {
    paddingVertical: 15,
  },
  nextButton: {
    backgroundColor: '#FFF',
    width: '100%',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  disabledNextButton: {
    opacity: 0.5,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  yearPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  yearPillSelected: {
    borderColor: '#F94E27',
    backgroundColor: 'rgba(249, 78, 39, 0.15)',
  },
  yearText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 14,
  },
  yearTextSelected: {
    color: '#FFF',
  },
});
