import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email } = await req.json();

        if (!email) {
            return Response.json({ error: 'Email required' }, { status: 400 });
        }

        // Use service role to get user details
        const allUsers = await base44.asServiceRole.entities.User.list();
        const foundUser = allUsers.find(u => u.email === email);

        if (foundUser) {
            return Response.json({
                email: foundUser.email,
                full_name: foundUser.full_name,
                display_name: foundUser.data?.display_name || foundUser.display_name || foundUser.full_name,
                data: {
                    display_name: foundUser.data?.display_name || foundUser.display_name || foundUser.full_name
                }
            });
        }

        // Check PendingUser if not found in User
        const pendingUsers = await base44.asServiceRole.entities.PendingUser.list();
        const foundPendingUser = pendingUsers.find(u => u.email === email);

        if (foundPendingUser) {
            return Response.json({
                email: foundPendingUser.email,
                full_name: foundPendingUser.real_name || foundPendingUser.display_name,
                display_name: foundPendingUser.display_name,
                data: {
                    display_name: foundPendingUser.display_name
                }
            });
        }

        return Response.json({ error: 'User not found' }, { status: 404 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});