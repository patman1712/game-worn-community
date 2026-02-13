import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Create admin user directly using Base44 API
    const appId = Deno.env.get('BASE44_APP_ID');
    const serviceToken = req.headers.get('authorization')?.replace('Bearer ', '');
    
    const createUserResponse = await fetch(`https://api.base44.com/apps/${appId}/auth/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'info@foto-scheiber.de',
        password: 'demo',
        full_name: 'Admin',
        role: 'admin',
      }),
    });

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.json();
      return Response.json({ error: `User-Erstellung fehlgeschlagen: ${errorData.message || createUserResponse.statusText}` }, { status: 400 });
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user profile data
    const allUsers = await base44.asServiceRole.entities.User.list();
    const newUser = allUsers.find(u => u.email === 'info@foto-scheiber.de');
    
    if (newUser) {
      await base44.asServiceRole.entities.User.update(newUser.id, {
        display_name: 'Admin',
        real_name: 'Administrator',
        location: '',
        show_location: false,
        accept_messages: true,
      });
    }

    return Response.json({ success: true, message: 'Admin user created successfully' });

  } catch (error) {
    console.error('Create admin error:', error);
    return Response.json({ 
      error: error.message || 'Fehler beim Erstellen des Admin-Users' 
    }, { status: 500 });
  }
});