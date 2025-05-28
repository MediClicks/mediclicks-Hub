import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function updateUserProfileIcon(clientId: string, iconSvg: string): Promise<void> {
  if (!clientId) {
    console.error("Client ID is required to update profile icon.");
    return;
  }

  const clientRef = doc(db, 'clients', clientId);

  try {
    await updateDoc(clientRef, {
      profileIcon: iconSvg,
    });
    console.log(`Successfully updated profile icon for client: ${clientId}`);
  } catch (error) {
    console.error(`Error updating profile icon for client ${clientId}:`, error);
    throw new Error(`Failed to update profile icon: ${error}`);
  }
}