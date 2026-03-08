import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import EmojiPicker from 'rn-emoji-keyboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { api } from '../../../services/api';
import { getSocket, initSocket } from '../../../services/socket';
import {
  setMessages,
  prependMessages,
  addMessage,
  markConversationRead,
  setTyping,
  setLoadingMessages,
  replaceOptimisticMessage,
  Message,
} from '../../../store/chatSlice';
import { colors } from '../../../core/theme/colors';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop';

interface RouteParams {
  matchId: string;
  userName: string;
  userAvatar: string | null;
  userId: string;
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// Group messages by date for section headers
function groupMessagesByDate(messages: Message[]): { date: string; data: Message[] }[] {
  const groups: Record<string, Message[]> = {};
  for (const msg of messages) {
    const dateKey = new Date(msg.sentAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
  }
  return Object.entries(groups).map(([date, data]) => ({
    date,
    data,
  }));
}

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    };
    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 150);
    const a3 = animateDot(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.typingDot,
              { transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const MessageBubble = ({ message, isMe, showTime }: { message: Message; isMe: boolean; showTime: boolean }) => {
  return (
    <View style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}>
      <View
        style={[
          styles.bubble,
          isMe ? styles.bubbleSent : styles.bubbleReceived,
        ]}
      >
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextSent : styles.bubbleTextReceived]}>
          {message.content}
        </Text>
        <View style={styles.bubbleMeta}>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeSent : styles.bubbleTimeReceived]}>
            {formatMessageTime(message.sentAt)}
          </Text>
          {isMe && (
            <Ionicons
              name={
                message.id.startsWith('temp-')
                  ? 'time-outline'          // ⏱ Pending — not yet confirmed
                  : message.readAt
                    ? 'checkmark-done'       // ✓✓ Read
                    : 'checkmark'            // ✓ Sent
              }
              size={message.id.startsWith('temp-') ? 13 : 14}
              color={
                message.id.startsWith('temp-')
                  ? 'rgba(255,255,255,0.35)' // Dimmed clock
                  : message.readAt
                    ? '#60a5fa'               // Blue for read
                    : 'rgba(255,255,255,0.4)' // Grey for sent
              }
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { matchId, userName, userAvatar, userId } = route.params as RouteParams;
  const dispatch = useDispatch();

  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const messages = useSelector((state: RootState) => state.chat.activeMessages[matchId] || []);
  const isLoading = useSelector((state: RootState) => state.chat.isLoadingMessages);
  const typingSenderId = useSelector((state: RootState) => state.chat.typingUsers[matchId]);

  const [text, setText] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const optimisticIdsRef = useRef<Set<string>>(new Set()); // Track optimistic messages to avoid duplicates

  // Fetch messages — smart: uses cache if available, only fetches new ones
  const fetchMessages = useCallback(async (cursor?: string) => {
    try {
      dispatch(setLoadingMessages(true));
      const params: any = { limit: 30 };
      if (cursor) params.cursor = cursor;
      const response = await api.get(`/chat/${matchId}/messages`, { params });
      if (response.data?.success) {
        const result = response.data.data;
        // Messages come newest-first from API, reverse for display (oldest at top)
        const reversed = [...result.messages].reverse();
        if (cursor) {
          dispatch(prependMessages({ matchId, messages: reversed }));
        } else {
          dispatch(setMessages({ matchId, messages: reversed }));
        }
        setNextCursor(result.nextCursor);
        setHasMore(result.hasMore);
      }
    } catch (err) {
      console.error('[Chat] Error fetching messages:', err);
    } finally {
      dispatch(setLoadingMessages(false));
    }
  }, [dispatch, matchId]);

  // Fetch only new messages since our latest cached message
  const fetchNewMessages = useCallback(async () => {
    try {
      const cachedMessages = messages.filter(m => !m.id.startsWith('temp-'));
      if (cachedMessages.length === 0) return fetchMessages(); // No cache, full fetch

      const latestMsg = cachedMessages[cachedMessages.length - 1];
      const response = await api.get(`/chat/${matchId}/messages`, {
        params: { since: latestMsg.sentAt },
      });
      if (response.data?.success) {
        const newMsgs: Message[] = response.data.data.messages;
        // Only add messages we don't already have
        for (const msg of newMsgs) {
          dispatch(addMessage(msg));
        }
      }
    } catch (err) {
      console.error('[Chat] Error fetching new messages:', err);
    }
  }, [dispatch, matchId, messages, fetchMessages]);

  useEffect(() => {
    // If we already have cached messages, just sync the delta
    const hasCachedMessages = messages.length > 0 && !messages[0]?.id.startsWith('temp-');
    if (hasCachedMessages) {
      fetchNewMessages();
    } else {
      fetchMessages();
    }
    // Mark as read when entering
    api.patch(`/chat/${matchId}/read`).catch(() => {});
    dispatch(markConversationRead(matchId));
  }, [matchId]);

  // Socket.IO setup
  useEffect(() => {
    initSocket();
    const socket = getSocket();
    if (!socket) return;

    // Join this match room
    socket.emit('join_match_room', matchId);

    // Listen for new messages
    const handleNewMessage = (msg: Message) => {
      // If this is our own message echoed back, replace the optimistic version
      if (msg.senderId === currentUserId && optimisticIdsRef.current.size > 0) {
        // Find and remove the oldest optimistic ID (they arrive in order)
        const firstOptimisticId = optimisticIdsRef.current.values().next().value;
        if (firstOptimisticId) {
          optimisticIdsRef.current.delete(firstOptimisticId);
          // Replace the optimistic message with the real one
          dispatch(replaceOptimisticMessage({ tempId: firstOptimisticId, realMessage: msg }));
          return;
        }
      }
      dispatch(addMessage(msg));
      // Auto-mark as read if we're currently viewing this chat
      if (msg.senderId !== currentUserId) {
        api.patch(`/chat/${matchId}/read`).catch(() => {});
        socket.emit('message_read', { matchId });
      }
    };

    // Listen for read receipts
    const handleMessagesRead = (data: { matchId: string; readBy: string }) => {
      // If the other user read our messages, we could update readAt here
      // For now, re-fetch to refresh
      if (data.readBy !== currentUserId) {
        fetchMessages();
      }
    };

    // Typing indicators
    const handleTypingStart = (data: { senderId: string; matchId: string }) => {
      if (data.matchId === matchId && data.senderId !== currentUserId) {
        dispatch(setTyping({ matchId, senderId: data.senderId }));
      }
    };
    const handleTypingStop = (data: { senderId: string; matchId: string }) => {
      if (data.matchId === matchId && data.senderId !== currentUserId) {
        dispatch(setTyping({ matchId, senderId: null }));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      dispatch(setTyping({ matchId, senderId: null }));
    };
  }, [matchId, currentUserId, dispatch]);

  // Send message — optimistic UI: show instantly, confirm with server
  const handleSend = useCallback(async () => {
    if (!text.trim() || isSending) return;
    const content = text.trim();
    setText('');

    // Emit typing stop
    const socket = getSocket();
    if (socket && isTypingRef.current) {
      socket.emit('typing_stop', { matchId });
      isTypingRef.current = false;
    }

    // Create an optimistic message that shows immediately
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMsg: Message = {
      id: tempId,
      content,
      senderId: currentUserId,
      sentAt: new Date().toISOString(),
      readAt: null,
      matchId,
    };

    // Show it instantly in the UI
    dispatch(addMessage(optimisticMsg));
    optimisticIdsRef.current.add(tempId);

    // Send to server in background
    try {
      if (socket?.connected) {
        socket.emit('send_message', { matchId, content }, (response: any) => {
          if (response?.success) {
            // Replace optimistic with real message using the server acknowledgment
            optimisticIdsRef.current.delete(tempId);
            dispatch(replaceOptimisticMessage({ tempId, realMessage: response.message }));
          } else {
            // Fallback to REST
            api.post(`/chat/${matchId}/messages`, { content }).then((res) => {
              if (res.data?.success) {
                optimisticIdsRef.current.delete(tempId);
                dispatch(replaceOptimisticMessage({ tempId, realMessage: res.data.data }));
              }
            }).catch(console.error);
          }
        });
      } else {
        const response = await api.post(`/chat/${matchId}/messages`, { content });
        if (response.data?.success) {
          // Replace optimistic with real message
          optimisticIdsRef.current.delete(tempId);
          dispatch(replaceOptimisticMessage({ tempId, realMessage: response.data.data }));
        }
      }
    } catch (err) {
      console.error('[Chat] Error sending message:', err);
    }
  }, [text, matchId, dispatch, isSending, currentUserId]);

  // Handle typing indicator
  const handleTextChange = useCallback((value: string) => {
    setText(value);
    const socket = getSocket();
    if (!socket) return;

    if (!isTypingRef.current && value.length > 0) {
      socket.emit('typing_start', { matchId });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit('typing_stop', { matchId });
        isTypingRef.current = false;
      }
    }, 2000);
  }, [matchId]);

  // Load older messages
  const handleLoadMore = useCallback(() => {
    if (hasMore && nextCursor && !isLoading) {
      fetchMessages(nextCursor);
    }
  }, [hasMore, nextCursor, isLoading, fetchMessages]);

  // Build flat list data with date separators
  const renderData = React.useMemo(() => {
    const items: (Message | { type: 'date'; date: string })[] = [];
    let lastDateKey = '';
    for (const msg of messages) {
      const dateKey = new Date(msg.sentAt).toDateString();
      if (dateKey !== lastDateKey) {
        items.push({ type: 'date', date: msg.sentAt });
        lastDateKey = dateKey;
      }
      items.push(msg);
    }
    return items;
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled={!showEmoji}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Image source={{ uri: userAvatar || DEFAULT_AVATAR }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{userName}</Text>
          {typingSenderId ? (
            <Text style={styles.headerStatus}>typing...</Text>
          ) : (
            <Text style={styles.headerStatusOffline}>tap for info</Text>
          )}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={renderData}
        keyExtractor={(item, index) => ('type' in item ? `date-${index}` : item.id)}
        renderItem={({ item, index }) => {
          if ('type' in item && item.type === 'date') {
            return (
              <View style={styles.dateSeparator}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>{formatDateSeparator(item.date)}</Text>
                <View style={styles.dateLine} />
              </View>
            );
          }
          const msg = item as Message;
          const isMe = msg.senderId === currentUserId;
          return <MessageBubble message={msg} isMe={isMe} showTime={true} />;
        }}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          isLoading && hasMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null
        }
        ListFooterComponent={typingSenderId ? <TypingIndicator /> : null}
        onContentSizeChange={() => {
          // Auto-scroll to bottom on new message
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {/* Emoji Picker */}
      <EmojiPicker
        onEmojiSelected={(emoji: any) => {
          setText((prev: string) => prev + emoji.emoji);
        }}
        open={showEmoji}
        onClose={() => {
          setShowEmoji(false);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        theme={{
          backdrop: 'transparent',
          knob: colors.text.tertiary,
          container: colors.surface,
          header: colors.text.primary,
          skinTonesContainer: colors.background,
          category: {
            icon: colors.text.tertiary,
            iconActive: colors.primary,
            container: colors.surface,
            containerActive: colors.background,
          },
          search: {
            text: colors.text.primary,
            placeholder: colors.text.tertiary,
            icon: colors.text.tertiary,
            background: colors.background,
          },
          emoji: {
            selected: colors.background,
          },
        }}
        styles={{
          category: {
            icon: { fontSize: 22 },
            container: { paddingVertical: 8 },
          },
        }}
        enableSearchBar
        enableRecentlyUsed
        categoryPosition="top"
        defaultHeight="40%"
        expandedHeight="60%"
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          onPress={() => {
            if (showEmoji) {
              // Switching from emoji to keyboard
              setShowEmoji(false);
              setTimeout(() => inputRef.current?.focus(), 100);
            } else {
              // Switching from keyboard to emoji
              Keyboard.dismiss();
              setTimeout(() => setShowEmoji(true), 100);
            }
          }}
          style={styles.emojiToggle}
        >
          <Ionicons
            name={showEmoji ? 'keypad-outline' : 'happy-outline'}
            size={26}
            color={showEmoji ? colors.primary : colors.text.tertiary}
          />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.tertiary}
            value={text}
            onChangeText={handleTextChange}
            onFocus={() => setShowEmoji(false)}
            multiline
            maxLength={2000}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || isSending}
          style={styles.sendButtonContainer}
        >
          <LinearGradient
            colors={text.trim() ? [colors.primary, colors.accent] : ['#333', '#333']}
            style={styles.sendButton}
          >
            {isSending ? (
              <ActivityIndicator color={colors.text.primary} size="small" />
            ) : (
              <Ionicons name="send" size={20} color={text.trim() ? colors.text.primary : colors.text.tertiary} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerStatus: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
    marginTop: 1,
  },
  headerStatusOffline: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  // Messages
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  // Date Separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dateText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginHorizontal: 12,
    fontWeight: '600',
  },
  // Message Bubble
  messageRow: {
    marginBottom: 4,
  },
  messageRowRight: {
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleSent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextSent: {
    color: '#fff',
  },
  bubbleTextReceived: {
    color: colors.text.primary,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 11,
  },
  bubbleTimeSent: {
    color: 'rgba(255,255,255,0.6)',
  },
  bubbleTimeReceived: {
    color: colors.text.tertiary,
  },
  // Typing Indicator
  typingContainer: {
    paddingVertical: 8,
    paddingLeft: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.text.tertiary,
  },
  // Input Bar
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: colors.text.primary,
    maxHeight: 100,
  },
  sendButtonContainer: {
    alignSelf: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Emoji
  emojiToggle: {
    alignSelf: 'center',
    padding: 4,
  },
});
