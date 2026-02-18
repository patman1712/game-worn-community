import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function CopyrightDialog({ open, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);

  const handleConfirm = () => {
    if (agreed) {
      onConfirm();
      setAgreed(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-lg bg-slate-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            {t('copyright.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">
            <p className="text-white/70 text-sm leading-relaxed">
              {t('copyright.text1')}
            </p>
            <p className="text-white/70 text-sm leading-relaxed mt-3">
              {t('copyright.text2')}
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-white/5">
            <Checkbox 
              id="copyright-agreement" 
              checked={agreed} 
              onCheckedChange={setAgreed}
              className="mt-0.5"
            />
            <Label 
              htmlFor="copyright-agreement" 
              className="text-white/80 text-sm cursor-pointer leading-relaxed"
            >
              {t('copyright.checkbox')}
            </Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleConfirm}
            disabled={!agreed}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('copyright.confirm')}
          </Button>
          <Button
            onClick={onCancel}
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