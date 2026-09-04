import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface ProfileInterestsProps {
  user: any;
}

export const ProfileInterests: React.FC<ProfileInterestsProps> = ({ user }) => {
  const [showAll, setShowAll] = useState(false);
  const tags = user.preferences?.interests || [];
  
  if (tags.length === 0) return null;

  const displayLimit = 8;
  const initialTags = tags.slice(0, displayLimit);
  const hasMore = tags.length > displayLimit;

  const formatValue = (val: string) => {
    if (!val) return '';
    return val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons name="shape-outline" size={20} color="#8e8e93" />
          <Text style={styles.sectionTitle}>Interests</Text>
        </View>
        {hasMore && (
          <TouchableOpacity onPress={() => setShowAll(true)} style={styles.seeAllRow}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.tagsGrid}>
        {initialTags.map((tag: string, index: number) => (
          <View key={index} style={styles.tagPill}>
            <Text style={styles.tagText}>{formatValue(tag)}</Text>
          </View>
        ))}
        {hasMore && (
          <TouchableOpacity onPress={() => setShowAll(true)} style={[styles.tagPill, styles.seeMorePill]}>
            <Text style={[styles.tagText, { color: '#8e8e93' }]}>+{tags.length - displayLimit} more</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FULL INTERESTS MODAL */}
      <Modal
        visible={showAll}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAll(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowAll(false)}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          <View style={styles.modalContent}>
            {/* DRAG HANDLE / PULL INDICATOR */}
            <View style={styles.pullIndicator} />
            
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitle}>
                <MaterialCommunityIcons name="shape-outline" size={24} color="#FFF" />
                <Text style={styles.modalTitle}>All Interests</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowAll(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              contentContainerStyle={styles.modalGrid}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tagPillLarge}>
                  <Text style={styles.tagTextLarge}>{formatValue(tag)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 2,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 12,
    backgroundColor: '#13131a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#8e8e93',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginRight: 4,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  seeMorePill: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tagText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#13131a',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32, // Adjusted: Enough space for indicator but cleaner
    borderTopWidth: 0,
  },
  pullIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 24,
    color: '#FFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 0, // Removed padding here
  },
  tagPillLarge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagTextLarge: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
});
