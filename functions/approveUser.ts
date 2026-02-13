import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can approve users
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const payload = await req.json();
    const { pendingUserId, approve, role = 'user' } = payload;

    console.log('[INFO] Processing approval request:', { pendingUserId, approve, role });

    if (!pendingUserId) {
      return Response.json({ error: 'Pending User ID fehlt' }, { status: 400 });
    }

    // Get pending user details
    const allPendingUsers = await base44.asServiceRole.entities.PendingUser.list();
    const pendingUser = allPendingUsers.find(p => p.id === pendingUserId);

    console.log('[INFO] Found pending user:', pendingUser);

    if (!pendingUser) {
      return Response.json({ error: 'Pending User nicht gefunden' }, { status: 404 });
    }

    if (approve) {
      try {
        // Use inviteUser from SDK - this will create the user properly
        console.log('[INFO] Inviting user via SDK:', pendingUser.email, 'with role:', role);
        
        await base44.users.inviteUser(pendingUser.email, role);
        
        console.log('[INFO] User invited, waiting for creation...');
        
        // Wait longer for user to be created
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get the newly created user
        const allUsers = await base44.asServiceRole.entities.User.list();
        const newUser = allUsers.find(u => u.email === pendingUser.email);

        console.log('[INFO] Found new user:', newUser?.email, 'with ID:', newUser?.id);

        if (newUser) {
          // Update user with additional profile data
          console.log('[INFO] Updating user profile...');
          await base44.asServiceRole.entities.User.update(newUser.id, {
            display_name: pendingUser.display_name,
            real_name: pendingUser.real_name,
            location: pendingUser.location,
            show_location: pendingUser.show_location,
            accept_messages: pendingUser.accept_messages,
          });

          // Update password via auth API
          console.log('[INFO] Updating user password...');
          const appId = Deno.env.get('BASE44_APP_ID');
          
          const passwordResponse = await fetch(`https://api.base44.com/v1/apps/${appId}/auth/users/${newUser.id}/password`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              password: pendingUser.password_hash,
            }),
          });

          if (!passwordResponse.ok) {
            const errorText = await passwordResponse.text();
            console.error('[ERROR] Password update failed:', errorText);
          } else {
            console.log('[INFO] Password updated successfully');
          }

          // Send approval email
          console.log('[INFO] Sending approval email...');
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: pendingUser.email,
            subject: 'Dein Account wurde freigeschaltet - Jersey Collectors',
            body: `
              <h2>Dein Account wurde freigeschaltet!</h2>
              <p>Hallo ${pendingUser.display_name},</p>
              <p>Gute Nachrichten! Dein Account wurde von einem Administrator freigeschaltet.</p>
              ${role === 'moderator' ? '<p><strong>Du wurdest als Moderator freigeschaltet</strong> und hast erweiterte Rechte in der Community.</p>' : ''}
              <p><strong>Du kannst dich jetzt mit deinen Anmeldedaten einloggen!</strong></p>
              <p>Viel Spaß beim Sammeln und Teilen deiner Trikots!</p>
              <p>Mit freundlichen Grüßen,<br>Das Jersey Collectors Team</p>
            `,
          });
        } else {
          console.error('[ERROR] User was not found in database after creation');
        }

        // Delete pending user entry
        console.log('[INFO] Deleting pending user entry...');
        await base44.asServiceRole.entities.PendingUser.delete(pendingUserId);

      } catch (error) {
        console.error('[ERROR] Error during approval:', error);
        throw error;
      }
    } else {
      // Reject user - just delete pending entry
      console.log('[INFO] Rejecting user, deleting pending entry...');
      await base44.asServiceRole.entities.PendingUser.delete(pendingUserId);
    }

    console.log('[INFO] Approval process completed successfully');
    return Response.json({ success: true });

  } catch (error) {
    console.error('[ERROR] Approval error:', error);
    return Response.json({ 
      error: error.message || 'Fehler bei der Freischaltung'
    }, { status: 500 });
  }
});