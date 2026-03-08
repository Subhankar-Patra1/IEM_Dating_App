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
      state.activeMessages[action.payload.matchId] = action.payload.messages;
      state.isLoadingMessages = false;
    },
    prependMessages: (state, action: PayloadAction<{ matchId: string; messages: Message[] }>) => {
      const existing = state.activeMessages[action.payload.matchId] || [];
      state.activeMessages[action.payload.matchId] = [...action.payload.messages, ...existing];
      state.isLoadingMessages = false;
    },
    setLoadingMessages: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMessages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const msg = action.payload;
      const matchMessages = state.activeMessages[msg.matchId] || [];
      // Avoid duplicates
      if (!matchMessages.find((m) => m.id === msg.id)) {
        state.activeMessages[msg.matchId] = [...matchMessages, msg];
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
          matchMessages[index] = realMessage;
        }
      }
      // Also update conversation's lastMessage if it was the optimistic one
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
          };
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
} = chatSlice.actions;
export default chatSlice.reducer;
