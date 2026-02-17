import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft, Heart, Star, Award, User, Calendar,
  Shirt, Tag, Shield, Loader2, ChevronLeft, ChevronRight, MessageCircle, Send, Trash2, Share2, X
} from "lucide-react";

export default function JerseyDetail() {
  const params = new URLSearchParams(window.location.search);
  const jerseyId = params.get("id");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [certificateImageOpen, setCertificateImageOpen] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Real-time subscription for jersey updates
  useEffect(() => {
    if (!jerseyId) return;
    
    // Subscribe to updates for this specific item
    const unsubscribeJersey = base44.entities.Jersey.subscribe((event) => {
      if (event.type === 'update' && event.id === jerseyId) {
        queryClient.invalidateQueries({ queryKey: ["jersey", jerseyId] });
      }
    });
    
    const unsubscribeItem = base44.entities.CollectionItem.subscribe((event) => {
      if (event.type === 'update' && event.id === jerseyId) {
        queryClient.invalidateQueries({ queryKey: ["jersey", jerseyId] });
      }
    });

    return () => {
      unsubscribeJersey();
      unsubscribeItem();
    };
  }, [jerseyId, queryClient]);

  const { data: jersey, isLoading } = useQuery({
    queryKey: ["jersey", jerseyId],
    queryFn: async () => {
      try {
        const jerseyList = await base44.entities.Jersey.filter({ id: jerseyId });
        if (jerseyList.length > 0) {
            const item = jerseyList[0];
            // ... merging logic ...
            let itemData = item.data || {};
            if (typeof itemData === 'string') {
                try { itemData = JSON.parse(itemData); } catch (e) { }
            }
            const merged = { ...itemData, ...item };
            
            // Explicit mappings
            merged.player_number = merged.player_number || merged.number || itemData.player_number || itemData.number;
            
            // IMPORTANT: Ensure likes_count is treated as a number
            merged.likes_count = typeof merged.likes_count === 'number' ? merged.likes_count : 0;
            
            // Handle owner name if unknown
            if (!merged.owner_name || merged.owner_name === 'Unbekannt') {
                if (merged.data?.owner_name) merged.owner_name = merged.data.owner_name;
            }
            
            return merged;
        }
        
        const itemList = await base44.entities.CollectionItem.filter({ id: jerseyId });
        if (itemList.length > 0) {
            const item = itemList[0];
            // ... merging logic ...
            let itemData = item.data || {};
            if (typeof itemData === 'string') {
                try { itemData = JSON.parse(itemData); } catch (e) { }
            }
            const merged = { ...itemData, ...item };
            
            // Explicit mappings
            merged.player_number = merged.player_number || merged.number || itemData.player_number || itemData.number;

            // IMPORTANT: Ensure likes_count is treated as a number
            merged.likes_count = typeof merged.likes_count === 'number' ? merged.likes_count : 0;
            
            // ...
            return merged;
        }
        return null;
      } catch (error) { return null; }
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

  const { data: ownerUser } = useQuery({
    queryKey: ["owner", jersey?.owner_email || jersey?.created_by],
    queryFn: async () => {
      const ownerEmail = jersey?.owner_email || jersey?.created_by;
      if (!ownerEmail) return null;
      const users = await base44.entities.User.list();
      const user = users.find(u => u.email === ownerEmail);
      // Ensure we return an object with display_name, potentially from data
      if (user) {
          return {
              ...user,
              display_name: user.data?.display_name || user.display_name || user.data?.name || "Unbekannt"
          };
      }
      return null;
    },
    enabled: !!(jersey?.owner_email || jersey?.created_by),
  });

  const isLiked = likes.length > 0;
  const ownerAcceptsMessages = ownerUser?.data?.accept_messages !== false && ownerUser?.accept_messages !== false;
  const ownerName = ownerUser?.display_name || jersey?.owner_name || jersey?.data?.owner_name || "Unbekannt";
  
  const userAcceptsMessages = currentUser ? (currentUser.data?.accept_messages ?? currentUser.accept_messages ?? true) : false;
  const isOwner = currentUser && jersey && (jersey.owner_email === currentUser.email || jersey.created_by === currentUser.email);
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.data?.role === 'admin');
  
  // Fix: Check explicit value, not just existence
  const isCollectionItem = jersey?.product_type === 'collection_item';

  // Logic updated: Allow seeing certificates if they are public OR if user is owner/admin
  const canSeeCertificates = jersey?.has_loa && jersey.loa_certificate_images?.length > 0 && (jersey.loa_certificates_public === true || isOwner || isAdmin);
  
  const likeMutation = useMutation({
    mutationFn: async () => {
      // Don't execute if already pending to prevent double clicks
      const entity = isCollectionItem ? base44.entities.CollectionItem : base44.entities.Jersey;
      
      // IMPORTANT: We now rely on the backend trigger to update the count
      // We just create/delete the like, and let the server calculate the true count
      
      if (isLiked) {
        const likeToDelete = likes[0];
        if (likeToDelete) {
            await base44.entities.JerseyLike.delete(likeToDelete.id);
        }
      } else {
        await base44.entities.JerseyLike.create({ jersey_id: jerseyId, user_email: currentUser.email });
      }

      // We don't manually update the jersey entity anymore, because the backend trigger does it automatically
      // and safer. We just return the current jersey to satisfy React Query
      return jersey;
    },
    onMutate: async () => {
        // Optimistic update
        await queryClient.cancelQueries({ queryKey: ["jersey", jerseyId] });
        await queryClient.cancelQueries({ queryKey: ["myLike", jerseyId, currentUser?.email] });

        const previousJersey = queryClient.getQueryData(["jersey", jerseyId]);
        const previousLikes = queryClient.getQueryData(["myLike", jerseyId, currentUser?.email]);
        
        const currentlyLiked = previousLikes && previousLikes.length > 0;
        const newIsLiked = !currentlyLiked;
        
        queryClient.setQueryData(["jersey", jerseyId], (old) => {
            if (!old) return old;
            
            let currentCount = parseInt(old.likes_count);
            if (isNaN(currentCount)) currentCount = 0;
            
            const newCount = newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
            
            // Update both top-level and data object
            return { 
                ...old, 
                likes_count: newCount,
                data: { ...(old.data || {}), likes_count: newCount }
            };
        });
        
        // Update local like state
        if (newIsLiked) {
             queryClient.setQueryData(["myLike", jerseyId, currentUser?.email], [{ id: 'temp-optimistic', jersey_id: jerseyId, user_email: currentUser?.email }]);
        } else {
             queryClient.setQueryData(["myLike", jerseyId, currentUser?.email], []);
        }
        
        // Update global lists optimistically as well
        const updateList = (oldList) => {
            if (!Array.isArray(oldList)) return oldList;
            return oldList.map(j => {
                if (j.id === jerseyId) {
                    let c = parseInt(j.likes_count);
                    if (isNaN(c)) c = 0;
                    const nc = newIsLiked ? c + 1 : Math.max(0, c - 1);
                    return { ...j, likes_count: nc, data: { ...(j.data || {}), likes_count: nc } };
                }
                return j;
            });
        };

        queryClient.setQueryData(["jerseys"], updateList);
        queryClient.setQueryData(["collectionItems"], updateList);
        
        return { previousJersey, previousLikes };
    },
    onSuccess: (updatedJersey) => {
        // Invalidate all related queries to force a fresh fetch
        // We do NOT trust the return value of update() completely as it might lack merged fields
        queryClient.invalidateQueries({ queryKey: ["jerseys"] });
        queryClient.invalidateQueries({ queryKey: ["collectionItems"] });
        queryClient.invalidateQueries({ queryKey: ["myLike"] }); 
        queryClient.invalidateQueries({ queryKey: ["likes"] });
        queryClient.invalidateQueries({ queryKey: ["jersey", jerseyId] });
    },
    onError: (err, newTodo, context) => {
        console.error("Like mutation failed:", err);
        if (context?.previousJersey) {
            queryClient.setQueryData(["jersey", jerseyId], context.previousJersey);
        }
        if (context?.previousLikes) {
            queryClient.setQueryData(["myLike", jerseyId, currentUser?.email], context.previousLikes);
        }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jersey", jerseyId] });
      queryClient.invalidateQueries({ queryKey: ["myLike"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (text) => {
      const result = await base44.entities.Comment.create({
        jersey_id: jerseyId,
        user_email: currentUser.email,
        user_name: currentUser.display_name || currentUser.full_name || currentUser.email,
        comment: text,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", jerseyId] });
      setCommentText("");
    },
    onError: (error) => {
        alert("Fehler beim Senden des Kommentars: " + error.message);
    }
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
        <p className="text-white/40">Objekt nicht gefunden.</p>
        <Link to={createPageUrl("Home")} className="text-cyan-400 text-sm mt-2 inline-block">Zurück</Link>
      </div>
    );
  }

  const allImages = [jersey.image_url, ...(jersey.additional_images || [])].filter((url, index, array) => array.indexOf(url) === index);

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
          {/* Images + Owner Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-white/5">
              <div 
                className="absolute inset-0 cursor-pointer z-10"
                onClick={() => setLightboxOpen(true)}
              />
              <img
                src={allImages[activeImage]}
                alt={jersey.title}
                className="w-full h-full object-contain"
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage(i => (i - 1 + allImages.length) % allImages.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors z-20"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage(i => (i + 1) % allImages.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors z-20"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveImage(i);
                    }}
                    onDoubleClick={() => {
                      setActiveImage(i);
                      setLightboxOpen(true);
                    }}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-cyan-500' : 'border-white/10 opacity-50 hover:opacity-80'}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Owner + Actions */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <Link
                  to={createPageUrl("UserProfile") + `?email=${jersey.owner_email || jersey.created_by}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{ownerName}</p>
                    <p className="text-white/30 text-xs">Sammlung ansehen</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {currentUser && ((currentUser.role === 'admin' || currentUser.data?.role === 'admin') || (jersey.owner_email === currentUser.email || jersey.created_by === currentUser.email)) && (
                    <Button
                      onClick={() => {
                        const shareUrl = `${window.location.protocol}//${window.location.host}${createPageUrl("Share")}?id=${jersey.id}`;
                        navigator.clipboard.writeText(shareUrl);
                        alert('Link kopiert! Du kannst ihn jetzt teilen.');
                      }}
                      variant="ghost"
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  )}
                  {currentUser && (jersey.owner_email !== currentUser.email && jersey.created_by !== currentUser.email) && ownerAcceptsMessages && userAcceptsMessages && (
                    <Link to={createPageUrl("Chat") + `?email=${jersey.owner_email || jersey.created_by}`}>
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

              {/* Private Owner Info - Moved here */}
              {(isOwner || isAdmin) && (jersey.purchase_price || jersey.invoice_url) && (
                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-white/60 text-xs font-medium flex items-center gap-2 mb-3">
                    <Shield className="w-3 h-3" /> Private Informationen
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {jersey.purchase_price && (
                      <div>
                        <span className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">Kaufpreis</span>
                        <span className="text-white font-mono text-sm">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(jersey.purchase_price)}
                        </span>
                      </div>
                    )}
                    {jersey.invoice_url && (
                      <div>
                        <span className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">Dokumente</span>
                        <button 
                          onClick={() => setCertificateImageOpen(jersey.invoice_url)}
                          className="text-cyan-400 text-sm hover:underline flex items-center gap-1"
                        >
                          Rechnung ansehen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              {/* Removed H1 Title */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {jersey.sport_type && (
                  <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs">
                    {jersey.sport_type === 'icehockey' ? 'Eishockey' :
                     jersey.sport_type === 'soccer' ? 'Fussball' :
                     jersey.sport_type === 'football' ? 'Football' :
                     jersey.sport_type === 'basketball' ? 'Basketball' :
                     jersey.sport_type === 'baseball' ? 'Baseball' : jersey.sport_type}
                  </Badge>
                )}
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
                    <Award className="w-3 h-3 mr-1" /> {jersey.sport_type === 'soccer' ? 'Matchworn' : 'Game-Worn'}
                  </Badge>
                )}
                {jersey.is_game_issued && (
                  <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs">
                    <Award className="w-3 h-3 mr-1" /> {jersey.sport_type === 'soccer' ? 'Player Edition' : 'Game-Issued'}
                  </Badge>
                )}
                {jersey.is_authentic && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                    <Award className="w-3 h-3 mr-1" /> Authentic
                  </Badge>
                )}
                {jersey.is_fan_jersey && (
                  <Badge className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs">
                    <Award className="w-3 h-3 mr-1" /> Fantrikot
                  </Badge>
                )}
                {jersey.is_signed && (
                   <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs">
                     <Star className="w-3 h-3 mr-1" /> Signiert
                   </Badge>
                 )}
                 {jersey.captain_patch && jersey.captain_patch !== "Keine" && (
                   <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                     {jersey.captain_patch} Patch
                   </Badge>
                 )}
                 {jersey.has_loa && (
                   <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">
                     LOA
                   </Badge>
                 )}
                 {jersey.is_photomatch && (
                   <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                     📸 Photomatch
                   </Badge>
                 )}
                 {jersey.for_sale && (
                  <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs">
                    For Sale
                  </Badge>
                )}
                {jersey.is_private && (isOwner || isAdmin) && (
                  <Badge className="bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs">
                    Privat
                  </Badge>
                )}
              </div>

            </div>

            {/* Team Name Title - Styled as Box */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-white/5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                 <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">{jersey.team || jersey.title || "Unbekannter Verein"}</h2>
            </div>

            {/* Player info */}
            {(jersey.player_name || jersey.player_number) && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  #{jersey.player_number || ""}
                </div>
                <div>
                  <p className="text-white font-semibold">{jersey.player_name || "Unbekannter Spieler"}</p>
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
              {jersey.brand && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-xs mb-1">
                    <Tag className="w-3 h-3" /> Marke
                  </div>
                  <p className="text-white text-sm font-medium">{jersey.brand}</p>
                </div>
              )}
              {jersey.size && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-xs mb-1">
                    <Shirt className="w-3 h-3" /> Größe
                  </div>
                  <p className="text-white text-sm font-medium">{jersey.size}</p>
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

            {/* Details Section */}
            {jersey.details && jersey.details.length > 0 && (
              <div>
                <h3 className="text-white/60 text-sm font-medium mb-2">Details</h3>
                <div className="flex flex-wrap gap-2">
                  {jersey.details.map(detail => (
                    <Badge key={detail} className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs">
                      {detail}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {jersey.description && (
              <div>
                <h3 className="text-white/60 text-sm font-medium mb-2">Über dieses Trikot</h3>
                <p className="text-white/40 text-sm leading-relaxed">{jersey.description}</p>
              </div>
            )}

            {/* Private Owner Info */}
            {/* Removed from here as it was moved to the left column */}

            {/* Certificate Section - Moved below actions as requested */}
            {canSeeCertificates && (
              <div className="pt-6 border-t border-white/5">
                <h3 className="text-white font-medium mb-4">Zertifikate (LOA)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jersey.loa_certificate_images.map((url, i) => (
                    <div 
                      key={i} 
                      className="rounded-lg overflow-hidden border border-white/10 bg-slate-800/30 cursor-pointer hover:border-cyan-500/50 transition-colors relative group"
                      onClick={() => setCertificateImageOpen(url)}
                    >
                      {url.toLowerCase().endsWith('.pdf') ? (
                        <div className="aspect-video flex flex-col items-center justify-center gap-3 p-6">
                          <svg className="w-16 h-16 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9L13,3.5V9H18.5M6,20V4H11V10H18V20H6Z" />
                          </svg>
                          <span className="text-white/60 text-sm">PDF Zertifikat</span>
                          <span className="text-white/40 text-xs">Zum Öffnen klicken</span>
                        </div>
                      ) : (
                        <img src={url} alt={`Zertifikat ${i + 1}`} className="w-full h-auto" />
                      )}
                      
                      {/* Overlay indicator */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <span className="text-white text-sm font-medium">Ansehen</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Moderator Actions - Above Certificate if no certificate, or below if certificate */}
            {currentUser && (currentUser.data?.role === 'moderator' || currentUser.role === 'admin' || currentUser.data?.role === 'admin' || isOwner) && (
              <div className="pt-6 border-t border-white/5 flex gap-2">
                <Link to={createPageUrl("EditJersey") + `?id=${jersey.id}`} className="flex-1">
                  <Button variant="outline" className="w-full text-orange-400 border-orange-500/30 hover:text-orange-300 hover:bg-orange-500/10">
                    Bearbeiten
                  </Button>
                </Link>
                <Button
                  onClick={async () => {
                    if (confirm('Objekt wirklich löschen?')) {
                      try {
                        const entity = isCollectionItem ? base44.entities.CollectionItem : base44.entities.Jersey;
                        // Delete likes - try/catch
                        try {
                            const likes = await base44.entities.JerseyLike.filter({ jersey_id: jersey.id });
                            for (const like of likes) {
                              try { await base44.entities.JerseyLike.delete(like.id); } catch (e) {}
                            }
                        } catch (e) {}
                        
                        // Delete comments - try/catch
                        try {
                            const comments = await base44.entities.Comment.filter({ jersey_id: jersey.id });
                            for (const comment of comments) {
                              try { await base44.entities.Comment.delete(comment.id); } catch (e) {}
                            }
                        } catch (e) {}
                        
                        // Delete item
                        await entity.delete(jersey.id);
                        window.location.href = createPageUrl("Home");
                      } catch (error) {
                        alert('Fehler beim Löschen: ' + error.message);
                      }
                    }
                  }}
                  variant="outline"
                  className="flex-1 text-red-400 border-red-500/30 hover:text-red-300 hover:bg-red-500/10"
                >
                  Löschen
                </Button>
              </div>
            )}

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

      {/* Certificate Viewer Dialog */}
      <Dialog open={certificateImageOpen !== null} onOpenChange={() => setCertificateImageOpen(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] bg-slate-900/95 border-white/10 p-0">
          <button
            onClick={() => setCertificateImageOpen(null)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {certificateImageOpen && (
            <div className="w-full h-full flex items-center justify-center p-4">
              {certificateImageOpen.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={certificateImageOpen}
                  className="w-full h-full rounded-lg"
                  title="PDF Zertifikat"
                />
              ) : (
                <img 
                  src={certificateImageOpen} 
                  alt="Zertifikat" 
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] bg-slate-900/95 border-white/10 p-0">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-full h-full flex items-center justify-center relative p-4">
            <img 
              src={allImages[activeImage]} 
              alt={jersey.title}
              className="max-w-full max-h-full object-contain"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage(i => (i - 1 + allImages.length) % allImages.length);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage(i => (i + 1) % allImages.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}