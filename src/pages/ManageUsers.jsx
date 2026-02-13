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
import { User, Shield, Ban, Trash2, Edit, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ManageUsers() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (!u || u.role !== 'admin') {
        window.location.href = '/';
      } else {
        setUser(u);
      }
    });
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      return await base44.entities.User.list();
    },
    enabled: !!user,
  });

  const manageMutation = useMutation({
    mutationFn: async ({ action, userId, updates }) => {
      return base44.functions.invoke('manageUser', { action, userId, updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setEditingUser(null);
    },
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
          <h1 className="text-3xl font-bold text-white mb-2">Registrierte User</h1>
          <p className="text-white/50">Verwalte alle registrierten Benutzer</p>
        </div>

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
                        {u.role === 'admin' && (
                          <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {u.role === 'moderator' && (
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
                          onClick={() => setEditingUser(u)}
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
                                value={editingUser.role}
                                onValueChange={(value) => setEditingUser({...editingUser, role: value})}
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
                                manageMutation.mutate({
                                  action: 'update',
                                  userId: editingUser.id,
                                  updates: {
                                    display_name: editingUser.data?.display_name,
                                    real_name: editingUser.data?.real_name,
                                    location: editingUser.data?.location,
                                    role: editingUser.role,
                                    show_location: editingUser.data?.show_location,
                                    accept_messages: editingUser.data?.accept_messages,
                                  }
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