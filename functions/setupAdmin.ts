import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const email = 'info@foto-scheiber.de';
    const password = 'demo';
    
    // Check if user already exists
    const allUsers = await base44.asServiceRole.entities.User.list();
    let user = allUsers.find(u => u.email === email);
    
    if (!user) {
      // Invite user first
      await base44.users.inviteUser(email, 'admin');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Fetch again
      const updatedUsers = await base44.asServiceRole.entities.User.list();
      user = updatedUsers.find(u => u.email === email);
    }
    
    if (!user) {
      return Response.json({ error: 'User konnte nicht gefunden/erstellt werden' }, { status: 500 });
    }
    
    // Update role to admin
    await base44.asServiceRole.entities.User.update(user.id, {
      role: 'admin',
      display_name: 'Admin',
      real_name: 'Administrator',
    });
    
    // Set password using admin endpoint
    const appId = Deno.env.get('BASE44_APP_ID');
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    const passwordResponse = await fetch(`https://api.base44.com/apps/${appId}/admin/users/${user.id}/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    
    if (!passwordResponse.ok) {
      const errorText = await passwordResponse.text();
      console.error('Password update failed:', passwordResponse.status, errorText);
      return Response.json({ 
        error: 'Passwort konnte nicht gesetzt werden',
        details: errorText,
        status: passwordResponse.status
      }, { status: 500 });
    }
    
    return Response.json({ 
      success: true, 
      message: `Admin-User ${email} wurde eingerichtet mit Passwort: ${password}`,
      userId: user.id
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});