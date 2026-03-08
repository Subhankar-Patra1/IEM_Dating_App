import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../core/theme/colors';

const { height } = Dimensions.get('window');

interface DiscardModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DiscardModal = ({ visible, onConfirm, onCancel }: DiscardModalProps) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // RESET values to starting position before animating in
      slideAnim.setValue(height);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200, // Faster fade
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250, // Linear slide instead of spring
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150, // Fast out
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200, // Fast out
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </Pressable>

        <Animated.View
          style={[
            styles.sheetContainer,
            { 
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim 
            },
          ]}
        >
          {/* Prevent touches on the sheet from leaking to the backdrop Pressable */}
          <Pressable style={styles.sheetContent}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>Discard changes?</Text>
              <Text style={styles.message}>
                You have unsaved changes. Are you sure you want to discard them?
              </Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={onCancel}
                  style={({ pressed }) => [
                    styles.keepButton,
                    { opacity: pressed ? 0.8 : 1 }
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <LinearGradient
                    colors={['#F94E27', '#F20D80']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.keepText}>Keep Editing</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={onConfirm}
                  style={({ pressed }) => [
                    styles.discardButton,
                    { opacity: pressed ? 0.6 : 1 }
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.discardText}>Discard Changes</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#1A1618', // SOLID BACKGROUND as requested
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
  },
  sheetContent: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  keepButton: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  discardButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444', 
  },
});
