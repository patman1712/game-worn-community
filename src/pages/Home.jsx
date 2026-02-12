import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shirt, Loader2 } from "lucide-react";

import JerseyCard from "@/components/jerseys/JerseyCard";
import FilterBar from "@/components/jerseys/FilterBar";
import StatsBar from "@/components/jerseys/StatsBar";

export default function Home() {
  const [search, setSearch] = useState("");
  const [league, setLeague] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: jerseys = [], isLoading } = useQuery({
    queryKey: ["jerseys"],
    queryFn: () => base44.entities.Jersey.list("-created_date", 200),
  });

  const { data: likes = [] } = useQuery({
    queryKey: ["likes", currentUser?.email],
    queryFn: () => currentUser ? base44.entities.JerseyLike.filter({ user_email: currentUser.email }) : [],
    enabled: !!currentUser,
  });

  const likeMutation = useMutation({
    mutationFn: async (jerseyId) => {
      const existing = likes.find(l => l.jersey_id === jerseyId);
      if (existing) {
        await base44.entities.JerseyLike.delete(existing.id);
        const jersey = jerseys.find(j => j.id === jerseyId);
        if (jersey) await base44.entities.Jersey.update(jerseyId, { likes_count: Math.max(0, (jersey.likes_count || 0) - 1) });
      } else {
        await base44.entities.JerseyLike.create({ jersey_id: jerseyId, user_email: currentUser.email });
        const jersey = jerseys.find(j => j.id === jerseyId);
        if (jersey) await base44.entities.Jersey.update(jerseyId, { likes_count: (jersey.likes_count || 0) + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jerseys"] });
      queryClient.invalidateQueries({ queryKey: ["likes"] });
    },
  });

  const likedIds = new Set(likes.map(l => l.jersey_id));

  const filtered = useMemo(() => {
    let result = [...jerseys];

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

    if (sortBy === "popular") {
      result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (sortBy === "team") {
      result.sort((a, b) => (a.team || "").localeCompare(b.team || ""));
    }

    return result;
  }, [jerseys, search, league, sortBy]);

  // Stats
  const totalLikes = jerseys.reduce((s, j) => s + (j.likes_count || 0), 0);
  const collectors = new Set(jerseys.map(j => j.owner_email || j.created_by).filter(Boolean)).size;
  const leagueCounts = {};
  jerseys.forEach(j => { if (j.league) leagueCounts[j.league] = (leagueCounts[j.league] || 0) + 1; });
  const topLeague = Object.entries(leagueCounts).sort(([,a],[,b]) => b - a)[0]?.[0];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden pt-8 pb-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-violet-900/20" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
              <Shirt className="w-3.5 h-3.5" />
              Community Trikot-Sammlung
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Jersey<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Vault</span>
            </h1>
            <p className="text-white/40 mt-3 max-w-md mx-auto text-sm">
              Zeige deine Eishockey-Trikots der Welt. Entdecke Sammlungen aus der ganzen Community.
            </p>
          </motion.div>

          <StatsBar
            totalJerseys={jerseys.length}
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
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Shirt className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">Noch keine Trikots gefunden.</p>
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