import React, { useState, useEffect } from "react";
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Plus, Shirt, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from 'react-i18next';
import JerseyCard from "@/components/jerseys/JerseyCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MyCollection() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {
      api.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: jerseys = [], isLoading: jerseysLoading } = useQuery({
    queryKey: ["myJerseys", user?.email],
    queryFn: () => api.entities.Jersey.filter({ owner_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["myItems", user?.email],
    queryFn: () => api.entities.CollectionItem.filter({ owner_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: likes = [] } = useQuery({
    queryKey: ["likes", user?.email],
    queryFn: () => user ? api.entities.JerseyLike.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const likedIds = new Set(likes.map(l => l.jersey_id));
  const allProducts = [...jerseys, ...items].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_date || 0).getTime();
    const dateB = new Date(b.createdAt || b.created_date || 0).getTime();
    return dateB - dateA;
  });
  const isLoading = jerseysLoading || itemsLoading;

  // Pagination Calculation
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);
  const currentItems = allProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('myCollection.title')}</h1>
              <p className="text-white/40 text-sm mt-1">{allProducts.length} {t('stats.jerseys')}</p>
            </div>
            <Link to={createPageUrl("AddJersey")}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t('myCollection.addItem')}
              </Button>
            </Link>
          </div>
          <Link to={createPageUrl("MyPurchases")}>
            <Button variant="outline" className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10">
              💰 {t('admin.userPurchases')}
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : allProducts.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/10">
            <Shirt className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">{t('myCollection.noItems')}</p>
            <Link to={createPageUrl("AddJersey")}>
              <Button className="mt-4 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30">
                <Plus className="w-4 h-4 mr-2" />
                {t('myCollection.startCollection')}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <AnimatePresence>
                {currentItems.map((jersey, i) => (
                  <JerseyCard
                    key={jersey.id}
                    jersey={jersey}
                    index={i}
                    isLiked={likedIds.has(jersey.id)}
                    onLike={async (id) => {
                      const existing = likes.find(l => l.jersey_id === id);
                      if (existing) {
                        await api.entities.JerseyLike.delete(existing.id);
                      } else {
                        await api.entities.JerseyLike.create({ jersey_id: id, user_email: user.email });
                      }
                      queryClient.invalidateQueries({ queryKey: ["likes"] });
                      queryClient.invalidateQueries({ queryKey: ["myJerseys"] });
                      queryClient.invalidateQueries({ queryKey: ["myItems"] });
                    }}
                  />
                ))}
              </AnimatePresence>
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