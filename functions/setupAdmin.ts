import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const email = 'info@foto-scheiber.de';
    const password = 'demo';
    
    // Check if user already exists
    const allUsers = await base44.asServiceRole.entities.User.list();
    let existingUser = allUsers.find(u => u.email === email);
    
    if (existingUser) {
      // Update existing user
      await base44.asServiceRole.entities.User.update(existingUser.id, {
        role: 'admin',
        display_name: 'Admin',
        real_name: 'Administrator',
        accept_messages: true,
      });
      
      // Update password via Base44 admin API
      const appId = Deno.env.get('BASE44_APP_ID');
      const token = req.headers.get('authorization')?.replace('Bearer ', '');
      
      const pwResponse = await fetch(`https://api.base44.com/apps/${appId}/admin/users/${existingUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const pwData = await pwResponse.text();
      console.log('Password update response:', pwResponse.status, pwData);
      
      return Response.json({ 
        success: true, 
        message: 'Admin-User aktualisiert',
        userId: existingUser.id 
      });
    } else {
      // Create new admin user via invite
      await base44.users.inviteUser(email, 'admin');
      
      // Wait for user creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the newly created user
      const updatedUsers = await base44.asServiceRole.entities.User.list();
      const newUser = updatedUsers.find(u => u.email === email);
      
      if (!newUser) {
        return Response.json({ error: 'User konnte nicht erstellt werden' }, { status: 500 });
      }
      
      // Update user details
      await base44.asServiceRole.entities.User.update(newUser.id, {
        display_name: 'Admin',
        real_name: 'Administrator',
        accept_messages: true,
      });
      
      // Update password
      const appId = Deno.env.get('BASE44_APP_ID');
      const token = req.headers.get('authorization')?.replace('Bearer ', '');
      
      const pwResponse = await fetch(`https://api.base44.com/apps/${appId}/admin/users/${newUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const pwData = await pwResponse.text();
      console.log('Password set response:', pwResponse.status, pwData);
      
      return Response.json({ 
        success: true, 
        message: 'Admin-User erstellt',
        userId: newUser.id 
      });
    }
    
  } catch (error) {
    console.error('Setup admin error:', error);
    return Response.json({ 
      error: error.message || 'Fehler beim Admin-Setup' 
    }, { status: 500 });
  }
});