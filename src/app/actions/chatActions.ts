
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { ChatMessage } from '@/types';

interface SaveConversationResult {
  success: boolean;
  id?: string; // ID of the saved conversation document
  error?: string;
}

export async function saveConversationAction(
  messages: ChatMessage[],
  userId: string,
  customTitle?: string
): Promise<SaveConversationResult> {
  if (!userId) {
    return { success: false, error: "User ID is required to save conversation." };
  }
  if (!messages || messages.length === 0) {
    return { success: false, error: "Cannot save an empty conversation." };
  }

  // Auto-generate a title if not provided, e.g., from the first user message
  let title = customTitle;
  if (!title) {
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    title = firstUserMessage ? firstUserMessage.text.substring(0, 70) : "Conversación Guardada";
    if (firstUserMessage && firstUserMessage.text.length > 70) {
      title += "...";
    }
  }
  // Ensure title is not empty
  if (!title.trim()) {
    title = "Conversación Guardada el " + new Date().toLocaleDateString('es-ES');
  }


  const conversationData = {
    userId,
    title,
    messages, // Array de ChatMessage
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  try {
    const docRef = await addDoc(collection(db, 'savedConversations'), conversationData);
    console.log('Conversation saved to Firestore with ID: ', docRef.id);
    return { success: true, id: docRef.id };
  } catch (e: any) {
    console.error('Error saving conversation to Firestore: ', e);
    return { success: false, error: e.message || 'Failed to save conversation to Firestore.' };
  }
}
