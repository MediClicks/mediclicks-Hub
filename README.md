# Firebase Stuialogio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
print(default_api.natural_language_write_file(path="src/lib/googleCalendar.ts", language="typescript", prompt="Crea un archivo llamado `googleCalendar.ts` en el directorio `src/lib`. Este archivo debe contener funciones para interactuar con la API de Google Calendar.\n\nPrimero, importa las bibliotecas necesarias: `googleapis` y `google-auth-library`.Configura la autenticación con OAuth2 usando un archivo JSON de credenciales. La ruta al archivo JSON debe ser `./credentials.json` (asumiendo que el archivo de credenciales está en la raíz del proyecto). Crea una función asíncrona llamada `createGoogleCalendarEvent` que acepte un objeto con los detalles del evento (summary, description, start, end, etc.) y use el cliente de Google Calendar autenticado para crear un evento.\n\nIncluye un ejemplo básico de cómo usar la función `createGoogleCalendarEvent` dentro de un `if (require.main === module)` block para propósitos de prueba."))
