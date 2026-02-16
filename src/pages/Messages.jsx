import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageCircle, Search, Loader2, User, Users, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NewMessageDialog from "@/components/messages/NewMessageDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      const sent = await base44.entities.Message.filter({ sender_email: currentUser.email });
      const received = await base44.entities.Message.filter({ receiver_email: currentUser.email });
      return [...sent, ...received];
    },
    enabled: !!currentUser,
  });

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["messageable-users", currentUser?.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMessageableUsers');
      return response.data.users || [];
    },
    enabled: !!currentUser,
    staleTime: 30000,
  });

  const { data: allUsersForNames = [] } = useQuery({
    queryKey: ["all-users-names"],
    queryFn: async () => {
      // Use backend function to get all users with service role
      const response = await base44.functions.invoke('getMessageableUsers');
      return response.data.users || [];
    },
    enabled: !!currentUser,
  });

  // Group messages by conversation
  const conversations = React.useMemo(() => {
    const convMap = new Map();
    
    messages.forEach(msg => {
      const otherEmail = msg.sender_email === currentUser?.email ? msg.receiver_email : msg.sender_email;
      const convId = [currentUser?.email, otherEmail].sort().join("_");
      
      if (!convMap.has(convId)) {
        const otherUser = allUsersForNames.find(u => u.email === otherEmail);
        convMap.set(convId, {
          otherEmail,
          otherUser,
          messages: [],
          lastMessage: msg,
          unreadCount: 0,
        });
      }
      
      const conv = convMap.get(convId);
      conv.messages.push(msg);
      
      // Update last message if this one is newer
      if (new Date(msg.created_date) > new Date(conv.lastMessage.created_date)) {
        conv.lastMessage = msg;
      }
      
      // Count unread
      if (msg.receiver_email === currentUser?.email && !msg.read) {
        conv.unreadCount++;
      }
    });
    
    return Array.from(convMap.values()).sort((a, b) => 
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  }, [messages, currentUser, allUsersForNames]);

  const filtered = showUserSearch 
    ? allUsers.filter(u => 
        !search || 
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.display_name && u.display_name.toLowerCase().includes(search.toLowerCase()))
      )
    : conversations.filter(c => 
        !search || c.otherEmail.toLowerCase().includes(search.toLowerCase())
      );

  const deleteMutation = useMutation({
    mutationFn: async (otherEmail) => {
      const convId = [currentUser.email, otherEmail].sort().join("_");
      const allMessages = await base44.entities.Message.filter({ conversation_id: convId });
      await Promise.all(allMessages.map(msg => base44.entities.Message.delete(msg.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    },
  });

  const handleDeleteClick = (e, otherEmail) => {
    e.preventDefault();
    e.stopPropagation();
    setConversationToDelete(otherEmail);
    setDeleteDialogOpen(true);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nachrichten</h1>
        </div>

        {/* Search & Actions */}
        <div className="flex gap-2 mb-3">
          <Button
            onClick={() => setShowUserSearch(false)}
            variant={!showUserSearch ? "default" : "ghost"}
            size="sm"
            className={!showUserSearch ? "bg-cyan-500 text-white" : "text-white/50"}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Konversationen
          </Button>
          <Button
            onClick={() => setShowUserSearch(true)}
            variant={showUserSearch ? "default" : "ghost"}
            size="sm"
            className={showUserSearch ? "bg-cyan-500 text-white" : "text-white/50"}
          >
            <Users className="w-4 h-4 mr-2" />
            Neue Nachricht
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={showUserSearch ? "Suche User..." : "Suche Konversationen..."}
            className="bg-slate-800/50 border-white/10 text-white pl-10 placeholder:text-white/20"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-3xl mx-auto px-4 pb-24">
        {(isLoading || (showUserSearch && isLoadingUsers)) ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">Keine Nachrichten gefunden</p>
          </div>
        ) : (
          <div className="space-y-2">
            {showUserSearch ? (
              // User search results
              filtered.map((user, i) => (
                <motion.div
                  key={user.email}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={createPageUrl("Chat") + `?email=${encodeURIComponent(user.email)}`}
                    className="block bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 hover:border-cyan-500/30 p-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {user.data?.display_name || user.display_name || user.full_name}
                        </h3>
                        <p className="text-white/40 text-xs mt-1">Neue Konversation starten</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              // Conversations
              filtered.map((conv, i) => (
                <motion.div
                  key={conv.otherEmail}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative group"
                >
                  <Link
                    to={createPageUrl("Chat") + `?email=${encodeURIComponent(conv.otherEmail)}`}
                    className="block bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 hover:border-cyan-500/30 p-4 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-medium truncate">
                            {(conv.otherUser?.data?.display_name || 
                              conv.otherUser?.display_name || 
                              conv.otherUser?.full_name) || 
                             "Benutzer"}
                          </h3>
                          <div className="flex items-center gap-2">
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-cyan-500 text-white text-xs px-2 py-0">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-white/50 text-sm line-clamp-1">
                          {conv.lastMessage.sender_email === currentUser.email ? "Du: " : ""}
                          {conv.lastMessage.message}
                        </p>
                        <p className="text-white/30 text-xs mt-1">
                          {new Date(conv.lastMessage.created_date).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteClick(e, conv.otherEmail)}
                        className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-opacity flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Konversation löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Möchtest du diese Konversation wirklich löschen? Alle Nachrichten werden dauerhaft entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white border-white/10 hover:bg-slate-700">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(conversationToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Löschen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}