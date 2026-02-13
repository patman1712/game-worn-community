import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can manage users
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const payload = await req.json();
    const { action, userId, updates } = payload;

    if (!userId) {
      return Response.json({ error: 'User ID fehlt' }, { status: 400 });
    }

    if (action === 'update') {
      // Update user data - separate role update from other fields
      const { role, ...otherUpdates } = updates;
      
      // Update profile fields in data object
      const currentUserData = await base44.asServiceRole.entities.User.filter({ id: userId });
      if (currentUserData[0]) {
        const userData = currentUserData[0].data || {};
        await base44.asServiceRole.entities.User.update(userId, {
          data: {
            ...userData,
            ...otherUpdates
          }
        });
        
        // Update role separately if provided
        if (role) {
          await base44.asServiceRole.entities.User.update(userId, { role });
        }
      }
      
      return Response.json({ success: true, message: 'User aktualisiert' });
    } 
    
    if (action === 'block') {
      // Block user
      const currentUserData = await base44.asServiceRole.entities.User.filter({ id: userId });
      if (currentUserData[0]) {
        const userData = currentUserData[0].data || {};
        await base44.asServiceRole.entities.User.update(userId, {
          data: {
            ...userData,
            is_blocked: true
          }
        });
      }
      
      const targetUser = await base44.asServiceRole.entities.User.filter({ id: userId });
      if (targetUser[0]) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: targetUser[0].email,
          subject: 'Dein Account wurde gesperrt - Jersey Collectors',
          body: `
            <h2>Account gesperrt</h2>
            <p>Dein Account bei Jersey Collectors wurde von einem Administrator gesperrt.</p>
            <p>Bei Fragen wende dich bitte an einen Administrator.</p>
          `,
        });
      }
      
      return Response.json({ success: true, message: 'User gesperrt' });
    }
    
    if (action === 'unblock') {
      // Unblock user
      const currentUserData = await base44.asServiceRole.entities.User.filter({ id: userId });
      if (currentUserData[0]) {
        const userData = currentUserData[0].data || {};
        await base44.asServiceRole.entities.User.update(userId, {
          data: {
            ...userData,
            is_blocked: false
          }
        });
      }
      
      const targetUser = await base44.asServiceRole.entities.User.filter({ id: userId });
      if (targetUser[0]) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: targetUser[0].email,
          subject: 'Dein Account wurde entsperrt - Jersey Collectors',
          body: `
            <h2>Account entsperrt</h2>
            <p>Dein Account bei Jersey Collectors wurde von einem Administrator entsperrt.</p>
            <p>Du kannst dich nun wieder anmelden und die Plattform nutzen.</p>
          `,
        });
      }
      
      return Response.json({ success: true, message: 'User entsperrt' });
    }
    
    if (action === 'delete') {
      const targetUser = await base44.asServiceRole.entities.User.filter({ id: userId });
      
      if (targetUser[0]) {
        // Delete user's jerseys
        const userJerseys = await base44.asServiceRole.entities.Jersey.filter({
          owner_email: targetUser[0].email
        });
        for (const jersey of userJerseys) {
          await base44.asServiceRole.entities.Jersey.delete(jersey.id);
        }
        
        // Delete user's likes
        const userLikes = await base44.asServiceRole.entities.JerseyLike.filter({
          user_email: targetUser[0].email
        });
        for (const like of userLikes) {
          await base44.asServiceRole.entities.JerseyLike.delete(like.id);
        }
        
        // Delete user's comments
        const userComments = await base44.asServiceRole.entities.Comment.filter({
          user_email: targetUser[0].email
        });
        for (const comment of userComments) {
          await base44.asServiceRole.entities.Comment.delete(comment.id);
        }
        
        // Delete user's messages
        const userMessages = await base44.asServiceRole.entities.Message.filter({
          sender_email: targetUser[0].email
        });
        for (const message of userMessages) {
          await base44.asServiceRole.entities.Message.delete(message.id);
        }
        
        // Delete user
        await base44.asServiceRole.entities.User.delete(userId);
        
        return Response.json({ success: true, message: 'User und alle Daten gelöscht' });
      }
    }

    return Response.json({ error: 'Ungültige Aktion' }, { status: 400 });

  } catch (error) {
    console.error('Manage user error:', error);
    return Response.json({ 
      error: error.message || 'Fehler bei der User-Verwaltung' 
    }, { status: 500 });
  }
});