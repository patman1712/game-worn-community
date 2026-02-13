import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Heart, Star, Award, User, Calendar,
  Shirt, Tag, Shield, Loader2, ChevronLeft, ChevronRight, MessageCircle, Send, Trash2
} from "lucide-react";

export default function JerseyDetail() {
  const params = new URLSearchParams(window.location.search);
  const jerseyId = params.get("id");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: jersey, isLoading } = useQuery({
    queryKey: ["jersey", jerseyId],
    queryFn: async () => {
      const list = await base44.entities.Jersey.filter({ id: jerseyId });
      return list[0];
    },
    enabled: !!jerseyId,
  });

  const { data: likes = [] } = useQuery({
    queryKey: ["myLike", jerseyId, currentUser?.email],
    queryFn: () => base44.entities.JerseyLike.filter({ jersey_id: jerseyId, user_email: currentUser.email }),
    enabled: !!currentUser && !!jerseyId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", jerseyId],
    queryFn: () => base44.entities.Comment.filter({ jersey_id: jerseyId }),
    enabled: !!jerseyId && !!currentUser,
  });

  const isLiked = likes.length > 0;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await base44.entities.JerseyLike.delete(likes[0].id);
        await base44.entities.Jersey.update(jerseyId, { likes_count: Math.max(0, (jersey.likes_count || 0) - 1) });
      } else {
        await base44.entities.JerseyLike.create({ jersey_id: jerseyId, user_email: currentUser.email });
        await base44.entities.Jersey.update(jerseyId, { likes_count: (jersey.likes_count || 0) + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jersey", jerseyId] });
      queryClient.invalidateQueries({ queryKey: ["myLike"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (text) => {
      return base44.entities.Comment.create({
        jersey_id: jerseyId,
        user_email: currentUser.email,
        user_name: currentUser.display_name || currentUser.full_name || currentUser.email,
        comment: text,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", jerseyId] });
      setCommentText("");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => base44.entities.Comment.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", jerseyId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!jersey) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40">Trikot nicht gefunden.</p>
        <Link to={createPageUrl("Home")} className="text-cyan-400 text-sm mt-2 inline-block">Zurück</Link>
      </div>
    );
  }

  const allImages = [jersey.image_url, ...(jersey.additional_images || [])].filter(Boolean);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          to={createPageUrl("Home")}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-white/5">
              <img
                src={allImages[activeImage]}
                alt={jersey.title}
                className="w-full h-full object-contain"
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage(i => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setActiveImage(i => (i + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-3">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-cyan-500' : 'border-white/10 opacity-50 hover:opacity-80'}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {jersey.league && (
                  <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs">
                    {jersey.league}
                  </Badge>
                )}
                {jersey.jersey_type && (
                  <Badge className="bg-white/10 text-white/60 border border-white/10 text-xs">
                    {jersey.jersey_type}
                  </Badge>
                )}
                {jersey.is_game_worn && (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                    <Award className="w-3 h-3 mr-1" /> Game-Worn
                  </Badge>
                )}
                {jersey.is_game_issued && (
                  <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs">
                    <Award className="w-3 h-3 mr-1" /> Game-Issued
                  </Badge>
                )}
                {jersey.is_signed && (
                  <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs">
                    <Star className="w-3 h-3 mr-1" /> Signiert
                  </Badge>
                )}
                {jersey.for_sale && (
                  <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs">
                    For Sale
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white">{jersey.title}</h1>
              <p className="text-white/50 text-lg mt-1">{jersey.team}</p>
            </div>

            {/* Player info */}
            {jersey.player_name && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {jersey.player_number || "#"}
                </div>
                <div>
                  <p className="text-white font-semibold">{jersey.player_name}</p>
                  <p className="text-white/40 text-sm">{jersey.season || ""}</p>
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {jersey.season && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-xs mb-1">
                    <Calendar className="w-3 h-3" /> Saison
                  </div>
                  <p className="text-white text-sm font-medium">{jersey.season}</p>
                </div>
              )}
              {jersey.condition && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-xs mb-1">
                    <Shield className="w-3 h-3" /> Zustand
                  </div>
                  <p className="text-white text-sm font-medium">{jersey.condition}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {jersey.description && (
              <div>
                <h3 className="text-white/60 text-sm font-medium mb-2">Über dieses Trikot</h3>
                <p className="text-white/40 text-sm leading-relaxed">{jersey.description}</p>
              </div>
            )}

            {/* Owner + Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <Link
                to={createPageUrl("UserProfile") + `?email=${jersey.owner_email || jersey.created_by}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{jersey.owner_name || "Unbekannt"}</p>
                  <p className="text-white/30 text-xs">Sammlung ansehen</p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                {/* Moderator Actions */}
                {currentUser && (currentUser.data?.role === 'moderator' || currentUser.role === 'admin' || currentUser.data?.role === 'admin') && (
                  <>
                    <Link to={createPageUrl("EditJersey") + `?id=${jersey.id}`}>
                      <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10">
                        Bearbeiten
                      </Button>
                    </Link>
                    <Button
                      onClick={() => {
                        if (confirm('Trikot wirklich löschen?')) {
                          base44.entities.Jersey.delete(jersey.id).then(() => {
                            window.location.href = createPageUrl("Home");
                          });
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Löschen
                    </Button>
                  </>
                )}
                {currentUser && (jersey.owner_email !== currentUser.email && jersey.created_by !== currentUser.email) && (
                  <Link
                    to={createPageUrl("Chat") + `?email=${jersey.owner_email || jersey.created_by}`}
                  >
                    <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={() => currentUser ? likeMutation.mutate() : base44.auth.redirectToLogin()}
                  variant="ghost"
                  className={`flex items-center gap-2 ${isLiked ? 'text-red-400 hover:text-red-300' : 'text-white/40 hover:text-white/70'} hover:bg-white/5`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{jersey.likes_count || 0}</span>
                </Button>
              </div>
            </div>

            {/* Comments Section - Only for logged in users */}
            {currentUser && (
              <div className="pt-6 border-t border-white/5">
                <h3 className="text-white font-medium mb-4">Kommentare ({comments.length})</h3>
                
                {/* Comment Input */}
                <div className="flex gap-2 mb-6">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Schreibe einen Kommentar..."
                    className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commentText.trim()) {
                        commentMutation.mutate(commentText);
                      }
                    }}
                  />
                  <Button
                    onClick={() => commentMutation.mutate(commentText)}
                    disabled={!commentText.trim() || commentMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                  >
                    {commentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment, i) => (
                    <div key={comment.id} className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{comment.user_name}</p>
                            <p className="text-white/30 text-xs">
                              {new Date(comment.created_date).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {/* Moderator can delete any comment */}
                        {(currentUser.data?.role === 'moderator' || currentUser.role === 'admin' || currentUser.data?.role === 'admin' || comment.user_email === currentUser.email) && (
                          <Button
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/30 hover:text-red-400 hover:bg-white/5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">{comment.comment}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-white/30 text-sm text-center py-8">
                      Noch keine Kommentare. Sei der Erste!
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}