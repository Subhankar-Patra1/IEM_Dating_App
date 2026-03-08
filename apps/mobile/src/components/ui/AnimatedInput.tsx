import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TextInputProps,
} from 'react-native';
import { colors } from '../../core/theme/colors';

interface AnimatedInputProps extends TextInputProps {
  label: string;
  domainSuffix?: string;
  isValid?: boolean;
  errorMessage?: string;
  containerStyle?: any;
  inputStyle?: any;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  domainSuffix,
  isValid,
  errorMessage,
  value,
  onFocus,
  onBlur,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  useEffect(() => {
    if (isValid) {
      Animated.spring(checkAnim, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();
    } else {
      checkAnim.setValue(0);
    }
  }, [isValid]);

  useEffect(() => {
    if (errorMessage) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [errorMessage]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isValid ? colors.success : 'rgba(255, 255, 255, 0.1)',
      isValid ? colors.success : '#B026FF', // Neon Purple focus
    ],
  });

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateX: shakeAnim }] }]}>
      <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.inputContainerFocused,
          containerStyle,
        ]}
      >
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          placeholderTextColor="rgba(255, 255, 255, 0.25)" // Softer placeholder
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {domainSuffix && (
          <View style={styles.domainBadge}>
            <Text style={styles.domainText}>{domainSuffix}</Text>
          </View>
        )}
        {isValid && (
          <Animated.View
            style={[
              styles.checkContainer,
              {
                opacity: checkAnim,
                transform: [{ scale: checkAnim }],
              },
            ]}
          >
            <Text style={styles.checkIcon}>✓</Text>
          </Animated.View>
        )}
      </Animated.View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  labelFocused: {
    color: '#B026FF', // Neon Purple
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14, // Slightly sharper corners for premium look
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingRight: 8,
    height: 56,
    overflow: 'hidden',
  },
  inputContainerFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#B026FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: '100%',
    fontSize: 15, // Slightly smaller
    color: '#FFFFFF',
    fontWeight: '500',
  },
  domainBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8, // Sharper
  },
  domainText: {
    color: '#A0A0A0', // Muted silver
    fontSize: 13,
    fontWeight: '600',
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});
