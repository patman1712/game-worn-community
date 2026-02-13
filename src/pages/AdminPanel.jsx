import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, UserX, Shield } from "lucide-react";

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(u);
    }).catch(() => window.location.href = '/');
  }, []);

  const { data: pendingUsers = [], isLoading } = useQuery({
    queryKey: ['pendingUsers'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === 'pending');
    },
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, approve, role }) => {
      return base44.functions.invoke('approveUser', { userId, approve, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
    },
  });

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </div>

        <Card className="bg-slate-900/60 border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg">Ausstehende Registrierungen</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">
                Keine ausstehenden Registrierungen
              </p>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map(u => (
                  <div key={u.id} className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">{u.display_name || u.email}</h3>
                        <p className="text-white/50 text-sm">{u.email}</p>
                        {u.location && (
                          <p className="text-white/40 text-xs mt-1">{u.location}</p>
                        )}
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                        Ausstehend
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveMutation.mutate({ userId: u.id, approve: true, role: 'user' })}
                        disabled={approveMutation.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Als User freischalten
                      </Button>
                      <Button
                        onClick={() => approveMutation.mutate({ userId: u.id, approve: true, role: 'moderator' })}
                        disabled={approveMutation.isPending}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Als Moderator freischalten
                      </Button>
                      <Button
                        onClick={() => approveMutation.mutate({ userId: u.id, approve: false })}
                        disabled={approveMutation.isPending}
                        size="sm"
                        variant="destructive"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}