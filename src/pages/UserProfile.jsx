import React, { useState, useEffect } from "react";
import { api } from '@/api/apiClient';
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shirt, User, Heart, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import JerseyCard from "@/components/jerseys/JerseyCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';

export default function UserProfile() {
  const { t } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: jerseys = [], isLoading: jerseysLoading } = useQuery({
    queryKey: ["userJerseys", email],
    queryFn: () => api.entities.Jersey.filter({ owner_email: email }, "-createdAt"),
    enabled: !!email,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["userItems", email],
    queryFn: () => api.entities.CollectionItem.filter({ owner_email: email }, "-createdAt"),
    enabled: !!email,
  });

  const { data: profileUser } = useQuery({
    queryKey: ["profileUser", email],
    queryFn: async () => {
      try {
        const users = await api.entities.User.filter({ email });
        return Array.isArray(users) ? users[0] : null;
      } catch (e) {
        console.error("Error fetching user profile:", e);
        return null;
      }
    },
    enabled: !!email,
  });

  const { data: likes = [] } = useQuery({
    queryKey: ["likes", currentUser?.email],
    queryFn: () => currentUser ? api.entities.JerseyLike.filter({ user_email: currentUser.email }) : [],
    enabled: !!currentUser,
  });

  const safeJerseys = Array.isArray(jerseys) ? jerseys : [];
  const safeItems = Array.isArray(items) ? items : [];

  const likedIds = new Set(Array.isArray(likes) ? likes.map(l => l.jersey_id) : []);
  const allProducts = [...safeJerseys, ...safeItems].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_date || 0).getTime();
    const dateB = new Date(b.createdAt || b.created_date || 0).getTime();
    return dateB - dateA;
  });
  
  // Pagination
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);
  const currentItems = allProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ownerName = profileUser?.display_name || allProducts[0]?.owner_name || email;
  const totalLikes = allProducts.reduce((s, j) => s + (j.likes_count || 0), 0);
  const isLoading = jerseysLoading || itemsLoading;

  const ownerAcceptsMessages = profileUser?.data?.accept_messages !== false && profileUser?.accept_messages !== false;
  const userAcceptsMessages = currentUser ? (currentUser.data?.accept_messages ?? currentUser.accept_messages ?? true) : false;
  const showMessageButton = currentUser && (email !== currentUser.email) && ownerAcceptsMessages && userAcceptsMessages;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Link
          to={createPageUrl("Home")}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Link>

        {/* Profile Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{ownerName}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-white/40 text-sm flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5" /> {allProducts.length} Objekte
                </span>
                <span className="text-white/40 text-sm flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> {totalLikes} Likes
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            {showMessageButton && (
              <Link to={createPageUrl("Chat") + `?email=${email}`}>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2">
                  <div className="w-4 h-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  Nachricht senden
                </Button>
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : allProducts.length === 0 ? (
          <div className="text-center py-20">
            <Shirt className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">Keine Objekte in dieser Sammlung.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {currentItems.map((jersey, i) => (
                <JerseyCard
                  key={jersey.id}
                  jersey={jersey}
                  index={i}
                  isLiked={likedIds.has(jersey.id)}
                  onLike={() => {}}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8 pb-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-slate-800/50 border-white/10 text-white hover:bg-white/10 disabled:opacity-30 w-8 h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span className="hidden sm:inline">{t('pagination.page')}</span>
                  <Select 
                    value={String(currentPage)} 
                    onValueChange={(v) => handlePageChange(Number(v))}
                  >
                    <SelectTrigger className="w-[65px] h-8 bg-slate-800/50 border-white/10 text-white text-xs">
                      <SelectValue>{currentPage}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] bg-slate-900 border-white/10 text-white">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <SelectItem key={p} value={String(p)} className="text-xs focus:bg-white/10 focus:text-white cursor-pointer">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>{t('pagination.of')} {totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-slate-800/50 border-white/10 text-white hover:bg-white/10 disabled:opacity-30 w-8 h-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}