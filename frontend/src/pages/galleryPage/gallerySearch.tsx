import { useState, useEffect, useRef } from 'react';
import { Search, Clock, X, Command, Calendar, Tag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { type DateRange } from 'react-day-picker';
import { useSearchParams } from 'react-router-dom';


const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filteredSearches, setFilteredSearches] = useState(recentSearches);
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample tags - you can replace with your own
  const availableTags = [
     "NO Style", 
     "photorealistic",
     "digital art",
     "oil painting",
     "watercolor",
     "anime",
     "cyberpunk",
     "steampunk", 
     "fantasy art", 
     "minimalist",
     "vintage", 
     "pop art",
     "surrealism",
     "impressionist",
     "sketch",
     "custom",
  ];
console.log(searchParams)
  // Handle Ctrl+K shortcut and outside clicks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && 
          !target.closest('.search-modal-content') && 
          !target.closest('[data-radix-popper-content-wrapper]') &&
          !target.closest('[data-radix-portal]')) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter recent searches based on query
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredSearches(
        recentSearches.filter(search =>
          search.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredSearches(recentSearches);
    }
  }, [recentSearches, searchQuery]);

  // Load recent searches from memory (localStorage removed for Claude.ai compatibility)
  useEffect(()=>{
  if(localStorage.getItem("recentSearches")){
    const storedSearches=JSON.parse(localStorage.getItem("recentSearches")||"[]")
    setRecentSearches(storedSearches)
  }
}, [])

  const handleSearch = (query: string) => {
    if (query.trim()) {
      let updatedSearches;
      if (!recentSearches.includes(query)) {
        updatedSearches = [query, ...recentSearches.slice(0, 4)];
        setRecentSearches(updatedSearches);
      } else {
        updatedSearches = recentSearches;
      }
      
      // Build URL parameters
      const params = new URLSearchParams();
      params.set('query', query);
      params.set('limit', '10');
      params.set('page', '1');
      
      // Add date range if selected
      if (dateRange?.from && dateRange?.to) {
        params.set('dateFrom', dateRange.from.toISOString().split('T')[0]);
        params.set('dateTo', dateRange.to.toISOString().split('T')[0]);
      }
      
      // Add tags if selected
      if (selectedTags.length > 0) {
        params.set('tags', selectedTags.join(','));
      }
       localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
      setSearchParams(params);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    handleSearch(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    setFilteredSearches([]);
  };

  const removeRecentSearch = (searchToRemove: string) => {
    const updated = recentSearches.filter(search => search !== searchToRemove);
    setRecentSearches(updated);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearDateRange = () => {
    setDateRange(undefined);
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  const getDateRangeText = () => {
    if (dateRange?.from && dateRange?.to) {
      return `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`;
    }
    return 'Any time';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Search Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 group"
      >
        <div className="flex items-center space-x-3 text-gray-500">
          <Search className="w-5 h-5" />
          <span className="text-sm">Search...</span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
          <Command className="w-3 h-3" />
          <span>K</span>
        </div>
      </Button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-start justify-center pt-20 z-50">
          <div className="search-modal-content w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Search Input */}
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <Input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                placeholder="Search for anything..."
                className="flex-1 text-base outline-none placeholder-gray-400 text-black border-none shadow-none focus:ring-0"
                autoFocus
              />
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="ml-3 p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </div>

            {/* Filters Section */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-3">
                {/* Date Range Picker */}
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 bg-white text-muted hover:text-muted"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {getDateRangeText()}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto overflow-hidden p-0" 
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Label className="text-sm font-medium mb-2 block">Select date range</Label>
                      <CalendarComponent
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range);
                          if (range?.from && range?.to) {
                            setIsDatePickerOpen(false);
                          }
                        }}
                        captionLayout="dropdown"
                        className="rounded-md border"
                      />
                      {dateRange?.from && (
                        <div className="flex justify-between mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearDateRange}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Tags Selector */}
                <Popover open={isTagsOpen} onOpenChange={setIsTagsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 bg-white text-muted hover:text-muted"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {selectedTags.length > 0 ? `${selectedTags.length} tags` : 'Tags'}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-64 p-0" 
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Select tags</Label>
                        {selectedTags.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearTags}
                            className="text-xs h-6 px-2"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {availableTags.map((tag) => (
                          <Button
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleTag(tag)}
                            className="text-xs h-8 justify-start"
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Clear all filters */}
                {(dateRange?.from || selectedTags.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearDateRange();
                      clearTags();
                    }}
                    className="text-xs h-8 text-gray-500 hover:text-red-500"
                  >
                    Clear filters
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {(dateRange?.from || selectedTags.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {dateRange?.from && dateRange?.to && (
                    <div className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      <Calendar className="w-3 h-3 mr-1" />
                      {getDateRangeText()}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDateRange}
                        className="ml-1 h-4 w-4 p-0 hover:bg-blue-200 rounded-full"
                      >
                        <X className="w-2 h-2" />
                      </Button>
                    </div>
                  )}
                  {selectedTags.map((tag) => (
                    <div key={tag} className="flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTag(tag)}
                        className="ml-1 h-4 w-4 p-0 hover:bg-green-200 rounded-full"
                      >
                        <X className="w-2 h-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Searches */}
            <div className="max-h-80 overflow-y-auto">
              {filteredSearches.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <Clock className="w-4 h-4" />
                      <span>Recent searches</span>
                    </div>
                    {recentSearches.length > 0 && (
                      <Button
                        onClick={clearRecentSearches}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {filteredSearches.map((search, index) => (
                      <div
                        key={index}
                        className="group flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleRecentSearchClick(search)}
                      >
                        <div className="flex items-center space-x-3">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{search}</span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(search);
                          }}
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results message */}
              {searchQuery && filteredSearches.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent searches found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Press Enter to search for "{searchQuery}"
                  </p>
                </div>
              )}

              {/* Empty state */}
              {!searchQuery && recentSearches.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent searches</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Your search history will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">Enter</kbd>
                    <span>to search</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs">Esc</kbd>
                    <span>to close</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span>Powered by</span>
                  <span className="font-medium">LetsHost</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;