import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const SPORTS = [
  { id: "icehockey", name: "Eishockey" },
  { id: "soccer", name: "Fussball" },
  // Temporarily disabled sports (can be re-enabled later):
  // { id: "football", name: "Football" },
  // { id: "basketball", name: "Basketball" },
  // { id: "baseball", name: "Baseball" },
  // { id: "other", name: "Sonstiges" },
];

const PRODUCTS = {
  icehockey: [
    { id: "jersey", name: "Trikots" },
    { id: "stick", name: "Schläger" },
    { id: "helmet", name: "Helm" },
    { id: "skates", name: "Schlittschuhe" },
    { id: "pants", name: "Hose" },
    { id: "bag", name: "Tasche" },
    { id: "pucks", name: "Pucks" },
    { id: "other", name: "Sonstiges" },
  ],
  soccer: [
    { id: "jersey", name: "Trikot" },
    { id: "shorts", name: "Hose" },
    { id: "shoes", name: "Fussballschuhe" },
    { id: "training", name: "Trainingsklamotten" },
    { id: "other", name: "Sonstiges" },
  ],
  football: [
    { id: "jersey", name: "Trikot" },
    { id: "gloves", name: "Handschuhe" },
    { id: "helmet", name: "Helm" },
    { id: "football", name: "Football" },
    { id: "other", name: "Sonstiges" },
  ],
  basketball: [
    { id: "jersey", name: "Trikots" },
    { id: "shoes", name: "Schuhe" },
    { id: "other", name: "Sonstiges" },
  ],
  baseball: [
    { id: "jersey", name: "Trikot" },
    { id: "glove", name: "Fanghandschuh" },
    { id: "ball", name: "Ball" },
    { id: "bat", name: "Schläger" },
    { id: "other", name: "Sonstiges" },
  ],
  other: [
    { id: "other", name: "Sonstiges" },
  ],
};

export default function SportProductSelector({ open, onSelect, onCancel }) {
  const [step, setStep] = useState("sport");
  const [selectedSport, setSelectedSport] = useState(null);

  const handleSportSelect = (sport) => {
    setSelectedSport(sport);
    setStep("product");
  };

  const handleProductSelect = (product) => {
    onSelect(selectedSport, product);
    // Reset
    setStep("sport");
    setSelectedSport(null);
  };

  const handleBack = () => {
    setStep("sport");
    setSelectedSport(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onCancel();
        setStep("sport");
        setSelectedSport(null);
      }
    }}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === "sport" ? "Sportart wählen" : "Produkt wählen"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {step === "sport" ? (
            SPORTS.map((sport, i) => (
              <motion.button
                key={sport.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSportSelect(sport)}
                className="w-full p-4 rounded-xl bg-slate-800/50 border border-white/10 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all flex items-center justify-between group"
              >
                <span className="font-medium">{sport.name}</span>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-cyan-400 transition-colors" />
              </motion.button>
            ))
          ) : (
            <>
              <Button
                onClick={handleBack}
                variant="ghost"
                className="text-white/50 hover:text-white hover:bg-white/5 mb-2"
              >
                ← Zurück
              </Button>
              {PRODUCTS[selectedSport.id].map((product, i) => (
                <motion.button
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleProductSelect(product)}
                  className="w-full p-4 rounded-xl bg-slate-800/50 border border-white/10 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all flex items-center justify-between group"
                >
                  <span className="font-medium">{product.name}</span>
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-cyan-400 transition-colors" />
                </motion.button>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}