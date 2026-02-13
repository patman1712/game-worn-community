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
    const pendingUsers = await base44.asServiceRole.entities.PendingUser.filter({ id: pendingUserId });
    const pendingUser = pendingUsers[0];

    if (!pendingUser) {
      return Response.json({ error: 'Pending User nicht gefunden' }, { status: 404 });
    }

    if (approve) {
      // Check if user already exists
      const existingUsers = await base44.asServiceRole.entities.User.filter({ email: pendingUser.email });
      
      if (existingUsers.length > 0) {
        // User already exists, just update their data
        await base44.asServiceRole.entities.User.update(existingUsers[0].id, {
          display_name: pendingUser.display_name,
          real_name: pendingUser.real_name,
          location: pendingUser.location,
          show_location: pendingUser.show_location,
          accept_messages: pendingUser.accept_messages,
          role: role,
        });
      } else {
        // Create new user with Base44 Auth API
        const appId = Deno.env.get('BASE44_APP_ID');
        
        // Register user via Auth API
        const authResponse = await fetch(`https://api.base44.com/v1/apps/${appId}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: pendingUser.email,
            password: pendingUser.password_hash,
            full_name: pendingUser.display_name,
          }),
        });

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          throw new Error(errorData.error || 'Fehler beim Erstellen des Users');
        }

        // Wait a bit for user to be created
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Get the newly created user
        const newUsers = await base44.asServiceRole.entities.User.filter({ email: pendingUser.email });
        
        if (newUsers.length > 0) {
          // Update user with additional data
          await base44.asServiceRole.entities.User.update(newUsers[0].id, {
            display_name: pendingUser.display_name,
            real_name: pendingUser.real_name,
            location: pendingUser.location,
            show_location: pendingUser.show_location,
            accept_messages: pendingUser.accept_messages,
            role: role,
          });
        }
      }

      // Send approval email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: pendingUser.email,
        subject: 'Dein Account wurde freigeschaltet - Jersey Collectors',
        body: `
          <h2>Dein Account wurde freigeschaltet!</h2>
          <p>Hallo ${pendingUser.display_name},</p>
          <p>Gute Nachrichten! Dein Account wurde von einem Administrator freigeschaltet.</p>
          ${role === 'moderator' ? '<p><strong>Du wurdest als Moderator freigeschaltet</strong> und hast erweiterte Rechte in der Community.</p>' : ''}
          <p>Du kannst dich jetzt mit deinen Zugangsdaten anmelden.</p>
          <p>Viel Spaß beim Sammeln und Teilen deiner Trikots!</p>
          <p>Mit freundlichen Grüßen,<br>Das Jersey Collectors Team</p>
        `,
      });

      // Delete pending user entry
      await base44.asServiceRole.entities.PendingUser.delete(pendingUserId);

    } else {
      // Reject user - delete pending entry
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