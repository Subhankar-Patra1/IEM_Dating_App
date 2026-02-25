import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../../../components/ui/GradientButton';
import { colors } from '../../../core/theme/colors';
import { typography } from '../../../core/theme/typography';
import { useDispatch } from 'react-redux';
import { api } from '../../../services/api';
import { setCredentials } from '../../../store/authSlice';

export const LoginScreen = () => {
  const [emailPrefix, setEmailPrefix] = useState('');
  const domain = '@iem.edu.in';

  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      const email = `${emailPrefix.trim().toLowerCase()}${domain}`;
      const response = await api.post('/auth/login', { 
        email, 
        password: 'password123' 
      });
      
      dispatch(setCredentials({ 
        user: response.data.data.user, 
        token: response.data.data.accessToken 
      }));
    } catch (error) {
      console.error('Login Error:', error);
      alert('Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#ffffff', '#f0f4ff']} 
      style={styles.container}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>IEM Connect</Text>
            <Text style={styles.subtitle}>Find your match on campus.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>College Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="your.name.year"
                placeholderTextColor={colors.text.secondary}
                value={emailPrefix}
                onChangeText={setEmailPrefix}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              <View style={styles.domainBadge}>
                <Text style={styles.domainText}>{domain}</Text>
              </View>
            </View>

            <GradientButton 
              title="Continue" 
              onPress={handleSendOTP} 
              disabled={emailPrefix.length < 3}
              loading={loading}
              style={styles.button}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
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
    padding: 24,
    justifyContent: 'center',
  },
  header: { 
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingRight: 8,
    overflow: 'hidden',
  },
  input: { 
    flex: 1, 
    padding: 16, 
    fontSize: 16, 
    color: colors.text.primary,
  },
  domainBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  domainText: { 
    color: colors.text.secondary, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  button: { 
    marginTop: 32 
  },
});
