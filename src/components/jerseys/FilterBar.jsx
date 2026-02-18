import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import MobileDrawerSelect from "./MobileDrawerSelect";
import { useTranslation } from 'react-i18next';

const LEAGUES_BY_SPORT = {
  icehockey: ["NHL", "DEL", "SHL", "KHL", "NLA", "EIHL", "Liiga", "CHL", "IIHF", "AHL", "OHL"],
  soccer: ["Bundesliga", "Premier League", "La Liga", "Serie A", "Ligue 1"],
  football: ["NFL", "NCAA"],
  basketball: ["NBA", "BBL", "EuroLeague"],
  baseball: ["MLB", "NPB"],
  other: []
};

const getLeagueOptions = (sport) => {
  if (!sport || sport === "all") return [{ value: "all", label: "Alle Ligen" }];
  const leagues = LEAGUES_BY_SPORT[sport] || [];
  return [
    { value: "all", label: "Alle Ligen" },
    ...leagues.map(l => ({ value: l, label: l }))
  ];
};

const SORT_OPTIONS = [
  { value: "newest", label: "Neueste" },
  { value: "popular", label: "Beliebteste" },
  { value: "team", label: "Team A-Z" }
];

const SPORT_OPTIONS = [
  { value: "all", label: "Alle Sportarten" },
  { value: "icehockey", label: "Eishockey" },
  { value: "soccer", label: "Fussball" },
  // Temporarily disabled sports:
  // { value: "football", label: "Football" },
  // { value: "basketball", label: "Basketball" },
  // { value: "baseball", label: "Baseball" },
  // { value: "other", label: "Andere" }
];

const PRODUCT_OPTIONS_BY_SPORT = {
  icehockey: [
    { value: "all", label: "Alle Objekte" },
    { value: "jersey", label: "Trikot" },
    { value: "stick", label: "Schläger" },
    { value: "helmet", label: "Spielerhelm" },
    { value: "skates", label: "Schlittschuhe" },
    { value: "pants", label: "Hose" },
    { value: "bag", label: "Tasche" },
    { value: "goalie_mask", label: "Torwart-Maske" },
    { value: "catcher", label: "Fanghand" },
    { value: "blocker", label: "Blockhand" },
    { value: "leg_pads", label: "Beinschienen" },
    { value: "pucks", label: "Pucks" },
    { value: "other", label: "Sonstiges" },
  ],
  soccer: [
    { value: "all", label: "Alle Objekte" },
    { value: "jersey", label: "Trikot" },
    { value: "shorts", label: "Hose" },
    { value: "shoes", label: "Fussballschuhe" },
    { value: "training", label: "Trainingsklamotten" },
    { value: "other", label: "Sonstiges" },
  ],
  football: [
    { value: "all", label: "Alle Objekte" },
    { value: "jersey", label: "Trikot" },
    { value: "gloves", label: "Handschuhe" },
    { value: "helmet", label: "Helm" },
    { value: "football", label: "Football" },
    { value: "other", label: "Sonstiges" },
  ],
  basketball: [
    { value: "all", label: "Alle Objekte" },
    { value: "jersey", label: "Trikots" },
    { value: "shoes", label: "Schuhe" },
    { value: "other", label: "Sonstiges" },
  ],
  baseball: [
    { value: "all", label: "Alle Objekte" },
    { value: "jersey", label: "Trikot" },
    { value: "glove", label: "Fanghandschuh" },
    { value: "ball", label: "Ball" },
    { value: "bat", label: "Schläger" },
    { value: "other", label: "Sonstiges" },
  ],
  other: [
    { value: "all", label: "Alle Objekte" },
    { value: "other", label: "Sonstiges" },
  ],
};

export default function FilterBar({ search, onSearchChange, league, onLeagueChange, sortBy, onSortChange, sport, onSportChange, productType, onProductTypeChange, hiddenSports = [] }) {
  const { t } = useTranslation();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showExtendedFilters = sport && sport !== "all";
  const leagueOptions = getLeagueOptions(sport);
  const productOptions = sport && sport !== "all" ? (PRODUCT_OPTIONS_BY_SPORT[sport] || [{ value: "all", label: "Alle Objekte" }]) : [{ value: "all", label: "Alle Objekte" }];
  
  // Filter out hidden sports from the options
  const visibleSportOptions = SPORT_OPTIONS.filter(s => s.value === "all" || !hiddenSports.includes(s.value));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('home.searchPlaceholder') + " / " + t('detail.season')}
          className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-white/25 focus:border-cyan-500/50"
        />
      </div>
      
      {/* Filters Grid */}
      <div className={`grid grid-cols-2 ${showExtendedFilters ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-3`}>
        {isMobile ? (
          <>
            <MobileDrawerSelect
              value={sport}
              onValueChange={(value) => {
                onSportChange(value);
                if (value === "all") {
                  onLeagueChange("all");
                  onProductTypeChange("all");
                }
              }}
              options={visibleSportOptions.map(s => ({ ...s, label: t(`home.filters.${s.value}`, s.label) }))}
              label={t('home.filters.all')}
              placeholder={t('home.filters.all')}
            />
            
            <MobileDrawerSelect
              value={sortBy}
              onValueChange={onSortChange}
              options={[
                { value: "newest", label: t('home.sort.newest') },
                { value: "oldest", label: t('home.sort.oldest') },
                { value: "popular", label: "Beliebteste" },
                { value: "team", label: "Team A-Z" }
              ]}
              label="Sortierung"
              placeholder="Sortieren"
            />

            {showExtendedFilters && (
              <>
                <MobileDrawerSelect
                  value={productType}
                  onValueChange={onProductTypeChange}
                  options={productOptions}
                  label="Produkttyp"
                  placeholder="Alle Objekte"
                />
                <MobileDrawerSelect
                  value={league}
                  onValueChange={onLeagueChange}
                  options={leagueOptions}
                  label="Liga"
                  placeholder="Alle Ligen"
                />
              </>
            )}
          </>
        ) : (
          <>
            <Select value={sport} onValueChange={(value) => {
              onSportChange(value);
              if (value === "all") {
                onLeagueChange("all");
                onProductTypeChange("all");
              }
            }}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SelectValue placeholder={t('home.filters.all')} />
              </SelectTrigger>
              <SelectContent>
                {visibleSportOptions.map(s => <SelectItem key={s.value} value={s.value}>{t(`home.filters.${s.value}`, s.label)}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-white/40" />
                <SelectValue placeholder="Sortieren" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('home.sort.newest')}</SelectItem>
                <SelectItem value="oldest">{t('home.sort.oldest')}</SelectItem>
                <SelectItem value="popular">Beliebteste</SelectItem>
                <SelectItem value="team">Team A-Z</SelectItem>
              </SelectContent>
            </Select>

            {showExtendedFilters && (
              <>
                <Select value={productType} onValueChange={onProductTypeChange}>
                  <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                    <SelectValue placeholder="Alle Objekte" />
                  </SelectTrigger>
                  <SelectContent>
                    {productOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={league} onValueChange={onLeagueChange}>
                  <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                    <SelectValue placeholder="Alle Ligen" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagueOptions.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}