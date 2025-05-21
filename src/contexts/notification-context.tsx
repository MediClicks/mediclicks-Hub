
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, Timestamp, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import type { Task, WithConvertedDates } from '@/types';
import { useAuth } from './auth-context'; // Import useAuth to access user

// Helper function to convert Firestore Timestamps (if any)
function convertTaskTimestamps(taskData: any): WithConvertedDates<Task> {
  const data = { ...taskData } as Partial<WithConvertedDates<Task>>;
  for (const key in data) {
    if (data[key as keyof Task] instanceof Timestamp) {
      data[key as keyof Task] = (data[key as keyof Task] as Timestamp).toDate() as any;
    }
  }
  return data as WithConvertedDates<Task>;
}


interface NotificationContextType {
  notifications: WithConvertedDates<Task>[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  isLoadingNotifications: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<WithConvertedDates<Task>[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const { isAuthenticated, user } = useAuth(); // Get user for potential future use (e.g., user-specific notifications)

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) { // Only fetch if user is authenticated
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setIsLoadingNotifications(true);
    try {
      const now = Timestamp.now();
      const tasksCollectionRef = collection(db, 'tasks');
      
      // Query for tasks where alertDate has passed and alertFired is false
      const q = query(
        tasksCollectionRef,
        where('alertDate', '<=', now),
        where('alertFired', '==', false),
        orderBy('alertDate', 'desc') // Show most recent past alerts first
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedNotifications = querySnapshot.docs.map(docSnap => {
        const data = convertTaskTimestamps(docSnap.data() as Task);
        return { id: docSnap.id, ...data };
      });

      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.length);

    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated]);

  const markNotificationsAsRead = async () => {
    if (notifications.length === 0) return;

    const currentNotificationsToMark = [...notifications]; // Operate on a copy

    // Optimistically update UI
    setUnreadCount(0);
    // setNotifications([]); // Optionally clear notifications immediately, or wait for next fetch

    try {
      const updatePromises = currentNotificationsToMark.map(task => {
        const taskDocRef = doc(db, 'tasks', task.id);
        return updateDoc(taskDocRef, { alertFired: true });
      });
      
      await Promise.all(updatePromises);
      console.log(`${currentNotificationsToMark.length} notifications marked as read in Firestore.`);
      // After successfully marking in Firestore, refetch notifications to ensure UI is in sync with DB
      // Or, if you cleared notifications optimistically, this fetch might not be needed if the next natural fetch does the job.
      // For now, let's assume the next call to fetchNotifications (e.g. on layout mount) will refresh the state.
      // If immediate refresh is needed after marking read, uncomment below:
      // await fetchNotifications(); 
      // Clear local state after successful DB update
      setNotifications([]);


    } catch (error) {
      console.error("Error marking notifications as read in Firestore:", error);
      // If an error occurs, we might want to revert optimistic UI updates or refetch
      // For simplicity now, we'll just log the error. The user might see the old count on next fetch.
      // To revert:
      // setUnreadCount(currentNotificationsToMark.length);
      // setNotifications(currentNotificationsToMark);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markNotificationsAsRead, isLoadingNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
