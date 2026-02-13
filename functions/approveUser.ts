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
        const appId = Deno.env.get('BASE44_APP_ID');
        
        // Create user directly via Auth API with password
        const authResponse = await fetch(`https://api.base44.com/v1/apps/${appId}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: pendingUser.email,
            password: pendingUser.password_hash,
            full_name: pendingUser.display_name || pendingUser.email,
          }),
        });

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          console.error('Auth API error:', errorData);
          throw new Error(errorData.error || 'Fehler beim Erstellen des Users');
        }

        // Wait for user to be created in database
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get the newly created user
        const allUsers = await base44.asServiceRole.entities.User.list();
        const newUser = allUsers.find(u => u.email === pendingUser.email);

        if (newUser) {
          // Update user with additional data and role
          await base44.asServiceRole.entities.User.update(newUser.id, {
            display_name: pendingUser.display_name,
            real_name: pendingUser.real_name,
            location: pendingUser.location,
            show_location: pendingUser.show_location,
            accept_messages: pendingUser.accept_messages,
            role: role,
          });

          // Send approval email
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