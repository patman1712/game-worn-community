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
    const { userId, approve, role = 'user' } = payload;

    if (!userId) {
      return Response.json({ error: 'User ID fehlt' }, { status: 400 });
    }

    // Get user details first
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    const userDetails = users[0];

    if (!userDetails) {
      return Response.json({ error: 'User nicht gefunden' }, { status: 404 });
    }

    if (approve) {
      // Approve user and set role (user or moderator)
      await base44.asServiceRole.entities.User.update(userId, { role });

      // Send approval email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: userDetails.email,
        subject: 'Dein Account wurde freigeschaltet - Jersey Collectors',
        body: `
          <h2>Dein Account wurde freigeschaltet!</h2>
          <p>Hallo ${userDetails.display_name || userDetails.email},</p>
          <p>Gute Nachrichten! Dein Account wurde von einem Administrator freigeschaltet.</p>
          ${role === 'moderator' ? '<p><strong>Du wurdest als Moderator freigeschaltet</strong> und hast erweiterte Rechte in der Community.</p>' : ''}
          <p>Du kannst dich jetzt mit deinen Zugangsdaten anmelden und die Jersey Collectors Community nutzen.</p>
          <p>Viel Spaß beim Sammeln und Teilen deiner Trikots!</p>
          <p>Mit freundlichen Grüßen,<br>Das Jersey Collectors Team</p>
        `,
      });

      // Notify admin who approved
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: 'User freigeschaltet - Jersey Collectors',
        body: `
          <h2>User erfolgreich freigeschaltet</h2>
          <p>Du hast den User <strong>${userDetails.display_name}</strong> (${userDetails.email}) erfolgreich als <strong>${role === 'moderator' ? 'Moderator' : 'User'}</strong> freigeschaltet.</p>
          <p>Der User wurde per E-Mail benachrichtigt.</p>
        `,
      });
    } else {
      // Reject user - delete account
      await base44.asServiceRole.entities.User.delete(userId);

      // Send rejection email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: userDetails.email,
        subject: 'Registrierung abgelehnt - Jersey Collectors',
        body: `
          <h2>Registrierung abgelehnt</h2>
          <p>Hallo ${userDetails.display_name || 'dort'},</p>
          <p>Leider konnte deine Registrierung bei Jersey Collectors nicht genehmigt werden.</p>
          <p>Bei Fragen kannst du dich gerne an einen Administrator wenden.</p>
          <p>Mit freundlichen Grüßen,<br>Das Jersey Collectors Team</p>
        `,
      });

      // Notify admin who rejected
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: 'User abgelehnt - Jersey Collectors',
        body: `
          <h2>User abgelehnt</h2>
          <p>Du hast die Registrierung von <strong>${userDetails.display_name}</strong> (${userDetails.email}) abgelehnt.</p>
          <p>Der User wurde per E-Mail benachrichtigt und aus der Datenbank gelöscht.</p>
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