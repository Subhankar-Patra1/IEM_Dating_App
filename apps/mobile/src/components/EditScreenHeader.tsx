import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../core/theme/colors';
import { DiscardModal } from './DiscardModal';

interface EditScreenHeaderProps {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  hasUnsavedChanges?: boolean;
}

export const EditScreenHeader = ({
  title,
  onCancel,
  onSave,
  saving = false,
  saveDisabled = false,
  hasUnsavedChanges = false,
}: EditScreenHeaderProps) => {
  const navigation = useNavigation<any>();
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges || saving) {
        return;
      }

      e.preventDefault();
      setPendingAction(e.data.action);
      setShowDiscardModal(true);
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, saving]);

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    if (pendingAction) {
      navigation.dispatch(pendingAction);
    } else {
      navigation.goBack();
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleCancel} style={styles.headerBtn} activeOpacity={0.7}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <TouchableOpacity
        onPress={onSave}
        disabled={saving || saveDisabled}
        style={[styles.headerBtn, (saving || saveDisabled) && { opacity: 0.4 }]}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#F94E27" />
        ) : (
          <Text style={styles.saveText}>Save</Text>
        )}
      </TouchableOpacity>

      <DiscardModal
        visible={showDiscardModal}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerBtn: {
    minWidth: 60,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F94E27',
    textAlign: 'right',
  },
});
