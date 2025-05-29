
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { TaskStatus } from '@/types';

interface UpdateTaskStatusResult {
  success: boolean;
  error?: string;
}

export async function updateTaskStatusAction(
  taskId: string,
  newStatus: TaskStatus
): Promise<UpdateTaskStatusResult> {
  if (!taskId || !newStatus) {
    return { success: false, error: 'Task ID and new status are required.' };
  }

  const taskRef = doc(db, 'tasks', taskId);

  try {
    await updateDoc(taskRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    console.log(`Task ${taskId} status updated to ${newStatus}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating task status:', error);
    return { success: false, error: error.message || 'Failed to update task status.' };
  }
}
