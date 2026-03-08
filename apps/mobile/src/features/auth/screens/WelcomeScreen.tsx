import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { SlideAgreeButton } from '../../../components/ui/SlideAgreeButton';


const { width } = Dimensions.get('window');

export const WelcomeScreen = () => {
  const navigation = useNavigation<any>();
  
  const handleStart = () => {
    navigation.navigate('Login');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient similar to the requested image */}
      <LinearGradient
        colors={['#8C2617', '#361512', '#121212', '#0A0A0A']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.container}
      >
        <View style={styles.topArea}>
          <Text style={styles.headerLogo}>IEM CONNECT</Text>

          {/* Floating Images Setup */}
          <View style={styles.cardsContainer}>
            {/* Background floating card (Left) */}
            <View style={[styles.imageCard, styles.cardLeft]}>
              <View style={styles.cardContent}>
                <Image 
                  source={{ uri: 'https://i.pravatar.cc/400?img=11' }} 
                  style={styles.cardImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.imageOverlay}
                >
                  <Text style={styles.cardName}>Akash, 19 <View style={styles.onlineDot}/></Text>
                  <Text style={styles.cardInfo}>Kolkata</Text>
                </LinearGradient>
              </View>
              
              {/* Floating purple icon */}
              <View style={[styles.floatingIcon, styles.purpleIcon]}>
                <MaterialCommunityIcons name="gift" size={24} color="#FFF" />
              </View>
            </View>

            {/* Foreground floating card (Right) */}
            <View style={[styles.imageCard, styles.cardRight]}>
              <View style={styles.cardContent}>
                <Image 
                  source={{ uri: 'https://i.pravatar.cc/400?img=5' }} 
                  style={styles.cardImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.imageOverlay}
                >
                  <Text style={styles.cardName}>Rupsa, 19 <View style={styles.onlineDot}/></Text>
                  <Text style={styles.cardInfo}>Howrah</Text>
                </LinearGradient>
              </View>

              {/* Floating blue icon */}
              <View style={[styles.floatingIcon, styles.blueIcon]}>
                <MaterialCommunityIcons name="email" size={20} color="#FFF" />
              </View>

              {/* Floating red icon */}
              <View style={[styles.floatingIcon, styles.redIcon]}>
                <MaterialCommunityIcons name="heart" size={28} color="#FFF" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomArea}>
          {/* Typography */}
          <Text style={styles.title}>
            Find Your{'\n'}
            <Text style={styles.titleHighlight}>Perfect</Text> Match
          </Text>
          
          <Text style={styles.subtitle}>
            Meet New People, Spark Real Connections,{'\n'}And See Where It Goes.
          </Text>


          {/* Swipe to Start Slider (Animated Component) */}
          <SlideAgreeButton onAgree={handleStart} />
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topArea: {
    flex: 1.2,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 20 : 60,
  },
  headerLogo: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 40,
  },
  cardsContainer: {
    width: '100%',
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCard: {
    width: 200,
    height: 280,
    borderRadius: 30,
    position: 'absolute',
    backgroundColor: '#333',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  cardContent: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  cardLeft: {
    transform: [{ rotate: '-12deg' }, { translateX: -40 }, { translateY: -10 }],
    zIndex: 1,
  },
  cardRight: {
    transform: [{ rotate: '8deg' }, { translateX: 50 }, { translateY: 20 }],
    zIndex: 2,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 24,
  },
  cardName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginLeft: 6,
    marginBottom: 2,
  },
  cardInfo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  floatingIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  purpleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7c3aed',
    left: -24,
    bottom: 80,
  },
  blueIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    top: -15,
    left: 45,
  },
  redIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
    right: -20,
    bottom: 40,
  },

  bottomArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 32,
    justifyContent: 'flex-end',
  },
  title: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  titleHighlight: {
    color: '#F94E27', // Bright Orange/Red
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    fontWeight: '500',
  },
});
