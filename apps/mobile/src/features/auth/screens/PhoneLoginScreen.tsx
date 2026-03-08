import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnimatedBlurBackground } from '../../../components/ui/AnimatedBlurBackground';
import { colors } from '../../../core/theme/colors';
import { api } from '../../../services/api';

export const PhoneLoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation<any>();

  const isValid = /^\d{10}$/.test(phoneNumber.trim());

  // Animations
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(30)).current;
  
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const slideAnim2 = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim1, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.spring(slideAnim1, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim2, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim2, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleSendOTP = useCallback(async () => {
    if (!isValid) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);

    const fullPhone = `+91${phoneNumber.trim()}`;

    try {
      await api.post('/auth/send-phone-otp', { phone: fullPhone });
      setLoading(false);
      navigation.navigate('PhoneOTPVerification', { phone: fullPhone });
    } catch (err: any) {
      setLoading(false);
      const msg = err.response?.data?.message || 'Failed to send code.';
      setError(msg);
    }
  }, [phoneNumber, isValid, navigation]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <AnimatedBlurBackground />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        <View style={styles.contentContainer}>
          
            <Animated.View 
              style={[
                styles.formHeaderArea,
                { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }
              ]}
            >
              <Text style={styles.formTitle}>
                <Text style={[styles.serifItalic, { fontSize: 44 }]}>Welcome </Text>
                <Text style={[styles.sansText, { fontSize: 36 }]}>Back</Text>
              </Text>
              <Text style={styles.formSubtext}>
                Sign in with your phone number to continue.
              </Text>
            </Animated.View>

          <Animated.View 
            style={[
              styles.bottomArea,
              { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }
            ]}
          >
            {/* The completely redesigned Phone Form (Dark Glass Pills) */}
            <View style={styles.formContainer}>
              
              <View style={styles.newInputGroup}>
                <Text style={styles.newInputLabel}>Phone Number</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCodePill}>
                    <Text style={styles.flag}>🇮🇳</Text>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.newInputPill}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={phoneNumber}
                    onChangeText={(text) => {
                      setPhoneNumber(text.replace(/[^0-9]/g, '').slice(0, 10));
                      if (error) setError('');
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    returnKeyType="go"
                    onSubmitEditing={handleSendOTP}
                  />
                </View>
                
                {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                  <Text style={styles.domainHint}>{10 - phoneNumber.length} more digits needed</Text>
                )}
              </View>

              {error ? <Text style={styles.newErrorText}>{error}</Text> : null}

              {/* Redesigned Primary Call to Action */}
              <TouchableOpacity
                style={[
                  styles.newLoginBtn,
                  !isValid && styles.newLoginBtnDisabled,
                  isValid && styles.newLoginBtnActive,
                ]}
                onPress={handleSendOTP}
                disabled={!isValid || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <Text style={styles.newLoginBtnText}>Sending OTP...</Text>
                ) : (
                  <>
                    <Text style={styles.newLoginBtnText}>Send Verify Code</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color={isValid ? "#FFF" : "rgba(255,255,255,0.5)"} style={styles.btnIconRedesigned} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center', // Center it like the email form
    paddingHorizontal: 32, // Tighter horizontal margins
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 60,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // High padding to clear keyboard
  },
  
  // Header Typography
  formHeaderArea: {
    marginBottom: 40,
    alignItems: 'flex-start',
    width: '100%',
  },
  backButton: {
    marginBottom: 16,
    marginLeft: -8,
    padding: 8,
  },
  formTitle: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Prevent text cutoff
    color: '#FFF',
  },
  serifItalic: {
    fontFamily: 'PlayfairDisplay_400Regular_Italic', 
  },
  sansText: {
    fontFamily: 'Inter_700Bold', 
    letterSpacing: -1.5,
  },
  formSubtext: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    paddingRight: 32, // Keep line length readable
  },

  // Bottom Area & Forms
  bottomArea: {
    width: '100%',
  },
  formContainer: {
    width: '100%',
  },
  newInputGroup: {
    marginBottom: 20,
  },
  newInputLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    backgroundColor: 'rgba(50,50,50,0.5)', // Darker, more solid glass
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)', // Slightly stronger border
    borderRadius: 30, // Pill shape request
    paddingLeft: 16,
    paddingRight: 16,
    gap: 6,
  },
  flag: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  newInputPill: {
    flex: 1,
    height: 60,
    backgroundColor: 'rgba(50,50,50,0.5)', // Darker, more solid glass
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)', // Slightly stronger border
    borderRadius: 30, // Maintains the pill shape request
    paddingHorizontal: 24,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
    letterSpacing: 1,
  },
  domainHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginLeft: 16,
    marginTop: 6,
    fontWeight: '500',
  },
  newErrorText: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  
  // Buttons
  newLoginBtn: {
    width: '100%',
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.1)', // Default transparent red before valid
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  newLoginBtnActive: {
    backgroundColor: '#E84A3B',
    shadowColor: '#E84A3B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20, // Huge glow
    elevation: 12,
  },
  newLoginBtnDisabled: {
    opacity: 0.6,
  },
  newLoginBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnIconRedesigned: {
    marginLeft: 8,
    opacity: 0.9,
  },
});
