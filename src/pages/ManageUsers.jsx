import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Shield, Ban, Trash2, Edit, Loader2, Search, Check, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ManageUsers() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (!u || (u.role !== 'admin' && u.data?.role !== 'admin')) {
        window.location.href = '/';
      } else {
        setUser(u);
      }
    });
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      const pendingUsers = await base44.entities.PendingUser.list();
      
      // Merge PendingUser data with User data for display names if needed
      return allUsers.map(user => {
        const pendingUser = pendingUsers.find(p => p.email === user.email);
        if (pendingUser) {
          return {
            ...user,
            data: {
              ...user.data,
              display_name: pendingUser.display_name || user.data?.display_name,
              real_name: pendingUser.real_name || user.data?.real_name,
              location: pendingUser.location || user.data?.location,
              show_location: pendingUser.show_location !== undefined ? pendingUser.show_location : user.data?.show_location,
              accept_messages: pendingUser.accept_messages !== undefined ? pendingUser.accept_messages : user.data?.accept_messages
            }
          };
        }
        return user;
      });
    },
    enabled: !!user,
  });

  const { data: pendingApprovals = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: async () => {
      return await base44.entities.PendingUser.list();
    },
    enabled: !!user,
  });

  // Filter out pending users that are already approved (exist in users list)
  const usersToApprove = pendingApprovals.filter(
    p => !users.some(u => u.email === p.email)
  );

  const approveMutation = useMutation({
    mutationFn: async (pendingUserId) => {
      await base44.auth.approveUser(pendingUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    },
    onError: (error) => {
      console.error('Approve user error:', error);
      alert('Fehler beim Freischalten: ' + error.message);
    }
  });

  const manageMutation = useMutation({
    mutationFn: async ({ action, userId, updates }) => {
      // Direct call to local client logic which now routes to /auth/manage-user
      // The client now returns { data: ... }
      const response = await base44.functions.invoke('manageUser', { action, userId, updates });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setEditingUser(null);
    },
    onError: (error) => {
      console.error('Manage user error:', error);
      alert('Fehler: ' + (error.response?.data?.error || error.message));
    }
  });

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.data?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.data?.real_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">User Verwaltung</h1>
          <p className="text-white/50">Verwalte Registrierungen und Benutzer</p>
        </div>

        {/* Pending Approvals Section */}
        {usersToApprove.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Warten auf Freischaltung
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 ml-2">
                {usersToApprove.length}
              </Badge>
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {usersToApprove.map((pendingUser) => (
                <Card key={pendingUser.id} className="bg-slate-900/60 backdrop-blur-sm border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-cyan-400" />
                      </div>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                        Neu
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-1">
                      {pendingUser.data?.display_name || 'Unbekannt'}
                    </h3>
                    <p className="text-white/50 text-sm mb-4">{pendingUser.email}</p>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => approveMutation.mutate(pendingUser.id)}
                        disabled={approveMutation.isPending}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                      >
                        {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        Freischalten
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-white mb-4">Registrierte User</h2>
        <Card className="bg-slate-900/60 backdrop-blur-sm border-white/5 mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suche nach Email, Name..."
                className="bg-slate-800/50 border-white/10 text-white flex-1"
              />
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {filteredUsers.map((u) => (
            <Card key={u.id} className="bg-slate-900/60 backdrop-blur-sm border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{u.data?.display_name || u.full_name}</p>
                        {(u.role === 'admin' || u.data?.role === 'admin') && (
                          <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {u.data?.role === 'moderator' && (
                          <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Moderator
                          </Badge>
                        )}
                        {u.data?.is_blocked && (
                          <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs">
                            <Ban className="w-3 h-3 mr-1" />
                            Gesperrt
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/50 text-sm">{u.email}</p>
                      {u.data?.real_name && u.data?.real_name !== u.data?.display_name && (
                        <p className="text-white/30 text-xs mt-1">{u.data.real_name}</p>
                      )}
                      {u.data?.location && (
                        <p className="text-white/30 text-xs">📍 {u.data.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Edit Dialog */}
                    <Dialog open={editingUser?.id === u.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={async () => {
                            // Fetch fresh PendingUser data when opening edit dialog
                            const pendingUsers = await base44.entities.PendingUser.filter({ email: u.email });
                            const pendingUser = pendingUsers[0];
                            if (pendingUser) {
                              setEditingUser({
                                ...u,
                                data: {
                                  ...u.data,
                                  display_name: pendingUser.display_name || u.data?.display_name,
                                  real_name: pendingUser.real_name || u.data?.real_name,
                                  location: pendingUser.location || u.data?.location,
                                  show_location: pendingUser.show_location !== undefined ? pendingUser.show_location : u.data?.show_location,
                                  accept_messages: pendingUser.accept_messages !== undefined ? pendingUser.accept_messages : u.data?.accept_messages
                                }
                              });
                            } else {
                              setEditingUser(u);
                            }
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Bearbeiten
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-white/10 text-white">
                        <DialogHeader>
                          <DialogTitle>User bearbeiten</DialogTitle>
                        </DialogHeader>
                        {editingUser && (
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label>Anzeigename</Label>
                              <Input
                                value={editingUser.data?.display_name || ''}
                                onChange={(e) => setEditingUser({
                                  ...editingUser, 
                                  data: {...editingUser.data, display_name: e.target.value}
                                })}
                                className="bg-slate-800 border-white/10 text-white"
                              />
                            </div>
                            <div>
                              <Label>Vollständiger Name</Label>
                              <Input
                                value={editingUser.data?.real_name || ''}
                                onChange={(e) => setEditingUser({
                                  ...editingUser, 
                                  data: {...editingUser.data, real_name: e.target.value}
                                })}
                                className="bg-slate-800 border-white/10 text-white"
                              />
                            </div>
                            <div>
                              <Label>Wohnort</Label>
                              <Input
                                value={editingUser.data?.location || ''}
                                onChange={(e) => setEditingUser({
                                  ...editingUser, 
                                  data: {...editingUser.data, location: e.target.value}
                                })}
                                className="bg-slate-800 border-white/10 text-white"
                              />
                            </div>
                            <div>
                              <Label>Rolle</Label>
                              <Select
                                value={editingUser.data?.role || 'user'}
                                onValueChange={(value) => setEditingUser({
                                  ...editingUser, 
                                  data: {...editingUser.data, role: value}
                                })}
                              >
                                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10">
                                  <SelectItem value="user" className="text-white">User</SelectItem>
                                  <SelectItem value="moderator" className="text-white">Moderator</SelectItem>
                                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Wohnort anzeigen</Label>
                              <Switch
                                checked={editingUser.data?.show_location || false}
                                onCheckedChange={(checked) => setEditingUser({
                                  ...editingUser, 
                                  data: {...editingUser.data, show_location: checked}
                                })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Nachrichten akzeptieren</Label>
                              <Switch
                                checked={editingUser.data?.accept_messages !== false}
                                onCheckedChange={(checked) => setEditingUser({
                                  ...editingUser, 
                                  data: {...editingUser.data, accept_messages: checked}
                                })}
                              />
                            </div>
                            <Button
                              onClick={() => {
                                const updates = {};
                                if (editingUser.data?.display_name !== undefined) updates.display_name = editingUser.data.display_name;
                                if (editingUser.data?.real_name !== undefined) updates.real_name = editingUser.data.real_name;
                                if (editingUser.data?.location !== undefined) updates.location = editingUser.data.location;
                                if (editingUser.data?.role !== undefined) updates.role = editingUser.data.role;
                                if (editingUser.data?.show_location !== undefined) updates.show_location = editingUser.data.show_location;
                                if (editingUser.data?.accept_messages !== undefined) updates.accept_messages = editingUser.data.accept_messages;
                                
                                manageMutation.mutate({
                                  action: 'update',
                                  userId: editingUser.id,
                                  updates
                                });
                              }}
                              disabled={manageMutation.isPending}
                              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
                            >
                              {manageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* Block/Unblock */}
                    <Button
                      onClick={() => manageMutation.mutate({
                        action: u.data?.is_blocked ? 'unblock' : 'block',
                        userId: u.id
                      })}
                      disabled={manageMutation.isPending}
                      size="sm"
                      variant="ghost"
                      className={u.data?.is_blocked ? "text-green-400 hover:bg-green-500/10" : "text-orange-400 hover:bg-orange-500/10"}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {u.data?.is_blocked ? 'Entsperren' : 'Sperren'}
                    </Button>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Löschen
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>User wirklich löschen?</AlertDialogTitle>
                          <AlertDialogDescription className="text-white/50">
                            Dies wird den User <strong>{u.data?.display_name || u.full_name}</strong> und alle seine Daten (Trikots, Kommentare, Nachrichten) permanent löschen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-slate-800 border-white/10 text-white">Abbrechen</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => manageMutation.mutate({ action: 'delete', userId: u.id })}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <Card className="bg-slate-900/60 backdrop-blur-sm border-white/5">
              <CardContent className="p-12 text-center">
                <p className="text-white/40">Keine User gefunden.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
