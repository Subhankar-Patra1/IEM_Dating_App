import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface LastMessage {
  id: string;
  content: string;
  senderId: string;
  sentAt: string;
  isRead: boolean;
  readAt: string | null;
  mediaKey?: string;
  mediaKeys?: string[];
}

export interface Conversation {
  matchId: string;
  user: ChatUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sentAt: string;
  readAt: string | null;
  matchId: string;
  mediaKey?: string;
  mediaKeys?: string[];
}

interface ChatState {
  conversations: Conversation[];
  activeMessages: Record<string, Message[]>; // keyed by matchId
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: Record<string, string | null>; // matchId -> senderId who is typing
}

const initialState: ChatState = {
  conversations: [],
  activeMessages: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  typingUsers: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
      state.isLoadingConversations = false;
    },
    setLoadingConversations: (state, action: PayloadAction<boolean>) => {
      state.isLoadingConversations = action.payload;
    },
    setMessages: (state, action: PayloadAction<{ matchId: string; messages: Message[] }>) => {
      const serverMessages = action.payload.messages.filter(
        (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
      );
      
      // CRITICAL: Preserve pending temp messages that haven't been confirmed yet.
      // Without this, fetching from server wipes optimistic messages → "vanish and resend" bug.
      const existing = state.activeMessages[action.payload.matchId] || [];
      const pendingTempMessages = existing.filter(m => 
        m.id.startsWith('temp-') && 
        // Only keep temp messages whose content is NOT already in server response
        !serverMessages.some(sm => sm.content === m.content && sm.senderId === m.senderId)
      );
      
      // Merge: server messages + surviving temp messages (temp at front = newest)
      state.activeMessages[action.payload.matchId] = [
        ...pendingTempMessages,
        ...serverMessages,
      ];
      state.isLoadingMessages = false;
    },
    prependMessages: (state, action: PayloadAction<{ matchId: string; messages: Message[] }>) => {
      if (!state.activeMessages[action.payload.matchId]) {
        state.activeMessages[action.payload.matchId] = [];
      }
      const existing = state.activeMessages[action.payload.matchId];
      // For inverted list (newest first), older loaded messages belong at the end of the array
      const combined = [...existing, ...action.payload.messages];
      // Avoid duplicates
      state.activeMessages[action.payload.matchId] = combined.filter(
        (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
      );
      state.isLoadingMessages = false;
    },
    setLoadingMessages: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMessages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const msg = action.payload;
      // Initialize if doesn't exist
      if (!state.activeMessages[msg.matchId]) {
        state.activeMessages[msg.matchId] = [];
      }
      const matchMessages = state.activeMessages[msg.matchId];
      // Avoid duplicates
      if (!matchMessages.find((m) => m.id === msg.id)) {
        // Prepend new messages for inverted list (index 0 is bottom/newest)
        matchMessages.unshift(msg);
      }
      // Update the conversation's last message
      const convIndex = state.conversations.findIndex((c) => c.matchId === msg.matchId);
      if (convIndex !== -1) {
        state.conversations[convIndex].lastMessage = {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          sentAt: msg.sentAt,
          isRead: !!msg.readAt,
          readAt: msg.readAt,
        };
      }
    },
    markConversationRead: (state, action: PayloadAction<string>) => {
      const convIndex = state.conversations.findIndex((c) => c.matchId === action.payload);
      if (convIndex !== -1) {
        state.conversations[convIndex].unreadCount = 0;
        if (state.conversations[convIndex].lastMessage) {
          state.conversations[convIndex].lastMessage!.isRead = true;
        }
      }
    },
    setTyping: (state, action: PayloadAction<{ matchId: string; senderId: string | null }>) => {
      state.typingUsers[action.payload.matchId] = action.payload.senderId;
    },
    replaceOptimisticMessage: (state, action: PayloadAction<{ tempId: string; realMessage: Message }>) => {
      const { tempId, realMessage } = action.payload;
      const matchMessages = state.activeMessages[realMessage.matchId];
      if (matchMessages) {
        const index = matchMessages.findIndex((m) => m.id === tempId);
        if (index !== -1) {
          // CRITICAL: Keep the temp ID for FlatList key stability.
          // Changing the ID causes FlatList to unmount/remount the bubble (visual flash).
          // Update metadata (readAt, sentAt, mediaKeys) from server but preserve the key.
          matchMessages[index] = {
            ...realMessage,
            id: tempId, // Keep stable key — prevents "hide and resend" visual effect
          };
        }
      }
      // Conversation lastMessage uses the REAL server ID for server consistency
      const convIndex = state.conversations.findIndex((c) => c.matchId === realMessage.matchId);
      if (convIndex !== -1) {
        const conv = state.conversations[convIndex];
        if (conv.lastMessage && conv.lastMessage.id === tempId) {
          conv.lastMessage = {
            id: realMessage.id,
            content: realMessage.content,
            senderId: realMessage.senderId,
            sentAt: realMessage.sentAt,
            isRead: !!realMessage.readAt,
            readAt: realMessage.readAt,
            mediaKey: realMessage.mediaKey
          };
        }
      }
    },
    removeMessage: (state, action: PayloadAction<{ matchId: string; messageId: string }>) => {
      const { matchId, messageId } = action.payload;
      if (state.activeMessages[matchId]) {
        state.activeMessages[matchId] = state.activeMessages[matchId].filter(
          (msg) => msg.id !== messageId
        );
      }
      
      // If we deleted the last message, null it out in the conversations list
      const convIndex = state.conversations.findIndex((c) => c.matchId === matchId);
      if (convIndex !== -1 && state.conversations[convIndex].lastMessage?.id === messageId) {
        const remainingMessages = state.activeMessages[matchId] || [];
        if (remainingMessages.length > 0) {
           // With newest-first storage, index 0 is the latest message
           const newLastMsg = remainingMessages[0];
           state.conversations[convIndex].lastMessage = {
             id: newLastMsg.id,
             content: newLastMsg.content,
             senderId: newLastMsg.senderId,
             sentAt: newLastMsg.sentAt,
             isRead: !!newLastMsg.readAt,
             readAt: newLastMsg.readAt,
             mediaKey: newLastMsg.mediaKey,
           };
        } else {
           state.conversations[convIndex].lastMessage = null;
        }
      }
    },
  },
});

export const {
  setConversations,
  setLoadingConversations,
  setMessages,
  prependMessages,
  setLoadingMessages,
  addMessage,
  markConversationRead,
  setTyping,
  replaceOptimisticMessage,
  removeMessage,
} = chatSlice.actions;
export default chatSlice.reducer;
