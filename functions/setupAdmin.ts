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
    
    // Delete any pending user entries
    const pendingUsers = await base44.asServiceRole.entities.PendingUser.filter({ email });
    for (const pu of pendingUsers) {
      await base44.asServiceRole.entities.PendingUser.delete(pu.id);
    }
    
    return Response.json({ 
      success: true, 
      message: `Admin-User ${email} wurde eingerichtet. Bitte setze das Passwort manuell über das Base44 Dashboard.`,
      userId: user.id,
      note: 'Passwort kann nur über das Dashboard gesetzt werden. Gehe zu Users -> info@foto-scheiber.de -> Passwort zurücksetzen'
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});