import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as path from 'path';
import * as fs from 'fs';

// Carga las credenciales desde el archivo JSON
const CREDENTIALS_PATH = path.join(__dirname, '../../client_secret_961144846241-ljliv9rhihhk9it4sr1go1stj2vc28g1.apps.googleusercontent.com.json');
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

// Configura el token de acceso. En una aplicación real, manejarías la autorización
// y guardarías/cargarías los tokens de acceso y refresco de forma segura.
// Por simplicidad en este ejemplo, asumimos que ya tienes un token de acceso válido.
// Deberás implementar un flujo de autenticación OAuth 2.0 completo para obtener estos tokens.
const TOKEN_PATH = path.join(__dirname, '../../token.json'); // Ruta para guardar/cargar el token

try {
  const token = fs.readFileSync(TOKEN_PATH, 'utf8');
  oAuth2Client.setCredentials(JSON.parse(token));
} catch (err) {
  console.error('Error loading token from file, or token file not found.', err);
  console.log('You need to authorize your application first. Follow the steps to get an access token and save it to token.json');
  // En un escenario real, redirigirías al usuario para la autorización
}

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

export async function createGoogleCalendarEvent(event: CalendarEvent): Promise<any> {
  try {
    const response = await calendar.events.insert({
      calendarId: 'primary', // O el ID del calendario donde quieres crear el evento
      requestBody: event,
    });
    console.log('Event created: %s', response.data.htmlLink);
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Ejemplo de uso (para pruebas)
// En un entorno de desarrollo, puedes ejecutar este archivo directamente para probar la creación de eventos.
// Asegúrate de tener un archivo `token.json` válido con un token de acceso.
if (require.main === module) {
  async function main() {
    const testEvent: CalendarEvent = {
      summary: 'Test Event from App',
      description: 'This is a test event created from the application.',
      start: {
        dateTime: '2024-12-20T09:00:00-07:00', // Reemplaza con la fecha y hora deseada
        timeZone: 'America/Los_Angeles', // Reemplaza con la zona horaria deseada
      },
      end: {
        dateTime: '2024-12-20T10:00:00-07:00', // Reemplaza con la fecha y hora deseada
        timeZone: 'America/Los_Angeles', // Reemplaza con la zona horaria deseada
      },
    };

    try {
      await createGoogleCalendarEvent(testEvent);
    } catch (error) {
      console.error('Failed to create test event:', error);
    }
  }

  main();
}
