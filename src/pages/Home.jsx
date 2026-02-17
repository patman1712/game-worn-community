import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shirt, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from 'react-i18next';

import JerseyCard from "@/components/jerseys/JerseyCard";
import FilterBar from "@/components/jerseys/FilterBar";
import StatsBar from "@/components/jerseys/StatsBar";

export default function Home() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [league, setLeague] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [sport, setSport] = useState("all");
  const [productType, setProductType] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Real-time subscription for jersey updates
  useEffect(() => {
    const unsubscribe = base44.entities.Jersey.subscribe((event) => {
      if (event.type === 'update') {
        queryClient.setQueryData(['jerseys'], (old) => {
          if (!Array.isArray(old)) return old;
          return old.map(j => j.id === event.id ? event.data : j);
        });
      }
    });
    return () => unsubscribe();
  }, [queryClient]);

  const { data: allJerseys = [], isLoading, refetch } = useQuery({
    queryKey: ["jerseys"],
    queryFn: () => base44.entities.Jersey.list("-created_date", 200),
  });

  const { data: allCollectionItems = [] } = useQuery({
    queryKey: ["collectionItems"],
    queryFn: () => base44.entities.CollectionItem.list("-created_date", 200),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: userCountData } = useQuery({
    queryKey: ["userCount"],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return { count: users.length };
    },
  });

  // Filter out private jerseys (unless they belong to the current user or user is admin)
  const jerseys = allJerseys.filter(j => 
    !j.is_private || j.owner_email === currentUser?.email || j.created_by === currentUser?.email || currentUser?.data?.role === 'admin' || currentUser?.role === 'admin'
  );

  const collectionItems = allCollectionItems.filter(item => 
    !item.is_private || item.owner_email === currentUser?.email || item.created_by === currentUser?.email || currentUser?.data?.role === 'admin' || currentUser?.role === 'admin'
  );

  // Filter out hidden sports
  const hiddenSports = currentUser?.hidden_sports || [];
  const visibleJerseys = jerseys.filter(j => !hiddenSports.includes(j.sport_type));
  const visibleCollectionItems = collectionItems.filter(item => !hiddenSports.includes(item.sport_type));

  const allProducts = [...visibleJerseys, ...visibleCollectionItems];

  const { data: likes = [] } = useQuery({
    queryKey: ["likes", currentUser?.email],
    queryFn: () => currentUser ? base44.entities.JerseyLike.filter({ user_email: currentUser.email }) : [],
    enabled: !!currentUser,
  });

  // Pull to refresh
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (pullStartY > 0 && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.min(currentY - pullStartY, 100);
      if (distance > 0) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await refetch();
      setTimeout(() => setIsRefreshing(false), 500);
    }
    setPullStartY(0);
    setPullDistance(0);
  };

  useEffect(() => {
    const feedElement = document.getElementById('jersey-feed');
    if (feedElement) {
      feedElement.addEventListener('touchstart', handleTouchStart);
      feedElement.addEventListener('touchmove', handleTouchMove);
      feedElement.addEventListener('touchend', handleTouchEnd);
      return () => {
        feedElement.removeEventListener('touchstart', handleTouchStart);
        feedElement.removeEventListener('touchmove', handleTouchMove);
        feedElement.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [pullStartY, pullDistance]);

  const likeMutation = useMutation({
    mutationFn: async (jerseyId) => {
      const existing = likes.find(l => l.jersey_id === jerseyId);
      
      // Determine if it's a Jersey or CollectionItem
      const isJersey = jerseys.some(j => j.id === jerseyId);
      const isCollectionItem = collectionItems.some(i => i.id === jerseyId);
      const entity = isCollectionItem ? base44.entities.CollectionItem : base44.entities.Jersey;
      
      if (existing) {
        await base44.entities.JerseyLike.delete(existing.id);
        const item = [...jerseys, ...collectionItems].find(j => j.id === jerseyId);
        if (item) await entity.update(jerseyId, { likes_count: Math.max(0, (item.likes_count || 0) - 1) });
      } else {
        await base44.entities.JerseyLike.create({ jersey_id: jerseyId, user_email: currentUser.email });
        const item = [...jerseys, ...collectionItems].find(j => j.id === jerseyId);
        if (item) await entity.update(jerseyId, { likes_count: (item.likes_count || 0) + 1 });
      }
    },
    onMutate: async (jerseyId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["jerseys"] });
      await queryClient.cancelQueries({ queryKey: ["collectionItems"] });
      await queryClient.cancelQueries({ queryKey: ["likes"] });

      const previousJerseys = queryClient.getQueryData(["jerseys"]);
      const previousCollectionItems = queryClient.getQueryData(["collectionItems"]);
      const previousLikes = queryClient.getQueryData(["likes", currentUser?.email]);

      const existing = likes.find(l => l.jersey_id === jerseyId);
      
      // Helper to update item count
      const updateItemCount = (list) => {
          if (!Array.isArray(list)) return list;
          return list.map(item => item.id === jerseyId 
            ? { ...item, likes_count: existing ? Math.max(0, (item.likes_count || 0) - 1) : (item.likes_count || 0) + 1 }
            : item
          );
      };

      // Update jerseys count optimistically
      queryClient.setQueryData(["jerseys"], (old = []) => updateItemCount(old));
      
      // Update collection items count optimistically
      queryClient.setQueryData(["collectionItems"], (old = []) => updateItemCount(old));

      // Update likes optimistically
      if (existing) {
        queryClient.setQueryData(["likes", currentUser?.email], (old = []) => 
          old.filter(l => l.id !== existing.id)
        );
      } else {
        queryClient.setQueryData(["likes", currentUser?.email], (old = []) => [
          ...old,
          { id: 'temp-' + Date.now(), jersey_id: jerseyId, user_email: currentUser.email }
        ]);
      }

      return { previousJerseys, previousCollectionItems, previousLikes };
    },
    onError: (err, jerseyId, context) => {
      // Rollback on error
      queryClient.setQueryData(["jerseys"], context.previousJerseys);
      queryClient.setQueryData(["collectionItems"], context.previousCollectionItems);
      queryClient.setQueryData(["likes", currentUser?.email], context.previousLikes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jerseys"] });
      queryClient.invalidateQueries({ queryKey: ["collectionItems"] });
      queryClient.invalidateQueries({ queryKey: ["likes"] });
    },
  });

  const likedIds = new Set(likes.map(l => l.jersey_id));

  const filtered = useMemo(() => {
    let result = [...allProducts];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(j =>
        j.title?.toLowerCase().includes(s) ||
        j.team?.toLowerCase().includes(s) ||
        j.player_name?.toLowerCase().includes(s)
      );
    }

    if (league !== "all") {
      result = result.filter(j => j.league === league);
    }

    if (sport !== "all") {
      result = result.filter(j => j.sport_type === sport);
    }

    if (productType !== "all") {
      result = result.filter(j => 
        (productType === "jersey" && !j.product_type) || 
        j.product_type === productType
      );
    }

    if (sortBy === "popular") {
      result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (sortBy === "team") {
      result.sort((a, b) => (a.team || "").localeCompare(b.team || ""));
    } else {
      // Default: newest first
      result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return result;
  }, [allProducts, search, league, sport, productType, sortBy, currentUser]);

  // Stats (based on filtered items)
  const filteredBySport = sport !== "all" 
    ? [...visibleJerseys, ...visibleCollectionItems].filter(j => j.sport_type === sport)
    : [...visibleJerseys, ...visibleCollectionItems];
  
  // Calculate total likes including all product types
  const totalLikes = filteredBySport.reduce((s, j) => s + (j.likes_count || 0), 0);
  const collectors = userCountData?.count || 0;
  const leagueCounts = {};
  filteredBySport.forEach(j => { if (j.league) leagueCounts[j.league] = (leagueCounts[j.league] || 0) + 1; });
  const topLeague = Object.entries(leagueCounts).sort(([,a],[,b]) => b - a)[0]?.[0];

  return (
    <div className="min-h-screen" id="jersey-feed">
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div className="fixed top-14 left-0 right-0 flex justify-center z-40">
          <div 
            className="bg-slate-900/90 backdrop-blur-sm rounded-full p-2 shadow-lg"
            style={{ transform: `translateY(${Math.min(pullDistance - 20, 40)}px)`, opacity: pullDistance / 80 }}
          >
            <RefreshCw className={`w-5 h-5 text-cyan-400 ${isRefreshing || pullDistance > 60 ? 'animate-spin' : ''}`} />
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden pt-8 pb-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-violet-900/20" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e4ef5392203adc7a32dee/7c3640279_logogamewordcummunity.PNG" 
              alt="Game-Worn Community" 
              className="h-56 md:h-72 w-auto object-contain mx-auto drop-shadow-[0_4px_20px_rgba(6,182,212,0.4)]"
            />
            <p className="text-white/40 mt-3 max-w-md mx-auto text-sm">
              {t('home.subtitle')}
            </p>
          </motion.div>

          <StatsBar
            totalJerseys={filteredBySport.length}
            totalCollectors={collectors}
            totalLikes={totalLikes}
            topLeague={topLeague}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="mb-8">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            league={league}
            onLeagueChange={setLeague}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sport={sport}
            onSportChange={setSport}
            productType={productType}
            onProductTypeChange={setProductType}
            hiddenSports={currentUser?.hidden_sports || []}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Shirt className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">{t('home.noResults')}</p>
            <p className="text-white/20 text-xs mt-1">Sei der Erste und teile deine Sammlung!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((jersey, i) => (
              <JerseyCard
                key={jersey.id}
                jersey={jersey}
                index={i}
                isLiked={likedIds.has(jersey.id)}
                onLike={(id) => currentUser ? likeMutation.mutate(id) : base44.auth.redirectToLogin()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}