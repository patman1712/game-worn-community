import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service role to get all users and pending users
        const allUsers = await base44.asServiceRole.entities.User.list();
        const allPendingUsers = await base44.asServiceRole.entities.PendingUser.list();
        
        // Filter users who accept messages and exclude current user
        const messageableUsers = allUsers.filter(u => {
            if (!u || u.email === user.email) return false;
            
            // Check PendingUser first, then User.data
            const pendingUser = allPendingUsers.find(pu => pu.email === u.email);
            const acceptsMessages = pendingUser 
                ? (pendingUser.accept_messages !== false)
                : (u.data?.accept_messages !== false && u.accept_messages !== false);
            
            return acceptsMessages;
        });

        // Return only necessary public fields
        const publicUsers = messageableUsers.map(u => ({
            email: u.email,
            full_name: u.full_name,
            display_name: u.data?.display_name || u.display_name || u.full_name,
            data: {
                display_name: u.data?.display_name || u.display_name || u.full_name
            }
        }));

        return Response.json({ users: publicUsers });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});