import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import MobileDrawerSelect from "./MobileDrawerSelect";

const LEAGUES = ["NHL", "DEL", "SHL", "KHL", "NLA", "EIHL", "Liiga", "CHL", "IIHF", "AHL", "OHL", "Sonstige"];

const LEAGUE_OPTIONS = [
  { value: "all", label: "Alle Ligen" },
  ...LEAGUES.map(l => ({ value: l, label: l }))
];

const SORT_OPTIONS = [
  { value: "newest", label: "Neueste" },
  { value: "popular", label: "Beliebteste" },
  { value: "team", label: "Team A-Z" }
];

const SPORT_OPTIONS = [
  { value: "all", label: "Alle Sportarten" },
  { value: "icehockey", label: "Eishockey" },
  { value: "soccer", label: "Fussball" },
  { value: "football", label: "Football" },
  { value: "basketball", label: "Basketball" },
  { value: "baseball", label: "Baseball" },
  { value: "other", label: "Andere" }
];

const PRODUCT_OPTIONS = [
  { value: "all", label: "Alle Produkte" },
  { value: "jersey", label: "Trikots" },
  { value: "stick", label: "Schläger" },
  { value: "shoes", label: "Schuhe" },
  { value: "other", label: "Andere" }
];

export default function FilterBar({ search, onSearchChange, league, onLeagueChange, sortBy, onSortChange, sport, onSportChange, productType, onProductTypeChange }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Team, Spieler oder Titel suchen..."
          className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {isMobile ? (
          <>
            <MobileDrawerSelect
              value={sport}
              onValueChange={onSportChange}
              options={SPORT_OPTIONS}
              label="Sportart wählen"
              placeholder="Alle Sportarten"
            />
            <MobileDrawerSelect
              value={productType}
              onValueChange={onProductTypeChange}
              options={PRODUCT_OPTIONS}
              label="Produkttyp wählen"
              placeholder="Alle Produkte"
            />
            <MobileDrawerSelect
              value={league}
              onValueChange={onLeagueChange}
              options={LEAGUE_OPTIONS}
              label="Liga wählen"
              placeholder="Alle Ligen"
            />
            <MobileDrawerSelect
              value={sortBy}
              onValueChange={onSortChange}
              options={SORT_OPTIONS}
              label="Sortierung"
              placeholder="Sortieren"
            />
          </>
        ) : (
          <>
            <Select value={sport} onValueChange={onSportChange}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SelectValue placeholder="Alle Sportarten" />
              </SelectTrigger>
              <SelectContent>
                {SPORT_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={productType} onValueChange={onProductTypeChange}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SelectValue placeholder="Alle Produkte" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={league} onValueChange={onLeagueChange}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SelectValue placeholder="Alle Ligen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Ligen</SelectItem>
                {LEAGUES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-white/40" />
                <SelectValue placeholder="Sortieren" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Neueste</SelectItem>
                <SelectItem value="popular">Beliebteste</SelectItem>
                <SelectItem value="team">Team A-Z</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>
    </div>
  );
}