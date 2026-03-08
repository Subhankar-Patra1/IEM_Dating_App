import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchRecommendations, swipeCard } from '../../store/discoverSlice';
import ProfileCard from './ProfileCard';
import SkeletonDeck from './SkeletonDeck';
import EmptyDiscoverState from './EmptyDiscoverState';
import ErrorState from './ErrorState';

const { width, height } = Dimensions.get('window');

const SwipeDeck = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { visibleProfiles, isLoading, error } = useSelector((state: RootState) => state.discover);

  useEffect(() => {
    // Initial fetch if we have no profiles
    if (visibleProfiles.length === 0 && !isLoading) {
      dispatch(fetchRecommendations(1));
    }
  }, [dispatch, visibleProfiles.length, isLoading]);

  const handleSwipe = (action: 'like' | 'pass' | 'super_like') => {
    dispatch(swipeCard(action));
    // If running low on cards, pre-fetch next batch
    // We can handle this logic in a thunk or useEffect later
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchRecommendations(1))} />;
  }

  if (visibleProfiles.length === 0 && isLoading) {
    return <SkeletonDeck />;
  }

  if (visibleProfiles.length === 0 && !isLoading) {
    return <EmptyDiscoverState onRefresh={() => dispatch(fetchRecommendations(1))} onAdjustFilters={() => {}} />;
  }

  return (
    <View style={styles.container}>
      {/* We render the visible profiles back-to-front (oldest/last in array at the bottom) */}
      {[...visibleProfiles].reverse().map((profile, index) => {
        // The last item in the reversed array is actually the top card (visibleProfiles[0])
        const isTopCard = index === visibleProfiles.length - 1;
        
        return (
          <View
            key={profile.id}
            style={[styles.cardContainer, { zIndex: index }]}
            pointerEvents={isTopCard ? 'auto' : 'none'}
          >
            <ProfileCard
              profile={profile}
              isTopCard={isTopCard}
              onSwipe={handleSwipe}
            />
          </View>
        );
      })}
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
  cardContainer: {
    position: 'absolute',
    width: width * 0.95,
    height: height * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(SwipeDeck);
