import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Clock, Bookmark, Filter, X, ArrowRight, TrendingUp, Users, Briefcase, CheckSquare, DollarSign, Users2, Book, Inbox } from 'lucide-react';
import { Card } from './index';
import { executiveSearch } from '../../../services/searchService';
import { useNavigate } from 'react-router-dom';

const MODULE_ICONS = {
  deals: TrendingUp,
  contacts: Users,
  projects: Briefcase,
  tasks: CheckSquare,
  revenue: DollarSign,
  team: Users2,
  knowledge: Book,
  inbox: Inbox
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700'
};

export default function ExecutiveSearch({ className = '' }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const searchTimeout = useRef(null);

  // Load recent and saved searches
  useEffect(() => {
    setRecentSearches(executiveSearch.getRecentSearches());
    setSavedSearches(executiveSearch.getSavedSearches());
  }, []);

  // Handle search with debouncing
  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSelectedIndex(-1);

    try {
      // Get suggestions first
      const suggestionResults = await executiveSearch.getSuggestions(searchQuery);
      setSuggestions(suggestionResults);

      // Perform full search
      const searchResults = await executiveSearch.search(searchQuery, {
        modules: selectedFilter === 'all' ? ['all'] : [selectedFilter],
        limit: 20
      });
      
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, handleSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const totalItems = [...suggestions, ...results].length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const allItems = [...suggestions, ...results];
          const selectedItem = allItems[selectedIndex];
          if (selectedItem) {
            handleItemClick(selectedItem);
          }
        } else {
          handleSearch(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle item clicks
  const handleItemClick = (item) => {
    if (item.url) {
      // Navigate to the item with state to highlight it
      navigate(item.url, { state: { highlightId: item.id } });
    } else {
      // It's a suggestion, set it as query
      setQuery(item);
    }
    setIsOpen(false);
    setQuery('');
  };

  // Handle filter selection
  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    setShowFilters(false);
    if (query) {
      handleSearch(query);
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Save current search
  const saveCurrentSearch = () => {
    if (query && query.length >= 2) {
      const name = prompt('Enter a name for this saved search:');
      if (name) {
        executiveSearch.saveSearch(name, query, { modules: [selectedFilter] });
        setSavedSearches(executiveSearch.getSavedSearches());
      }
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search deals, contacts, projects, tasks..."
          className="w-full pl-10 pr-10 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
        />
        
        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
              >
                <Filter className="w-3 h-3" />
                {selectedFilter === 'all' ? 'All' : selectedFilter}
              </button>
              
              {query && (
                <button
                  onClick={saveCurrentSearch}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                >
                  <Bookmark className="w-3 h-3" />
                  Save
                </button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b border-gray-100">
                {['all', 'deals', 'contacts', 'projects', 'tasks', 'revenue', 'team', 'knowledge', 'inbox'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => handleFilterSelect(filter)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedFilter === filter
                        ? 'bg-[#c9a84c] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Searching...</span>
              </div>
            )}

            {/* Suggestions */}
            {!loading && suggestions.length > 0 && results.length === 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  Recent Searches
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleItemClick(suggestion)}
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2 ${
                      selectedIndex === index ? 'bg-gray-100' : ''
                    }`}
                  >
                    <Clock className="w-3 h-3 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {!loading && results.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs text-gray-500">
                  {results.length} results found
                </div>
                {results.map((result, index) => {
                  const Icon = MODULE_ICONS[result.module] || Search;
                  const globalIndex = suggestions.length + index;
                  
                  return (
                    <button
                      key={`${result.module}-${result.id}`}
                      onClick={() => handleItemClick(result)}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-start gap-3 ${
                        selectedIndex === globalIndex ? 'bg-gray-100' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {result.title}
                          </span>
                          {result.status && (
                            <span className={`px-1.5 py-0.5 text-xs rounded-full ${STATUS_COLORS[result.status] || 'bg-gray-100 text-gray-700'}`}>
                              {result.status}
                            </span>
                          )}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-gray-500 truncate">
                            {result.subtitle}
                          </div>
                        )}
                        {result.description && (
                          <div className="text-xs text-gray-400 truncate mt-1">
                            {result.description}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {!loading && query.length >= 2 && results.length === 0 && suggestions.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No results found for "{query}"</p>
                <p className="text-xs text-gray-400 mt-1">Try different keywords or filters</p>
              </div>
            )}

            {/* Saved Searches */}
            {!loading && !query && savedSearches.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                  <Bookmark className="w-3 h-3" />
                  Saved Searches
                </div>
                {savedSearches.slice(0, 3).map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => {
                      setQuery(saved.query);
                      handleFilterSelect(saved.options.modules?.[0] || 'all');
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Bookmark className="w-3 h-3 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{saved.name}</div>
                      <div className="text-xs text-gray-500">{saved.query}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
