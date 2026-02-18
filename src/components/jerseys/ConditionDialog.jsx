import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';

export default function ConditionDialog({ open, onOpenChange, selectedCondition, onConfirm }) {
  const { t } = useTranslation();
  const [tempCondition, setTempCondition] = React.useState(selectedCondition || "");
  const [wornQuality, setWornQuality] = React.useState("");

  // Helper to map incoming string to key (simple heuristic)
  const mapToKey = (str) => {
    if (!str) return "";
    if (str.includes("Neu mit") || str.includes("New with")) return "newWithTags";
    if (str.includes("Neu ohne") || str.includes("New without")) return "newWithoutTags";
    if (str.includes("Getragen") || str.includes("Worn")) return "worn";
    return "";
  };

  const mapQualityToKey = (str) => {
    if (!str) return "";
    if (str.includes("Sehr gut") || str.includes("Very good")) return "veryGood";
    if (str.includes("Gut") || str.includes("Good")) return "good";
    if (str.includes("Schlecht") || str.includes("Bad")) return "bad";
    return "";
  };

  React.useEffect(() => {
    // Logic to parse selectedCondition
    // This is a bit loose but works for now
    if (selectedCondition) {
        if (selectedCondition.includes("-")) {
            // Likely worn
            setTempCondition("worn");
            const parts = selectedCondition.split("-");
            if (parts.length > 1) {
                setWornQuality(mapQualityToKey(parts[1].trim()));
            }
        } else {
            setTempCondition(mapToKey(selectedCondition));
            setWornQuality("");
        }
    } else {
        setTempCondition("");
        setWornQuality("");
    }
  }, [selectedCondition, open]);

  const handleConfirm = () => {
    if (tempCondition === "worn" && wornQuality) {
      onConfirm(`${t('condition.worn')} - ${t('condition.' + wornQuality)}`);
    } else if (tempCondition && tempCondition !== "worn") {
      onConfirm(t('condition.' + tempCondition));
    }
    onOpenChange(false);
  };

  const isValid = tempCondition && (tempCondition !== "worn" || wornQuality);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('condition.title')}</DialogTitle>
          <DialogDescription className="text-white/50">
            {t('condition.subtitle')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-white/70 text-sm mb-2 block">{t('condition.label')}</Label>
            <div className="space-y-2">
              {["newWithTags", "newWithoutTags", "worn"].map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTempCondition(key);
                    if (key !== "worn") setWornQuality("");
                  }}
                  className={`w-full p-3 rounded-lg border transition-colors text-left ${
                    tempCondition === key
                      ? 'bg-cyan-600/20 border-cyan-500 text-white'
                      : 'bg-slate-800/50 border-white/10 text-white/70 hover:bg-slate-700'
                  }`}
                >
                  {t('condition.' + key)}
                </button>
              ))}
            </div>
          </div>

          {tempCondition === "worn" && (
            <div>
              <Label className="text-white/70 text-sm mb-2 block">{t('condition.quality')}</Label>
              <div className="space-y-2">
                {["veryGood", "good", "bad"].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setWornQuality(key)}
                    className={`w-full p-3 rounded-lg border transition-colors text-left ${
                      wornQuality === key
                        ? 'bg-cyan-600/20 border-cyan-500 text-white'
                        : 'bg-slate-800/50 border-white/10 text-white/70 hover:bg-slate-700'
                    }`}
                  >
                    {t('condition.' + key)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleConfirm}
            disabled={!isValid}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50"
          >
            {t('details.confirm')}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="text-white/50 hover:text-white hover:bg-white/5"
          >
            {t('detail.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}