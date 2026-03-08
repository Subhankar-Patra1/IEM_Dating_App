import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, Text, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProfileMediaGallery } from './ProfileMediaGallery';
import { ProfileBasicInfo } from './ProfileBasicInfo';
import { ProfileAbout } from './ProfileAbout';
import { ProfileVibes } from './ProfileVibes';
import { ProfileInterests } from './ProfileInterests';
import { ProfilePersonality } from './ProfilePersonality';
import { ProfileEducation } from './ProfileEducation';
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
      
      // Main modal entry
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

      // Staggered children entry
      Animated.stagger(100, sectionAnims.map(anim => 
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.poly(3)),
          useNativeDriver: true,
        })
      )).start();

    } else if (renderContent) {
      // Animate out main modal
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
        // Reset section anims after modal hides
        sectionAnims.forEach(anim => anim.setValue(0));
      });
    }
  }, [isVisible]);

  // Handle action buttons triggering swiping
  const handleAction = (action: 'like' | 'pass' | 'superlike') => {
    onClose();
    setTimeout(() => {
      if (action === 'like') onLike();
      if (action === 'pass') onPass();
      if (action === 'superlike' && onSuperLike) onSuperLike();
    }, 250); // wait for modal animate out
  };

  if (!renderContent) return null;

  return (
    <Modal
      transparent
      visible={renderContent}
      onRequestClose={onClose}
      animationType="none" // We use custom animated values instead
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        {/* Clickable Backdrop to Close */}
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
          {/* Subtle gradient underneath for readability */}
          <LinearGradient
            colors={['transparent', 'rgba(18,18,18,0.6)', '#121212']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
            <View style={styles.floatingActionBar}>
              <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={() => handleAction('pass')}>
                <Ionicons name="close" size={30} color="#ff5c5c" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => handleAction('like')}>
                <LinearGradient
                  colors={['#ff5c5c', '#ff9f43']}
                  style={styles.likeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="heart" size={36} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.starBtn]} onPress={() => handleAction('superlike')}>
                <Ionicons name="star" size={30} color="#45aaf2" />
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
          
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <BlurView intensity={20} tint="dark" style={styles.glassHeaderBtn}>
              <TouchableOpacity onPress={onClose} style={styles.iconHitSlop}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
            </BlurView>
            
            {/* Drag Handle Indicator */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            <View style={styles.headerRight}>
              <BlurView intensity={20} tint="dark" style={styles.glassHeaderBtn}>
                <TouchableOpacity onPress={() => {}} style={styles.iconHitSlop}>
                  <Ionicons name="share-outline" size={22} color="#FFF" />
                </TouchableOpacity>
              </BlurView>
            </View>
          </View>

          <ScrollView 
            style={styles.scrollView}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {/* 13 Sections in Order */}
            <AnimatedSection anim={sectionAnims[0]}><ProfileMediaGallery user={user} isVisible={isVisible} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[1]}><ProfileBasicInfo user={user} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[2]}><ProfileAbout user={user} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[3]}><ProfilePersonality user={user} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[4]}><ProfileVibes user={user} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[5]}><ProfileInterests user={user} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[6]}><ProfileEducation user={user} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[7]}><ProfileCompatibility user={user} /></AnimatedSection>
            <AnimatedSection anim={sectionAnims[8]}><ProfileVerification user={user} /></AnimatedSection>
            
            {/* Bottom Padding */}
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
  dragHandleContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 101, // Above header elements but clickable through ideally
    pointerEvents: 'none',
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
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    zIndex: 100,
  },
  glassHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconHitSlop: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  floatingActionBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140, // Height to cover the bottom completely
    justifyContent: 'flex-end',
    zIndex: 200, // Above everything
  },
  blurContainer: {
    width: '100%',
    height: 120, // Cover the gradient section
    justifyContent: 'center',
    paddingBottom: 20, // Keep buttons up
  },
  floatingActionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    alignItems: 'center',
  },
  actionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: '#13131a',
  },
  passBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: 'rgba(255, 92, 92, 0.2)', // Red tint border
  },
  starBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: 'rgba(69, 170, 242, 0.2)', // Blue tint border
  },
  likeBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 0, // No border, full gradient
    shadowColor: '#ff5c5c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  likeGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
