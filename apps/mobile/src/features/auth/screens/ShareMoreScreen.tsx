import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  TextInput,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { setCredentials, updateUser } from "../../../store/authSlice";
import { api } from "../../../services/api";

export const ShareMoreScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { user, token } = route.params || {};

  const [bio, setBio] = useState("");
  const [updating, setUpdating] = useState(false);
  const [isBioActive, setIsBioActive] = useState(false);

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

  const handleSave = async () => {
    if (!bio.trim()) return;

    setUpdating(true);
    try {
      const {
        campus,
        isHosteller,
        clubs,
        attendanceMood,
        hangoutSpots,
        orientation,
        showOrientation,
        distancePreference,
        seeking,
        department,
        degree,
        year,
        yearOfStudy
      } = route.params || {};

      const finalData: any = {
        preferences: {
          ...user?.preferences,
          bio: bio.trim(),
        },
      };

      if (campus !== undefined) finalData.campus = campus;
      if (isHosteller !== undefined) finalData.isHosteller = isHosteller;
      if (clubs !== undefined) finalData.clubs = clubs;
      if (attendanceMood !== undefined) finalData.attendanceMood = attendanceMood;
      if (hangoutSpots !== undefined) finalData.hangoutSpots = hangoutSpots;
      if (orientation !== undefined) finalData.orientation = orientation;
      if (showOrientation !== undefined) finalData.showOrientation = showOrientation;
      if (distancePreference !== undefined) finalData.distancePreference = distancePreference;
      if (seeking !== undefined) finalData.seeking = seeking;
      if (department !== undefined) finalData.department = department;
      if (degree !== undefined) finalData.degree = degree;
      if (year !== undefined) finalData.year = year;
      if (yearOfStudy !== undefined) finalData.yearOfStudy = yearOfStudy;

      const response = await api.put("/profile", finalData);

      if (response.data?.success) {
        dispatch(updateUser(response.data.data));
      }
      navigation.navigate("FaceVerificationInfo");

      // RootNavigator will automatically switch to Main stack
    } catch (error) {
      console.error("Failed to save bio:", error);
      setUpdating(false);
      alert("Failed to save. Please try again.");
    }
  };

  const handleSkip = async () => {
    setUpdating(true);
    try {
      const {
        campus,
        isHosteller,
        clubs,
        attendanceMood,
        hangoutSpots,
        orientation,
        showOrientation,
        distancePreference,
        seeking,
        department,
        degree,
        year,
        yearOfStudy
      } = route.params || {};

      const hasUpdate = [campus, isHosteller, clubs, attendanceMood, hangoutSpots, orientation, showOrientation, distancePreference, seeking, department, degree, year, yearOfStudy].some(val => val !== undefined);

      if (hasUpdate) {
        const finalData: any = {};
        if (campus !== undefined) finalData.campus = campus;
        if (isHosteller !== undefined) finalData.isHosteller = isHosteller;
        if (clubs !== undefined) finalData.clubs = clubs;
        if (attendanceMood !== undefined) finalData.attendanceMood = attendanceMood;
        if (hangoutSpots !== undefined) finalData.hangoutSpots = hangoutSpots;
        if (orientation !== undefined) finalData.orientation = orientation;
        if (showOrientation !== undefined) finalData.showOrientation = showOrientation;
        if (distancePreference !== undefined) finalData.distancePreference = distancePreference;
        if (seeking !== undefined) finalData.seeking = seeking;
        if (department !== undefined) finalData.department = department;
        if (degree !== undefined) finalData.degree = degree;
        if (year !== undefined) finalData.year = year;
        if (yearOfStudy !== undefined) finalData.yearOfStudy = yearOfStudy;
        
        const response = await api.put("/profile", finalData);
        if (response.data?.success) {
          dispatch(updateUser(response.data.data));
        }
      }
    } catch (error) {
      console.error("Failed to save skipped profile items:", error);
    } finally {
      navigation.navigate("FaceVerificationInfo");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
          <View style={{ flex: 1 }}>
            <View style={styles.headerNav}>
              <TouchableOpacity onPress={() => navigation.navigate("Interests")}>
                <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <Text style={styles.title}>Share more about yourself</Text>
                <Text style={styles.subtitle}>
                  Write a bio to help your profile stand out.
                </Text>

                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => setIsBioActive(true)}
                  style={[
                    styles.bioCard,
                    isBioActive && styles.bioCardActive,
                    bio.length > 0 && styles.bioCardFilled
                  ]}
                >
                  <View style={styles.bioHeader}>
                    <Text style={styles.bioTitle}>About me</Text>
                    {!isBioActive && !bio && (
                      <View style={styles.plusCircle}>
                        <MaterialCommunityIcons name="plus" size={24} color="#000" />
                      </View>
                    )}
                  </View>
                  
                  {isBioActive ? (
                    <TextInput
                      autoFocus
                      multiline
                      style={styles.bioInput}
                      placeholder="Introduce yourself to make a strong impression."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={bio}
                      onChangeText={setBio}
                      onBlur={() => setIsBioActive(false)}
                      maxLength={500}
                    />
                  ) : (
                    <Text style={[styles.bioPreview, bio.length > 0 && styles.bioPreviewActive]}>
                      {bio || "Introduce yourself to make a strong impression."}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>

            {bio.trim().length > 0 && (
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.nextButton} 
                  onPress={handleSave}
                  disabled={updating}
                >
                  <Text style={styles.nextButtonText}>
                    {updating ? "Saving..." : "Done"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1115",
  },
  headerNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 45,
    height: Platform.OS === "ios" ? 60 : 90,
  },
  skipText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 17,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFF",
    lineHeight: 48,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 24,
    marginBottom: 40,
  },
  bioCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    borderStyle: "dotted",
    minHeight: 120,
    marginTop: 10,
  },
  bioCardActive: {
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  bioCardFilled: {
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.15)",
  },
  bioHeader: {
    marginBottom: 8,
  },
  bioTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: -10,
    top: -10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  bioInput: {
    fontSize: 16,
    color: "#FFF",
    lineHeight: 24,
    paddingTop: 0,
    minHeight: 40,
  },
  bioPreview: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 22,
  },
  bioPreviewActive: {
    color: "#FFF",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 10,
  },
  nextButton: {
    backgroundColor: "#FFF",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#0F1115",
    fontSize: 18,
    fontWeight: "700",
  },
});
