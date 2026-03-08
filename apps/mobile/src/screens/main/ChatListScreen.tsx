import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { api } from '../../services/api';
import {
  setConversations,
  setLoadingConversations,
  Conversation,
} from '../../store/chatSlice';
import { colors } from '../../core/theme/colors';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop';

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ConversationItem = ({ item, currentUserId }: { item: Conversation; currentUserId: string }) => {
  const navigation = useNavigation<any>();
  const isUnread = item.unreadCount > 0;
  const isSentByMe = item.lastMessage?.senderId === currentUserId;

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('ChatScreen', {
          matchId: item.matchId,
          userName: item.user.name,
          userAvatar: item.user.avatar,
          userId: item.user.id,
        })
      }
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.user.avatar || DEFAULT_AVATAR }}
          style={styles.avatar}
        />
        {isUnread && <View style={styles.onlineDot} />}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.userName, isUnread && styles.userNameUnread]} numberOfLines={1}>
            {item.user.name}
          </Text>
          <Text style={[styles.timeText, isUnread && styles.timeTextUnread]}>
            {formatTime(item.lastMessage?.sentAt)}
          </Text>
        </View>
        <View style={styles.conversationFooter}>
          <View style={styles.lastMessageRow}>
            {isSentByMe && item.lastMessage && (
              <Ionicons
                name={
                  item.lastMessage.id?.startsWith('temp-')
                    ? 'time-outline'
                    : item.lastMessage.readAt
                      ? 'checkmark-done'
                      : 'checkmark'
                }
                size={item.lastMessage.id?.startsWith('temp-') ? 13 : 14}
                color={
                  item.lastMessage.id?.startsWith('temp-')
                    ? colors.text.tertiary
                    : item.lastMessage.readAt
                      ? '#60a5fa'
                      : colors.text.tertiary
                }
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {item.lastMessage
                ? `${isSentByMe ? 'You: ' : ''}${item.lastMessage.content}`
                : 'Say hello! 👋'}
            </Text>
          </View>
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 9 ? '9+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.emptyIconGradient}
      >
        <Ionicons name="chatbubbles-outline" size={48} color={colors.text.primary} />
      </LinearGradient>
    </View>
    <Text style={styles.emptyTitle}>No Messages Yet</Text>
    <Text style={styles.emptySubtitle}>
      When you match with someone, your{'\n'}conversations will appear here
    </Text>
  </View>
);

export const ChatListScreen = () => {
  const dispatch = useDispatch();
  const conversations = useSelector((state: RootState) => state.chat.conversations);
  const isLoading = useSelector((state: RootState) => state.chat.isLoadingConversations);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const fetchConversations = useCallback(async () => {
    try {
      dispatch(setLoadingConversations(true));
      const response = await api.get('/chat/conversations');
      if (response.data?.success) {
        dispatch(setConversations(response.data.data));
      }
    } catch (err) {
      console.error('[ChatList] Error fetching conversations:', err);
    } finally {
      dispatch(setLoadingConversations(false));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const totalUnread = conversations.reduce((sum: number, c: Conversation) => sum + c.unreadCount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.matchId}
        renderItem={({ item }) => (
          <ConversationItem item={item} currentUserId={currentUserId} />
        )}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchConversations}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  // List
  listContent: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 88,
  },
  // Conversation Item
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    flex: 1,
    marginRight: 8,
  },
  userNameUnread: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  timeTextUnread: {
    color: colors.primary,
    fontWeight: '600',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.text.tertiary,
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
