import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send, Loader2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const otherEmail = urlParams.get("email");

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: otherUser } = useQuery({
    queryKey: ["user", otherEmail],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.email === otherEmail);
    },
    enabled: !!otherEmail,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat", currentUser?.email, otherEmail],
    queryFn: async () => {
      if (!currentUser || !otherEmail) return [];
      const convId = [currentUser.email, otherEmail].sort().join("_");
      const allMessages = await base44.entities.Message.filter({ conversation_id: convId });
      return allMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!currentUser && !!otherEmail,
    refetchInterval: 3000, // Poll for new messages
  });

  // Mark messages as read
  useEffect(() => {
    if (!currentUser || !messages.length) return;
    
    const unreadMessages = messages.filter(m => 
      m.receiver_email === currentUser.email && !m.read
    );
    
    unreadMessages.forEach(msg => {
      base44.entities.Message.update(msg.id, { read: true }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["unreadMessages"] });
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      });
    });
  }, [messages, currentUser, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async (text) => {
      const convId = [currentUser.email, otherEmail].sort().join("_");
      return base44.entities.Message.create({
        sender_email: currentUser.email,
        receiver_email: otherEmail,
        message: text,
        conversation_id: convId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setMessageText("");
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentUser || !otherEmail) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Fixed Chat Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-medium">
              {otherUser?.data?.display_name || otherUser?.display_name || otherUser?.full_name || otherEmail}
            </h2>
            <p className="text-white/40 text-xs">Chat</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 min-h-[50vh]">
        <div className="max-w-3xl mx-auto space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/30 text-sm">Noch keine Nachrichten</p>
              <p className="text-white/20 text-xs mt-1">Schreibe die erste Nachricht!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isOwn = msg.sender_email === currentUser.email;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                        : "bg-slate-800/80 text-white"
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? "text-white/60" : "text-white/40"}`}>
                      {new Date(msg.created_date).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-t border-white/5 px-4 py-4 sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Nachricht schreiben..."
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 flex-1"
            disabled={sendMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!messageText.trim() || sendMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}