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
  TextInput,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "../../../services/api";

const { width } = Dimensions.get("window");

const CLUBS = ["Robotics", "Tech/Coding", "Music/Band", "Dance", "Drama", "Sports", "Photography", "Debate"];
const ATTENDANCE_STYLES = ["75% Maintainer", "Front Bencher", "Bunker", "Risk Taker"];

export const SocialSelectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, token, ...profileData } = route.params || {};

  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [attendanceMood, setAttendanceMood] = useState<string | null>(null);
  const [hangoutSpot, setHangoutSpot] = useState("");
  const [updating, setUpdating] = useState(false);

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

  const toggleClub = (club: string) => {
    if (selectedClubs.includes(club)) {
      setSelectedClubs(selectedClubs.filter(c => c !== club));
    } else if (selectedClubs.length < 5) {
      setSelectedClubs([...selectedClubs, club]);
    }
  };

  const handleNext = async () => {
    if (!attendanceMood) return;
    
    setUpdating(true);
    try {
      const finalData = {
        ...profileData,
        clubs: selectedClubs,
        attendanceMood: attendanceMood,
        hangoutSpots: hangoutSpot ? [hangoutSpot] : [],
      };

      // In a real app, we might wait until the very end to save, 
      // but here we follow the pattern of saving incrementally or passing state.
      // Since the original flow saves at CollegeSelection, we'll follow that pattern 
      // of passing data to the final registration step.
      
      navigation.navigate("OrientationSelection", {
        ...route.params,
        ...finalData
      });
    } catch (error) {
      console.error("Failed to process social selection:", error);
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.navigate("CampusSelection")}>
            <MaterialCommunityIcons name="arrow-left" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Social & Vibes</Text>
              <Text style={styles.subtitle}>
                Relatable IEM things to start the conversation.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>IEM Clubs (Max 5)</Text>
            <View style={styles.chipsContainer}>
              {CLUBS.map((club) => (
                <TouchableOpacity
                  key={club}
                  style={[
                    styles.chip,
                    selectedClubs.includes(club) && styles.chipSelected
                  ]}
                  onPress={() => toggleClub(club)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedClubs.includes(club) && styles.chipTextSelected]}>
                    {club}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 25 }]}>Attendance Style</Text>
            <View style={styles.attendanceContainer}>
              {ATTENDANCE_STYLES.map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.styleOption,
                    attendanceMood === style && styles.styleOptionSelected
                  ]}
                  onPress={() => setAttendanceMood(style)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.styleText, attendanceMood === style && styles.styleTextSelected]}>
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 25 }]}>Favorite Sector V Spot</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chai stall near RDB, Cafe coffee day..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={hangoutSpot}
                onChangeText={setHangoutSpot}
              />
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.nextButton, (!attendanceMood || updating) && styles.disabledNextButton]}
              onPress={handleNext}
              disabled={!attendanceMood || updating}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {updating ? "Processing..." : "Next"}
              </Text>
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F94E27",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 15,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    margin: 5,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  chipSelected: {
    borderColor: "#F94E27",
    backgroundColor: "rgba(249, 78, 39, 0.15)",
  },
  chipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#FFF",
  },
  attendanceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  styleOption: {
    width: (width - 55) / 2,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: 'center',
    marginBottom: 10,
  },
  styleOptionSelected: {
    borderColor: "#F94E27",
    backgroundColor: "rgba(249, 78, 39, 0.1)",
  },
  styleText: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  styleTextSelected: {
    color: "#FFF",
    fontWeight: "800",
  },
  inputContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 15,
  },
  input: {
    height: 56,
    color: "#FFF",
    fontSize: 16,
  },
  footer: {
    paddingVertical: 10,
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
});
