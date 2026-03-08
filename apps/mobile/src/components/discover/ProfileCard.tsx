import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { MinimalProfile } from '../../store/discoverSlice';

const { width, height } = Dimensions.get('window');

interface ProfileCardProps {
  profile: MinimalProfile;
  isTopCard: boolean;
  onSwipe: (action: 'like' | 'pass' | 'super_like') => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, isTopCard, onSwipe }) => {
  return (
    <View style={styles.card}>
      <Image 
        source={{ uri: profile.primaryPhoto }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{profile.name}, {profile.age}</Text>
        <Text style={styles.dept}>{profile.department}</Text>
        <Text style={styles.distance}>{profile.distance}</Text>
      </View>
      
      {/* TEMPORARY BUTTONS FOR TESTING SWIPE LOGIC */}
      {isTopCard && (
        <View style={styles.testButtons}>
          <Text onPress={() => onSwipe('pass')} style={[styles.testBtn, { color: 'red' }]}>PASS</Text>
          <Text onPress={() => onSwipe('like')} style={[styles.testBtn, { color: 'green' }]}>LIKE</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', // Temporary text backdrop
  },
  name: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  dept: {
    color: 'white',
    fontSize: 18,
    marginTop: 5,
  },
  distance: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 5,
  },
  testButtons: {
    position: 'absolute',
    top: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  testBtn: {
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    overflow: 'hidden',
  }
});

export default ProfileCard;
