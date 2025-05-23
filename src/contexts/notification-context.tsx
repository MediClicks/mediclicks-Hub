
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
      const todayStart = startOfDay(now); // Usar startOfDay de date-fns
      const tomorrowEnd = endOfDay(new Date(now.setDate(now.getDate() + 1))); // Hasta el final del día de mañana

      const tasksCollectionRef = collection(db, 'tasks');
      
      const q = query(
        tasksCollectionRef,
        where('dueDate', '>=', Timestamp.fromDate(todayStart)),
        where('dueDate', '<=', Timestamp.fromDate(tomorrowEnd)),
        where('status', 'in', ['Pendiente', 'En Progreso']),
        orderBy('dueDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedNotifications = querySnapshot.docs.map(docSnap => {
        const data = convertTaskTimestamps(docSnap.data() as Task);
        return { id: docSnap.id, ...data };
      });

      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.length); // Inicialmente, todas las tareas que cumplen son "no leídas"

    } catch (error) {
      console.error("Error fetching notifications for tasks due in next 24h:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated]);

 const markNotificationsAsRead = useCallback(async () => {
    if (notifications.length === 0) return;

    // No actualizaremos alertFired en Firestore aquí, solo reseteamos el contador para la UI
    // La lógica de fetchNotifications volverá a traerlas si cumplen criterios.
    // Se decidió simplificar para evitar escrituras masivas si el usuario solo abre el panel.
    
    // Lo que sí haremos es resetear el unreadCount en la UI.
    setUnreadCount(0);
    // Podríamos decidir si queremos limpiar `notifications` aquí o dejarlas visibles hasta el próximo fetch.
    // Por ahora, las mantenemos visibles, `fetchNotifications` las actualizará.

  }, [notifications]); // No tiene dependencias que cambien frecuentemente, pero si `notifications` cambia, se recrea.


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
