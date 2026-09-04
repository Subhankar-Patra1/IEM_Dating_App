import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProfileMediaGallery } from './ProfileMediaGallery';
import { ProfileBasicInfo } from './ProfileBasicInfo';
import { ProfileAbout } from './ProfileAbout';
import { ProfileVibes } from './ProfileVibes';
import { ProfileInterests } from './ProfileInterests';
import { ProfilePersonality } from './ProfilePersonality';
import { ProfileCompatibility } from './ProfileCompatibility';
import { ProfileVerification } from './ProfileVerification';

const AnimatedSection = ({ children, anim }: { children: React.ReactNode, anim: Animated.Value }) => (
  <Animated.View style={{
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
  }}>
    {children}
  </Animated.View>
);

// ─── Apple Liquid Glass Button ───────────────────────────────────────────────
interface GlassButtonProps {
  onPress: () => void;
  iconName: string;
  iconSize?: number;
  tintColor?: string; // Optional warm tint (e.g. share button)
}

const GlassButton: React.FC<GlassButtonProps> = ({
  onPress,
  iconName,
  iconSize = 22,
  tintColor,
}) => (
  <View style={[styles.glassOuter, tintColor ? { shadowColor: tintColor } : {}]}>
    {/* Outer ring — subtle border glow */}
    <View style={styles.glassRing}>
      <BlurView intensity={120} tint="dark" style={styles.glassBlur}>

        {/* Optional warm tint layer (share button) */}
        {tintColor && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tintColor, borderRadius: 22 }]} />
        )}

        {/* Top-edge highlight — fakes the glass "rim" catching light */}
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.0)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          pointerEvents="none"
        />

        {/* Bottom-edge depth shadow (subtle darkening at bottom) */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />

        {/* Icon */}
        <TouchableOpacity onPress={onPress} style={styles.glassIconHit} activeOpacity={0.7}>
          <Ionicons name={iconName as any} size={iconSize} color="rgba(255,255,255,0.95)" />
        </TouchableOpacity>

      </BlurView>
    </View>
  </View>
);
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileDetailModalProps {
  user: any;
  isVisible: boolean;
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
  onSuperLike?: () => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  user,
  isVisible,
  onClose,
  onLike,
  onPass,
  onSuperLike
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Staggered animations for up to 10 child sections
  const sectionAnims = useRef([...Array(10)].map(() => new Animated.Value(0))).current;

  const [renderContent, setRenderContent] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setRenderContent(true);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.poly(3)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.poly(3)),
          useNativeDriver: true,
        })
      ]).start();

      Animated.stagger(100, sectionAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.poly(3)),
          useNativeDriver: true,
        })
      )).start();

    } else if (renderContent) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start(() => {
        setRenderContent(false);
        sectionAnims.forEach(anim => anim.setValue(0));
      });
    }
  }, [isVisible]);

  const handleAction = (action: 'like' | 'pass' | 'superlike') => {
    onClose();
    setTimeout(() => {
      if (action === 'like') onLike();
      if (action === 'pass') onPass();
      if (action === 'superlike' && onSuperLike) onSuperLike();
    }, 250);
  };

  if (!renderContent) return null;

  return (
    <Modal
      transparent
      visible={renderContent}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>

        {/* Clickable Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Floating Action Bar (Fixed Bottom) */}
        <Animated.View style={[
          styles.floatingActionBarWrapper,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] })
            }]
          }
        ]}>
          <LinearGradient
            colors={['transparent', 'rgba(18,18,18,0.6)', '#121212']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
            <View style={styles.floatingActionBar}>
              <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={() => handleAction('pass')}>
                <Ionicons name="close" size={32} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => handleAction('like')}>
                <Ionicons name="heart" size={32} color="#FFF" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>

        {/* Content Container */}
        <Animated.View style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) },
              { scale: scaleAnim }
            ]
          }
        ]}>

          {/* Top gradient for readability */}
          <LinearGradient
            colors={['rgba(18,18,18,0.7)', 'rgba(18,18,18,0.3)', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />

          {/* Header Bar */}
          <View style={styles.headerBar}>

            {/* ← Back Button — Apple liquid glass (dark) */}
            <GlassButton
              onPress={onClose}
              iconName="arrow-back"
              iconSize={22}
            />

            {/* Drag Handle */}
            <View style={styles.dragHandleContainer} pointerEvents="none">
              <View style={styles.dragHandle} />
            </View>

            {/* Share Button — Apple liquid glass (warm orange tint) */}
            <View style={styles.headerRight}>
              <GlassButton
                onPress={() => {}}
                iconName="share-outline"
                iconSize={20}
                tintColor="rgba(228, 90, 40, 0.30)"
              />
            </View>

          </View>

          <ScrollView
            style={styles.scrollView}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <AnimatedSection anim={sectionAnims[0]}><ProfileMediaGallery user={user} isVisible={isVisible} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[1]}><ProfileBasicInfo user={user} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[2]}><ProfileAbout user={user} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[3]}><ProfilePersonality user={user} /></AnimatedSection>
            {/* <AnimatedSection anim={sectionAnims[4]}><ProfileVibes user={user} /></AnimatedSection> */}
            <AnimatedSection anim={sectionAnims[5]}><ProfileInterests user={user} /></AnimatedSection>
            {/* <AnimatedSection anim={sectionAnims[6]}><ProfileCompatibility user={user} /></AnimatedSection> */}
            <AnimatedSection anim={sectionAnims[7]}><ProfileVerification user={user} /></AnimatedSection>

            <View style={{ height: 100 }} />
          </ScrollView>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    width: '100%',
    height: '95%',
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 90,
  },
  dragHandleContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 101,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    zIndex: 100,
  },
  headerRight: {
    flexDirection: 'row',
  },

  // ─── Glass Button System ─────────────────────────────────────────────────
  glassOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    // Soft ambient shadow beneath button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  glassRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    // Outer glass border — picks up edge reflections
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  glassBlur: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassIconHit: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  // ─────────────────────────────────────────────────────────────────────────

  scrollView: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  floatingActionBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  blurContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  floatingActionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    alignItems: 'center',
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  passBtn: {
    backgroundColor: '#E44124',
  },
  likeBtn: {
    backgroundColor: '#6AB04C',
  },
});