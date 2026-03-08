import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

const SkeletonCard = ({ stackIndex }: { stackIndex: number }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <Animated.View style={[
      styles.card,
      { opacity, transform: [{ scale: 1 - (stackIndex * 0.05) }, { translateY: stackIndex * -20 }] }
    ]}>
      {/* Immitate internal content */}
      <View style={styles.imagePlaceholder} />
      <View style={styles.infoPlaceholder}>
        <View style={styles.titleLine} />
        <View style={styles.subtitleLine} />
      </View>
    </Animated.View>
  );
};

const SkeletonDeck = () => {
  return (
    <View style={styles.container}>
      {/* Render 3 cards layered behind each other */}
      <View style={{ position: 'absolute', zIndex: 1 }}>
        <SkeletonCard stackIndex={2} />
      </View>
      <View style={{ position: 'absolute', zIndex: 2 }}>
        <SkeletonCard stackIndex={1} />
      </View>
      <View style={{ position: 'absolute', zIndex: 3 }}>
        <SkeletonCard stackIndex={0} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    width: width * 0.95,
    height: height * 0.7,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#d6d6d6',
  },
  infoPlaceholder: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    gap: 10,
  },
  titleLine: {
    width: 200,
    height: 30,
    backgroundColor: '#c0c0c0',
    borderRadius: 5,
  },
  subtitleLine: {
    width: 150,
    height: 20,
    backgroundColor: '#c0c0c0',
    borderRadius: 5,
  }
});

export default SkeletonDeck;
