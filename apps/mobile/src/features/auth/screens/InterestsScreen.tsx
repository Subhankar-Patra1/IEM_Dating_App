import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
  TextInput,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { setCredentials, updateUser } from "../../../store/authSlice";
import { api } from "../../../services/api";

const { width } = Dimensions.get("window");

type InterestOption = {
  id: string;
  label: string;
};

type InterestCategory = {
  id: string;
  title: string;
  icon: string;
  emoji: string;
  interests: InterestOption[];
};

const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: "creativity",
    title: "Creativity",
    icon: "palette-outline",
    emoji: "🎨",
    interests: [
      { id: "poetry", label: "Poetry" },
      { id: "sneakers", label: "Sneakers" },
      { id: "freelancing", label: "Freelancing" },
      { id: "photography", label: "Photography" },
      { id: "choir", label: "Choir" },
      { id: "cosplay", label: "Cosplay" },
      { id: "content_creation", label: "Content Creation" },
      { id: "vintage_fashion", label: "Vintage fashion" },
      { id: "investing", label: "Investing" },
      { id: "singing", label: "Singing" },
      { id: "language_exchange", label: "Language Exchange" },
      { id: "writing", label: "Writing" },
      { id: "literature", label: "Literature" },
      { id: "nfts", label: "NFTs" },
      { id: "tattoos", label: "Tattoos" },
      { id: "painting", label: "Painting" },
      { id: "upcycling", label: "Upcycling" },
      { id: "entrepreneurship", label: "Entrepreneurship" },
      { id: "acapella", label: "Acapella" },
      { id: "musical_instrument", label: "Musical Instrument" },
      { id: "musical_writing", label: "Musical Writing" },
      { id: "dancing", label: "Dancing" },
      { id: "exchange_program", label: "Exchange Program" },
      { id: "art", label: "Art" },
      { id: "real_estate", label: "Real Estate" },
      { id: "drawing", label: "Drawing" },
      { id: "blogging", label: "Blogging" },
      { id: "fashion", label: "Fashion" },
      { id: "diy", label: "DIY" },
    ],
  },
  {
    id: "fan_favorites",
    title: "Fan favorites",
    icon: "star-outline",
    emoji: "🌟",
    interests: [
      { id: "90s_kid", label: "90s Kid" },
      { id: "comic_con", label: "Comic-con" },
      { id: "harry_potter", label: "Harry Potter" },
      { id: "nba", label: "NBA" },
      { id: "mlb", label: "MLB" },
      { id: "dnd", label: "Dungeons & Dragons" },
      { id: "manga", label: "Manga" },
      { id: "marvel", label: "Marvel" },
      { id: "disney", label: "Disney" },
    ],
  },
  {
    id: "food_and_drink",
    title: "Food and drink",
    icon: "silverware-fork-knife",
    emoji: "🍽️",
    interests: [
      { id: "maggi", label: "Maggi" },
      { id: "biryani", label: "Biryani" },
      { id: "sushi", label: "Sushi" },
      { id: "foodie", label: "Foodie" },
      { id: "food_tours", label: "Food tours" },
      { id: "mocktails", label: "Mocktails" },
      { id: "sweet_treats", label: "Sweet treats" },
      { id: "brunch", label: "Brunch" },
      { id: "acai", label: "Açai" },
      { id: "street_food", label: "Street Food" },
      { id: "plant_based", label: "Plant-based" },
      { id: "boba_tea", label: "Boba tea" },
      { id: "cocktails", label: "Cocktails" },
      { id: "ice_cream", label: "Ice Cream" },
      { id: "coffee", label: "Coffee" },
      { id: "pho", label: "Pho" },
      { id: "wine", label: "Wine" },
    ],
  },
  {
    id: "gaming",
    title: "Gaming",
    icon: "controller-classic-outline",
    emoji: "🎮",
    interests: [
      { id: "ludo", label: "Ludo" },
      { id: "playstation", label: "PlayStation" },
      { id: "e_sports", label: "E-Sports" },
      { id: "fortnite", label: "Fortnite" },
      { id: "xbox", label: "Xbox" },
      { id: "league_of_legends", label: "League of Legends" },
      { id: "nintendo", label: "Nintendo" },
      { id: "among_us", label: "Among Us" },
      { id: "atari", label: "Atari" },
      { id: "roblox", label: "Roblox" },
    ],
  },
  {
    id: "going_out",
    title: "Going out",
    icon: "map-marker-outline",
    emoji: "🌌",
    interests: [
      { id: "festivals", label: "Festivals" },
      { id: "stand_up_comedy", label: "Stand up Comedy" },
      { id: "escape_rooms", label: "Escape Rooms" },
      { id: "bars", label: "Bars" },
      { id: "thrifting", label: "Thrifting" },
      { id: "museums", label: "Museums" },
      { id: "raves", label: "Raves" },
      { id: "drive_in_cinema", label: "Drive-in Cinema" },
      { id: "musical_theater", label: "Musical theater" },
      { id: "cafe_hopping", label: "Cafe hopping" },
      { id: "aquarium", label: "Aquarium" },
      { id: "clubbing", label: "Clubbing" },
      { id: "exhibition", label: "Exhibition" },
      { id: "shopping", label: "Shopping" },
      { id: "cars", label: "Cars" },
      { id: "pub_quiz", label: "Pub Quiz" },
      { id: "happy_hour", label: "Happy hour" },
      { id: "karaoke", label: "Karaoke" },
      { id: "house_parties", label: "House Parties" },
      { id: "theater", label: "Theater" },
      { id: "shisha", label: "Shisha" },
      { id: "rollerskating", label: "Rollerskating" },
      { id: "live_music", label: "Live Music" },
      { id: "bar_hopping", label: "Bar Hopping" },
      { id: "bowling", label: "Bowling" },
      { id: "motorcycles", label: "Motorcycles" },
      { id: "parties", label: "Parties" },
      { id: "nightlife", label: "Nightlife" },
      { id: "art_galleries", label: "Art galleries" },
      { id: "film_festival", label: "Film Festival" },
      { id: "pubs", label: "Pubs" },
      { id: "concerts", label: "Concerts" },
      { id: "town_festivities", label: "Town Festivities" },
    ],
  },
  {
    id: "music",
    title: "Music",
    icon: "music-note-outline",
    emoji: "🎶",
    interests: [
      { id: "bhangra", label: "Bhangra" },
      { id: "k_pop", label: "K-Pop" },
      { id: "gospel_music", label: "Gospel music" },
      { id: "music_bands", label: "Music bands" },
      { id: "rock_music", label: "Rock music" },
      { id: "soul_music", label: "Soul music" },
      { id: "pop_music", label: "Pop music" },
      { id: "punk_rock", label: "Punk rock" },
      { id: "rap_music", label: "Rap music" },
      { id: "folk_music", label: "Folk music" },
      { id: "latin_music", label: "Latin music" },
      { id: "alternative_music", label: "Alternative music" },
      { id: "techno", label: "Techno" },
      { id: "jazz", label: "Jazz" },
      { id: "house_music", label: "House music" },
      { id: "edm", label: "EDM" },
      { id: "r_and_b", label: "R&B" },
      { id: "indie_music", label: "Indie music" },
      { id: "opera", label: "Opera" },
      { id: "heavy_metal", label: "Heavy Metal" },
      { id: "funk_music", label: "Funk music" },
      { id: "reggaeton", label: "Reggaeton" },
      { id: "country_music", label: "Country Music" },
      { id: "hip_hop", label: "Hip Hop" },
      { id: "j_pop", label: "J-Pop" },
      { id: "electronic_music", label: "Electronic Music" },
      { id: "grime", label: "Grime" },
      { id: "90s_britpop", label: "90s Britpop" },
      { id: "trap_music", label: "Trap Music" },
      { id: "music_general", label: "Music" },
    ],
  },
  {
    id: "outdoors",
    title: "Outdoors and adventure",
    icon: "pine-tree-outline",
    emoji: "🏕️",
    interests: [
      { id: "road_trips", label: "Road Trips" },
      { id: "rowing", label: "Rowing" },
      { id: "diving", label: "Diving" },
      { id: "jetskiing", label: "Jetskiing" },
      { id: "walking_tours", label: "Walking tours" },
      { id: "nature", label: "Nature" },
      { id: "hot_springs", label: "Hot Springs" },
      { id: "walking_my_dog", label: "Walking My Dog" },
      { id: "skiing", label: "Skiing" },
      { id: "canoeing", label: "Canoeing" },
      { id: "snowboarding", label: "Snowboarding" },
      { id: "couchsurfing", label: "Couchsurfing" },
      { id: "free_diving", label: "Free Diving" },
      { id: "travel", label: "Travel" },
      { id: "paddle_boarding", label: "Paddle Boarding" },
      { id: "surfing", label: "Surfing" },
      { id: "beach_bars", label: "Beach Bars" },
      { id: "paragliding", label: "Paragliding" },
      { id: "sailing", label: "Sailing" },
      { id: "hiking", label: "Hiking" },
      { id: "mountains", label: "Mountains" },
      { id: "backpacking", label: "Backpacking" },
      { id: "rock_climbing", label: "Rock Climbing" },
      { id: "fishing", label: "Fishing" },
      { id: "camping", label: "Camping" },
      { id: "outdoors_general", label: "Outdoors" },
      { id: "picnicking", label: "Picnicking" },
    ],
  },
  {
    id: "social_and_content",
    title: "Social and content",
    icon: "cellphone-play",
    emoji: "📱",
    interests: [
      { id: "instagram", label: "Instagram" },
      { id: "twitter_x", label: "X" },
      { id: "soundcloud", label: "SoundCloud" },
      { id: "pinterest", label: "Pinterest" },
      { id: "spotify", label: "Spotify" },
      { id: "social_media", label: "Social Media" },
      { id: "vlogging", label: "Vlogging" },
      { id: "youtube", label: "YouTube" },
      { id: "virtual_reality", label: "Virtual Reality" },
      { id: "memes", label: "Memes" },
      { id: "metaverse", label: "Metaverse" },
      { id: "podcasts", label: "Podcasts" },
      { id: "tiktok", label: "TikTok" },
      { id: "twitch", label: "Twitch" },
      { id: "netflix", label: "Netflix" },
    ],
  },
  {
    id: "sports_and_fitness",
    title: "Sports and fitness",
    icon: "dumbbell",
    emoji: "⚾",
    interests: [
      { id: "freeletics", label: "Freeletics" },
      { id: "cricket", label: "Cricket" },
      { id: "ice_hockey", label: "Ice Hockey" },
      { id: "sports_shooting", label: "Sports Shooting" },
      { id: "athletics", label: "Athletics" },
      { id: "sports", label: "Sports" },
      { id: "walking", label: "Walking" },
      { id: "beach_sports", label: "Beach sports" },
      { id: "fitness_classes", label: "Fitness classes" },
      { id: "skating", label: "Skating" },
      { id: "rugby", label: "Rugby" },
      { id: "boxing", label: "Boxing" },
      { id: "badminton", label: "Badminton" },
      { id: "pilates", label: "Pilates" },
      { id: "cheerleading", label: "Cheerleading" },
      { id: "pole_dancing", label: "Pole Dancing" },
      { id: "car_racing", label: "Car Racing" },
      { id: "motor_sports", label: "Motor Sports" },
      { id: "jogging", label: "Jogging" },
      { id: "football", label: "Football" },
      { id: "tennis", label: "Tennis" },
      { id: "skateboarding", label: "Skateboarding" },
      { id: "gymnastics", label: "Gymnastics" },
      { id: "hockey", label: "Hockey" },
      { id: "basketball", label: "Basketball" },
      { id: "running", label: "Running" },
      { id: "gym", label: "Gym" },
      { id: "weightlifting", label: "Weightlifting" },
      { id: "wrestling", label: "Wrestling" },
      { id: "marathon", label: "Marathon" },
      { id: "martial_arts", label: "Martial Arts" },
      { id: "volleyball", label: "Volleyball" },
      { id: "padel", label: "Padel" },
      { id: "equestrian", label: "Equestrian" },
      { id: "soccer", label: "Soccer" },
      { id: "baseball", label: "Baseball" },
      { id: "archery", label: "Archery" },
      { id: "crossfit", label: "Crossfit" },
      { id: "climbing", label: "Climbing" },
      { id: "cycling", label: "Cycling" },
      { id: "swimming", label: "Swimming" },
      { id: "table_tennis", label: "Table Tennis" },
      { id: "working_out", label: "Working out" },
    ],
  },
  {
    id: "tv_and_movies",
    title: "TV and movies",
    icon: "television-play",
    emoji: "🎬",
    interests: [
      { id: "action_movies", label: "Action movies" },
      { id: "animated_movies", label: "Animated movies" },
      { id: "crime_shows", label: "Crime shows" },
      { id: "drama_shows", label: "Drama shows" },
      { id: "fantasy_movies", label: "Fantasy movies" },
      { id: "documentaries", label: "Documentaries" },
      { id: "indie_films", label: "Indie films" },
      { id: "reality_tv", label: "Reality TV" },
      { id: "rom_coms", label: "Rom-coms" },
      { id: "sports_shows", label: "Sports shows" },
      { id: "thriller_films", label: "Thriller films" },
      { id: "k_drama_shows", label: "K-drama shows" },
      { id: "horror_movies", label: "Horror Movies" },
      { id: "bollywood", label: "Bollywood" },
      { id: "movies_general", label: "Movies" },
      { id: "sci_fi", label: "Sci-Fi" },
      { id: "anime", label: "Anime" },
      { id: "comedy", label: "Comedy" },
    ],
  },
  {
    id: "values_and_causes",
    title: "Values and causes",
    icon: "earth",
    emoji: "🌎",
    interests: [
      { id: "activism", label: "Activism" },
      { id: "mental_health_awareness", label: "Mental Health Awareness" },
      { id: "voter_rights", label: "Voter Rights" },
      { id: "climate_change", label: "Climate Change" },
      { id: "lgbtqia_plus_rights", label: "LGBTQIA+ Rights" },
      { id: "feminism", label: "Feminism" },
      { id: "black_lives_matter", label: "Black Lives Matter" },
      { id: "inclusivity", label: "Inclusivity" },
      { id: "human_rights", label: "Human Rights" },
      { id: "social_development", label: "Social Development" },
      { id: "volunteering", label: "Volunteering" },
      { id: "environmentalism", label: "Environmentalism" },
      { id: "world_peace", label: "World Peace" },
      { id: "pride", label: "Pride" },
      { id: "youth_empowerment", label: "Youth Empowerment" },
      { id: "equality", label: "Equality" },
      { id: "politics", label: "Politics" },
      { id: "disability_rights", label: "Disability Rights" },
    ],
  },
  {
    id: "wellness_and_lifestyle",
    title: "Wellness and lifestyle",
    icon: "leaf-circle-outline",
    emoji: "🌿",
    interests: [
      { id: "self_love", label: "Self Love" },
      { id: "trying_new_things", label: "Trying New Things" },
      { id: "tarot", label: "Tarot" },
      { id: "spa", label: "Spa" },
      { id: "self_care", label: "Self Care" },
      { id: "self_development", label: "Self Development" },
      { id: "meditation", label: "Meditation" },
      { id: "skincare", label: "Skincare" },
      { id: "makeup", label: "Makeup" },
      { id: "astrology", label: "Astrology" },
      { id: "mindfulness", label: "Mindfulness" },
      { id: "sauna", label: "Sauna" },
      { id: "active_lifestyle", label: "Active Lifestyle" },
      { id: "yoga", label: "Yoga" },
    ],
  },
];

