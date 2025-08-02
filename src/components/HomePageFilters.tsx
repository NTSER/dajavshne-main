import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X, MapPin, Gamepad2, Tag, Star, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterState {
  category: string;
  location: string;
  games: string[];
}

interface HomePageFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
  className?: string;
}

const categories = [
  "PC Gaming",
  "PlayStation 5", 
  "Billiards",
  "Table Tennis",
  "Arcade",
  "VR Gaming"
];

const locations = [
  "Rustaveli",
  "Vere Park", 
  "XFCX",
  "Esports Complex",
  "Downtown",
  "Old Town"
];

const gameOptions = [
  "FIFA",
  "Call of Duty",
  "Fortnite",
  "Valorant",
  "CS:GO",
  "8-Ball Pool",
  "9-Ball Pool",
  "Table Tennis",
  "Dota 2",
  "League of Legends",
  "Apex Legends",
  "Overwatch 2",
  "Rocket League",
  "Minecraft",
  "Grand Theft Auto V",
  "Among Us",
  "Fall Guys",
  "Rainbow Six Siege"
];

const HomePageFilters = ({ onFiltersChange, className = "" }: HomePageFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    location: "",
    games: []
  });
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleGameToggle = (game: string) => {
    const newGames = filters.games.includes(game)
      ? filters.games.filter(g => g !== game)
      : [...filters.games, game];
    handleFilterChange('games', newGames);
  };

  const clearFilters = () => {
    const emptyFilters = {
      category: "",
      location: "",
      games: []
    };
    setFilters(emptyFilters);
    onFiltersChange?.(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== ""
  );

  const activeFilterCount = [
    filters.category,
    filters.location
  ].filter(Boolean).length + filters.games.length;

  return (
    <div className={`relative ${className}`} ref={filterRef}>
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        size="lg"
        className={`group relative border-2 transition-all duration-300 ${
          isExpanded 
            ? 'border-primary bg-primary/5 shadow-lg' 
            : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Filter className={`h-5 w-5 mr-2 transition-transform duration-300 ${
          isExpanded ? 'rotate-180' : ''
        }`} />
        <span className="font-medium">
          {isExpanded ? 'Hide Filters' : 'Show Filters'}
        </span>
        
        {/* Active Filter Count Badge */}
        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold"
            >
              {activeFilterCount}
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Expandable Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-full left-0 mt-4 z-50 w-full min-w-[320px] max-w-6xl right-0 sm:min-w-[600px] lg:min-w-[800px]"
          >
            <Card className="border-2 border-primary/20 shadow-2xl bg-white backdrop-blur-sm rounded-xl overflow-hidden mx-4 sm:mx-0">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    Filter Venues
                  </h3>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-muted-foreground hover:text-destructive transition-colors self-start sm:self-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Category Filter */}
                  <div className="space-y-4">
                    <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <div className="p-1 bg-primary/10 rounded">
                        <Tag className="h-3 w-3 text-primary" />
                      </div>
                      Category
                    </label>
                    <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                      <SelectTrigger className="w-full h-11 border-2 border-muted hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Choose category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-4">
                    <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <div className="p-1 bg-primary/10 rounded">
                        <MapPin className="h-3 w-3 text-primary" />
                      </div>
                      Location
                    </label>
                    <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                      <SelectTrigger className="w-full h-11 border-2 border-muted hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Choose location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                   </div>
                </div>

                {/* Games Filter */}
                <div className="mt-8 sm:mt-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <div className="p-1 bg-primary/10 rounded">
                        <Gamepad2 className="h-3 w-3 text-primary" />
                      </div>
                      Available Games
                    </label>
                    {gameOptions.length > 10 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllGames(!showAllGames)}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        {showAllGames ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show All ({gameOptions.length})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {(showAllGames ? gameOptions : gameOptions.slice(0, 10)).map((game) => (
                      <Badge
                        key={game}
                        variant={filters.games.includes(game) ? "default" : "outline"}
                        className={`cursor-pointer transition-all duration-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ${
                          filters.games.includes(game)
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                            : 'hover:bg-primary/10 hover:border-primary border-2'
                        }`}
                        onClick={() => handleGameToggle(game)}
                      >
                        {game}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 pt-4 border-t border-muted"
                      >
                        <p className="text-sm text-muted-foreground mb-2">Active Filters:</p>
                        <div className="flex flex-wrap gap-2">
                          {filters.category && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Category: {filters.category}
                            </Badge>
                          )}
                          {filters.location && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Location: {filters.location}
                            </Badge>
                          )}
                          {filters.games.map((game) => (
                            <Badge key={game} variant="secondary" className="bg-primary/10 text-primary">
                              {game}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePageFilters;