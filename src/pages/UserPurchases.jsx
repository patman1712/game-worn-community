import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Loader2, Euro, User, Shirt } from "lucide-react";
import { motion } from "framer-motion";

export default function UserPurchases() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin' && u?.data?.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(u);
    }).catch(() => window.location.href = '/');
  }, []);

  const { data: jerseys = [], isLoading } = useQuery({
    queryKey: ["allJerseys"],
    queryFn: () => base44.entities.Jersey.list(),
    enabled: !!user,
  });

  // Group jerseys by owner
  const userPurchases = jerseys
    .filter(j => j.purchase_price != null && j.purchase_price > 0)
    .reduce((acc, jersey) => {
      const ownerEmail = jersey.owner_email || jersey.created_by;
      if (!acc[ownerEmail]) {
        acc[ownerEmail] = {
          email: ownerEmail,
          name: jersey.owner_name || ownerEmail,
          jerseys: [],
          totalCost: 0,
          count: 0,
        };
      }
      acc[ownerEmail].jerseys.push(jersey);
      acc[ownerEmail].totalCost += jersey.purchase_price;
      acc[ownerEmail].count++;
      return acc;
    }, {});

  // Sort by total cost (highest first)
  const sortedUsers = Object.values(userPurchases).sort((a, b) => b.totalCost - a.totalCost);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          to={createPageUrl("AdminPanel")}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Admin Panel
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">User Käufe Übersicht</h1>
          <p className="text-white/40 text-sm">
            Alle User mit erfassten Kaufpreisen, sortiert nach Gesamtsumme
          </p>
        </div>

        {sortedUsers.length === 0 ? (
          <div className="text-center py-20">
            <Euro className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">Noch keine Käufe erfasst.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedUsers.map((userData, i) => (
              <motion.div
                key={userData.email}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden"
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{userData.name}</h3>
                      <p className="text-white/40 text-sm">{userData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-white/40 text-xs mb-1">Trikots</p>
                      <div className="flex items-center gap-1.5">
                        <Shirt className="w-4 h-4 text-cyan-400" />
                        <p className="text-white font-bold text-lg">{userData.count}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-xs mb-1">Gesamtsumme</p>
                      <div className="flex items-center gap-1.5">
                        <Euro className="w-4 h-4 text-green-400" />
                        <p className="text-green-400 font-bold text-lg">{userData.totalCost.toFixed(2)} €</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}