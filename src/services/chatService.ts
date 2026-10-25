import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import { handleFirestoreError, OperationType } from '../firebase/errors.ts';
import type { Message } from '../types/index.ts';

export async function sendChatMessage(
  projectId: string,
  text: string,
  sender: { uid: string; displayName?: string; email?: string }
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) return;

  const messagesRef = collection(db, 'projects', projectId, 'messages');
  const newMsgDoc = doc(messagesRef);

  const messageData: Omit<Message, 'id'> = {
    projectId,
    senderId: sender.uid,
    senderName: sender.displayName || sender.email?.split('@')[0] || 'Team Member',
    senderEmail: sender.email || '',
    text: cleanText,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(newMsgDoc, messageData);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}/messages/${newMsgDoc.id}`);
  }
}

export function subscribeProjectMessages(
  projectId: string,
  onMessages: (messages: Message[]) => void,
  onError?: (err: any) => void
) {
  const messagesRef = collection(db, 'projects', projectId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Message, 'id'>),
      }));
      onMessages(messages);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/messages`);
    }
  );
}

export function filterMessagesInBrowser(
  messages: Message[],
  filterUsername: string,
  filterDateRange: 'all' | 'today' | 'last7' | 'last30'
): Message[] {
  let filtered = [...messages];

  // Filter by username / sender
  if (filterUsername && filterUsername !== 'all') {
    filtered = filtered.filter(
      (m) =>
        m.senderName.toLowerCase().includes(filterUsername.toLowerCase()) ||
        m.senderEmail?.toLowerCase().includes(filterUsername.toLowerCase()) ||
        m.senderId === filterUsername
    );
  }

  // Filter by date range
  if (filterDateRange !== 'all') {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    filtered = filtered.filter((m) => {
      const msgTime = new Date(m.createdAt).getTime();
      if (isNaN(msgTime)) return true;

      if (filterDateRange === 'today') {
        return msgTime >= todayStart;
      }
      if (filterDateRange === 'last7') {
        const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
        return msgTime >= sevenDaysAgo;
      }
      if (filterDateRange === 'last30') {
        const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
        return msgTime >= thirtyDaysAgo;
      }
      return true;
    });
  }

  return filtered;
}
