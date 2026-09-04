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
  ScrollView,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { VoiceRecordBar } from '../components/VoiceRecordBar';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, withSpring } from 'react-native-reanimated';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { RootState } from '../../../store';
import { api } from '../../../services/api';
import { getSocket, initSocket } from '../../../services/socket';
import { addToOfflineQueue, getOfflineQueue, setupQueueRetry, retryOfflineMessages, removeFromQueue, triggerQueueRetry } from '../../../services/offlineQueue';
import {
  setMessages,
  prependMessages,
  addMessage,
  markConversationRead,
  setTyping,
  setLoadingMessages,
  replaceOptimisticMessage,
  removeMessage,
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

import { MessageBubble } from '../components/MessageBubble';
import { CropModal } from '../components/CropModal';
import { MediaWorkspace } from '../components/MediaWorkspace';

interface SelectedMedia {
  originalUri: string;
  currentUri: string;
  caption?: string;
}

export const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { matchId, userName, userAvatar, userId } = route.params as RouteParams;
  const dispatch = useDispatch();

  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const messages = useSelector(
    (state: RootState) => state.chat.activeMessages[matchId] ?? [],
    (a, b) => {
      if (a.length !== b.length) return false;
      // Stable comparison: check if all IDs match in order
      for (let i = 0; i < a.length; i++) {
        if (a[i]?.id !== b[i]?.id) return false;
      }
      return true;
    }
  );
  const isLoading = useSelector((state: RootState) => state.chat.isLoadingMessages);
  const typingSenderId = useSelector((state: RootState) => state.chat.typingUsers[matchId] ?? null);

  const [text, setText] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedMedia[]>([]);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [photoToCrop, setPhotoToCrop] = useState<string | null>(null);
  const [cropIndex, setCropIndex] = useState<number>(-1);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const scrollBtnScale = useSharedValue(0);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const optimisticIdsRef = useRef<Map<string, {tempId: string, realId?: string, sentAt: number, sequenceNum: number, content: string}>>(new Map());
  const messageSequenceRef = useRef<number>(0); // Track message order like WhatsApp
  const pendingServerAcksRef = useRef<Map<string, any>>(new Map()); // Buffer for out-of-order arrivals
  const processedServerIdsRef = useRef<Set<string>>(new Set()); // Server IDs already handled by callbacks — skip in new_message
  const messageIdsRef = useRef<Set<string>>(new Set()); // Fresh dedup set, updated on every messages change
  const queueRetryInProgressRef = useRef(false); // Prevent double retry (mount + connect event)
  const isScrolledUpRef = useRef(false);
  const isScrollingDownRef = useRef(false);

  const emojiHeight = useSharedValue(0);
  const [keyboardHeight, setKeyboardHeight] = useState(300); // Dynamic fallback
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const prevKeyboardHeight = useSharedValue(0);
  const savedKeyboardHeight = useSharedValue(keyboardHeight);
  const isAndroid = useSharedValue(Platform.OS === 'android');

  // Frame-by-frame synchronized keyboard positioning
  useKeyboardHandler(
    {
      onMove: (e) => {
        'worklet';
        const absHeight = Math.abs(e.height);
        const isRising = absHeight > prevKeyboardHeight.value;
        prevKeyboardHeight.value = absHeight;

        // Only allow keyboard tracking to adjust spacer if Emoji is NOT open
        if (!showEmoji) {
          emojiHeight.value = absHeight;
        } else {
          // If emoji is open but keyboard starts RISING (e.g., tapped text input)
          if (isRising && absHeight > 10) {
            runOnJS(setShowEmoji)(false);
            // Smooth transition: deduce from fully loaded offset avoids collapse jumps
            emojiHeight.value = Math.max(0, savedKeyboardHeight.value - absHeight);
          }
        }
      },
      onEnd: (e) => {
        'worklet';
        const absHeight = Math.abs(e.height);
        prevKeyboardHeight.value = absHeight; // Sync at end frame

        if (e.height > 0) {
          savedKeyboardHeight.value = e.height; // Cache fully opened height
          runOnJS(setKeyboardHeight)(e.height);
          runOnJS(setIsKeyboardVisible)(true);
        } else {
          runOnJS(setIsKeyboardVisible)(false);
          if (!showEmoji) {
            emojiHeight.value = 0;
          }
        }
      },
    },
    [showEmoji]
  );

  // Keep messageIdsRef in sync with messages (avoids stale closure in socket handlers)
  useEffect(() => {
    const idSet = new Set(messages.map(m => m.id));
    messageIdsRef.current = idSet;
  }, [messages]);

  // Fetch messages — smart: uses cache if available, only fetches new ones
  const fetchMessages = useCallback(async (cursor?: string) => {
    try {
      dispatch(setLoadingMessages(true));
      const params: any = { limit: 30 };
      if (cursor) params.cursor = cursor;
      const response = await api.get(`/chat/${matchId}/messages`, { params });
      if (response.data?.success) {
        const result = response.data.data;
        // Messages come newest-first from API, keep as is for inverted list
        if (cursor) {
          dispatch(prependMessages({ matchId, messages: result.messages }));
        } else {
          dispatch(setMessages({ matchId, messages: result.messages }));
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

  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    
    if (isScrollingDownRef.current) {
      if (offset < 10) isScrollingDownRef.current = false;
      return;
    }

    const isUp = offset > 100;
    setShowScrollDown(isUp);
    isScrolledUpRef.current = isUp;
    if (!isUp) {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (showScrollDown) {
      scrollBtnScale.value = 1; // Instant show
    } else {
      scrollBtnScale.value = withTiming(0, { duration: 200 }); // Smooth vanish
    }
  }, [showScrollDown]);

  const animatedScrollBtnStyle = useAnimatedStyle(() => {
    return {
      opacity: scrollBtnScale.value,
      transform: [{ scale: scrollBtnScale.value }],
    };
  });

  // Fetch only new messages since our latest cached message
  const fetchNewMessages = useCallback(async () => {
    try {
      const cachedMessages = messages.filter(m => !m.id.startsWith('temp-'));
      if (cachedMessages.length === 0) return fetchMessages(); // No cache, full fetch

      // For inverted list: index 0 is newest, last index is oldest
      const oldestMsg = cachedMessages[cachedMessages.length - 1];
      const response = await api.get(`/chat/${matchId}/messages`, {
        params: { since: oldestMsg.sentAt },
      });
      if (response.data?.success) {
        const newMsgs: Message[] = response.data.data.messages;
        // Messages come ASC from API (oldest first) when using 'since' param
        // This is CORRECT for adding to inverted list - they'll be prepended in right order
        for (const msg of newMsgs) {
          // Deduplication check
          if (!messages.some(m => m.id === msg.id)) {
            dispatch(addMessage(msg));
          }
        }
      }
    } catch (err) {
      console.error('[Chat] Error fetching new messages:', err);
    }
  }, [dispatch, matchId, messages, fetchMessages]);

  useEffect(() => {
    // If we have ANY cached messages (including temp/optimistic), sync delta only.
    // NEVER call fetchMessages() when temp messages exist — it would wipe them.
    if (messages.length > 0) {
      fetchNewMessages();
    } else {
      fetchMessages();
    }
    // Mark as read when entering
    api.patch(`/chat/${matchId}/read`).catch(() => {});
    dispatch(markConversationRead(matchId));
    
    // Cleanup on unmount: clear typing indicator
    return () => {
      const socket = getSocket();
      if (socket && isTypingRef.current) {
        socket.emit('typing_stop', { matchId });
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [matchId]);

  // Socket.IO setup
  useEffect(() => {
    initSocket();
    const socket = getSocket();
    if (!socket) return;

    // Queue Retry Trigger Setup
    setupQueueRetry(socket);
    
    // Shared retry function — registers optimistic IDs, then retries with per-message callback
    const performQueueRetry = async () => {
      if (queueRetryInProgressRef.current) {
        console.log('[Chat] Queue retry already in progress, skipping');
        return;
      }
      queueRetryInProgressRef.current = true;
      
      try {
        // Register queued messages into optimisticIdsRef BEFORE retry
        const queue = await getOfflineQueue();
        const matchQueue = queue.filter(m => m.matchId === matchId);
        for (const item of matchQueue) {
          if (!optimisticIdsRef.current.has(item.tempId)) {
            optimisticIdsRef.current.set(item.tempId, {
              tempId: item.tempId,
              sentAt: item.queuedAt,
              sequenceNum: item.sequenceNum ?? 0,
              content: item.content,
            });
          }
        }
        
        // Per-message callback: fires IMMEDIATELY when server confirms each message
        // This beats the new_message broadcast, preventing duplicates and content swaps
        await triggerQueueRetry(socket, matchId, (queuedMsg, serverMessage) => {
          console.log(`[Chat] Queue callback: ${queuedMsg.tempId} -> ${serverMessage.id}`);
          // Mark server ID as processed BEFORE broadcast arrives
          processedServerIdsRef.current.add(serverMessage.id);
          // Remove from optimistic tracking
          optimisticIdsRef.current.delete(queuedMsg.tempId);
          // DON'T dispatch replaceOptimisticMessage — message stays as-is in UI
          // Server data will sync on next chat open via fetchMessages
        });
      } catch (err) {
        console.error('[Chat] Queue retry failed:', err);
      } finally {
        queueRetryInProgressRef.current = false;
      }
    };
    
    if (socket.connected) {
      performQueueRetry();
    }

    // Join this match room
    socket.emit('join_match_room', matchId);

    // Listen for new messages
    const handleNewMessage = (msg: Message) => {
      console.log('[Chat] new_message:', msg.id, 'from:', msg.senderId === currentUserId ? 'me' : 'other');
      
      // WHATSAPP-STYLE: Completely skip our own messages from broadcast.
      // Own messages are already in the UI as optimistic bubbles.
      // The send callback handles confirmation. The broadcast is redundant.
      if (msg.senderId === currentUserId) {
        processedServerIdsRef.current.add(msg.id);
        // Cleanup: remove from optimisticIdsRef if content matches
        if (optimisticIdsRef.current.size > 0) {
          const sortedEntries = Array.from(optimisticIdsRef.current.entries())
            .sort((a, b) => a[1].sequenceNum - b[1].sequenceNum);
          for (const [key, value] of sortedEntries) {
            if (value.content === msg.content) {
              optimisticIdsRef.current.delete(key);
              break;
            }
          }
        }
        return; // NEVER add/replace own messages from broadcast
      }
      
      // --- Only OTHER users' messages reach here ---
      
      // Deduplication check
      if (messageIdsRef.current.has(msg.id)) {
        return;
      }
      
      dispatch(addMessage(msg));
      
      // Add local unread count if scrolled up
      if (isScrolledUpRef.current) {
        setUnreadCount(prev => prev + 1);
      }

      // Auto-mark as read
      api.patch(`/chat/${matchId}/read`).catch(() => {});
      socket.emit('message_read', { matchId });
    };

    // Listen for read receipts — DON'T re-fetch (would risk wiping temp messages)
    const handleMessagesRead = (_data: { matchId: string; readBy: string }) => {
      // Read receipts are status updates, not new data.
      // The UI will reflect read status on next natural message fetch.
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

    // Listen for deleted messages
    const handleMessageDeleted = (data: { messageId: string; matchId: string }) => {
      if (data.matchId === matchId) {
        dispatch(removeMessage({ matchId, messageId: data.messageId }));
      }
    };

    // Connection status monitoring with retry logic
    const handleConnect = async () => {
      setConnectionStatus('connected');
      // Trigger offline queue retry when connection is restored
      setTimeout(() => performQueueRetry(), 1000); // Wait 1 second for stable connection
    };
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleReconnectAttempt = () => setConnectionStatus('reconnecting');

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      dispatch(setTyping({ matchId, senderId: null }));
    };
  }, [matchId, currentUserId, dispatch]);

  // Send message — optimistic UI: show instantly, confirm with server
  const handleSend = useCallback(async () => {
    if ((!text.trim() && selectedImages.length === 0) || isSending) return;
    
    const captionsCount = selectedImages.filter(img => img.caption && img.caption.trim()).length;
    const shouldSplit = captionsCount > 1;

    setIsSending(true);

    // Emit typing stop
    const socket = getSocket();
    if (socket && isTypingRef.current) {
      socket.emit('typing_stop', { matchId });
      isTypingRef.current = false;
    }

    try {
      if (shouldSplit) {
        // 1. Upload all images in parallel
        const uploadPromises = selectedImages.map(async (img) => {
          const ext = img.currentUri.split('.').pop() || 'jpeg';
          const urlResponse = await api.get(`/chat/${matchId}/media/upload-url?ext=${ext}`);
          if (urlResponse.data?.success) {
            const { uploadUrl, mediaKey } = urlResponse.data.data;
            const imgResponse = await fetch(img.currentUri);
            const blob = await imgResponse.blob();
            await fetch(uploadUrl, {
              method: 'PUT',
              body: blob,
              headers: { 'Content-Type': `image/${ext}` },
            });
            return { mediaKey, caption: img.caption || '', localUri: img.currentUri };
          }
          throw new Error('Failed to upload image');
        });

        const uploadedMedia = await Promise.all(uploadPromises);

        // 2. Clear inputs
        setText('');
        setSelectedImages([]);

        // 3. Create optimistic messages with UNIQUE IDs and SEQUENCE NUMBERS (WhatsApp-style)
        const baseTime = Date.now();
        const messagesToSend = uploadedMedia.map((item, index) => {
          const tempId = `temp-${baseTime}-${index}-${Math.random().toString(36).slice(2, 7)}`;
          const sentAt = new Date(baseTime + index).toISOString(); // Ensure unique timestamps
          const sequenceNum = ++messageSequenceRef.current; // Increment sequence like WhatsApp
          
          const optimisticMsg: Message = {
            id: tempId,
            content: item.caption,
            mediaKeys: [`local-${item.localUri}`],
            senderId: currentUserId!,
            sentAt,
            readAt: null,
            matchId,
          };
          return { tempId, optimisticMsg, item, sentAt, sequenceNum };
        });

        messagesToSend.forEach(m => {
          dispatch(addMessage(m.optimisticMsg));
          optimisticIdsRef.current.set(m.tempId, { 
            tempId: m.tempId, 
            sentAt: Date.now(),
            sequenceNum: m.sequenceNum,
            content: m.item.caption // Store content for accurate matching
          });
        });

        // 4. Send SEQUENTIALLY to preserve order (with retry logic)
        for (const m of messagesToSend) {
          let sent = false;
          let attempts = 0;
          const maxAttempts = 3;
          
          while (!sent && attempts < maxAttempts) {
            try {
              // Check connection status BEFORE attempting
              const isConnected = socket?.connected === true;
              
              if (!isConnected && attempts === 0) {
                // Immediately queue if offline on first attempt
                await addToOfflineQueue({
                  tempId: m.tempId,
                  matchId,
                  content: m.item.caption,
                  mediaKeys: [m.item.mediaKey],
                  queuedAt: Date.now(),
                  status: 'pending',
                  sequenceNum: m.sequenceNum, // Preserve original send order
                });
                console.log(`[Chat] Message ${m.tempId} queued (offline) with sequence ${m.sequenceNum}`);
              }
              
              await new Promise<void>((resolve, reject) => {
                // Add to offline queue BEFORE sending (idempotent)
                addToOfflineQueue({
                  tempId: m.tempId,
                  matchId,
                  content: m.item.caption,
                  mediaKeys: [m.item.mediaKey],
                  queuedAt: Date.now(),
                  status: 'sending',
                  sequenceNum: m.sequenceNum, // Preserve original send order
                }).catch(err => console.error('[Chat] Failed to queue:', err));

                const socketTimeout = setTimeout(() => {
                  console.log(`[Chat] Socket timeout for message ${m.tempId}`);
                  reject(new Error('Socket timeout'));
                }, 10000); // 10 second timeout

                // Only try socket if connected
                if (isConnected) {
                  socket.emit('send_message', { 
                    matchId, 
                    content: m.item.caption, 
                    mediaKeys: [m.item.mediaKey] 
                  }, (response: any) => {
                    clearTimeout(socketTimeout);
                    if (response?.success && response.message) {
                      // Successfully sent - remove from queue and update UI
                      removeFromQueue(m.tempId).catch(err => console.error('[Chat] Failed to remove from queue:', err));
                      optimisticIdsRef.current.delete(m.tempId);
                      processedServerIdsRef.current.add(response.message.id);
                      dispatch(replaceOptimisticMessage({ tempId: m.tempId, realMessage: response.message }));
                      sent = true;
                    } else if (response?.error === 'duplicate') {
                      // Server detected duplicate - already handled
                      removeFromQueue(m.tempId).catch(err => console.error('[Chat] Failed to remove from queue:', err));
                      optimisticIdsRef.current.delete(m.tempId);
                      sent = true;
                    }
                    resolve();
                  });
                } else {
                  clearTimeout(socketTimeout);
                  // Don't reject immediately - let it queue and retry later
                  resolve();
                }
              });
              
              // If socket wasn't connected, break and wait for reconnection
              if (!isConnected) {
                console.log(`[Chat] Waiting for reconnection to send message ${m.tempId}`);
                break; // Exit retry loop, message stays in queue
              }
              
            } catch (err) {
              attempts++;
              console.log(`[Chat] Send attempt ${attempts}/${maxAttempts} failed for message ${m.tempId}`);
              
              if (attempts >= maxAttempts) {
                // Final fallback to REST API only if we have connection
                const isConnected = socket?.connected === true;
                if (isConnected) {
                  try {
                    const response = await api.post(`/chat/${matchId}/messages`, { 
                      content: m.item.caption, 
                      mediaKeys: [m.item.mediaKey] 
                    });
                    if (response.data?.success && optimisticIdsRef.current.has(m.tempId)) {
                      optimisticIdsRef.current.delete(m.tempId);
                      processedServerIdsRef.current.add(response.data.data.id);
                      dispatch(replaceOptimisticMessage({ tempId: m.tempId, realMessage: response.data.data }));
                      removeFromQueue(m.tempId).catch(err => console.error('[Chat] Failed to remove from queue:', err));
                      sent = true;
                      console.log(`[Chat] Message ${m.tempId} sent via REST fallback`);
                    }
                  } catch (restErr) {
                    console.error('[Chat] REST fallback failed:', restErr);
                    // Message stays in queue for later retry
                  }
                } else {
                  console.log(`[Chat] Still offline, keeping message ${m.tempId} in queue`);
                }
              } else {
                // Wait before retry (exponential backoff)
                const delay = Math.pow(2, attempts) * 1000;
                console.log(`[Chat] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }
        }

      } else {
        // Condition B: Grouped send with retry logic
        let content = text.trim();
        const captions = selectedImages.map(img => img.caption).filter(Boolean);
        if (captions.length > 0) {
          content = content ? `${content}\n\n${captions.join('\n')}` : captions.join('\n');
        }
        
        const imageUris = selectedImages.map(img => img.currentUri);
        
        setText('');
        setSelectedImages([]);

        // Unique ID generation
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const sentAt = new Date().toISOString();
        const optimisticMsg: Message = {
          id: tempId,
          content,
          mediaKeys: imageUris.map(uri => `local-${uri}`),
          senderId: currentUserId!,
          sentAt,
          readAt: null,
          matchId,
        };

        dispatch(addMessage(optimisticMsg));
        const seqNum = ++messageSequenceRef.current;
        optimisticIdsRef.current.set(tempId, { 
          tempId, 
          sentAt: Date.now(),
          sequenceNum: seqNum,
          content // Store COMPUTED content (with captions), not raw text
        });

        let finalMediaKeys: string[] = [];

        if (imageUris.length > 0) {
          const uploadPromises = imageUris.map(async (imageUri) => {
            const ext = imageUri.split('.').pop() || 'jpeg';
            const urlResponse = await api.get(`/chat/${matchId}/media/upload-url?ext=${ext}`);
            if (urlResponse.data?.success) {
              const { uploadUrl, mediaKey } = urlResponse.data.data;
              const imgResponse = await fetch(imageUri);
              const blob = await imgResponse.blob();
              await fetch(uploadUrl, {
                method: 'PUT',
                body: blob,
                headers: { 'Content-Type': `image/${ext}` },
              });
              return mediaKey;
            }
            throw new Error('Upload failed');
          });

          finalMediaKeys = await Promise.all(uploadPromises);
        }

        // Send with retry logic
        let sent = false;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!sent && attempts < maxAttempts) {
          try {
            // Check connection status BEFORE attempting
            const isConnected = socket?.connected === true;
            
            if (!isConnected && attempts === 0) {
              // Immediately queue if offline on first attempt
              await addToOfflineQueue({
                tempId,
                matchId,
                content,
                mediaKeys: finalMediaKeys,
                queuedAt: Date.now(),
                status: 'pending',
                sequenceNum: seqNum, // Use SAME sequence number (don't double-increment!)
              });
              console.log(`[Chat] Message ${tempId} queued (offline) with sequence ${messageSequenceRef.current}`);
            }
            
            await new Promise<void>((resolve, reject) => {
              // Add to offline queue BEFORE sending (idempotent)
              addToOfflineQueue({
                tempId,
                matchId,
                content,
                mediaKeys: finalMediaKeys,
                queuedAt: Date.now(),
                status: 'sending',
                sequenceNum: seqNum, // Use SAME sequence number
              }).catch(err => console.error('[Chat] Failed to queue:', err));

              const socketTimeout = setTimeout(() => {
                console.log(`[Chat] Socket timeout for message ${tempId}`);
                reject(new Error('Socket timeout'));
              }, 10000); // 10 second timeout

              // Only try socket if connected
              if (isConnected) {
                socket.emit('send_message', { matchId, content, mediaKeys: finalMediaKeys }, (response: any) => {
                  clearTimeout(socketTimeout);
                  if (response?.success && response.message) {
                    // Successfully sent - remove from queue and update UI
                    removeFromQueue(tempId).catch(err => console.error('[Chat] Failed to remove from queue:', err));
                    optimisticIdsRef.current.delete(tempId);
                    processedServerIdsRef.current.add(response.message.id);
                    dispatch(replaceOptimisticMessage({ tempId, realMessage: response.message }));
                    sent = true;
                  } else if (response?.error === 'duplicate') {
                    // Server detected duplicate - already handled
                    removeFromQueue(tempId).catch(err => console.error('[Chat] Failed to remove from queue:', err));
                    optimisticIdsRef.current.delete(tempId);
                    sent = true;
                  }
                  resolve();
                });
              } else {
                clearTimeout(socketTimeout);
                // Don't reject immediately - let it queue and retry later
                resolve();
              }
            });
            
            // If socket wasn't connected, break and wait for reconnection
            if (!isConnected) {
              console.log(`[Chat] Waiting for reconnection to send message ${tempId}`);
              break; // Exit retry loop, message stays in queue
            }
            
          } catch (err) {
            attempts++;
            console.log(`[Chat] Send attempt ${attempts}/${maxAttempts} failed for message ${tempId}`);
            
            if (attempts >= maxAttempts) {
              // Final fallback to REST API only if we have connection
              const isConnected = socket?.connected === true;
              if (isConnected) {
                try {
                  const response = await api.post(`/chat/${matchId}/messages`, { content, mediaKeys: finalMediaKeys });
                  if (response.data?.success && optimisticIdsRef.current.has(tempId)) {
                    optimisticIdsRef.current.delete(tempId);
                    processedServerIdsRef.current.add(response.data.data.id);
                    dispatch(replaceOptimisticMessage({ tempId, realMessage: response.data.data }));
                    removeFromQueue(tempId).catch(err => console.error('[Chat] Failed to remove from queue:', err));
                    sent = true;
                    console.log(`[Chat] Message ${tempId} sent via REST fallback`);
                  }
                } catch (restErr) {
                  console.error('[Chat] REST fallback failed:', restErr);
                  // Message stays in queue for later retry
                }
              } else {
                console.log(`[Chat] Still offline, keeping message ${tempId} in queue`);
              }
            } else {
              // Wait before retry (exponential backoff)
              const delay = Math.pow(2, attempts) * 1000;
              console.log(`[Chat] Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
      }
    } catch (err) {
      console.error('[Chat] Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  }, [text, selectedImages, matchId, dispatch, isSending, currentUserId]);

  const handleToggleEmoji = () => {
    if (showEmoji) {
      setShowEmoji(false);
      emojiHeight.value = withTiming(0, { duration: 150 });
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setShowEmoji(true);
      if (isKeyboardVisible) {
        emojiHeight.value = keyboardHeight; // Seize height instant
        Keyboard.dismiss();
      } else {
        emojiHeight.value = withTiming(keyboardHeight, { duration: 150 }); // smooth expand
      }
    }
  };

  const handleInputFocus = () => {
    if (showEmoji) {
      setShowEmoji(false);
    }
  };

  const handleSendVoiceNote = async (uri: string, _durationSec?: number) => {
    setIsSending(true);
    // Unique ID for voice note
    const tempId = `temp-voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const sentAt = new Date().toISOString();
    
    // Optimistic voice note message
    const optimisticMsg: Message = {
      id: tempId,
      content: _durationSec ? _durationSec.toString() : '',
      mediaKeys: [`local-voice-${uri}`], // recognized locally by Bubble layout
      senderId: currentUserId || '',
      sentAt,
      readAt: null,
      matchId,
    };
    
    dispatch(addMessage(optimisticMsg));
    optimisticIdsRef.current.set(tempId, { 
      tempId, 
      sentAt: Date.now(),
      sequenceNum: ++messageSequenceRef.current,
      content: optimisticMsg.content // Store content for accurate matching
    });

    let sent = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    try {
      const ext = 'm4a'; 
      const urlResponse = await api.get(`/chat/${matchId}/media/upload-url?ext=${ext}`);
      if (!urlResponse.data?.success) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadUrl, mediaKey } = urlResponse.data.data;
      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();
      
      await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'audio/m4a' },
      });

      // Send with retry logic
      while (!sent && attempts < maxAttempts) {
        try {
          await new Promise<void>((resolve, reject) => {
            addToOfflineQueue({
              tempId,
              matchId,
              content: _durationSec ? _durationSec.toString() : '',
              mediaKeys: [mediaKey],
              queuedAt: Date.now(),
              status: 'pending',
            });

            const socketTimeout = setTimeout(() => {
              reject(new Error('Socket timeout'));
            }, 10000);

            const socket = getSocket();
            if (socket?.connected) {
              socket.emit('send_message', { 
                matchId, 
                content: _durationSec ? _durationSec.toString() : '', 
                mediaKeys: [mediaKey] 
              }, (response: any) => {
                clearTimeout(socketTimeout);
                if (response?.success && response.message) {
                  if (optimisticIdsRef.current.has(tempId)) {
                    optimisticIdsRef.current.delete(tempId);
                    processedServerIdsRef.current.add(response.message.id);
                    dispatch(replaceOptimisticMessage({ tempId, realMessage: response.message }));
                    removeFromQueue(tempId);
                  }
                  sent = true;
                }
                resolve();
              });
            } else {
              clearTimeout(socketTimeout);
              reject(new Error('Socket not connected'));
            }
          });
        } catch (err) {
          attempts++;
          if (attempts >= maxAttempts) {
            console.error('[VoiceNote] All send attempts failed:', err);
            // Message stays in queue
          } else if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }
      }
    } catch (err) {
      console.error('[VoiceNote] Error sending voice note:', err);
      // Keep in queue for retry
    } finally {
      setIsSending(false);
    }
  };

  // Handle Image Selection
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const mediaItems = result.assets.map(asset => ({
          originalUri: asset.uri,
          currentUri: asset.uri,
        }));
        setSelectedImages(prev => [...prev, ...mediaItems]);
        setIsWorkspaceOpen(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleCropPress = (uri: string, index: number) => {
    setPhotoToCrop(uri);
    setCropIndex(index);
    setCropModalVisible(true);
  };

  const handleCropSave = (croppedUri: string) => {
    setSelectedImages(prev => {
      const newImages = [...prev];
      newImages[cropIndex] = {
        ...newImages[cropIndex],
        currentUri: croppedUri,
      };
      return newImages;
    });
    setCropModalVisible(false);
    setPhotoToCrop(null);
  };

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
      const dateKey = msg.sentAt ? new Date(msg.sentAt).toDateString() : '';
      if (dateKey !== lastDateKey) {
        items.push({ type: 'date', date: msg.sentAt });
        lastDateKey = dateKey;
      }
      items.push(msg);
    }
    return items;
  }, [messages]);

  const animatedSubContentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -emojiHeight.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Image source={{ uri: userAvatar || DEFAULT_AVATAR }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{userName}</Text>
          {typingSenderId ? (
            <Text style={styles.headerStatus}>typing...</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
              <View style={[
                styles.connectionDot,
                connectionStatus === 'connected' ? styles.connected : 
                connectionStatus === 'reconnecting' ? styles.reconnecting : styles.disconnected
              ]} />
              <Text style={styles.headerStatusOffline}>
                {connectionStatus === 'connected' ? 'online' : 
                 connectionStatus === 'reconnecting' ? 'reconnecting...' : 'offline'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Clipper Frame Acceleration */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <AnimatedReanimated.View style={[{ flex: 1 }, animatedSubContentStyle]}>
          {/* Messages */}
          <MessageList
            ref={flatListRef}
            messages={messages}
            currentUserId={currentUserId}
            onLoadMore={handleLoadMore}
            isLoading={isLoading}
            hasMore={hasMore}
            typingSenderId={typingSenderId}
            onScroll={handleScroll}
          />

          <AnimatedReanimated.View 
            style={[styles.scrollDownButtonWrapper, animatedScrollBtnStyle]}
            pointerEvents={showScrollDown ? 'auto' : 'none'}
          >
            <TouchableOpacity 
              style={styles.scrollDownButtonInner} 
              onPress={() => {
                isScrollingDownRef.current = true;
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                setUnreadCount(0);
                setShowScrollDown(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-down" size={24} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </AnimatedReanimated.View>

          {/* Input Bar */}
          <VoiceRecordBar
            ref={inputRef}
            text={text}
            setText={setText}
            onSend={handleSend}
            onPickImage={handlePickImage}
            onToggleEmoji={handleToggleEmoji}
            showEmoji={showEmoji}
            isSending={isSending}
            onSendVoiceNote={handleSendVoiceNote}
            onFocus={handleInputFocus}
          />
        </AnimatedReanimated.View>

        {/* Absolute Sibling for Touch & Fill Bounds (Android Fix) */}
        <AnimatedReanimated.View style={[{
          position: 'absolute',
          bottom: -350, // Expanded extends below glass edge 
          left: 0, right: 0,
          height: 350,
          backgroundColor: colors.surface
        }, animatedSubContentStyle]}>
          <EmojiKeyboard
            onEmojiSelected={(emoji: any) => {
              setText((prev: string) => prev + emoji.emoji);
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
            enableRecentlyUsed
            categoryPosition="top"
          />
        </AnimatedReanimated.View>
      </View>
      <MediaWorkspace
        visible={isWorkspaceOpen}
        images={selectedImages}
        setImages={setSelectedImages}
        onAddMore={handlePickImage}
        onClose={() => {
          setIsWorkspaceOpen(false);
          setSelectedImages([]);
        }}
        onSend={() => {
          setIsWorkspaceOpen(false);
          handleSend();
        }}
        onCropPress={(uri, index) => {
          setPhotoToCrop(uri);
          setCropIndex(index);
          setCropModalVisible(true);
        }}
      />

      {photoToCrop && (
        <CropModal
          visible={cropModalVisible}
          imageUri={photoToCrop}
          onCancel={() => {
            setCropModalVisible(false);
            setPhotoToCrop(null);
          }}
          onCropSave={handleCropSave}
        />
      )}
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
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connected: {
    backgroundColor: colors.success,
  },
  reconnecting: {
    backgroundColor: colors.accent,
  },
  disconnected: {
    backgroundColor: colors.error,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imagePreviewScroll: {
    maxHeight: 100,
    marginBottom: 10,
  },
  imagePreviewContent: {
    gap: 16,
    paddingHorizontal: 12,
    paddingTop: 8, // Space for the remove button
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  attachBtn: {
    padding: 4,
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
  scrollDownButtonWrapper: {
    position: 'absolute',
    bottom: 75,
    right: 16,
    zIndex: 10,
  },
  scrollDownButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  unreadBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

interface MessageListProps {
  messages: any[];
  currentUserId: string | null;
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
  typingSenderId: string | null;
  onScroll?: (event: any) => void;
}

const MessageList = React.memo(
  React.forwardRef<any, MessageListProps>(
    ({ messages, currentUserId, onLoadMore, isLoading, hasMore, typingSenderId, onScroll }, ref) => {
      // Build flat list data with date separators for inverted list (newest first)
      const renderData = React.useMemo(() => {
        const items: (any | { type: 'date'; date: string })[] = [];
        if (messages.length === 0) return items;

        // Messages are sorted DESC (newest first) for inverted list
        let currentDateKey = messages[0].sentAt ? new Date(messages[0].sentAt).toDateString() : '';
        let tempGroup: any[] = [];

        for (const msg of messages) {
          const msgDateKey = msg.sentAt ? new Date(msg.sentAt).toDateString() : '';
          if (msgDateKey !== currentDateKey) {
            // Flush current group (newer messages) then add date separator
            items.push(...tempGroup);
            // Date separator goes AFTER the newer group (appears BELOW in inverted list)
            if (tempGroup.length > 0) {
              // Use the FIRST message's date (oldest in this group)
              items.push({ type: 'date', date: tempGroup[tempGroup.length - 1].sentAt });
            }
            tempGroup = [];
            currentDateKey = msgDateKey;
          }
          tempGroup.push(msg);
        }
        // Flush final group
        if (tempGroup.length > 0) {
          items.push(...tempGroup);
          // Add date separator for oldest group
          items.push({ type: 'date', date: tempGroup[tempGroup.length - 1].sentAt });
        }
        return items;
      }, [messages]);

      const formatDateSeparator = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      };

      return (
        <FlatList
          ref={ref}
          data={renderData}
          keyExtractor={(item, index) => ('type' in item ? `date-${index}` : item.id)}
          inverted={true}
          onScroll={onScroll}
          scrollEventThrottle={16}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          windowSize={15}
          maxToRenderPerBatch={10}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={20}
          renderItem={({ item }) => {
            if ('type' in item && item.type === 'date') {
              return (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginVertical: 12,
                  paddingHorizontal: 16,
                }}>
                  <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <Text style={{
                    color: '#8E8E93',
                    fontSize: 12,
                    marginHorizontal: 12,
                    fontWeight: '500',
                  }}>{formatDateSeparator(item.date)}</Text>
                  <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </View>
              );
            }
            const msg = item;
            const isMe = msg.senderId === currentUserId;
            return <MessageBubble key={msg.id} message={msg} isMe={isMe} showTime={true} />;
          }}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          showsVerticalScrollIndicator={false}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={typingSenderId ? <TypingIndicator /> : null}
          ListFooterComponent={
            isLoading && hasMore ? (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <ActivityIndicator color="#007AFF" size="small" />
              </View>
            ) : null
          }
        />
      );
    }
  )
);
