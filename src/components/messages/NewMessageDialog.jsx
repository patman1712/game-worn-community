import React, { useState } from "react";
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function NewMessageDialog({ currentUser, onMessageSent }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const allUsers = await api.entities.User.list();
      return allUsers.filter(u => {
        // User accepts messages if flag is explicitly true or undefined (default true)
        // AND checks if 'data' field has it (sometimes stored there)
        const userSettings = u.data || {};
        const acceptsMessages = 
          (u.accept_messages !== false) && 
          (userSettings.accept_messages !== false);
          
        const isSelf = u.email === currentUser?.email;
        
        return acceptsMessages && !isSelf;
      });
    },
    enabled: open,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const [email1, email2] = [currentUser.email, selectedUser].sort();
      const conversationId = `${email1}_${email2}`;

      return api.entities.Message.create({
        sender_email: currentUser.email,
        receiver_email: selectedUser,
        message: message,
        conversation_id: conversationId,
        read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessage("");
      setSelectedUser("");
      setOpen(false);
      if (onMessageSent) onMessageSent();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500">
          <MessageCircle className="w-4 h-4 mr-2" />
          {t('chat.newMessage')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>{t('chat.sendNewMessage')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>{t('chat.selectRecipient')}</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                <SelectValue placeholder={t('chat.selectUser')} />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.email} value={u.email}>
                    {u.data?.display_name || u.display_name || u.full_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('chat.messageLabel')}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('chat.typeMessage')}
              className="bg-slate-800 border-white/10 text-white placeholder:text-white/30 min-h-[120px]"
            />
          </div>
          <Button
            onClick={() => sendMessageMutation.mutate()}
            disabled={!selectedUser || !message.trim() || sendMessageMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('chat.send')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}