import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shirt, User, Heart, Loader2 } from "lucide-react";
import JerseyCard from "@/components/jerseys/JerseyCard";

export default function UserProfile() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: jerseys = [], isLoading } = useQuery({
    queryKey: ["userJerseys", email],
    queryFn: () => base44.entities.Jersey.filter({ owner_email: email }, "-created_date"),
    enabled: !!email,
  });

  const { data: profileUser } = useQuery({
    queryKey: ["profileUser", email],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email });
      return users[0];
    },
    enabled: !!email,
  });

  const { data: likes = [] } = useQuery({
    queryKey: ["likes", currentUser?.email],
    queryFn: () => currentUser ? base44.entities.JerseyLike.filter({ user_email: currentUser.email }) : [],
    enabled: !!currentUser,
  });

  const likedIds = new Set(likes.map(l => l.jersey_id));
  const ownerName = profileUser?.display_name || jerseys[0]?.owner_name || email;
  const totalLikes = jerseys.reduce((s, j) => s + (j.likes_count || 0), 0);

  const ownerAcceptsMessages = profileUser?.data?.accept_messages !== false && profileUser?.accept_messages !== false;
  const userAcceptsMessages = currentUser ? (currentUser.data?.accept_messages ?? currentUser.accept_messages ?? true) : false;
  const showMessageButton = currentUser && (email !== currentUser.email) && ownerAcceptsMessages && userAcceptsMessages;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link
          to={createPageUrl("Home")}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Link>

        {/* Profile Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{ownerName}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-white/40 text-sm flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5" /> {jerseys.length} Trikots
                </span>
                <span className="text-white/40 text-sm flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> {totalLikes} Likes
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            {showMessageButton && (
              <Link to={createPageUrl("Chat") + `?email=${email}`}>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2">
                  <div className="w-4 h-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  Nachricht senden
                </Button>
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : jerseys.length === 0 ? (
          <div className="text-center py-20">
            <Shirt className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">Keine Trikots in dieser Sammlung.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {jerseys.map((jersey, i) => (
              <JerseyCard
                key={jersey.id}
                jersey={jersey}
                index={i}
                isLiked={likedIds.has(jersey.id)}
                onLike={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}