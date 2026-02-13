import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const email = 'info@foto-scheiber.de';
    const password = 'demo';
    
    // Check if there's already a pending user
    const pendingUsers = await base44.asServiceRole.entities.PendingUser.filter({ email });
    for (const pu of pendingUsers) {
      await base44.asServiceRole.entities.PendingUser.delete(pu.id);
    }
    
    // Create a pending user entry with password
    const pendingUser = await base44.asServiceRole.entities.PendingUser.create({
      email,
      password_hash: password,
      display_name: 'Admin',
      real_name: 'Administrator',
      location: '',
      show_location: false,
      accept_messages: true,
    });
    
    // Now approve this pending user as admin
    const approveResponse = await base44.functions.invoke('approveUser', {
      pendingUserId: pendingUser.id,
      approve: true,
      role: 'admin'
    });
    
    if (approveResponse.data.error) {
      return Response.json({ 
        error: 'Fehler beim Freischalten: ' + approveResponse.data.error 
      }, { status: 500 });
    }
    
    return Response.json({ 
      success: true, 
      message: `Admin-User ${email} wurde erstellt mit Passwort: ${password}. Du kannst dich jetzt einloggen!`
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});