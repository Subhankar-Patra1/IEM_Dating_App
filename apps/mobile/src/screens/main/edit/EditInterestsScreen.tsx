import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Alert, Platform, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';

// Condensed category data — same IDs as InterestsScreen
const INTEREST_CATEGORIES = [
  { id: 'creativity', title: 'Creativity', emoji: '🎨', interests: ['Poetry','Sneakers','Freelancing','Photography','Content Creation','Singing','Writing','Literature','Tattoos','Painting','Entrepreneurship','Musical Instrument','Dancing','Art','Drawing','Blogging','Fashion','DIY'] },
  { id: 'fan_favorites', title: 'Fan favorites', emoji: '🌟', interests: ['90s Kid','Comic-con','Harry Potter','NBA','Manga','Marvel','Disney'] },
  { id: 'food_and_drink', title: 'Food and drink', emoji: '🍽️', interests: ['Maggi','Biryani','Sushi','Foodie','Street Food','Brunch','Boba tea','Coffee','Ice Cream','Cocktails'] },
  { id: 'gaming', title: 'Gaming', emoji: '🎮', interests: ['Ludo','PlayStation','E-Sports','Fortnite','Xbox','League of Legends','Nintendo','Among Us'] },
  { id: 'going_out', title: 'Going out', emoji: '🌌', interests: ['Festivals','Stand up Comedy','Escape Rooms','Bars','Museums','Cafe hopping','Clubbing','Shopping','Karaoke','Live Music','Concerts','Parties','Nightlife'] },
  { id: 'music', title: 'Music', emoji: '🎶', interests: ['K-Pop','Rock music','Pop music','Rap music','EDM','R&B','Indie music','Hip Hop','Jazz','Electronic Music','Techno'] },
  { id: 'outdoors', title: 'Outdoors', emoji: '🏕️', interests: ['Road Trips','Nature','Travel','Surfing','Hiking','Mountains','Backpacking','Camping','Fishing','Picnicking'] },
  { id: 'social_and_content', title: 'Social', emoji: '📱', interests: ['Instagram','Spotify','YouTube','Memes','Podcasts','TikTok','Netflix','Social Media'] },
  { id: 'sports_and_fitness', title: 'Sports & fitness', emoji: '⚾', interests: ['Cricket','Sports','Gym','Football','Basketball','Running','Swimming','Cycling','Badminton','Boxing','Yoga','Tennis','Volleyball','Working out'] },
  { id: 'tv_and_movies', title: 'TV & movies', emoji: '🎬', interests: ['Action movies','Anime','Bollywood','Comedy','Documentaries','Horror Movies','K-drama shows','Rom-coms','Sci-Fi','Thriller films'] },
  { id: 'values_and_causes', title: 'Values', emoji: '🌎', interests: ['Activism','Mental Health Awareness','Climate Change','Feminism','Human Rights','Volunteering','Equality'] },
  { id: 'wellness_and_lifestyle', title: 'Wellness', emoji: '🌿', interests: ['Self Care','Meditation','Yoga','Skincare','Astrology','Mindfulness','Active Lifestyle'] },
];

const toId = (label: string) => label.toLowerCase().replace(/[^a-z0-9]/g, '_');

export const EditInterestsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentInterests } = route.params || {};

  const [selected, setSelected] = useState<string[]>(currentInterests || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleInterest = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return INTEREST_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return INTEREST_CATEGORIES.map(cat => ({
      ...cat,
      interests: cat.interests.filter(i => i.toLowerCase().includes(q)),
    })).filter(cat => cat.interests.length > 0);
  }, [searchQuery]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/profile', { preferences: { interests: selected } });
      if (response.data?.success) dispatch(updateUser(response.data.data));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <EditScreenHeader 
        title="Interests" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        hasUnsavedChanges={
          selected.length !== (currentInterests || []).length || 
          selected.some(i => !(currentInterests || []).includes(i))
        }
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Interests</Text>
          <Text style={styles.subtitle}>Select interests to show on your profile.</Text>

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: 10 }} />
            <TextInput style={styles.searchInput} placeholder="Search" placeholderTextColor="rgba(255,255,255,0.4)" value={searchQuery} onChangeText={setSearchQuery} />
          </View>

          {filtered.map(cat => {
            const isExpanded = expandedCategories[cat.id];
            const visible = isExpanded ? cat.interests : cat.interests.slice(0, 8);
            const hasMore = cat.interests.length > 8;
            const selectedCount = cat.interests.filter(i => selected.includes(toId(i))).length;

            return (
              <View key={cat.id} style={styles.catSection}>
                <View style={styles.catHeader}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={styles.catTitle}>{cat.title}</Text>
                  {selectedCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{selectedCount}</Text></View>}
                </View>
                <View style={styles.pillsContainer}>
                  {visible.map(interest => {
                    const id = toId(interest);
                    return (
                      <TouchableOpacity key={id} style={[styles.pill, selected.includes(id) && styles.pillSelected]} onPress={() => toggleInterest(id)} activeOpacity={0.7}>
                        <Text style={[styles.pillText, selected.includes(id) && styles.pillTextSelected]}>{interest}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {hasMore && !searchQuery && (
                  <TouchableOpacity style={styles.showMore} onPress={() => setExpandedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}>
                    <Text style={styles.showMoreText}>{isExpanded ? 'Show less' : 'Show more'}</Text>
                    <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
                <View style={styles.divider} />
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 24 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', height: 48, borderRadius: 12, paddingHorizontal: 15, marginBottom: 32 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16, padding: 0 },
  catSection: { marginBottom: 24 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  catEmoji: { fontSize: 18, marginRight: 10 },
  catTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  badge: { marginLeft: 8, backgroundColor: '#F94E27', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: { height: 38, paddingHorizontal: 16, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginRight: 8, marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  pillSelected: { borderColor: '#F94E27', backgroundColor: 'rgba(255,255,255,0.05)' },
  pillText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  pillTextSelected: { color: '#FFF' },
  showMore: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  showMoreText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600', marginRight: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 12 },
});
