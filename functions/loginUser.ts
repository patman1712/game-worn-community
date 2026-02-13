import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { email, password } = payload;

    if (!email || !password) {
      return Response.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 });
    }

    // Use Base44 API for login
    const appId = Deno.env.get('BASE44_APP_ID');
    
    const loginResponse = await fetch(`https://api.base44.com/apps/${appId}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      return Response.json({ error: 'Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.' }, { status: 401 });
    }

    return Response.json({ 
      success: true,
      token: loginData.access_token
    });

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ 
      error: 'Login fehlgeschlagen. Bitte versuche es erneut.' 
    }, { status: 500 });
  }
});