const MAX_INTERESTS = INTEREST_CATEGORIES.length;

export const InterestsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { user, token, ...profileData } = route.params || {};

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    creativity: false,
    fan_favorites: false,
    food_and_drink: false,
    gaming: false,
    going_out: false,
    music: false,
    outdoors: false,
    social_and_content: false,
    sports_and_fitness: false,
    tv_and_movies: false,
    values_and_causes: false,
    wellness_and_lifestyle: false,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const selectedCategoriesCount = useMemo(() => {
    const categories = new Set();
    INTEREST_CATEGORIES.forEach(cat => {
      if (cat.interests.some(interest => selectedInterests.includes(interest.id))) {
        categories.add(cat.id);
      }
    });
    return categories.size;
  }, [selectedInterests]);

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interestId)) {
        return prev.filter((id) => id !== interestId);
      }

      // Find which category this interest belongs to
      const category = INTEREST_CATEGORIES.find(cat => 
        cat.interests.some(i => i.id === interestId)
      );

      if (!category) return prev;

      // Check if this category is already "active" (has at least one interest selected)
      const isCategoryActive = category.interests.some(i => prev.includes(i.id));

      // If category is already active, we can always add more interests to it
      if (isCategoryActive) {
        return [...prev, interestId];
      }

      // If it's a new category, check if we've reached the 10 category limit
      if (selectedCategoriesCount < MAX_INTERESTS) {
        return [...prev, interestId];
      }

      return prev;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return INTEREST_CATEGORIES;
    const query = searchQuery.toLowerCase();
    return INTEREST_CATEGORIES.map((cat) => ({
      ...cat,
      interests: cat.interests.filter((interest) =>
        interest.label.toLowerCase().includes(query)
      ),
    })).filter((cat) => cat.interests.length > 0);
  }, [searchQuery]);

  const handleDone = async () => {
    if (selectedInterests.length === 0) return;

    setUpdating(true);
    try {
      const currentPrefs = (route.params?.preferences && typeof route.params.preferences === 'object') 
        ? route.params.preferences 
        : (user?.preferences && typeof user.preferences === 'object') 
          ? user.preferences 
          : {};

      const {
        campus,
        isHosteller,
        clubs,
        attendanceMood,
        hangoutSpots,
        orientation,
        showOrientation,
        distancePreference,
        seeking,
        department,
        degree,
        year,
        yearOfStudy
      } = route.params || {};

      const finalData: any = {
        preferences: {
          ...currentPrefs,
          interests: selectedInterests,
        },
      };

      if (campus !== undefined) finalData.campus = campus;
      if (isHosteller !== undefined) finalData.isHosteller = isHosteller;
      if (clubs !== undefined) finalData.clubs = clubs;
      if (attendanceMood !== undefined) finalData.attendanceMood = attendanceMood;
      if (hangoutSpots !== undefined) finalData.hangoutSpots = hangoutSpots;
      if (orientation !== undefined) finalData.orientation = orientation;
      if (showOrientation !== undefined) finalData.showOrientation = showOrientation;
      if (distancePreference !== undefined) finalData.distancePreference = distancePreference;
      if (seeking !== undefined) finalData.seeking = seeking;
      if (department !== undefined) finalData.department = department;
      if (degree !== undefined) finalData.degree = degree;
      if (year !== undefined) finalData.year = year;
      if (yearOfStudy !== undefined) finalData.yearOfStudy = yearOfStudy;

      console.log("Saving interests:", JSON.stringify(finalData));

      const response = await api.put("/profile", finalData);

      if (response.data?.success) {
        dispatch(updateUser(response.data.data));
      }

      /* 
      dispatch(
        setCredentials({
          user: { ...user, preferences: finalData.preferences },
          token,
        })
      );
      */

      // Navigate to the new ShareMore screen
      navigation.navigate("ShareMore", {
        ...route.params,
        user: { ...user, preferences: finalData.preferences },
        token,
        preferences: finalData.preferences
      });
    } catch (error) {
      console.error("Failed to save interests:", error);
      setUpdating(false);
      alert("Failed to save settings. Please try again.");
    }
  };

  const handleSkip = () => {
    navigation.navigate("ShareMore", { ...route.params, user, token });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.navigate("PersonalityTraits")}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <View />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>Interests</Text>
            <Text style={styles.progressText}>{selectedCategoriesCount} of {MAX_INTERESTS}</Text>
          </View>
          <Text style={styles.subtitle}>Add up to {MAX_INTERESTS} interest categories to your profile. You can select multiple options within each category.</Text>

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredCategories.map((category) => {
            const isExpanded = expandedCategories[category.id];
            const visibleInterests = isExpanded ? category.interests : category.interests.slice(0, 12);
            const hasMore = category.interests.length > 12;
            const selectedInCategory = category.interests.filter(i => selectedInterests.includes(i.id)).length;

            return (
              <View key={category.id} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  {selectedInCategory > 0 && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {selectedInCategory}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.interestsContainer}>
                  {visibleInterests.map((interest) => (
                    <TouchableOpacity
                      key={interest.id}
                      style={[
                        styles.interestPill,
                        selectedInterests.includes(interest.id) && styles.interestPillSelected
                      ]}
                      onPress={() => toggleInterest(interest.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.interestLabel,
                        selectedInterests.includes(interest.id) && styles.interestLabelSelected
                      ]}>
                        {interest.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {hasMore && !searchQuery && (
                   <TouchableOpacity 
                    style={styles.showMoreBtn} 
                    onPress={() => toggleCategory(category.id)}
                  >
                    <Text style={styles.showMoreText}>
                      {isExpanded ? "Show less" : "Show more"}
                    </Text>
                    <MaterialCommunityIcons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={18} 
                      color="rgba(255,255,255,0.4)" 
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.divider} />
              </View>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Next Button Footer */}
      {selectedCategoriesCount > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleDone}
            disabled={updating}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {updating ? "Saving..." : `Next ${selectedCategoriesCount}/${MAX_INTERESTS}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1115",
  },
  headerNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 45,
    height: Platform.OS === "ios" ? 60 : 90,
  },
  doneText: {
    color: "#007AFF", // Blue color for Done
    fontSize: 17,
    fontWeight: "600",
  },
  disabledDone: {
    color: "rgba(0, 122, 255, 0.4)",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased to account for floating footer
  },
  mainContent: {
    marginTop: 10,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFF",
  },
  progressText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    paddingBottom: 5,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 22,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 32,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    padding: 0,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFF",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  interestPill: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginRight: 8,
    marginBottom: 10,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  interestPillSelected: {
    borderColor: "#F94E27",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  interestLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  interestLabelSelected: {
    color: "#FFF",
  },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  showMoreText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginTop: 10,
  },
  categoryBadge: {
    backgroundColor: "#F94E27",
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 22,
    height: 22,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 10,
    backgroundColor: "#0F1115",
  },
  nextButton: {
    backgroundColor: "#FFF",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  nextButtonText: {
    color: "#0F1115",
    fontSize: 18,
    fontWeight: "700",
  },
});
