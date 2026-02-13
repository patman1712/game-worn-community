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
        // Invite user - this sends them an email to set their password
        console.log('[INFO] Inviting user via SDK:', pendingUser.email, 'with role:', role);
        
        await base44.users.inviteUser(pendingUser.email, role);
        
        console.log('[INFO] User invited, waiting for creation...');
        
        // Wait for user to be created in database
        let newUser = null;
        let attempts = 0;
        
        while (!newUser && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const allUsers = await base44.asServiceRole.entities.User.list();
          newUser = allUsers.find(u => u.email === pendingUser.email);
          attempts++;
        }

        console.log('[INFO] Found new user:', newUser?.email, 'with ID:', newUser?.id);

        if (newUser) {
          // Store profile information in user's data field
          console.log('[INFO] Updating user profile...');
          
          const currentData = newUser.data || {};
          
          await base44.asServiceRole.entities.User.update(newUser.id, {
            data: {
              ...currentData,
              display_name: pendingUser.display_name,
              real_name: pendingUser.real_name,
              location: pendingUser.location,
              show_location: pendingUser.show_location,
              accept_messages: pendingUser.accept_messages,
            }
          });

          console.log('[INFO] Profile updated successfully');

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
              <p><strong>Du hast eine Einladungs-Email erhalten.</strong> Bitte klicke auf den Link in dieser Email, um dein Passwort zu setzen und dich anzumelden.</p>
              <p>Falls du die E-Mail nicht findest, schaue bitte auch in deinem Spam-Ordner nach.</p>
              <p>Viel Spaß beim Sammeln und Teilen deiner Trikots!</p>
              <p>Mit freundlichen Grüßen,<br>Das Jersey Collectors Team</p>
            `,
          });

          console.log('[INFO] Approval email sent');
        } else {
          console.error('[ERROR] User was not found in database after creation');
          throw new Error('User konnte nicht in der Datenbank gefunden werden');
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