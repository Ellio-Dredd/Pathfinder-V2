import React from 'react';
import { Search, MapPin, Compass, Trash2, MapIcon, Share2, Star } from 'lucide-react';

export default function TouristMode({
  inputRef,
  loading,
  suggestions,
  itinerary,
  setItinerary,
  handleOptimizeTouristRoute,
  handleShareItinerary
}) {
  return (
    <div className="space-y-4">
      {/* 1. DYNAMIC DISCOVERY SEARCH */}
      {/* --- UNIFIED SEARCH BAR --- */}
      <div className="relative mb-6">
        <div className="flex items-center bg-slate-100 dark:bg-black/30 rounded-2xl px-4 py-1 border border-transparent dark:border-white/5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-inner">
          <Search size={18} className="text-blue-500" />
          <input
            ref={inputRef} /* GOOGLE AUTOCOMPLETE ATTACHED HERE */
            type="text"
            placeholder="Search a City or Specific Place..."
            className="w-full p-3 bg-transparent border-none outline-none text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* 2. HORIZONTAL SUGGESTIONS SHELF */}
      {suggestions.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
          {suggestions.map((place) => (
            <div
              key={place.id}
              className="min-w-[160px] max-w-[160px] bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {/* Place Photo */}
              <div className="h-24 w-full bg-slate-100 dark:bg-slate-700/50 relative overflow-hidden">
                {place.photoUrl ? (
                  <img
                    src={place.photoUrl}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                    <MapPin size={24} className="text-blue-400" />
                  </div>
                )}
                {/* Rating Badge */}
                {place.rating && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Star size={10} fill="currentColor" className="text-amber-400" />
                    {place.rating}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate">
                  {place.name}
                </span>
                <button
                  onClick={() => {
                    if (!itinerary.find((i) => i.id === place.id)) {
                      setItinerary([...itinerary, place]);
                    }
                  }}
                  className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-500 text-[10px] font-black py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                >
                  + ADD TO TRIP
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. THE ITINERARY CART (Your existing list) */}
      <div className="space-y-3">
        {itinerary.length > 0 && (
          <h5 className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">
            Selected Stops
          </h5>
        )}

        {itinerary.length === 0 && (
          <div className="text-center py-12 px-6 border border-slate-200 dark:border-white/5 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/20 shadow-inner relative overflow-hidden">
            <div className="absolute -top-10 -right-10 text-indigo-500/10 dark:text-indigo-400/5">
              <Compass size={120} />
            </div>
            <div className="bg-white dark:bg-slate-800 w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 relative z-10">
              <Compass className="text-indigo-500 dark:text-indigo-400 animate-pulse" size={32} />
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white mb-2 relative z-10">
              Build Your Dream Trip
            </h4>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed relative z-10">
              Search for a city or attraction above, or click anywhere on the map to add custom stops to your itinerary.
            </p>
          </div>
        )}

        {itinerary.map((item, index) => (
          <div
            key={item.id}
            className="group flex items-center justify-between bg-white dark:bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-white/10 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <span className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-[11px] font-black w-7 h-7 flex items-center justify-center rounded-xl shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                {index + 1}
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate w-40">
                  {item.address}
                </span>
              </div>
            </div>
            <button
              onClick={() =>
                setItinerary(
                  itinerary.filter((i) => i.id !== item.id),
                )
              }
              className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* 4. OPTIMIZE BUTTON */}
      {itinerary.length > 1 && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleOptimizeTouristRoute(itinerary)}
            className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all active:scale-95 border border-white/20"
          >
            <MapIcon size={20} className="animate-bounce-slow" /> Optimize Tourist Path
          </button>
          <button
            onClick={handleShareItinerary}
            className="bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 font-bold px-5 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200 dark:border-purple-500/20 transition-all active:scale-95 group"
            title="Share Itinerary"
          >
            <Share2 size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
