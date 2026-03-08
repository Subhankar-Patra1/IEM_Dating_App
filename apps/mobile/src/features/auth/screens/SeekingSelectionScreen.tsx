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
import { useDispatch } from "react-redux";
import { setCredentials } from "../../../store/authSlice";
import { api } from "../../../services/api";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 3;

export const SeekingSelectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { user, token, ...profileData } = route.params || {};

  const [selectedSeeking, setSelectedSeeking] = useState<string | null>(null);
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

  const seekingOptions = [
    { id: 'Long-term partner', title: 'Long-term partner', emoji: '💘' },
    { id: 'Long-term, but short-term OK', title: 'Long-term, but short-term OK', emoji: '😍' },
    { id: 'Short-term, but long-term OK', title: 'Short-term, but long-term OK', emoji: '🥂' },
    { id: 'Short-term fun', title: 'Short-term fun', emoji: '🎉' },
    { id: 'New friends', title: 'New friends', emoji: '👋' },
    { id: 'Still figuring it out', title: 'Still figuring it out', emoji: '🤔' },
  ];

  const handleNext = () => {
    navigation.navigate("LifestyleHabits", {
      ...route.params,
      seeking: selectedSeeking
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
          <TouchableOpacity onPress={() => navigation.navigate("DistancePreference")}>
            <MaterialCommunityIcons name="arrow-left" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>What are you looking for?</Text>
            <Text style={styles.subtitle}>
              All good if it changes. There's something for everyone.
            </Text>
          </View>

          <View style={styles.gridContainer}>
            {seekingOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedSeeking === option.id && styles.optionCardSelected
                ]}
                onPress={() => setSelectedSeeking(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{option.emoji}</Text>
                <Text style={styles.optionTitle}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.nextButton, (!selectedSeeking || updating) && styles.disabledNextButton]}
              onPress={handleNext}
              disabled={!selectedSeeking || updating}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {updating ? "Saving..." : "Next"}
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
    marginBottom: 30,
    marginTop: 10,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionCard: {
    width: CARD_WIDTH,
    aspectRatio: 0.85,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionCardSelected: {
    borderColor: '#F94E27',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emojiText: {
    fontSize: 36,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
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
