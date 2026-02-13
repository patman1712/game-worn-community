import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { email, password, display_name, real_name, location, show_location, accept_messages } = payload;

    if (!email || !password || !display_name) {
      return Response.json({ error: 'Erforderliche Felder fehlen' }, { status: 400 });
    }

    // Check if email already exists in pending or active users
    const existingPending = await base44.asServiceRole.entities.PendingUser.filter({ email });
    if (existingPending.length > 0) {
      return Response.json({ error: 'Diese E-Mail wartet bereits auf Freischaltung' }, { status: 400 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const existingUser = allUsers.find(u => u.email === email);
    if (existingUser) {
      return Response.json({ error: 'Diese E-Mail ist bereits registriert' }, { status: 400 });
    }

    // Create pending user entry
    await base44.asServiceRole.entities.PendingUser.create({
      email,
      password_hash: password,
      display_name,
      real_name: real_name || display_name,
      location: location || '',
      show_location: show_location || false,
      accept_messages: accept_messages !== false,
    });

    // Get admin users
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

    // Note: Cannot send email to unregistered user yet
    // Email will be sent after approval

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