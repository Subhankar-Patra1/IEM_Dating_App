import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Helper to convert CM to FT'IN"
const cmToFtIn = (cm: number) => {
  const realInches = cm / 2.54;
  const feet = Math.floor(realInches / 12);
  let inches = Math.round(realInches % 12);
  
  if (inches === 12) {
    return `${feet + 1}'0"`;
  }
  return `${feet}'${inches}"`;
};

// Generate height range: 91cm (3'0") to 244cm (8'0")
const HEIGHTS = Array.from({ length: 244 - 91 + 1 }, (_, i) => 91 + i);
const PADDED_HEIGHTS = [null, null, ...HEIGHTS, null, null];

/* ==========================================
   MEMOIZED ITEM: Prevents lag and fixes
   muddy color bleeding during scroll
   ========================================== */
const HeightItem = memo(({ item, index, scrollY }: { item: number | null, index: number, scrollY: Animated.Value }) => {
  if (item === null) return <View style={styles.item} />;

  // The exact scroll Y position where THIS item is perfectly in the center
  const centerPos = (index - 2) * ITEM_HEIGHT;

  // Opacity and scale stay smooth across a wide range
  const smoothInputRange = [
    centerPos - ITEM_HEIGHT * 2,
    centerPos,
    centerPos + ITEM_HEIGHT * 2
  ];

  // Colors use a tight range so they SNAP instead of bleeding
  const colorInputRange = [
    centerPos - ITEM_HEIGHT,       // 1 item away
    centerPos - ITEM_HEIGHT * 0.4, // Right before entering center
    centerPos,                     // Dead center
    centerPos + ITEM_HEIGHT * 0.4, // Right after leaving center
    centerPos + ITEM_HEIGHT        // 1 item away
  ];

  const opacity = scrollY.interpolate({
    inputRange: smoothInputRange,
    outputRange: [0.3, 1, 0.3],
    extrapolate: 'clamp'
  });

  const scale = scrollY.interpolate({
    inputRange: smoothInputRange,
    outputRange: [0.8, 1.25, 0.8],
    extrapolate: 'clamp'
  });

  // Using exact RGBA prevents the "muddy" crossfade colors
  const cmColor = scrollY.interpolate({
    inputRange: colorInputRange,
    outputRange: [
      'rgba(255, 255, 255, 0.4)', 
      'rgba(255, 255, 255, 0.4)', // Stays grey until it hits the center zone
      'rgba(249, 78, 39, 1)',     // #F94E27 exact match
      'rgba(255, 255, 255, 0.4)', // Immediately goes back to grey
      'rgba(255, 255, 255, 0.4)'
    ],
    extrapolate: 'clamp'
  });

  const ftColor = scrollY.interpolate({
    inputRange: colorInputRange,
    outputRange: [
      'rgba(255, 255, 255, 0.2)', 
      'rgba(255, 255, 255, 0.2)', 
      'rgba(255, 255, 255, 0.8)', 
      'rgba(255, 255, 255, 0.2)', 
      'rgba(255, 255, 255, 0.2)'
    ],
    extrapolate: 'clamp'
  });

  return (
    <Animated.View style={[styles.item, { opacity, transform: [{ scale }] }]}>
      <Animated.Text style={[styles.cmText, { color: cmColor }]}>{item} cm</Animated.Text>
      <Animated.Text style={[styles.ftText, { color: ftColor }]}>({cmToFtIn(item)})</Animated.Text>
    </Animated.View>
  );
});

export const EditHeightScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentHeight } = route.params || {};

  const initialValue = currentHeight || 165;
  const initialIndex = HEIGHTS.indexOf(initialValue);

  const [selectedHeight, setSelectedHeight] = useState(initialValue);
  const selectedHeightRef = useRef(initialValue);
  const [saving, setSaving] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  // Background listener tracks scroll exactly without choking the JS thread
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const index = Math.round(value / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(HEIGHTS.length - 1, index));
      const newValue = HEIGHTS[clampedIndex];

      if (newValue && newValue !== selectedHeightRef.current) {
        selectedHeightRef.current = newValue;
        setSelectedHeight(newValue);
      }
    });

    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [scrollY]);

  // Push scroll events to the native UI thread
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const handleScrollEnd = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(HEIGHTS.length - 1, index));
    const newValue = HEIGHTS[clampedIndex];
    if (newValue && newValue !== selectedHeight) {
      selectedHeightRef.current = newValue;
      setSelectedHeight(newValue);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/profile', { height: selectedHeight });
      if (response.data?.success) {
        dispatch(updateUser(response.data.data));
      }
      navigation.goBack();
    } catch (err: any) {
      console.error('[EditHeight] Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderItem = useCallback(({ item, index }: any) => {
    return <HeightItem item={item} index={index} scrollY={scrollY} />;
  }, [scrollY]);

  return (
    <View style={styles.container}>
      <EditScreenHeader
        title="Height"
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saving={saving}
        hasUnsavedChanges={selectedHeight !== initialValue}
      />

      <View style={styles.content}>
        <Text style={styles.title}>How tall are you?</Text>
        <Text style={styles.subtitle}>Edit or delete your answers at any time.</Text>

        <View style={styles.pickerContainer}>
          <View style={styles.indicator} pointerEvents="none" />

          {/* Upgraded to FlatList for high performance */}
          <Animated.FlatList
            ref={flatListRef}
            data={PADDED_HEIGHTS}
            keyExtractor={(item, index) => item ? item.toString() : `pad-${index}`}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            scrollEventThrottle={16}
            decelerationRate="fast"
            contentContainerStyle={styles.scrollContent}
            getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
            initialScrollIndex={initialIndex !== -1 ? initialIndex : 0}
            windowSize={5}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Selected Height</Text>
          <Text style={styles.footerValue}>{selectedHeight} cm • {cmToFtIn(selectedHeight)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 50 },

  pickerContainer: {
    height: WHEEL_HEIGHT,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  indicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#F94E27',
    zIndex: 1,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cmText: {
    fontSize: 22,
    fontWeight: '800', // Sticking to a single high weight prevents layout recalculation lag
    marginRight: 10,
  },
  ftText: {
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(249, 78, 39, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(249, 78, 39, 0.1)',
  },
  footerLabel: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#F94E27',
    fontWeight: '800',
    marginBottom: 8,
  },
  footerValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  }
});