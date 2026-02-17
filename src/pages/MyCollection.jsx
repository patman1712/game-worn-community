import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Plus, Shirt, Trash2, Pencil, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next';

export default function MyCollection() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: jerseys = [], isLoading: jerseysLoading } = useQuery({
    queryKey: ["myJerseys", user?.email],
    queryFn: () => base44.entities.Jersey.filter({ owner_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["myItems", user?.email],
    queryFn: () => base44.entities.CollectionItem.filter({ owner_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const allProducts = [...jerseys, ...items];
  const isLoading = jerseysLoading || itemsLoading;

  const deleteJerseyMutation = useMutation({
    mutationFn: (id) => base44.entities.Jersey.delete(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["myJerseys"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.CollectionItem.delete(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
    },
  });

  const handleDelete = (product) => {
    // Check if it's a Jersey or CollectionItem
    if (jerseys.some(j => j.id === product.id)) {
      deleteJerseyMutation.mutate(product.id);
    } else {
      deleteItemMutation.mutate(product.id);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {allProducts.map((jersey, i) => (
                <motion.div
                  key={jersey.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-slate-900/60 rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/20 transition-all"
                >
                  <Link to={createPageUrl("JerseyDetail") + `?id=${jersey.id}`}>
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={jersey.image_url}
                        alt={jersey.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-medium text-sm truncate">{jersey.title || jersey.team || "Ohne Titel"}</h3>
                        <p className="text-white/40 text-xs mt-0.5">{jersey.team}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Link to={createPageUrl("EditJersey") + `?id=${jersey.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 text-xs">
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Bearbeiten
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 text-xs">
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Löschen
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Trikot löschen?</AlertDialogTitle>
                              <AlertDialogDescription className="text-white/50">
                                Das Trikot wird unwiderruflich gelöscht.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(jersey)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {jersey.league && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {jersey.league}
                        </span>
                      )}
                      <span className="text-white/20 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                        {jersey.likes_count || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}