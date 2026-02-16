import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ConditionDialog({ open, onOpenChange, selectedCondition, onConfirm }) {
  const [tempCondition, setTempCondition] = React.useState(selectedCondition || "");
  const [wornQuality, setWornQuality] = React.useState("");

  React.useEffect(() => {
    if (selectedCondition) {
      if (selectedCondition.startsWith("Getragen - ")) {
        setTempCondition("Getragen");
        setWornQuality(selectedCondition.replace("Getragen - ", ""));
      } else {
        setTempCondition(selectedCondition);
        setWornQuality("");
      }
    } else {
      setTempCondition("");
      setWornQuality("");
    }
  }, [selectedCondition, open]);

  const handleConfirm = () => {
    if (tempCondition === "Getragen" && wornQuality) {
      onConfirm(`Getragen - ${wornQuality}`);
    } else if (tempCondition !== "Getragen") {
      onConfirm(tempCondition);
    }
    onOpenChange(false);
  };

  const isValid = tempCondition && (tempCondition !== "Getragen" || wornQuality);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Zustand auswählen</DialogTitle>
          <DialogDescription className="text-white/50">
            Wähle den Zustand des Trikots
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Zustand</Label>
            <div className="space-y-2">
              {["Neu mit Etikett", "Neu ohne Etikett", "Getragen"].map(condition => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => {
                    setTempCondition(condition);
                    if (condition !== "Getragen") setWornQuality("");
                  }}
                  className={`w-full p-3 rounded-lg border transition-colors text-left ${
                    tempCondition === condition
                      ? 'bg-cyan-600/20 border-cyan-500 text-white'
                      : 'bg-slate-800/50 border-white/10 text-white/70 hover:bg-slate-700'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          {tempCondition === "Getragen" && (
            <div>
              <Label className="text-white/70 text-sm mb-2 block">Qualität</Label>
              <div className="space-y-2">
                {["Sehr gut", "Gut", "Schlecht"].map(quality => (
                  <button
                    key={quality}
                    type="button"
                    onClick={() => setWornQuality(quality)}
                    className={`w-full p-3 rounded-lg border transition-colors text-left ${
                      wornQuality === quality
                        ? 'bg-cyan-600/20 border-cyan-500 text-white'
                        : 'bg-slate-800/50 border-white/10 text-white/70 hover:bg-slate-700'
                    }`}
                  >
                    {quality}
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
            Bestätigen
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="text-white/50 hover:text-white hover:bg-white/5"
          >
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}