import React, { useState, useEffect } from "react";
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Plus, Shirt, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from 'react-i18next';
import JerseyCard from "@/components/jerseys/JerseyCard";

export default function MyCollection() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

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
  const allProducts = [...jerseys, ...items];
  const isLoading = jerseysLoading || itemsLoading;

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {allProducts.map((jersey, i) => (
                <JerseyCard
                  key={jersey.id}
                  jersey={jersey}
                  index={i}
                  isLiked={likedIds.has(jersey.id)}
                  // onLike is optional, JerseyCard handles UI, but we can provide it for optimistic updates if needed
                  // For MyCollection, simple re-render on like change via query invalidation (which JerseyCard might not trigger for likes list)
                  // But JerseyCard only toggles heart visually if onLike is passed? No, let's check JerseyCard.
                  // JerseyCard calls onLike prop. If we don't pass it, it might not do anything.
                  // We should pass a simple handler.
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
        )}
      </div>
    </div>
  );
}