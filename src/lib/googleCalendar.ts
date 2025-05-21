import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as path from 'path';
import * as fs from 'fs';

// Carga las credenciales desde el archivo JSON en la raíz del proyecto
const CREDENTIALS_FILENAME = 'client_secret_961144846241-ljliv9rhihhk9it4sr1go1stj2vc28g1.apps.googleusercontent.com.json';
const CREDENTIALS_PATH = path.join(process.cwd(), CREDENTIALS_FILENAME);

let credentials;
try {
  credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
} catch (err) {
  console.error(`Error loading credentials file (${CREDENTIALS_FILENAME}):`, err);
  throw new Error(`Could not load credentials file: ${CREDENTIALS_FILENAME}. Make sure it's in the project root.`);
}

const { client_secret, client_id } = credentials.web;
// Este URI DEBE estar registrado en tu Google Cloud Console como un URI de redireccionamiento autorizado para este ID de cliente.
const redirectUri = 'http://localhost:9002/api/google-calendar/callback';
const oAuth2Client = new OAuth2Client(client_id, client_secret, redirectUri);

// Ruta para guardar/cargar el token
const TOKEN_FILENAME = 'token.json';
const TOKEN_PATH = path.join(process.cwd(), TOKEN_FILENAME);

try {
  const token = fs.readFileSync(TOKEN_PATH, 'utf8');
  oAuth2Client.setCredentials(JSON.parse(token));
} catch (err) {
  console.warn(`Warning: Error loading ${TOKEN_FILENAME}, or file not found. Google Calendar integration will fail unless a valid token is present.`);
  // No lanzamos un error aquí, permitimos que la app continúe, pero la creación de eventos fallará.
}

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string; // ISO 8601 format e.g. '2023-05-28T09:00:00-07:00' or '2023-05-28T16:00:00Z'
    timeZone?: string; // IANA Time Zone Database name, e.g., 'America/New_York'
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
}

export async function createGoogleCalendarEvent(event: CalendarEvent): Promise<any> {
  if (!oAuth2Client.credentials || !oAuth2Client.credentials.access_token) {
    console.error('Google Calendar: No access token found. Ensure token.json is valid and readable.');
    throw new Error('No access token available for Google Calendar. Please authorize the application.');
  }
  try {
    const response = await calendar.events.insert({
      calendarId: 'primary', // O el ID del calendario donde quieres crear el evento
      requestBody: event,
    });
    console.log('Google Calendar event created: %s', response.data.htmlLink);
    return response.data;
  } catch (error: any) {
    // Log more detailed error information from Google API if available
    if (error.response && error.response.data && error.response.data.error) {
      console.error('Error creating Google Calendar event (API Error):', error.response.data.error);
      const apiError = error.response.data.error;
      let message = `Google API Error: ${apiError.message} (Code: ${apiError.code}).`;
      if (apiError.errors && apiError.errors.length > 0) {
        message += ` Details: ${apiError.errors[0].reason} - ${apiError.errors[0].message}`;
      }
      if (apiError.code === 401 || apiError.code === 403 || (typeof error.message === 'string' && error.message.toLowerCase().includes('token'))) {
        message += ' This might be due to an invalid, expired, or missing token in token.json, or insufficient permissions.';
      }
      throw new Error(message);
    } else {
      console.error('Error creating Google Calendar event (General):', error.message || error);
      throw error; // Re-throw original error if no detailed API error info
    }
  }
}
