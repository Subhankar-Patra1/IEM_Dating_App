import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../core/theme/colors';
import { typography } from '../../../core/theme/typography';

interface SwipeCardProps {
  user: { name: string; department: string; year: string; imageUri: string; intent: string; };
  onLike: () => void;
  onPass: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ user, onLike, onPass }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: user.imageUri }} style={styles.image} />
      
      <View style={styles.overlay}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{user.intent}</Text>
        </View>
        <Text style={styles.name}>{user.name}, {user.year}</Text>
        <Text style={styles.department}>{user.department}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.fab, styles.fabPass]} onPress={onPass}>
          <Text style={styles.fabIcon}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, styles.fabLike]} onPress={onLike}>
          <Text style={styles.fabIcon}>♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 0.85,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  image: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 24,
    paddingTop: 80, // Allow space for gradient if added later
    backgroundColor: 'rgba(0,0,0,0.4)', // Simplified overlay
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 16, marginBottom: 8,
  },
  tagText: { color: colors.text.inverse, fontSize: 12, fontWeight: '600' },
  name: { fontSize: 28, fontWeight: '700', color: colors.text.inverse, marginBottom: 4 },
  department: { fontSize: 16, color: colors.text.inverse, opacity: 0.9 },
  actionRow: {
    position: 'absolute', bottom: -28, // Pull slightly down 
    flexDirection: 'row', width: '100%',
    justifyContent: 'space-evenly',
  },
  fab: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.surface,
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width:0, height:4 }
  },
  fabPass: { borderColor: colors.error, borderWidth: 1 },
  fabLike: { borderColor: colors.secondary, borderWidth: 1 },
  fabIcon: { fontSize: 24 },
});
