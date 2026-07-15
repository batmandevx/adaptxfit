'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Globe,
  ExternalLink,
  Loader2,
  X,
  Heart,
  Apple,
  Dumbbell,
  Brain,
  Shield,
  ChevronRight,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ── Types ──────────────────────────────────────────────────────────────
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  date: string;
  favicon: string;
}

interface SearchResponse {
  success: boolean;
  query: string;
  totalResults: number;
  results: SearchResult[];
}

// ── Category Pills Config ──────────────────────────────────────────────
const categories = [
  {
    label: 'Adaptive Exercises',
    icon: <Dumbbell className="h-3.5 w-3.5" />,
    query: 'adaptive exercises for disabilities',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/60',
  },
  {
    label: 'Mental Health',
    icon: <Brain className="h-3.5 w-3.5" />,
    query: 'mental health tips for rehabilitation',
    color: 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-950/60',
  },
  {
    label: 'Nutrition Tips',
    icon: <Apple className="h-3.5 w-3.5" />,
    query: 'adaptive fitness nutrition tips',
    color: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950/60',
  },
  {
    label: 'Heart Health',
    icon: <Heart className="h-3.5 w-3.5" />,
    query: 'heart health exercises and diet',
    color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/60',
  },
  {
    label: 'Injury Prevention',
    icon: <Shield className="h-3.5 w-3.5" />,
    query: 'injury prevention adaptive fitness',
    color: 'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800 dark:hover:bg-violet-950/60',
  },
  {
    label: 'Disability Fitness',
    icon: <Globe className="h-3.5 w-3.5" />,
    query: 'fitness routines for disabilities',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800 dark:hover:bg-cyan-950/60',
  },
];

// ── Helper ─────────────────────────────────────────────────────────────
function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// ── Component ──────────────────────────────────────────────────────────
interface HealthSearchProps {
  defaultQuery?: string;
}

export default function HealthSearch({ defaultQuery }: HealthSearchProps) {
  const [query, setQuery] = useState(defaultQuery || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Search function ────────────────────────────────────────────────
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    // Add to recent searches
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== searchQuery.trim());
      return [searchQuery.trim(), ...filtered].slice(0, 3);
    });

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}&num=8`
      );
      const data: SearchResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Debounced search on typing ─────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length === 0) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // ── Handle category pill click ─────────────────────────────────────
  const handleCategoryClick = (searchQuery: string) => {
    setQuery(searchQuery);
    // performSearch will be triggered by the useEffect above
  };

  // ── Handle recent search click ─────────────────────────────────────
  const handleRecentClick = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  // ── Handle retry ───────────────────────────────────────────────────
  const handleRetry = () => {
    setError(null);
    performSearch(query);
  };

  // ── Handle clear ───────────────────────────────────────────────────
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
  };

  return (
    <Card className="rounded-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
              <Search className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Health Info Lookup</CardTitle>
              <CardDescription className="text-xs">
                Search the web for health &amp; nutrition info
              </CardDescription>
            </div>
          </div>
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search health, nutrition, fitness..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-400"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 animate-spin" />
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategoryClick(cat.query)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${cat.color}`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !isLoading && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent:
            </span>
            {recentSearches.map((search) => (
              <button
                key={search}
                onClick={() => handleRecentClick(search)}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
              >
                <ChevronRight className="h-2.5 w-2.5" />
                {truncate(search, 25)}
              </button>
            ))}
          </div>
        )}

        <Separator className="bg-emerald-100 dark:bg-emerald-900/30" />

        {/* Results Area */}
        <div className="min-h-[120px]">
          {/* Empty State */}
          {!hasSearched && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <Globe className="h-10 w-10 text-emerald-300 dark:text-emerald-700 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Search for health information
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try a category above or type your own query
              </p>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3 py-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/30 animate-pulse"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-4 rounded bg-emerald-200 dark:bg-emerald-800" />
                    <div className="h-4 w-2/3 rounded bg-emerald-200 dark:bg-emerald-800" />
                  </div>
                  <div className="h-3 w-full rounded bg-muted mb-1" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-6 text-center"
            >
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center mb-3">
                <X className="h-5 w-5 text-rose-500" />
              </div>
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                Search failed
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={handleRetry}
              >
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Results */}
          {!isLoading && !error && results.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={query}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar"
              >
                <p className="text-xs text-muted-foreground mb-2">
                  Found {results.length} results for &quot;{truncate(query, 30)}&quot;
                </p>
                {results.map((result, index) => (
                  <motion.a
                    key={result.url}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                    className="block rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/30 hover:shadow-md transition-all duration-200 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 group"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Favicon */}
                      {result.favicon ? (
                        <img
                          src={result.favicon}
                          alt=""
                          className="h-4 w-4 mt-0.5 rounded shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Globe className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-400 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                            {result.title}
                          </h4>
                          <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Snippet */}
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {truncate(result.snippet, 120)}
                        </p>

                        {/* Domain & Date */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-0"
                          >
                            {result.domain || getDomainFromUrl(result.url)}
                          </Badge>
                          {result.date && (
                            <span className="text-[10px] text-muted-foreground/60">
                              {result.date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* No Results State */}
          {!isLoading && !error && hasSearched && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-6 text-center"
            >
              <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try a different search term
              </p>
            </motion.div>
          )}
        </div>
      </CardContent>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b98140;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #10b98180;
        }
      `}</style>
    </Card>
  );
}
