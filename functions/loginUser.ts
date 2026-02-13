import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 });
    }

    const appId = Deno.env.get('BASE44_APP_ID');
    
    // Call Base44 login API
    const response = await fetch(`https://api.base44.com/v1/apps/${appId}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ 
        error: data.error || 'Login fehlgeschlagen' 
      }, { status: response.status });
    }

    return Response.json({ 
      success: true,
      access_token: data.access_token 
    });

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ 
      error: 'Ein Fehler ist aufgetreten' 
    }, { status: 500 });
  }
});