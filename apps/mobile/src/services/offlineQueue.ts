import AsyncStorage from '@react-native-async-storage/async-storage';
import { Socket } from 'socket.io-client';

export interface QueuedMessage {
  tempId: string;           // Optimistic ID shown in UI
  realId?: string;          // Server-assigned ID (if received)
  matchId: string;
  content: string;
  mediaKeys: string[];
  queuedAt: number;
  status: 'pending' | 'sending' | 'failed' | 'sent';
  sequenceNum?: number;     // Track original send order (WhatsApp-style)
}

const OFFLINE_QUEUE_KEY = '@chat:offlineQueue';

export const addToOfflineQueue = async (message: QueuedMessage) => {
  try {
    const existing = await getOfflineQueue();
    const exists = existing.some(m => m.tempId === message.tempId);
    if (!exists) {
      await AsyncStorage.setItem(
        OFFLINE_QUEUE_KEY,
        JSON.stringify([...existing, message])
      );
    }
  } catch (err) {
    console.error('[OfflineQueue] Failed to queue message:', err);
  }
};

export const getOfflineQueue = async (): Promise<QueuedMessage[]> => {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const removeFromQueue = async (tempId: string) => {
  try {
    const existing = await getOfflineQueue();
    const filtered = existing.filter(m => m.tempId !== tempId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('[OfflineQueue] Failed to remove from queue:', err);
  }
};

export const clearOfflineQueue = async () => {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
};

// Retry messages when connection restores.
// onMessageConfirmed fires IMMEDIATELY per-message (not batched) to prevent
// race condition with the server's new_message broadcast.
export const retryOfflineMessages = async (
  socket: Socket,
  matchId: string,
  onMessageConfirmed?: (queuedMsg: QueuedMessage, serverMessage: any) => void,
): Promise<QueuedMessage[]> => {
  const queue = await getOfflineQueue();
  const matchQueue = queue.filter(m => m.matchId === matchId);

  if (matchQueue.length === 0 || !socket.connected) return [];

  console.log('[OfflineQueue] Retrying ' + matchQueue.length + ' messages for match ' + matchId);

  // CRITICAL: Sort by sequence number to preserve original send order
  matchQueue.sort((a, b) => {
    if (a.sequenceNum !== undefined && b.sequenceNum !== undefined) {
      return a.sequenceNum - b.sequenceNum;
    }
    return a.queuedAt - b.queuedAt;
  });

  console.log('[OfflineQueue] Sorted order:', matchQueue.map(m => ({
    tempId: m.tempId,
    content: m.content,
    sequenceNum: m.sequenceNum,
    queuedAt: m.queuedAt
  })));

  const successfulSends: QueuedMessage[] = [];

  // Send sequentially in correct order
  for (const item of matchQueue) {
    try {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('[OfflineQueue] Timeout for message ' + item.tempId);
          resolve();
        }, 15000);

        console.log('[OfflineQueue] Sending ' + item.tempId + ': "' + item.content.substring(0, 30) + '"');

        socket.emit('send_message', {
          matchId: item.matchId,
          content: item.content,
          mediaKeys: item.mediaKeys,
        }, (response: any) => {
          clearTimeout(timeout);
          if (response?.success) {
            successfulSends.push(item);
            // CRITICAL: Fire callback IMMEDIATELY so processedServerIdsRef is updated
            // BEFORE the new_message broadcast arrives (prevents race condition)
            if (onMessageConfirmed && response.message) {
              onMessageConfirmed(item, response.message);
            }
            console.log('[OfflineQueue] ✓ Sent ' + item.tempId + ' -> server ID ' + (response.message?.id || 'unknown'));
          } else {
            console.log('[OfflineQueue] ✗ Failed ' + item.tempId + ':', response);
          }
          resolve();
        });
      });
    } catch (err) {
      console.error('[OfflineQueue] Error retrying message ' + item.tempId + ':', err);
    }
  }

  // Remove successfully sent messages from queue
  for (const item of successfulSends) {
    await removeFromQueue(item.tempId);
  }

  return successfulSends;
};

// Listen for connection restore - don't auto-retry here
export const setupQueueRetry = (socket: Socket) => {
  socket.on('reconnect', async () => {
    console.log('[OfflineQueue] Connection restored, queue ready for retry');
  });
};

// Manual trigger for retry - called from ChatScreen
export const triggerQueueRetry = async (
  socket: Socket,
  matchId: string,
  onMessageConfirmed?: (queuedMsg: QueuedMessage, serverMessage: any) => void,
) => {
  const successfulSends = await retryOfflineMessages(socket, matchId, onMessageConfirmed);
  console.log('[OfflineQueue] Retry complete, sent ' + successfulSends.length + ' messages');
  return successfulSends;
};
