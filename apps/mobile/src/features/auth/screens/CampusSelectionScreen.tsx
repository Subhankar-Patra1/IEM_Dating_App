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

const CAMPUS_DATA = [
  { id: "Management", label: "Management House Campus", icon: "office-building" },
  { id: "Gurukul", label: "Gurukul Campus", icon: "book-open-variant" },
  { id: "Ashram", label: "Ashram Campus", icon: "domain" },
  { id: "UEM_NewTown", label: "UEM NewTown Campus", icon: "city-variant" },
  { id: "UEM_Jaipur", label: "UEM Jaipur Campus", icon: "map-marker" },
];

export const CampusSelectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, token, ...profileData } = route.params || {};

  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [isHosteller, setIsHosteller] = useState<boolean | null>(null);

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
    if (!selectedCampus || isHosteller === null) return;
    
    navigation.navigate("SocialSelection", {
      ...route.params,
      campus: selectedCampus,
      isHosteller: isHosteller,
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
          <TouchableOpacity onPress={() => navigation.navigate("BatchSelection")}>
            <MaterialCommunityIcons name="arrow-left" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Where are you located?</Text>
            <Text style={styles.subtitle}>
              This helps for quick coffee invites during breaks or matching with fellow hostellers.
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Primary Campus</Text>
            {CAMPUS_DATA.map((campus) => (
              <TouchableOpacity
                key={campus.id}
                style={[
                  styles.optionItem,
                  selectedCampus === campus.id && styles.optionItemSelected
                ]}
                onPress={() => setSelectedCampus(campus.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <MaterialCommunityIcons 
                    name={campus.icon as any} 
                    size={24} 
                    color={selectedCampus === campus.id ? "#F94E27" : "rgba(255,255,255,0.6)"} 
                  />
                  <Text style={[
                      styles.optionText,
                      selectedCampus === campus.id && styles.optionTextSelected
                  ]}>
                    {campus.label}
                  </Text>
                </View>
                {selectedCampus === campus.id && (
                  <MaterialCommunityIcons name="check-circle" size={24} color="#F94E27" />
                )}
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionLabel, { marginTop: 30 }]}>Residency</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.halfOption,
                  isHosteller === true && styles.optionItemSelected
                ]}
                onPress={() => setIsHosteller(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons 
                    name="home-city" 
                    size={28} 
                    color={isHosteller === true ? "#F94E27" : "rgba(255,255,255,0.6)"} 
                />
                <Text style={[styles.optionText, isHosteller === true && styles.optionTextSelected]}>Hosteller</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.halfOption,
                  isHosteller === false && styles.optionItemSelected
                ]}
                onPress={() => setIsHosteller(false)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons 
                    name="bus" 
                    size={28} 
                    color={isHosteller === false ? "#F94E27" : "rgba(255,255,255,0.6)"} 
                />
                <Text style={[styles.optionText, isHosteller === false && styles.optionTextSelected]}>Day Scholar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.nextButton, (!selectedCampus || isHosteller === null) && styles.disabledNextButton]}
              onPress={handleNext}
              disabled={!selectedCampus || isHosteller === null}
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
    marginBottom: 30,
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
  optionItem: {
    height: 70,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  optionItemSelected: {
    borderColor: "#F94E27",
    backgroundColor: "rgba(249, 78, 39, 0.05)",
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginLeft: 15,
  },
  optionTextSelected: {
    color: "#FFF",
    fontWeight: "700",
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfOption: {
    width: (width - 55) / 2,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
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
});
