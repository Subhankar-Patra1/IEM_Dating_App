import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  PanResponder, 
  Dimensions, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SwipeableCard, Profile } from '../../components/ui/SwipeableCard';
import { colors } from '../../core/theme/colors';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

// Dummy data for Discover UI test
const DUMMY_PROFILES: Profile[] = [
  {
    id: '1',
    name: 'Aisha',
    age: 21,
    bio: 'Coding by day, anime by night. Looking for someone to debug my life.',
    department: 'B.Tech CSE',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Rohan',
    age: 22,
    bio: 'Coffee addict and aspiring designer. I probably like your playlist.',
    department: 'BBA',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Priya',
    age: 20,
    bio: 'Avid reader and occasional painter. Let\'s go on a library date.',
    department: 'BCA',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop',
  }
];

export const DashboardScreen = () => {
  const [profiles, setProfiles] = useState(DUMMY_PROFILES);
  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? width * 1.5 : -width * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false // Layout animation requires false for position
    }).start(() => onSwipeComplete());
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false
    }).start();
  };

  const onSwipeComplete = useCallback(() => {
    setProfiles((prev) => prev.slice(1));
    position.setValue({ x: 0, y: 0 });
  }, [position]);

  const handleAction = (type: 'like' | 'nope') => {
    if (profiles.length === 0) return;
    forceSwipe(type === 'like' ? 'right' : 'left');
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-width * 1.5, 0, width * 1.5],
      outputRange: ['-30deg', '0deg', '30deg']
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    };
  };

  const renderCards = () => {
    if (profiles.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No more profiles nearby!</Text>
        </View>
      );
    }

    return profiles.map((profile, index) => {
      // Top card is animated
      if (index === 0) {
        return (
          <Animated.View
            key={profile.id}
            style={[getCardStyle(), styles.cardStyle]}
            {...panResponder.panHandlers}
          >
            <SwipeableCard profile={profile} />
          </Animated.View>
        );
      }

      // Next cards are static underneath
      return (
        <Animated.View 
          key={profile.id} 
          style={[styles.cardStyle, { top: 10 * index, transform: [{ scale: 1 - index * 0.05 }] }]}
        >
          <SwipeableCard profile={profile} />
        </Animated.View>
      );
    }).reverse();
  };

  return (
    <LinearGradient colors={['#F9FAFB', '#F3F4F6']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>
      
      <View style={styles.cardsContainer}>
        {renderCards()}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.nopeButton]}
          onPress={() => handleAction('nope')}
        >
          <Ionicons name="close" size={32} color="#EF4444" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleAction('like')}
        >
          <Ionicons name="heart" size={32} color="#10B981" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20, // adjust vertical alignment
  },
  cardStyle: {
    position: 'absolute',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.secondary,
    fontWeight: '600'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: 40,
    paddingTop: 20,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  nopeButton: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  likeButton: {
    borderWidth: 2,
    borderColor: '#D1FAE5',
  }
});
