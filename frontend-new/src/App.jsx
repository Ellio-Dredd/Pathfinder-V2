import React, { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Sun, Moon, Search, LogOut, Compass, ExternalLink, X } from "lucide-react";

// Core app components
import apiService from "./services/apiService";
import usePathfinderController from "./hooks/usePathfinderController";
import DailyPlanner from "./components/DailyPlanner";
import MapView from "./components/MapView";
import TouristMode from "./TouristMode";
import Auth from "./Auth";
import ShareModal from "./ShareModal";

// Marker icon setup for Leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const {
    session, activeTab, setActiveTab, searchQuery, setSearchQuery, searchResults, isSearching, 
    locations, setLocations, newPoint, setNewPoint, newName, setNewName, newOpen, setNewOpen, 
    newClose, setNewClose, relocateId, setRelocateId, route, setRoute, loading, shareModalState, 
    setShareModalState, routePath, setRoutePath, itinerary, setItinerary, suggestions, 
    mapRef, inputRef, fetchDiscovery, handleMapClick, useCurrentLocation, selectSearchResult, 
    confirmAddPoint, handleOptimize, handleOptimizeTouristRoute, handleShareItinerary, setAsStart, handleLogout,
  } = usePathfinderController();

  if (!session) return <Auth />;

  const openInGoogleMaps = () => {
    const stops = activeTab === "tourist" ? itinerary : locations;
    if (stops.length < 2) return alert("Add at least 2 stops first!");
    const origin = `${stops[0].lat},${stops[0].lng}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
    const waypoints = stops.slice(1, -1).map((s) => `${s.lat},${s.lng}`).join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, "_blank");
  };

  return (
    <div className={`relative h-screen w-screen overflow-hidden font-['Inter'] ${isDarkMode ? "dark bg-slate-950" : "bg-slate-50"}`}>
      
      {/* Map layer stays in the background */}
      <div className="absolute inset-0 z-0">
        <MapView
          mapRef={mapRef}
          isDarkMode={isDarkMode}
          locations={locations}
          itinerary={itinerary}
          newPoint={newPoint}
          route={route}
          routePath={routePath}
          activeTab={activeTab}
          handleMapClick={handleMapClick}
        />
      </div>

      {/* UI controls that float over the map */}
      <div className="relative z-10 flex h-full w-full pointer-events-none">
        
        {/* Main navigation and details panel */}
        <div className={`
          pointer-events-auto
          fixed md:relative 
          bottom-0 left-0 right-0
          md:bottom-auto md:left-auto md:right-auto
          z-[1001] md:z-10 
          w-full md:w-[400px] 
          h-[70vh] md:h-full 
          flex flex-col 
          bg-white/95 dark:bg-slate-900/95 
          backdrop-blur-xl 
          border-t md:border-t-0 md:border-r 
          border-slate-200 dark:border-white/10 
          shadow-2xl 
          transition-transform duration-500 ease-in-out
          rounded-t-[2.5rem] md:rounded-t-none
          ${isSidebarOpen ? "translate-y-0 md:translate-x-0" : "translate-y-[calc(100%-80px)] md:-translate-x-full md:translate-y-0"}
        `}>
          
          {/* Handle for sliding the bottom sheet on mobile */}
          <div className="md:hidden flex justify-center p-3 pt-4" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>

          {/* Logo and header actions */}
          <div className="p-6 pb-2">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
                  <Compass className="text-white" size={24} />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                  Path<span className="text-blue-600">finder</span>
                </h1>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-black/30 text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-all border border-transparent dark:border-white/5 shadow-inner">
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button 
                  onClick={handleLogout} 
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-black/30 text-slate-600 dark:text-red-400 hover:text-red-500 transition-all border border-transparent dark:border-white/5 shadow-inner"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>

            {/* Toggle between modes */}
            <div className="flex p-1 bg-slate-100 dark:bg-black/30 rounded-2xl mb-6 shadow-inner border border-transparent dark:border-white/5">
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "daily" ? "bg-white dark:bg-slate-800 text-blue-400 shadow-lg border border-slate-200 dark:border-white/10" : "text-slate-400 hover:text-slate-800 dark:text-slate-200"}`}
                onClick={() => setActiveTab("daily")}
              >
                Daily Planner
              </button>
              <button
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "tourist" ? "bg-white dark:bg-slate-800 text-blue-400 shadow-lg border border-slate-200 dark:border-white/10" : "text-slate-400 hover:text-slate-800 dark:text-slate-200"}`}
                onClick={() => setActiveTab("tourist")}
              >
                Tourist Mode
              </button>
            </div>

            {/* Main search area */}
            <div className="relative mb-6">
              <div className="flex items-center bg-slate-100 dark:bg-black/30 rounded-2xl px-4 py-1 border border-transparent dark:border-white/5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-inner">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Sri Lanka..."
                  className="w-full p-3 bg-transparent border-none outline-none text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Auto-complete suggestions list */}
              {(searchResults.length > 0 || searchQuery.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl mt-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[1001] max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar">
                  <div onClick={useCurrentLocation} className="p-4 border-b border-transparent dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-3 group">
                    <div className="bg-blue-50 dark:bg-blue-500/20 p-2 rounded-full group-hover:bg-blue-500/30">
                      <Compass size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-blue-400">Use Current Location</div>
                      <div className="text-[10px] text-slate-500">Find exactly where you are</div>
                    </div>
                  </div>
                  {searchResults.map((result) => (
                    <div key={result.place_id} onClick={() => selectSearchResult(result)} className="p-4 border-b border-transparent dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                      <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{result.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{result.display_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* List of stops and itineraries */}
          <div className="overflow-y-auto flex-grow px-6 pb-6 space-y-4 custom-scrollbar">
            {activeTab === "tourist" ? (
              <TouristMode
                inputRef={inputRef}
                loading={loading}
                suggestions={suggestions}
                itinerary={itinerary}
                setItinerary={setItinerary}
                handleOptimizeTouristRoute={() => handleOptimizeTouristRoute(itinerary)}
                handleShareItinerary={handleShareItinerary}
              />
            ) : (
              <DailyPlanner
                locations={locations} setLocations={setLocations}
                newPoint={newPoint} setNewPoint={setNewPoint}
                newName={newName} setNewName={setNewName}
                newOpen={newOpen} setNewOpen={setNewOpen}
                newClose={newClose} setNewClose={setNewClose}
                relocateId={relocateId} setRelocateId={setRelocateId}
                route={route} setRoute={setRoute}
                confirmAddPoint={confirmAddPoint}
                handleOptimize={handleOptimize}
                setAsStart={setAsStart}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Empty space for map interaction on desktop */}
        <div className="flex-1 md:block hidden" />
      </div>

      {/* Floating action buttons and overlays */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {((activeTab === "daily" && route.length > 0) || (activeTab === "tourist" && routePath.length > 0)) && (
          <button
            onClick={openInGoogleMaps}
            className="pointer-events-auto absolute bottom-8 right-8 group flex items-center gap-3 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white px-6 py-4 rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all active:scale-95 hover:shadow-[0_15px_40px_rgba(37,99,235,0.6)]"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <ExternalLink size={20} />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Send to Maps</div>
              <div className="text-sm font-black">Open in Google Maps</div>
            </div>
          </button>
        )}

        <ShareModal
          isOpen={shareModalState.isOpen}
          onClose={() => setShareModalState({ ...shareModalState, isOpen: false })}
          shareUrl={shareModalState.url}
        />
      </div>
    </div>
  );
}
