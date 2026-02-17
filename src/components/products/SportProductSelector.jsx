import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';

const SPORTS = [
  { id: "icehockey" },
  { id: "soccer" },
  // Temporarily disabled sports (can be re-enabled later):
  // { id: "football", name: "Football" },
  // { id: "basketball", name: "Basketball" },
  // { id: "baseball", name: "Baseball" },
  // { id: "other", name: "Sonstiges" },
];

const PRODUCTS = {
  icehockey: [
    { id: "jersey" },
    { id: "stick" },
    { id: "helmet" },
    { id: "skates" },
    { id: "pants" },
    { id: "bag" },
    { id: "goalie_mask" },
    { id: "catcher" },
    { id: "blocker" },
    { id: "leg_pads" },
    { id: "pucks" },
    { id: "other" },
  ],
  soccer: [
    { id: "jersey" },
    { id: "shorts" },
    { id: "shoes" },
    { id: "training" },
    { id: "other" },
  ],
  football: [
    { id: "jersey" },
    { id: "gloves" },
    { id: "helmet" },
    { id: "football" },
    { id: "other" },
  ],
  basketball: [
    { id: "jersey" },
    { id: "shoes" },
    { id: "other" },
  ],
  baseball: [
    { id: "jersey" },
    { id: "glove" },
    { id: "ball" },
    { id: "bat" },
    { id: "other" },
  ],
  other: [
    { id: "other" },
  ],
};

export default function SportProductSelector({ open, onSelect, onCancel }) {
  const { t } = useTranslation();
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
            {step === "sport" ? t('myCollection.chooseSport') : t('myCollection.chooseProduct')}
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
                <span className="font-medium">{t('home.filters.' + sport.id)}</span>
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
                ← {t('detail.back')}
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
                  <span className="font-medium">{t('products.' + product.id)}</span>
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