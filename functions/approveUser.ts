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

    if (approve) {
      // Approve user and set role
      await base44.asServiceRole.entities.User.update(userId, { role });

      // Get user details
      const approvedUser = await base44.asServiceRole.entities.User.filter({ id: userId });
      const userDetails = approvedUser[0];

      // Send approval email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: userDetails.email,
        subject: 'Dein Account wurde freigeschaltet - Jersey Collectors',
        body: `
          <h2>Dein Account wurde freigeschaltet!</h2>
          <p>Hallo ${userDetails.display_name || userDetails.email},</p>
          <p>Gute Nachrichten! Dein Account wurde von einem Administrator freigeschaltet.</p>
          <p>Du kannst dich jetzt mit deinen Zugangsdaten anmelden und die Jersey Collectors Community nutzen.</p>
          <p>Viel Spaß beim Sammeln und Teilen deiner Trikots!</p>
          <p>Mit freundlichen Grüßen,<br>Das Jersey Collectors Team</p>
        `,
      });
    } else {
      // Reject user - delete account
      await base44.asServiceRole.entities.User.delete(userId);

      const rejectedUser = await base44.asServiceRole.entities.User.filter({ id: userId });
      if (rejectedUser[0]) {
        // Send rejection email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: rejectedUser[0].email,
          subject: 'Registrierung abgelehnt - Jersey Collectors',
          body: `
            <h2>Registrierung abgelehnt</h2>
            <p>Hallo,</p>
            <p>Leider konnte deine Registrierung bei Jersey Collectors nicht genehmigt werden.</p>
            <p>Bei Fragen wende dich bitte an einen Administrator.</p>
            <p>Mit freundlichen Grüßen,<br>Das Jersey Collectors Team</p>
          `,
        });
      }
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Approval error:', error);
    return Response.json({ 
      error: error.message || 'Fehler bei der Freischaltung' 
    }, { status: 500 });
  }
});