import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";

// Blue pulse icon for the user's location
const userLocationIcon = L.divIcon({
  className: "",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute h-8 w-8 rounded-full bg-blue-400 opacity-75 animate-ping"></div>
      <div class="relative h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-sm"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function AddPointHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapView({
  mapRef,
  isDarkMode,
  locations,
  itinerary,
  newPoint,
  route,
  routePath,
  activeTab,
  handleMapClick
}) {
  return (
    <div className="flex-1 relative z-0">
      <MapContainer
        center={[6.9271, 79.8612]}
        zoom={13}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", minHeight: "100vh" }}
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          url={isDarkMode 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />

        <AddPointHandler onMapClick={handleMapClick} />

        {/* Search marker or user position */}
        {newPoint.lat && (
          <Marker position={[newPoint.lat, newPoint.lng]} icon={userLocationIcon}>
            <Popup className="custom-popup">You are here</Popup>
          </Marker>
        )}

        {/* Markers for the Daily Planner stops */}
        {activeTab === "daily" && locations.map((loc, idx) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Tooltip permanent direction="top" offset={[0, -40]} className="custom-tooltip">
              {idx === 0 ? "START" : idx}
            </Tooltip>
            <Popup>{loc.name}</Popup>
          </Marker>
        ))}

        {/* Markers for the Tourist Mode itinerary */}
        {activeTab === "tourist" && itinerary.map((place, idx) => (
          <Marker key={place.id} position={[place.lat, place.lng]}>
            <Tooltip permanent direction="top" offset={[0, -40]} className="custom-tooltip">
              {idx + 1}
            </Tooltip>
            <Popup>
              <div className="font-bold text-slate-800">{place.name}</div>
              <div className="text-[10px] text-slate-500">{place.address}</div>
            </Popup>
          </Marker>
        ))}

        {/* Lines connecting the stops on the map */}
        {activeTab === "daily" && route.length > 0 && (
          <Polyline positions={route} color="#3b82f6" weight={4} opacity={0.7} />
        )}
        {activeTab === "tourist" && routePath.length > 0 && (
          <Polyline positions={routePath} color="#6366f1" weight={5} opacity={0.8} dashArray="10, 10" />
        )}
      </MapContainer>
    </div>
  );
}
