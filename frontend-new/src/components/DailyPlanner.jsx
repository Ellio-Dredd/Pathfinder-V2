import React from "react";
import { MapPin, LocateFixed, Plus, CheckCircle, Map as MapIcon, Clock, Edit3, Navigation, Trash2, AlertCircle } from "lucide-react";
import SOSButton from "../SOSButton";

export default function DailyPlanner({
  locations,
  setLocations,
  newPoint,
  setNewPoint,
  newName,
  setNewName,
  newOpen,
  setNewOpen,
  newClose,
  setNewClose,
  relocateId,
  setRelocateId,
  route,
  setRoute,
  confirmAddPoint,
  handleOptimize,
  setAsStart,
  loading
}) {
  return (
    <>
      {route.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-4">
            <h4 className="text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <MapIcon size={16} /> AI Route Reasoning
            </h4>
            <button
              onClick={() => setRoute([])}
              className="text-[10px] bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-white/5 font-bold uppercase tracking-wider"
            >
              Edit Stops
            </button>
          </div>

          <div className="relative pl-5 border-l-2 border-slate-200 dark:border-slate-700/50 space-y-6 ml-3 mt-2 pb-6">
            {locations.map((loc, i) => (
              <div key={loc.id} className="relative">
                {/* Indicator dot for the timeline */}
                <div className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-[3px] border-white dark:border-slate-900 ${loc.violation ? 'bg-red-500' : 'bg-blue-500'}`} />

                <div className={`bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm border p-4 rounded-2xl ${loc.violation ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white text-[10px] px-1.5 rounded">{i === 0 ? "START" : i}</span>
                      {loc.name}
                    </h3>
                    <span className={`text-xs font-black ${loc.violation ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {loc.arrival_time}
                    </span>
                  </div>

                  {/* Detailed explanation for this stop */}
                  {loc.reasoning && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-3 bg-slate-50 dark:bg-black/30 p-3 rounded-xl border border-slate-200 dark:border-white/5 italic flex flex-col gap-2">
                      {loc.reasoning.split('. ').map((sentence, idx) => {
                        if (!sentence.trim()) return null;
                        let icon = <CheckCircle size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />;
                        if (sentence.includes("WARNING")) icon = <AlertCircle size={14} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />;
                        else if (sentence.includes("Waiting")) icon = <Clock size={14} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />;
                        else if (sentence.includes("Travel") || sentence.includes("Started")) icon = <Navigation size={14} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />;

                        return (
                          <div key={idx} className="flex items-start gap-2">
                            {icon}
                            <span>{sentence.replace("WARNING: ", "").replace(/\.+$/, '')}.</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Prompt when moving the start location */}
          {relocateId && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-pulse">
              <MapPin size={18} /> Click map to move Start point
            </div>
          )}

          {/* Form for adding a new stop to the list */}
          {newPoint.lat && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-500/20 p-5 rounded-3xl space-y-4 shadow-sm backdrop-blur-sm">
              <h4 className="text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                {locations.length === 0 ? <LocateFixed size={16} /> : <Plus size={16} />}
                {locations.length === 0 ? "Set Start" : "Add Stop"}
              </h4>
              <input
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-black/30 border border-transparent dark:border-white/5 text-sm font-bold text-slate-800 dark:text-white shadow-inner focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block ml-1">Open</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-lg bg-slate-100 dark:bg-black/30 border border-transparent dark:border-white/5 text-sm font-bold text-slate-800 dark:text-white"
                    value={newOpen}
                    onChange={(e) => setNewOpen(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block ml-1">Close</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-lg bg-slate-100 dark:bg-black/30 border border-transparent dark:border-white/5 text-sm font-bold text-slate-800 dark:text-white"
                    value={newClose}
                    onChange={(e) => setNewClose(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                onClick={confirmAddPoint}
              >
                <CheckCircle size={18} /> Confirm
              </button>
            </div>
          )}

          {/* Scrollable list of all stops */}
          <div className="space-y-3">
            {locations.length === 0 && !newPoint.lat && (
              <div className="text-center py-12 px-6 border border-slate-200 dark:border-white/5 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900/40 dark:to-slate-800/40 shadow-inner relative overflow-hidden group">
                <div className="absolute -top-10 -left-10 text-blue-500/10 dark:text-blue-400/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                  <MapIcon size={120} />
                </div>
                <div className="bg-white dark:bg-slate-800 w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 relative z-10">
                  <MapIcon className="text-blue-500 dark:text-blue-400" size={32} />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-2 relative z-10">Map Your Adventure</h4>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed relative z-10">
                  Click anywhere on the map to set your starting location and begin planning your route.
                </p>
              </div>
            )}

            {locations.map((loc, i) => (
              <div
                key={loc.id}
                className={`bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm border p-4 rounded-2xl transition-all relative ${i === 0 ? "border-l-4 border-l-blue-500 border-transparent dark:border-white/5" : loc.violation ? "border-l-4 border-l-red-500 border-transparent dark:border-white/5" : "border-slate-200 dark:border-white/10 hover:shadow-lg dark:shadow-none"}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md h-fit ${i === 0 ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-black/30 text-slate-400 border border-transparent dark:border-white/5"}`}>
                      {i === 0 ? "START" : i + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">{loc.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-slate-500" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {loc.arrival_time ? `Arrive: ${loc.arrival_time}` : `${loc.open_time}:00 - ${loc.close_time}:00`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {i === 0 && (
                      <button onClick={() => setRelocateId(loc.id)} className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <Edit3 size={16} />
                      </button>
                    )}
                    {i > 0 && (
                      <button onClick={() => setAsStart(loc.id)} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <Navigation size={16} />
                      </button>
                    )}
                    <button onClick={() => setLocations(locations.filter((l) => l.id !== loc.id))} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Optimization and SOS controls */}
      <div className="mt-auto pt-6 space-y-3">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-95"
          onClick={handleOptimize}
          disabled={loading || locations.length < 2}
        >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Navigation size={20} />}
          {loading ? "Thinking..." : "Optimize Smart Route"}
        </button>
        <SOSButton />
      </div>
    </>
  );
}
