
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, Timestamp, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { startOfDay, endOfDay, isBefore, isEqual } from 'date-fns'; // Importar desde date-fns
import type { Task, WithConvertedDates } from '@/types';
import { useAuth } from './auth-context';

// Helper function to convert Firestore Timestamps (if any)
function convertTaskTimestamps(taskData: any): WithConvertedDates<Task> {
  const data = { ...taskData } as Partial<WithConvertedDates<Task>>;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key as keyof Task];
        if (value instanceof Timestamp) {
          data[key as keyof Task] = value.toDate() as any;
        } else if (typeof value === 'object' && value !== null && !(value instanceof Date) && !Array.isArray(value)) {
            data[key as keyof Task] = convertTaskTimestamps(value) as any;
        } else if (Array.isArray(value)) {
          (data[key as keyof Task] as any) = value.map(item =>
            typeof item === 'object' && item !== null && !(item instanceof Date) ? convertTaskTimestamps(item) : item
          );
        }
    }
  }
  return data as WithConvertedDates<Task>;
}


interface NotificationContextType {
  notifications: WithConvertedDates<Task>[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationsAsRead: () => void;
  isLoadingNotifications: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<WithConvertedDates<Task>[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setIsLoadingNotifications(true);
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const tomorrowEnd = endOfDay(new Date(new Date().setDate(now.getDate() + 1)));


      const tasksCollectionRef = collection(db, 'tasks');
      
      const q = query(
        tasksCollectionRef,
        where('dueDate', '>=', Timestamp.fromDate(todayStart)),
        where('dueDate', '<=', Timestamp.fromDate(tomorrowEnd)),
        where('alertFired', '==', false), // Solo tareas cuya alerta no ha sido "disparada/leída"
        orderBy('dueDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedNotifications = querySnapshot.docs.map(docSnap => {
        const data = convertTaskTimestamps(docSnap.data() as Task);
        return { id: docSnap.id, ...data };
      }).filter(task => task.status !== 'Completada'); // Filtrar tareas completadas después de la consulta

      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.length);

    } catch (error) {
      console.error("Error fetching notifications for tasks due in next 24h:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated]);

 const markNotificationsAsRead = useCallback(async () => {
    if (notifications.length === 0 || unreadCount === 0) return;

    const updatesToPerform = notifications.map(task => {
      if (task.id) { // Asegurarse de que el task.id existe
        const taskRef = doc(db, "tasks", task.id);
        return updateDoc(taskRef, { alertFired: true });
      }
      return Promise.resolve(); // No hacer nada si el id no existe
    });

    try {
      await Promise.all(updatesToPerform);
      console.log("Notifications marked as read in Firestore.");
      // Las notificaciones permanecerán visibles en la UI para esta sesión,
      // pero no se contarán como no leídas.
      // En la próxima llamada a fetchNotifications, no se incluirán si alertFired es true.
    } catch (error) {
      console.error("Error marking notifications as read in Firestore:", error);
    }
    setUnreadCount(0); // Reset unread count in UI regardless of Firestore update success
    // No limpiar setNotifications([]) aquí para que el usuario pueda interactuar con la lista actual
  }, [notifications, unreadCount]);


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
