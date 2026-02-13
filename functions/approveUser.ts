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
      // Create user directly with password using Base44 API
      const appId = Deno.env.get('BASE44_APP_ID');
      const serviceToken = req.headers.get('authorization')?.replace('Bearer ', '');
      
      const createUserResponse = await fetch(`https://api.base44.com/apps/${appId}/auth/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: pendingUser.email,
          password: pendingUser.password_hash,
          full_name: pendingUser.real_name || pendingUser.display_name,
          role: role,
        }),
      });

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json();
        throw new Error(`User-Erstellung fehlgeschlagen: ${errorData.message || createUserResponse.statusText}`);
      }

      // Wait a moment for user to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user profile data
      const allUsers = await base44.asServiceRole.entities.User.list();
      const newUser = allUsers.find(u => u.email === pendingUser.email);
      
      if (newUser) {
        await base44.asServiceRole.entities.User.update(newUser.id, {
          display_name: pendingUser.display_name,
          real_name: pendingUser.real_name,
          location: pendingUser.location,
          show_location: pendingUser.show_location,
          accept_messages: pendingUser.accept_messages,
        });

        // Send approval email to the new user
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: pendingUser.email,
          subject: 'Dein Account wurde freigeschaltet - Jersey Collectors',
          body: `
            <h2>Dein Account wurde freigeschaltet!</h2>
            <p>Hallo ${pendingUser.display_name},</p>
            <p>Gute Nachrichten! Dein Account wurde von einem Administrator freigeschaltet.</p>
            ${role === 'moderator' ? '<p><strong>Du wurdest als Moderator freigeschaltet</strong> und hast erweiterte Rechte in der Community. Du kannst Trikots und Kommentare bearbeiten und löschen.</p>' : ''}
            <p>Du kannst dich jetzt mit deinen Zugangsdaten anmelden:</p>
            <ul>
              <li><strong>E-Mail:</strong> ${pendingUser.email}</li>
              <li><strong>Passwort:</strong> Das Passwort, das du bei der Registrierung angegeben hast</li>
            </ul>
            <p>Viel Spaß beim Sammeln und Teilen deiner Trikots!</p>
            <p>Mit freundlichen Grüßen,<br>Das Jersey Collectors Team</p>
          `,
        });
      }

      // Delete pending user entry
      await base44.asServiceRole.entities.PendingUser.delete(pendingUserId);

      // Notify admin who approved
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: 'User freigeschaltet - Jersey Collectors',
        body: `
          <h2>User erfolgreich freigeschaltet</h2>
          <p>Du hast den User <strong>${pendingUser.display_name}</strong> (${pendingUser.email}) erfolgreich als <strong>${role === 'moderator' ? 'Moderator' : 'User'}</strong> freigeschaltet.</p>
          <p>Der User wurde per E-Mail benachrichtigt und kann sich nun anmelden.</p>
        `,
      });
    } else {
      // Reject user - delete pending entry
      await base44.asServiceRole.entities.PendingUser.delete(pendingUserId);

      // Notify admin who rejected
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: 'User abgelehnt - Jersey Collectors',
        body: `
          <h2>User abgelehnt</h2>
          <p>Du hast die Registrierung von <strong>${pendingUser.display_name}</strong> (${pendingUser.email}) abgelehnt.</p>
          <p>Der Antrag wurde gelöscht.</p>
        `,
      });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Approval error:', error);
    return Response.json({ 
      error: error.message || 'Fehler bei der Freischaltung' 
    }, { status: 500 });
  }
});