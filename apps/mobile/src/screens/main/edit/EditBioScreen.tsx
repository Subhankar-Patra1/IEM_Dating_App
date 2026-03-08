import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Animated, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EditScreenHeader } from '../../../components/EditScreenHeader';
import { api } from '../../../services/api';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../../store/authSlice';

export const EditBioScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { currentBio } = route.params || {};

  const [bio, setBio] = useState(currentBio || '');
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/profile', { preferences: { bio: bio.trim() } });
      if (response.data?.success) dispatch(updateUser(response.data.data));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <EditScreenHeader 
        title="About Me" 
        onCancel={() => navigation.goBack()} 
        onSave={handleSave} 
        saving={saving} 
        hasUnsavedChanges={bio !== (currentBio || '')}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>Share more about yourself</Text>
            <Text style={styles.subtitle}>Write a bio to help your profile stand out.</Text>

            <View style={[styles.bioCard, bio.length > 0 && styles.bioCardFilled]}>
              <Text style={styles.bioLabel}>About me</Text>
              <TextInput
                multiline
                style={styles.bioInput}
                placeholder="Introduce yourself to make a strong impression."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={bio}
                onChangeText={setBio}
                maxLength={500}
              />
              <Text style={styles.charCount}>{bio.length}/500</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1115' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 22, marginBottom: 30 },
  bioCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', minHeight: 180 },
  bioCardFilled: { borderColor: 'rgba(255,255,255,0.25)' },
  bioLabel: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  bioInput: { fontSize: 16, color: '#FFF', lineHeight: 24, paddingTop: 0, minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'right', marginTop: 8 },
});
