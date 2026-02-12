import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function MobileDrawerSelect({ 
  value, 
  onValueChange, 
  options, 
  placeholder = "Auswählen",
  label 
}) {
  const [open, setOpen] = React.useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const handleSelect = (val) => {
    onValueChange(val);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/10 text-white text-left text-sm flex items-center justify-between active:bg-slate-800">
          <span className={value ? "text-white" : "text-white/40"}>{displayValue}</span>
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-slate-900 border-white/10">
        <DrawerHeader>
          <DrawerTitle className="text-white">{label || placeholder}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                value === option.value 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-white/70 active:bg-white/5'
              }`}
            >
              <span>{option.label}</span>
              {value === option.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}