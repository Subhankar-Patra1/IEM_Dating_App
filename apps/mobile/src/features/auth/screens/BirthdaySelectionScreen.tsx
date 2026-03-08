import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../../store/authSlice";
import { api } from "../../../services/api";

const { width } = Dimensions.get("window");

export const BirthdaySelectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { user, token, name } = route.params || {};

  // Date stored as separate strings for the digits
  const [day, setDay] = useState(["", ""]);
  const [month, setMonth] = useState(["", ""]);
  const [year, setYear] = useState(["", "", "", ""]);
  
  const [updating, setUpdating] = useState(false);

  // Refs for auto-focusing next input
  const dayRefs = useRef<Array<TextInput | null>>([]);
  const monthRefs = useRef<Array<TextInput | null>>([]);
  const yearRefs = useRef<Array<TextInput | null>>([]);

  // Animations
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

  const isValidRealDate = (d: string, m: string, y: string) => {
    const dayVal = parseInt(d);
    const monthVal = parseInt(m);
    const yearVal = parseInt(y);

    if (isNaN(dayVal) || isNaN(monthVal) || isNaN(yearVal)) return false;
    if (monthVal < 1 || monthVal > 12) return false;
    
    const currentYear = new Date().getFullYear();
    if (yearVal < 1920 || yearVal > currentYear) return false;

    const lastDayOfMonth = new Date(yearVal, monthVal, 0).getDate();
    if (dayVal < 1 || dayVal > lastDayOfMonth) return false;

    return true;
  };

  const calculateAge = (d: string, m: string, y: string) => {
    const birthDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleNext = async () => {
    const d = day.join("");
    const m = month.join("");
    const y = year.join("");

    if (d.length < 2 || m.length < 2 || y.length < 4) return;
    
    const calculatedAge = calculateAge(d, m, y);
    if (calculatedAge < 18) {
      alert("You must be 18 or older to join.");
      return;
    }

    navigation.navigate("GenderSelection", {
      user,
      token,
      name,
      birthday: `${y}-${m}-${d}T00:00:00.000Z`,
      age: calculatedAge
    });
  };

  const handleKeyPress = (e: any, index: number, type: 'day' | 'month' | 'year') => {
    if (e.nativeEvent.key === 'Backspace') {
      if (type === 'day' && index > 0 && !day[index]) {
        dayRefs.current[index - 1]?.focus();
      } else if (type === 'month') {
        if (index > 0 && !month[index]) monthRefs.current[index - 1]?.focus();
        else if (index === 0 && !month[index]) dayRefs.current[1]?.focus();
      } else if (type === 'year') {
        if (index > 0 && !year[index]) yearRefs.current[index - 1]?.focus();
        else if (index === 0 && !year[index]) monthRefs.current[1]?.focus();
      }
    }
  };

  const updateDigit = (val: string, index: number, type: 'day' | 'month' | 'year') => {
    const digit = val.replace(/[^0-9]/g, "");
    if (!digit && val !== "") return;

    if (type === 'day') {
      if (index === 0 && parseInt(digit) > 3) return; // Day 1st digit can't be > 3
      const newDay = [...day];
      newDay[index] = digit;
      setDay(newDay);
      if (digit && index < 1) dayRefs.current[index + 1]?.focus();
      else if (digit && index === 1) monthRefs.current[0]?.focus();
    } else if (type === 'month') {
      if (index === 0 && parseInt(digit) > 1) return; // Month 1st digit can't be > 1
      const newMonth = [...month];
      newMonth[index] = digit;
      setMonth(newMonth);
      if (digit && index < 1) monthRefs.current[index + 1]?.focus();
      else if (digit && index === 1) yearRefs.current[0]?.focus();
    } else {
      if (index === 0 && parseInt(digit) > 2) return; // Year 1st digit reasonable check
      const newYear = [...year];
      newYear[index] = digit;
      setYear(newYear);
      if (digit && index < 3) yearRefs.current[index + 1]?.focus();
    }
  };

  const isValidDate = day.join("").length === 2 && 
                      month.join("").length === 2 && 
                      year.join("").length === 4 && 
                      isValidRealDate(day.join(""), month.join(""), year.join(""));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -20 : 0}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate("NameSelection")}
        >
          <MaterialCommunityIcons name="arrow-left" size={32} color="#FFF" />
        </TouchableOpacity>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Your b-day?</Text>
          
          <View style={styles.dateInputContainer}>
            {/* Day */}
            {day.map((d, i) => (
              <TextInput
                key={`day-${i}`}
                ref={r => { dayRefs.current[i] = r; }}
                style={styles.digitInput}
                keyboardType="number-pad"
                maxLength={1}
                value={d}
                 onChangeText={v => updateDigit(v, i, 'day')}
                onKeyPress={e => handleKeyPress(e, i, 'day')}
                placeholder="D"
                placeholderTextColor="rgba(255,255,255,0.2)"
                selectionColor="#FFF"
              />
            ))}
            
            <Text style={styles.separator}>/</Text>

            {/* Month */}
            {month.map((m, i) => (
              <TextInput
                key={`month-${i}`}
                ref={r => { monthRefs.current[i] = r; }}
                style={styles.digitInput}
                keyboardType="number-pad"
                maxLength={1}
                value={m}
                 onChangeText={v => updateDigit(v, i, 'month')}
                onKeyPress={e => handleKeyPress(e, i, 'month')}
                placeholder="M"
                placeholderTextColor="rgba(255,255,255,0.2)"
                selectionColor="#FFF"
              />
            ))}

            <Text style={styles.separator}>/</Text>

            {/* Year */}
            {year.map((y, i) => (
              <TextInput
                key={`year-${i}`}
                ref={r => { yearRefs.current[i] = r; }}
                style={styles.digitInput}
                keyboardType="number-pad"
                maxLength={1}
                value={y}
                 onChangeText={v => updateDigit(v, i, 'year')}
                onKeyPress={e => handleKeyPress(e, i, 'year')}
                placeholder="Y"
                placeholderTextColor="rgba(255,255,255,0.2)"
                selectionColor="#FFF"
              />
            ))}
          </View>
          
           <Text style={styles.note}>
            Your profile shows your age, not your date of birth.
          </Text>
          <Text style={styles.requirementText}>
            * You must be at least 18 years old to join
          </Text>
          {isValidDate && (
            <Text style={styles.ageDisplay}>
              Age: {calculateAge(day.join(""), month.join(""), year.join(""))}
            </Text>
          )}
        </Animated.View>

        <TouchableOpacity 
          style={[styles.nextButton, (!isValidDate || updating) && styles.disabledButton]}
          onPress={handleNext}
          disabled={!isValidDate || updating}
        >
          <Text style={styles.nextButtonText}>
            {updating ? "Saving..." : "Next"}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 40,
    marginTop: 10,
    marginLeft: -8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFF",
    lineHeight: 50,
    marginBottom: 40,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  digitInput: {
    fontSize: 26,
    color: "#FFF",
    fontWeight: "600",
    width: 34,
    height: 50,
    textAlign: "center",
    marginHorizontal: 0,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255,255,255,0.5)",
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  separator: {
    fontSize: 24,
    color: "rgba(255,255,255,0.3)",
    marginHorizontal: 4,
    marginTop: 0,
  },
  note: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
    textAlign: "center",
  },
  requirementText: {
    fontSize: 13,
    color: "#F94E27", 
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
  },
  ageDisplay: {
    fontSize: 20,
    color: "#FFF",
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignSelf: "center",
  },
  nextButton: {
    backgroundColor: "#FFF",
    paddingVertical: 18,
    borderRadius: 35,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  modalContent: {
    backgroundColor: "#1C1C1E",
    width: "100%",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
  },
  handEmoji: {
    fontSize: 50,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  modalPrimaryButton: {
    backgroundColor: "#FFF",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 15,
  },
  modalPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  modalSecondaryButton: {
    paddingVertical: 10,
  },
  modalSecondaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
