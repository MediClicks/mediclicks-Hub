'use server';

import { createGoogleCalendarEvent, type CalendarEvent } from '@/lib/googleCalendar';
import type { Timestamp } from 'firebase/firestore';

export async function addCalendarEventForTaskAction(task: {
  name: string;
  description?: string;
  alertDate: Timestamp; // Viene de Firestore Timestamp
}) {
  try {
    const alertDateTime = task.alertDate.toDate();
    // El evento durará 1 hora por defecto
    const endDateTime = new Date(alertDateTime.getTime() + 60 * 60 * 1000); 

    // Para Google Calendar, las fechas deben estar en formato ISO 8601.
    // .toISOString() devuelve la fecha en UTC (ej: '2024-05-21T17:00:00.000Z').
    // La propiedad timeZone en el evento le dice a Google Calendar cómo interpretar/mostrar esta fecha UTC.
    // Es importante que la zona horaria sea válida (IANA Time Zone Database name).
    const timeZone = 'America/New_York'; // TODO: Hacer esto configurable o tomar del perfil de usuario.

    const event: CalendarEvent = {
      summary: `Recordatorio Tarea: ${task.name}`,
      description: task.description || `Recordatorio para la tarea "${task.name}"`,
      start: {
        dateTime: alertDateTime.toISOString(),
        timeZone: timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: timeZone,
      },
      reminders: { // Añadir un recordatorio predeterminado (popup 10 minutos antes)
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const calendarEvent = await createGoogleCalendarEvent(event);
    console.log('Calendar event successfully created via server action:', calendarEvent.htmlLink);
    return { success: true, message: 'Evento de calendario creado exitosamente.', link: calendarEvent.htmlLink };
  } catch (error: any) {
    console.error('Error en addCalendarEventForTaskAction:', error.message);
    let userMessage = 'No se pudo crear el evento en Google Calendar.';
    
    // Intentar dar mensajes más específicos basados en el error.
    if (typeof error.message === 'string') {
        if (error.message.includes('token.json') || error.message.includes('No access token') || error.message.includes('invalid_grant')) {
            userMessage += ' Por favor, verifica la autorización con Google Calendar (archivo token.json).';
        } else if (error.message.includes('Could not load credentials file')) {
            userMessage += ` Asegúrate de que el archivo de credenciales de Google exista en la raíz del proyecto.`;
        } else if (error.message.includes('Google API Error')) {
            userMessage += ` Detalles: ${error.message}`;
        }
    }
    return { success: false, message: userMessage };
  }
}
