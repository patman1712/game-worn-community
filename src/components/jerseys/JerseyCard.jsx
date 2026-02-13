import React, { useState, useEffect } from "react";
import { Heart, Star, Award, User, Edit, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function JerseyCard({ jersey, isLiked, onLike, index = 0 }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const displayName = jersey.owner_name || jersey.created_by;

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isModerator = currentUser?.data?.role === 'moderator' || currentUser?.role === 'admin' || currentUser?.data?.role === 'admin';

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

            {/* Badges top */}
            <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[calc(100%-80px)]">
              {jersey.is_game_worn && (
                <Badge className="bg-amber-500/90 text-white border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
                  <Award className="w-3 h-3 mr-1" />
                  Game-Worn
                </Badge>
              )}
              {jersey.is_game_issued && (
                <Badge className="bg-orange-500/90 text-white border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
                  <Award className="w-3 h-3 mr-1" />
                  Game-Issued
                </Badge>
              )}
              {jersey.is_signed && (
                <Badge className="bg-violet-500/90 text-white border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
                  <Star className="w-3 h-3 mr-1" />
                  Signiert
                </Badge>
              )}
              {jersey.for_sale && (
                <Badge className="bg-green-500/90 text-white border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
                  For Sale
                </Badge>
              )}
            </div>

            {/* Like and Edit buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              {isModerator && (
                <Link to={createPageUrl("EditJersey") + `?id=${jersey.id}`} onClick={(e) => e.stopPropagation()}>
                  <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-orange-500/40 transition-all">
                    <Edit className="w-4 h-4 text-orange-400/70 hover:text-orange-400" />
                  </button>
                </Link>
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

          {/* For Sale Badge */}
          {jersey.for_sale && (
            <div className="px-4 py-2 flex items-center gap-2 border-t border-white/5 bg-green-500/5">
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
              <span className="text-white/70 text-xs font-medium">Zum Verkauf</span>
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