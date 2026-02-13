import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { display_name } = await req.json();

    if (!display_name) {
      return Response.json({ error: 'Missing display_name' }, { status: 400 });
    }

    // Fetch all jerseys by this user
    const jerseys = await base44.entities.Jersey.filter({ owner_email: user.email });

    // Update all jerseys with new owner name
    for (const jersey of jerseys) {
      await base44.entities.Jersey.update(jersey.id, { owner_name: display_name });
    }

    return Response.json({ success: true, updated: jerseys.length });
  } catch (error) {
    console.error('Error updating user jerseys:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});