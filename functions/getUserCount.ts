import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Use service role to get all users count
        const users = await base44.asServiceRole.entities.User.list();
        
        return Response.json({ count: users.length });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});