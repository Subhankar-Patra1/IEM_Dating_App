import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface ProfileMediaGalleryProps {
  user: any;
  isVisible: boolean; // Indicates if the modal is currently open
}

export const ProfileMediaGallery: React.FC<ProfileMediaGalleryProps> = ({ user, isVisible }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaReady, setMediaReady] = useState<Record<number, boolean>>({});
  const [mediaError, setMediaError] = useState<Record<number, boolean>>({});
  const videoRef = useRef<any>(null);

  const mediaItems = useMemo(() => {
    const items: { type: 'video' | 'image', uri: string, previewUri?: string }[] = [];
    if (user.video) {
      items.push({ type: 'video', uri: user.video, previewUri: user.videoPreview || undefined });
    }
    if (user.photos && user.photos.length > 0) {
      user.photos.forEach((photo: string) => items.push({ type: 'image', uri: photo }));
    }
    if (items.length === 0 && user.imageUri) {
      items.push({ type: 'image', uri: user.imageUri });
    }
    return items;
  }, [user]);

  // Handle memory and playback
  useEffect(() => {
    if (!isVisible && videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [isVisible]);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== currentIndex) {
      setCurrentIndex(roundIndex);
    }
  };

  const showFallback = mediaItems.length === 0;

  if (showFallback) {
    return (
      <View style={[styles.container, { height: SCREEN_HEIGHT * 0.65 }]}>
        <LinearGradient
          colors={['#2c3e50', '#3498db']}
          style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}
        >
          <Ionicons name="person" size={120} color="rgba(255,255,255,0.2)" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: SCREEN_HEIGHT * 0.45 }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {mediaItems.map((item, idx) => {
          const isActive = idx === currentIndex;
          const isError = mediaError[idx];
          
          return (
            <View key={idx} style={{ width: SCREEN_WIDTH, height: '100%' }}>
              {!mediaReady[idx] && !isError && (
                 <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
                   <ActivityIndicator size="large" color={colors.primary} />
                 </View>
              )}
              
              {isError ? (
                <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
                  <Ionicons name="image-outline" size={60} color="rgba(255,255,255,0.4)" />
                </View>
              ) : item.type === 'video' ? (
                <Video
                  ref={videoRef}
                  source={{ uri: item.uri }}
                  style={[StyleSheet.absoluteFill, { opacity: mediaReady[idx] ? 1 : 0 }]}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={isVisible && isActive}
                  isLooping
                  isMuted={isMuted}
                  onReadyForDisplay={() => setMediaReady(prev => ({...prev, [idx]: true}))}
                  onError={() => setMediaError(prev => ({...prev, [idx]: true}))}
                />
              ) : (
                <Image
                  source={{ uri: item.uri }}
                  style={[StyleSheet.absoluteFill, { opacity: mediaReady[idx] ? 1 : 0 }]}
                  onLoad={() => setMediaReady(prev => ({...prev, [idx]: true}))}
                  onError={() => setMediaError(prev => ({...prev, [idx]: true}))}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Media Indicators (Top) */}
      {mediaItems.length > 1 && (
        <View style={styles.indicatorContainer}>
          {mediaItems.map((_, idx) => (
            <View 
              key={idx} 
              style={[
                styles.indicatorDot, 
                idx === currentIndex ? styles.indicatorActive : styles.indicatorInactive
              ]} 
            />
          ))}
        </View>
      )}

      {/* Editorial Radial Gradient Mesh Overlay */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255, 92, 92, 0.35)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: -100, left: -50, width: SCREEN_WIDTH * 1.5, height: SCREEN_HEIGHT * 0.5 }}
        />
        <LinearGradient
          colors={['rgba(69, 170, 242, 0.25)', 'transparent']}
          start={{ x: 1, y: 0.2 }} end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: -50, right: -100, width: SCREEN_WIDTH * 1.5, height: SCREEN_HEIGHT * 0.5 }}
        />
      </View>

      {/* Heavy Bottom Fade for Name Layering */}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,15,0.85)', '#0a0a0f']}
        locations={[0, 0.6, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#111',
  },
  loaderContainer: {
    backgroundColor: '#111', 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    zIndex: 2,
  },
  indicatorContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: 6,
  },
  indicatorDot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  indicatorActive: {
    width: 20,
    opacity: 1,
  },
  indicatorInactive: {
    width: 4,
    opacity: 0.5,
  },
  muteButton: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  }
});
