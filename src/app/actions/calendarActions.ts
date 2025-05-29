
'use server';

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as path from 'path';
import * as fs from 'fs';
import { createGoogleCalendarEvent, type CalendarEvent } from '@/lib/googleCalendar'; // Asegúrate que la ruta a googleCalendar es correcta

interface AddEventResult {
  success: boolean;
  message: string;
  link?: string | null;
  error?: string;
}

interface EventDetails {
    name: string;
    description?: string;
    alertDate: Date;
}

export async function addCalendarEventForTaskAction(details: EventDetails): Promise<AddEventResult> {
  if (!details.alertDate) {
    return { success: false, message: "No se proporcionó fecha de alerta para el evento de calendario." };
  }

  const eventStartTime = details.alertDate;
  const eventEndTime = new Date(eventStartTime.getTime() + 60 * 60 * 1000); // Evento de 1 hora

  const calendarEvent: CalendarEvent = {
    summary: `Recordatorio Tarea: ${details.name}`,
    description: details.description || `Recordatorio para la tarea: ${details.name}`,
    start: {
      dateTime: eventStartTime.toISOString(),
      timeZone: 'America/New_York', // O la zona horaria que prefieras / configures
    },
    end: {
      dateTime: eventEndTime.toISOString(),
      timeZone: 'America/New_York', // O la zona horaria que prefieras / configures
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 60 },
      ],
    },
  };

  try {
    const createdEvent = await createGoogleCalendarEvent(calendarEvent);
    return { 
      success: true, 
      message: 'Evento de Google Calendar creado exitosamente.',
      link: createdEvent?.htmlLink 
    };
  } catch (error: any) {
    console.error('Error en addCalendarEventForTaskAction:', error);
    // No relanzar error.message directamente si puede contener información sensible
    let errorMessage = 'No se pudo crear el evento en Google Calendar.';
    if (typeof error.message === 'string' && (error.message.includes('token.json') || error.message.includes('No access token'))) {
        errorMessage += ' Por favor, revisa la configuración del token de Google Calendar (token.json).';
    } else if (typeof error.message === 'string' && error.message.includes('Google API Error')) {
        errorMessage = error.message; // Usar el mensaje de error más detallado de la API
    }
    return { 
      success: false, 
      message: errorMessage,
      error: error.message || 'Error desconocido al crear evento de calendario.'
    };
  }
}
