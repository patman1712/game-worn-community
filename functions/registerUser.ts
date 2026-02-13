import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { email, password, display_name, real_name, location, show_location, accept_messages } = payload;

    if (!email || !password || !display_name) {
      return Response.json({ error: 'Erforderliche Felder fehlen' }, { status: 400 });
    }

    // Create user entity record with pending role
    const newUser = await base44.asServiceRole.entities.User.create({
      email,
      role: 'pending',
      display_name,
      real_name: real_name || display_name,
      location: location || '',
      show_location: show_location || false,
      accept_messages: accept_messages !== false,
      password_hash: password, // Store temporarily, will be handled by auth system
    });

    // Get admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');
    
    // Send email to all admins
    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: 'Neue Registrierung - Jersey Collectors',
        body: `
          <h2>Neue Benutzer-Registrierung</h2>
          <p>Ein neuer Benutzer hat sich registriert und wartet auf Freischaltung:</p>
          <ul>
            <li><strong>E-Mail:</strong> ${email}</li>
            <li><strong>Anzeigename:</strong> ${display_name}</li>
            <li><strong>Vollständiger Name:</strong> ${real_name || 'Nicht angegeben'}</li>
            <li><strong>Wohnort:</strong> ${location || 'Nicht angegeben'}</li>
          </ul>
          <p>Bitte logge dich ins Admin-Panel ein, um den Benutzer freizuschalten.</p>
        `,
      });
    }

    // Send confirmation email to new user
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: 'Willkommen bei Jersey Collectors - Registrierung erhalten',
      body: `
        <h2>Willkommen bei Jersey Collectors!</h2>
        <p>Hallo ${display_name},</p>
        <p>Vielen Dank für deine Registrierung! Deine Anmeldung wurde erfolgreich übermittelt.</p>
        <p><strong>Wichtig:</strong> Dein Account muss noch von einem Administrator freigeschaltet werden. Du erhältst eine weitere E-Mail, sobald dies geschehen ist und du dich anmelden kannst.</p>
        <p>Dies kann einige Zeit in Anspruch nehmen. Bitte habe etwas Geduld.</p>
        <p>Mit freundlichen Grüßen,<br>Das Jersey Collectors Team</p>
      `,
    });

    return Response.json({ 
      success: true, 
      message: 'Registrierung erfolgreich. Warte auf Admin-Freischaltung.' 
    });

  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ 
      error: error.message || 'Fehler bei der Registrierung' 
    }, { status: 500 });
  }
});