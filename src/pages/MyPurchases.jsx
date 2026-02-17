import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Loader2, Euro, FileText, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function MyPurchases() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) {
        base44.auth.redirectToLogin(window.location.href);
      }
      setUser(u);
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: jerseys = [], isLoading: jerseysLoading } = useQuery({
    queryKey: ["myPurchases", user?.email],
    queryFn: () => base44.entities.Jersey.filter({ owner_email: user.email }),
    enabled: !!user,
  });

  const { data: collectionItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["myPurchasesItems", user?.email],
    queryFn: () => base44.entities.CollectionItem.filter({ owner_email: user.email }),
    enabled: !!user,
  });

  // Filter all items with purchase price
  const allItems = [...jerseys, ...collectionItems];
  const purchasedItems = allItems.filter(j => {
    const price = j.purchase_price || j.data?.purchase_price;
    return price != null && price > 0;
  });
  const totalCost = purchasedItems.reduce((sum, j) => sum + (j.purchase_price || j.data?.purchase_price || 0), 0);
  const isLoading = jerseysLoading || itemsLoading;

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          to={createPageUrl("MyCollection")}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zu Meine Objekte
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Meine Käufe</h1>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
            <Euro className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-white/50 text-xs">Gesamtsumme</p>
              <p className="text-white font-bold text-lg">{totalCost.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        {purchasedItems.length === 0 ? (
          <div className="text-center py-20">
            <Euro className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">Noch keine Käufe erfasst.</p>
            <p className="text-white/20 text-xs mt-1">Füge bei deinen Objekten einen Kaufpreis hinzu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchasedItems.map((jersey, i) => (
              <motion.div
                key={jersey.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={createPageUrl("JerseyDetail") + `?id=${jersey.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:border-cyan-500/30 transition-all">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                      <img
                        src={jersey.image_url}
                        alt={jersey.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{jersey.team}</h3>
                      <p className="text-white/50 text-sm truncate">{jersey.player_name || jersey.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {jersey.jersey_type && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                            {jersey.jersey_type}
                          </span>
                        )}
                        {jersey.is_game_worn && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {jersey.sport_type === 'soccer' ? 'Matchworn' : 'Game-Worn'}
                          </span>
                        )}
                        {jersey.is_game_issued && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            {jersey.sport_type === 'soccer' ? 'Player Edition' : 'Game-Issued'}
                          </span>
                        )}
                        {jersey.is_authentic && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Authentic
                          </span>
                        )}
                        {jersey.is_fan_jersey && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            Fantrikot
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-cyan-400 font-bold text-lg">{jersey.purchase_price.toFixed(2)} €</p>
                      {jersey.invoice_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white/60 hover:text-white hover:bg-white/5"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(jersey.invoice_url, '_blank');
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Rechnung
                        </Button>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}