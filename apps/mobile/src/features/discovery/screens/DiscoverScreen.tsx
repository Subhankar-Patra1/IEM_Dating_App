import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  Platform, 
  ActivityIndicator, 
  Text, 
  Alert, 
  Animated, 
  PanResponder, 
  Dimensions,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeCard } from '../components/SwipeCard';
import { IemConnectHeader } from '../components/IemConnectHeader';
import { IemConnectMembersList } from '../components/IemConnectMembersList';
import { colors } from '../../../core/theme/colors';
import { api } from '../../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.2 * SCREEN_WIDTH;
const SWIPE_VELOCITY_THRESHOLD = 0.7;

export const DiscoverScreen = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const position = useRef(new Animated.ValueXY()).current;
  const usersRef = useRef(users);
  
  useEffect(() => {
    usersRef.current = users;

    const prefetchCount = Math.min(3, users.length);
    for (let i = 0; i < prefetchCount; i++) {
      const u = users[i];
      if (typeof u.primaryPhoto === 'string') Image.prefetch(u.primaryPhoto).catch(() => {});
      if (Array.isArray(u.photos)) {
        u.photos.forEach((photo: string) => {
          if (typeof photo === 'string') Image.prefetch(photo).catch(() => {});
        });
      }
    }
  }, [users]);

  useEffect(() => {
    fetchRecommendations(1);
  }, []);

  const fetchRecommendations = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const res = await api.get(`/discover/recommendations?page=${pageNum}&limit=5`);
      const newUsers = res.data.data;
      
      if (newUsers.length === 0) {
        setHasMore(false);
      } else {
        setUsers(prev => pageNum === 1 ? newUsers : [...prev, ...newUsers]);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      if (pageNum === 1) setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (usersRef.current.length === 0) return;
    
    const currentUsers = usersRef.current;
    const targetUser = currentUsers[0];
    
    setUsers(prev => prev.slice(1));
    
    if (currentUsers.length <= 3 && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRecommendations(nextPage);
    }

    try {
      const res = await api.post('/discover/swipe', {
        targetId: targetUser.id,
        action
      });

      if (res.data.data && res.data.data.matchCreated) {
        Alert.alert("It's a Match! 🎉", `You and ${targetUser.name} liked each other!`);
      }
    } catch (error) {
      console.error(`Failed to record ${action}:`, error);
    }
  };

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: true
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'left' | 'right') => {
    // CRITICAL FIX: Reset the position instantly BEFORE changing state to prevent UI freezing
    position.setValue({ x: 0, y: 0 });
    
    const action = direction === 'right' ? 'like' : 'pass';
    handleSwipe(action);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      speed: 20,
      bounciness: 6,
      useNativeDriver: true
    }).start();
  };

  const callbacks = useRef({ forceSwipe, resetPosition });
  useEffect(() => {
    callbacks.current = { forceSwipe, resetPosition };
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (event, gesture) => {
          return Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3;
        },
        onPanResponderMove: (event, gesture) => {
          position.setValue({ x: gesture.dx, y: gesture.dy * 0.4 });
        },
        onPanResponderRelease: (event, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD || (gesture.vx > SWIPE_VELOCITY_THRESHOLD && gesture.dx > 40)) {
            callbacks.current.forceSwipe('right');
          } else if (gesture.dx < -SWIPE_THRESHOLD || (gesture.vx < -SWIPE_VELOCITY_THRESHOLD && gesture.dx < -40)) {
            callbacks.current.forceSwipe('left');
          } else {
            callbacks.current.resetPosition();
          }
        },
        onPanResponderTerminate: () => {
          callbacks.current.resetPosition();
        }
      }),
    [position]
  );

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-12deg', '0deg', '12deg']
    });

    return {
      transform: [
        { translateX: position.x },
        { translateY: position.y },
        { rotate },
        { scale: 1 }
      ]
    };
  };

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.92, 1],
    extrapolate: 'clamp',
  });

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.7, 1],
    extrapolate: 'clamp',
  });

  const likeStampOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 6],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeStampOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 6, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const passScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  });

  const likeScale = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 2],
    outputRange: [1, 1.3],
    extrapolate: 'clamp',
  });

  const passGlowOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0],
    outputRange: [0.6, 0],
    extrapolate: 'clamp',
  });

  const likeGlowOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 2],
    outputRange: [0, 0.4],
    extrapolate: 'clamp',
  });

  const renderCards = () => {
    if (loading && users.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (users.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyEmoji}>✨</Text>
          </View>
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptySub}>Check back later for more profiles nearby.</Text>
        </View>
      );
    }

    return users.slice(0, 2).reverse().map((user, index, array) => {
      const isTopCard = index === array.length - 1;
      const topCardStyle = getCardStyle();

      return (
        <Animated.View
          key={`card-${user.id}`} 
          style={[
            styles.cardStyle,
            isTopCard ? { zIndex: 99 } : { zIndex: 1, opacity: nextCardOpacity },
            isTopCard ? topCardStyle : {
              transform: [
                { translateX: 0 },
                { translateY: 0 },
                { rotate: '0deg' },
                { scale: nextCardScale }
              ]
            }
          ]}
          // CRITICAL FIX: Spread panHandlers everywhere, remove pointerEvents. Z-Index handles priority naturally.
          {...panResponder.panHandlers}
        >
          {isTopCard && (
            <>
              <Animated.View style={[styles.stampContainer, styles.likeStamp, { opacity: likeStampOpacity }]} pointerEvents="none">
                <Text style={[styles.stampText, { color: '#00E676', borderColor: '#00E676' }]}>LIKE</Text>
              </Animated.View>
              <Animated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeStampOpacity }]} pointerEvents="none">
                <Text style={[styles.stampText, { color: '#FF1744', borderColor: '#FF1744' }]}>NOPE</Text>
              </Animated.View>
            </>
          )}

          <SwipeCard 
            user={{
              ...user,
              imageUri: user.primaryPhoto,
              tags: typeof user.seeking === 'string' ? [user.seeking] : [],
            }}
            onLike={() => isTopCard && forceSwipe('right')}
            onPass={() => isTopCard && forceSwipe('left')}
            onStar={() => isTopCard && forceSwipe('right')}
            isActiveCard={isTopCard}
          />
        </Animated.View>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1F2125' }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <IemConnectHeader />
        <IemConnectMembersList />
        <View style={styles.cardsWrapper}>
          {renderCards()}
        </View>

        <View style={styles.actionContainer}>
          <Animated.View style={[styles.actionBtnContainer, { transform: [{ scale: passScale }] }]}>
            <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={() => forceSwipe('left')} activeOpacity={0.8}>
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={[styles.mainActionContainer, { transform: [{ scale: likeScale }] }]}>
            <TouchableOpacity style={styles.mainActionBtn} onPress={() => forceSwipe('right')} activeOpacity={0.8}>
              <Ionicons name="heart" size={32} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  cardsWrapper: { flex: 1, position: 'relative', marginTop: 8 },
  cardStyle: { position: 'absolute', top: 0, left: 12, right: 12, bottom: 180 }, // Give massive space around bottom tab layout
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 24 },
  actionContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32, position: 'absolute', bottom: 110, left: 0, right: 0, zIndex: 100 }, // Pushed up above custom tab bar
  actionBtnContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  actionBtn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  passBtn: { backgroundColor: '#E44124' }, // Solid Red/Orange from the image
  mainActionContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  mainActionBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#6AB04C', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  stampContainer: { position: 'absolute', top: 50, zIndex: 999, padding: 10 },
  likeStamp: { left: 24, transform: [{ rotate: '-15deg' }] },
  nopeStamp: { right: 24, transform: [{ rotate: '15deg' }] },
  stampText: { fontSize: 36, fontWeight: '900', borderWidth: 3, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, letterSpacing: 3, overflow: 'hidden' },
});