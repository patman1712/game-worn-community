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

    if (!pendingUserId) {
      return Response.json({ error: 'Pending User ID fehlt' }, { status: 400 });
    }

    // Get pending user details
    const allPendingUsers = await base44.asServiceRole.entities.PendingUser.list();
    const pendingUser = allPendingUsers.find(p => p.id === pendingUserId);

    if (!pendingUser) {
      return Response.json({ error: 'Pending User nicht gefunden' }, { status: 404 });
    }

    if (approve) {
      try {
        // Invite user with SDK - this creates the user and sends invitation email
        await base44.users.inviteUser(pendingUser.email, role);

        // Wait for user creation in database
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get the created user and update profile
        const allUsers = await base44.asServiceRole.entities.User.list();
        const newUser = allUsers.find(u => u.email === pendingUser.email);

        if (newUser) {
          // Update user profile with additional data
          await base44.asServiceRole.entities.User.update(newUser.id, {
            display_name: pendingUser.display_name,
            real_name: pendingUser.real_name,
            location: pendingUser.location,
            show_location: pendingUser.show_location,
            accept_messages: pendingUser.accept_messages,
          });

          // Now send approval confirmation email (user exists in database now)
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: pendingUser.email,
            subject: 'Dein Account wurde freigeschaltet - Jersey Collectors',
            body: `
              <h2>Dein Account wurde freigeschaltet!</h2>
              <p>Hallo ${pendingUser.display_name},</p>
              <p>Gute Nachrichten! Dein Account wurde von einem Administrator freigeschaltet.</p>
              ${role === 'moderator' ? '<p><strong>Du wurdest als Moderator freigeschaltet</strong> und hast erweiterte Rechte in der Community.</p>' : ''}
              <p><strong>Wichtiger Hinweis:</strong> Du hast eine separate Einladungs-E-Mail erhalten. Bitte klicke auf den Link in dieser E-Mail, um dein Passwort zu setzen und dich erstmalig anzumelden.</p>
              <p>Falls du die E-Mail nicht findest, schaue bitte auch in deinem Spam-Ordner nach.</p>
              <p>Viel Spaß beim Sammeln und Teilen deiner Trikots!</p>
              <p>Mit freundlichen Grüßen,<br>Das Jersey Collectors Team</p>
            `,
          });
        }

        // Delete pending user entry
        await base44.asServiceRole.entities.PendingUser.delete(pendingUserId);

      } catch (error) {
        console.error('Error during approval:', error);
        throw error;
      }
    } else {
      // Reject user - just delete pending entry
      await base44.asServiceRole.entities.PendingUser.delete(pendingUserId);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Approval error:', error);
    return Response.json({ 
      error: error.message || 'Fehler bei der Freischaltung'
    }, { status: 500 });
  }
});