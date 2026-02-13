import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const email = 'info@foto-scheiber.de';
    const password = 'demo';
    
    // Delete any existing pending users
    const existingPending = await base44.asServiceRole.entities.PendingUser.filter({ email });
    for (const pu of existingPending) {
      await base44.asServiceRole.entities.PendingUser.delete(pu.id);
    }
    
    // Create pending user
    const pendingUser = await base44.asServiceRole.entities.PendingUser.create({
      email,
      password_hash: password,
      display_name: 'Admin',
      real_name: 'Administrator',
      location: '',
      show_location: false,
      accept_messages: true,
    });
    
    // Invite user
    await base44.users.inviteUser(email, 'admin');
    
    // Wait for user creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the created user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const newUser = allUsers.find(u => u.email === email);
    
    if (!newUser) {
      return Response.json({ error: 'User wurde nicht gefunden' }, { status: 500 });
    }
    
    // Update password directly via auth API
    const appId = Deno.env.get('BASE44_APP_ID');
    const serviceToken = req.headers.get('authorization')?.replace('Bearer ', '');
    
    const updatePasswordResponse = await fetch(`https://api.base44.com/apps/${appId}/auth/users/${newUser.id}/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${serviceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    
    const pwResponseText = await updatePasswordResponse.text();
    console.log('Password update response:', updatePasswordResponse.status, pwResponseText);
    
    // Update user profile
    await base44.asServiceRole.entities.User.update(newUser.id, {
      display_name: 'Admin',
      real_name: 'Administrator',
      accept_messages: true,
    });
    
    // Delete pending user
    await base44.asServiceRole.entities.PendingUser.delete(pendingUser.id);
    
    return Response.json({ 
      success: true, 
      message: `Admin-User ${email} wurde erstellt. Versuche dich jetzt mit dem Passwort: ${password} einzuloggen.`,
      passwordUpdateStatus: updatePasswordResponse.status
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});