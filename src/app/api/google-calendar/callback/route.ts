import { NextRequest, NextResponse } from 'next/server';
// import { handleGoogleCalendarCallback } from '@/lib/googleCalendar'; // Asumimos que esta función se refactorizará o no se usará directamente aquí

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Error en callback de Google Calendar OAuth:', error);
    return NextResponse.json({ error: `Error de autorización de Google: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'Código de autorización no encontrado.' }, { status: 400 });
  }

  // TODO: Implementar el intercambio del código por tokens y el almacenamiento seguro de tokens.
  // Esta es una parte crítica y compleja que generalmente involucra:
  // 1. Un OAuth2Client configurado (como el que está en googleCalendar.ts, pero podría necesitarse aquí también).
  // 2. Llamar a oAuth2Client.getToken(code) para obtener los tokens.
  // 3. Guardar los tokens (access_token, refresh_token, expiry_date) de forma segura,
  //    idealmente asociados al ID del usuario de Firebase Auth en Firestore.
  // 4. Crear/actualizar un archivo `token.json` en la raíz del proyecto es una solución
  //    MUY BÁSICA y solo para un único usuario global, no es segura ni escalable.

  // Por ahora, este endpoint solo registrará el código y mostrará un mensaje.
  // La lógica real de manejo de tokens debe ser implementada cuidadosamente.
  console.log('Google Calendar OAuth callback recibido con código:', code);
  
  // Ejemplo de cómo podrías intentar guardar el token (esto es simplificado y requiere `token.json` escribible):
  /*
  try {
    // Necesitarías inicializar oAuth2Client aquí o importarlo
    // const {tokens} = await oAuth2Client.getToken(code);
    // oAuth2Client.setCredentials(tokens);
    // fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens)); // TOKEN_PATH debe ser la ruta a token.json
    // console.log('Token almacenado en', TOKEN_PATH);
    // return NextResponse.json({ message: 'Autenticación con Google Calendar exitosa! Los tokens han sido guardados (de forma básica).' });

  } catch (e: any) {
    console.error('Error intercambiando código por token o guardando token:', e.message);
    return NextResponse.json({ error: 'Error procesando la autenticación con Google Calendar.' }, { status: 500 });
  }
  */

  return NextResponse.json({ 
    message: 'Callback de Google Calendar recibido. El código de autorización es: ' + code + 
             '. Necesitas implementar el intercambio de este código por tokens y su almacenamiento seguro. '+
             'Actualmente, debes generar "token.json" manualmente para usar la API.'
  });
}
