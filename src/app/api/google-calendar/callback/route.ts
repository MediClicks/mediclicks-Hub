import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleCalendarCallback } from '@/lib/googleCalendar';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Authorization code not found.' }, { status: 400 });
  }

  // TODO: Obtén el ID del usuario autenticado aquí. Por ejemplo, desde Firebase Authentication.
  const userId = "REPLACE_WITH_AUTHENTICATED_USER_ID"; // <--- Reemplaza esto

  try {
    // Aquí manejamos el código de autorización y obtenemos los tokens
    // En una aplicación real, deberías guardar estos tokens de forma segura asociados al usuario
    await handleGoogleCalendarCallback(code, userId);

    // Redirige o responde al usuario después de la autenticación exitosa
    return NextResponse.json({ message: 'Successfully authenticated with Google Calendar!' });
  } catch (error: any) {
    console.error('Error handling Google Calendar callback:', error);
    return NextResponse.json({ error: 'Error authenticating with Google Calendar.' }, { status: 500 });
  }
}