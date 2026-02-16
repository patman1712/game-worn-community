import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const DETAILS_OPTIONS = [
  "Neu mit Etikett",
  "Neu ohne Etikett",
  "Getragen",
  "pre Season",
  "Home",
  "Away",
  "Third",
  "Spezialtrikot",
  "Warm-Up",
  "Play Offs",
  "Set 1",
  "Set 2",
  "Set 3"
];

export default function DetailsDialog({ open, onOpenChange, selectedDetails, onConfirm }) {
  const [tempSelected, setTempSelected] = React.useState(selectedDetails || []);

  React.useEffect(() => {
    setTempSelected(selectedDetails || []);
  }, [selectedDetails, open]);

  const toggleDetail = (detail) => {
    if (tempSelected.includes(detail)) {
      setTempSelected(tempSelected.filter(d => d !== detail));
    } else {
      setTempSelected([...tempSelected, detail]);
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Details auswählen</DialogTitle>
          <DialogDescription className="text-white/50">
            Wähle beliebig viele Details aus
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {DETAILS_OPTIONS.map(detail => (
            <div key={detail} className="flex items-center gap-3">
              <Checkbox
                id={detail}
                checked={tempSelected.includes(detail)}
                onCheckedChange={() => toggleDetail(detail)}
                className="border-white/20"
              />
              <Label
                htmlFor={detail}
                className="text-white/90 cursor-pointer flex-1"
              >
                {detail}
              </Label>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Bestätigen ({tempSelected.length})
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