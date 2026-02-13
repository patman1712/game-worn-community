import React, { useState, useEffect } from "react";
import { Heart, Star, Award, User, Edit, DollarSign, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
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

export default function JerseyCard({ jersey, isLiked, onLike, index = 0 }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const displayName = jersey.owner_name || jersey.created_by;
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isModerator = currentUser?.data?.role === 'moderator' || currentUser?.role === 'admin' || currentUser?.data?.role === 'admin';

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Jersey.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jerseys"] });
      queryClient.invalidateQueries({ queryKey: ["myJerseys"] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative"
    >
      <Link to={createPageUrl("JerseyDetail") + `?id=${jersey.id}`}>
        <div className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.1)]">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-slate-800">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-800 animate-pulse" />
            )}
            <img
              src={jersey.image_url}
              alt={jersey.title}
              className={`w-full h-full object-contain transition-all duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />



            {/* Like and Edit buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              {isModerator && (
                <>
                  <Link to={createPageUrl("EditJersey") + `?id=${jersey.id}`} onClick={(e) => e.stopPropagation()}>
                    <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-orange-500/40 transition-all">
                      <Edit className="w-4 h-4 text-orange-400/70 hover:text-orange-400" />
                    </button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-red-500/40 transition-all">
                        <Trash2 className="w-4 h-4 text-red-400/70 hover:text-red-400" />
                      </button>
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
                          onClick={() => deleteMutation.mutate(jersey.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Löschen
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

            {/* Bottom info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-1.5 mb-2">
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
              <h3 className="font-semibold text-white text-sm leading-tight line-clamp-1">
                {jersey.title}
              </h3>
              <p className="text-white/50 text-xs mt-0.5">{jersey.team}</p>
              {jersey.player_name && (
                <p className="text-cyan-400/80 text-xs mt-1 font-medium">
                  #{jersey.player_number} {jersey.player_name}
                </p>
              )}
            </div>
          </div>

          {/* Info Section - Game Worn, For Sale, etc */}
          {(jersey.is_game_worn || jersey.is_game_issued || jersey.is_signed || jersey.for_sale) && (
            <div className="px-4 py-2 flex items-center gap-2 flex-wrap border-t border-white/5 bg-white/[0.02]">
              {jersey.is_game_worn && (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0">
                  <Award className="w-2.5 h-2.5 mr-1" />
                  Game-Worn
                </Badge>
              )}
              {jersey.is_game_issued && (
                <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] px-1.5 py-0">
                  <Award className="w-2.5 h-2.5 mr-1" />
                  Game-Issued
                </Badge>
              )}
              {jersey.is_signed && (
                <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] px-1.5 py-0">
                  <Star className="w-2.5 h-2.5 mr-1" />
                  Signiert
                </Badge>
              )}
              {jersey.for_sale && (
                <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] px-1.5 py-0 flex items-center gap-1">
                  <DollarSign className="w-2.5 h-2.5" />
                  Verkauf
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
              <span>{jersey.likes_count || 0}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}