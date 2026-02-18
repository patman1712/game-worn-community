import React, { useState, useEffect } from "react";
import { Heart, Star, Award, User, Edit, DollarSign, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { api } from '@/api/apiClient';
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export default function JerseyCard({ jersey: initialJersey, isLiked, onLike, index = 0 }) {
  const { t } = useTranslation();
  // Flatten data if available (for CollectionItems)
  const jersey = { ...(initialJersey.data || {}), ...initialJersey };
  
  const [imgLoaded, setImgLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [open, setOpen] = useState(false);
  const displayName = jersey.owner_name || jersey.created_by;
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isModerator = currentUser?.data?.role === 'moderator' || currentUser?.role === 'admin' || currentUser?.data?.role === 'admin';
  const isOwner = currentUser?.email === jersey.owner_email || currentUser?.email === jersey.created_by;
  const canEdit = isModerator || isOwner;

  // Fix: Check explicit value, not just existence
  const isCollectionItem = jersey.product_type === 'collection_item';

  const likeMutation = useMutation({
    mutationFn: async () => {
      const entity = isCollectionItem ? api.entities.CollectionItem : api.entities.Jersey;
      if (isLiked) {
        // Unlike
        // We need the like ID. But JerseyCard only gets isLiked boolean from parent.
        // The parent (Home.jsx) handles the logic usually via onLike callback.
        // But to have instant update locally, we might need to rely on parent re-fetching.
        // However, if we want to show updated count immediately in the card, we need local state.
      }
    },
    // We actually rely on the parent's onLike handler for the mutation logic in most cases
    // But let's check how Home.jsx passes onLike.
  });

  // Local state for optimistic UI updates (optional, but good for UX)
  // Actually, the parent (Home.jsx) refetches data on like, so the prop `jersey` should update.
  // If `jersey.likes_count` comes from the DB, it should update after refetch.
  
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const entity = isCollectionItem ? api.entities.CollectionItem : api.entities.Jersey;
      
      // We don't need to manually delete likes/comments anymore
      // The backend now handles this automatically (server-side cleanup)
      
      // Delete item
      await entity.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jerseys"] });
      queryClient.invalidateQueries({ queryKey: ["collectionItems"] });
      queryClient.invalidateQueries({ queryKey: ["myJerseys"] });
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      setOpen(false);
    },
    onError: (error) => {
        alert("Fehler beim Löschen: " + error.message);
    }
  });
  
  const handleDeleteClick = (e) => {
      // STOP EVERYTHING to prevent card click
      e.preventDefault();
      e.stopPropagation();
      console.log("Delete clicked for:", jersey.id);
      setOpen(true);
  };
  
  const handleConfirmDelete = async (e) => {
      // STOP EVERYTHING AGAIN
      e.preventDefault();
      e.stopPropagation();
      console.log("Confirm delete for:", jersey.id);
      try {
          await deleteMutation.mutateAsync(jersey.id);
      } catch (err) {
          console.error("Delete failed:", err);
      }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative"
    >
      <div>
        <div 
          onClick={() => {
            window.location.href = createPageUrl("JerseyDetail") + `?id=${jersey.id}`;
          }}
          className="cursor-pointer relative bg-slate-900/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.1)]">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-slate-800">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-800 animate-pulse" />
            )}
            <img
              src={jersey.image_url}
              alt={jersey.title}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-contain transition-all duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />

            {/* Like and Edit buttons */}
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              {canEdit && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = createPageUrl("EditJersey") + `?id=${jersey.id}`;
                    }}
                    className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-orange-500/40 transition-all"
                  >
                    <Edit className="w-4 h-4 text-orange-400/70 hover:text-orange-400" />
                  </button>
                  
                  {/* Delete Button - Simplified Structure */}
                  <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogTrigger asChild>
                      <button 
                        onClick={handleDeleteClick}
                        className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-red-500/40 transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-400/70 hover:text-red-400" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent 
                        className="bg-slate-900 border-white/10 z-50"
                        onClick={(e) => e.stopPropagation()}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">{t('detail.deleteConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/50">
                          {t('detail.deleteConfirmText')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel 
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                            }}
                            className="bg-white/5 text-white border-white/10 hover:bg-white/10"
                        >
                            {t('detail.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmDelete}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {deleteMutation.isPending ? t('common.loading') : t('detail.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLike?.(jersey.id);
                }}
                className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all"
              >
                <Heart
                  className={`w-4 h-4 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-white/70 hover:text-white'}`}
                />
              </button>
            </div>
          </div>

          {/* Info Section - Below Image */}
          <div className="px-4 py-3 bg-slate-900/80">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-2 py-0">
                {jersey.sport_type === 'icehockey' ? t('home.filters.icehockey') :
                 jersey.sport_type === 'soccer' ? t('home.filters.soccer') :
                 jersey.sport_type === 'football' ? 'Football' :
                 jersey.sport_type === 'basketball' ? 'Basketball' :
                 jersey.sport_type === 'baseball' ? 'Baseball' : t('home.filters.icehockey')}
              </Badge>
              {jersey.league && (
                <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0">
                  {jersey.league}
                </Badge>
              )}
              {jersey.jersey_type && (
                <Badge className="bg-white/10 text-white/70 border border-white/10 text-[10px] px-2 py-0">
                  {jersey.jersey_type}
                </Badge>
              )}
            </div>
            <p className="text-white/70 text-sm font-medium truncate">{jersey.team}</p>
            {jersey.player_name && (
              <p className="text-cyan-400 text-sm mt-1 font-medium truncate">
                #{jersey.player_number} {jersey.player_name}
              </p>
            )}
          </div>

          {/* Info Section - Game Worn, For Sale, etc */}
          {(jersey.is_game_worn || jersey.is_game_issued || jersey.is_authentic || jersey.is_fan_jersey || jersey.is_signed || jersey.for_sale !== false) && (
            <div className="px-4 py-2 flex items-center gap-2 flex-wrap border-t border-white/5 bg-white/[0.02]">
              {jersey.is_game_worn && (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0">
                  <Award className="w-2.5 h-2.5 mr-1" />
                  {jersey.sport_type === 'soccer' ? t('badges.matchworn') : t('badges.gameworn')}
                </Badge>
              )}
              {jersey.is_game_issued && (
                <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] px-1.5 py-0">
                  <Award className="w-2.5 h-2.5 mr-1" />
                  {jersey.sport_type === 'soccer' ? t('badges.playeredition') : t('badges.gameissued')}
                </Badge>
              )}
              {jersey.is_authentic && (
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-1.5 py-0">
                  <Award className="w-2.5 h-2.5 mr-1" />
                  {t('badges.authentic')}
                </Badge>
              )}
              {jersey.is_fan_jersey && (
                <Badge className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] px-1.5 py-0">
                  <Award className="w-2.5 h-2.5 mr-1" />
                  {t('badges.fanjersey')}
                </Badge>
              )}
              {jersey.is_signed && (
                <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] px-1.5 py-0">
                  <Star className="w-2.5 h-2.5 mr-1" />
                  {t('badges.signed')}
                </Badge>
              )}
              {jersey.is_photomatch && (
               <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-1.5 py-0">
                 📸 {t('badges.photomatch')}
               </Badge>
              )}
              {jersey.for_sale && (
               <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] px-1.5 py-0 flex items-center gap-1">
                 <DollarSign className="w-2.5 h-2.5" />
                 {t('card.forSale')}
               </Badge>
              )}
              {!jersey.for_sale && (
               <Badge className="bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] px-1.5 py-0 flex items-center gap-1">
                 {t('card.notForSale')}
               </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="text-white/50 text-xs truncate max-w-[120px]">
                {displayName || "Unbekannt"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <Heart className="w-3 h-3" />
              <span>{isLiked ? (jersey.likes_count || 0) : (jersey.likes_count || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}