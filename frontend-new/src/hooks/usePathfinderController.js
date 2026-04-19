import { useState, useEffect, useRef } from "react";
import apiService from "../services/apiService";
import { supabase } from "../supabaseClient";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let isGoogleMapsConfigured = false;

export default function usePathfinderController() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locations, setLocations] = useState([]);
  const [newPoint, setNewPoint] = useState({ lat: null, lng: null });
  const [newName, setNewName] = useState("");
  const [newOpen, setNewOpen] = useState(8);
  const [newClose, setNewClose] = useState(20);
  const [relocateId, setRelocateId] = useState(null);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shareModalState, setShareModalState] = useState({ isOpen: false, url: "" });

  const [routePath, setRoutePath] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [coords, setCoords] = useState(null);
  const [citySearch, setCitySearch] = useState("");

  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const autoCompleteRef = useRef(null);

  // Setup Google Places autocomplete for the search input
  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        if (!isGoogleMapsConfigured) {
          setOptions({
            key: import.meta.env.VITE_GOOGLE_API_KEY,
            version: "weekly",
          });
          isGoogleMapsConfigured = true;
        }

        const { Autocomplete } = await importLibrary("places");
        if (!inputRef.current) return;

        if (autoCompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(
            autoCompleteRef.current,
          );
        }

        autoCompleteRef.current = new Autocomplete(inputRef.current, {
          componentRestrictions: { country: "lk" },
          fields: [
            "geometry",
            "name",
            "formatted_address",
            "place_id",
            "types",
          ],
        });

        autoCompleteRef.current.addListener("place_changed", () => {
          const place = autoCompleteRef.current.getPlace();
          if (!place.geometry) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          const isCity =
            place.types.includes("locality") ||
            place.types.includes("administrative_area_level_1") ||
            place.types.includes("administrative_area_level_2");

          if (mapRef.current) {
            mapRef.current.flyTo([lat, lng], isCity ? 12 : 16);
          }

          if (isCity) {
            setCoords({ lat, lng });
            fetchDiscovery(lat, lng);
          } else {
            const newStop = {
              id: place.place_id || Date.now().toString(),
              name: place.name,
              address: place.formatted_address,
              lat: lat,
              lng: lng,
            };

            setItinerary((prev) => {
              if (!prev.find((i) => i.id === newStop.id))
                return [...prev, newStop];
              return prev;
            });

            if (inputRef.current) inputRef.current.value = "";
          }
        });
      } catch (error) {
        console.error("Google Maps failed to load", error);
      }
    };

    initGoogleMaps();
  }, [activeTab]);

  // Manage the user's login session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Load trip data if arriving via a shared link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itineraryId = params.get("itinerary_id");

    if (itineraryId) {
      const fetchShared = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("itineraries")
            .select("*")
            .eq("id", itineraryId)
            .single();

          if (error) throw error;
          if (data) {
            setItinerary(data.locations);
            setRoutePath(data.route_shape);
            setActiveTab("tourist");
            // Fly to the first location
            if (data.locations.length > 0 && mapRef.current) {
              mapRef.current.flyTo([data.locations[0].lat, data.locations[0].lng], 12);
            }
          }
        } catch (err) {
          console.error("Failed to load shared itinerary:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchShared();
    }
  }, []);

  // Search logic with a small delay to avoid too many API calls
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await apiService.searchPlaces(searchQuery);
        setSearchResults(data);
      } catch (error) {
        console.error("Search error:", error);
      }
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Find interesting places near the current map view
  const fetchDiscovery = async (lat, lng) => {
    setLoading(true);
    try {
      const data = await apiService.discoverTouristPlaces(lat, lng);
      if (data.error) {
        alert(data.error);
        setSuggestions([]);
      } else {
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Discovery failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Application event handlers
  const handleMapClick = async (latlng) => {
    if (activeTab === "daily" && relocateId) {
      setLocations(locations.map((loc) => loc.id === relocateId ? { ...loc, lat: latlng.lat, lng: latlng.lng } : loc));
      setRelocateId(null);
      return;
    }

    setLoading(true);
    try {
      const data = await apiService.reverseGeocode(latlng.lat, latlng.lng);
      
      let smartName = "Map Selection";
      let addressStr = "Custom Location";

      if (data) {
        const addr = data.address || {};
        const area = addr.suburb || addr.village || addr.town || addr.city_district || addr.city || "";
        
        if (data.name && data.name.trim()) {
          smartName = area && area !== data.name ? `${data.name}, ${area}` : data.name;
        } else {
          const primaryName = addr.amenity || addr.shop || addr.tourism || addr.building || addr.leisure || addr.natural || addr.historic || addr.place || addr.neighbourhood || addr.road || "New Stop";
          smartName = area && area !== primaryName ? `${primaryName}, ${area}` : primaryName;
        }
        addressStr = data.display_name || "Custom Location";
      }

      if (activeTab === "tourist") {
        setItinerary((prev) => [...prev, {
          id: Date.now().toString(),
          name: smartName,
          address: addressStr,
          lat: latlng.lat,
          lng: latlng.lng,
          rating: "-",
        }]);
      } else {
        setNewPoint(latlng);
        setNewName(smartName);
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      if (activeTab === "tourist") {
        setItinerary((prev) => [...prev, { id: Date.now().toString(), name: "Map Selection", address: "Custom Location", lat: latlng.lat, lng: latlng.lng, rating: "-" }]);
      } else {
        setNewPoint(latlng);
        setNewName("New Stop");
      }
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation is not supported");
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const coords = { lat: latitude, lng: longitude };
      setNewPoint(coords);
      setSearchResults([]);
      if (mapRef.current) mapRef.current.flyTo([latitude, longitude], 15);
      
      try {
        const data = await apiService.reverseGeocode(latitude, longitude);
        const addressName = data.display_name || "Current Location";
        setNewName(addressName);
        setSearchQuery("");
      } catch (err) {
        setNewName("Current Location");
        setSearchQuery("");
      }
    }, (error) => alert("Unable to retrieve location"), { enableHighAccuracy: true });
  };

  const selectSearchResult = (place) => {
    const lat = place.lat || place.latitude;
    const lng = place.lng || place.longitude;
    if (lat === undefined || lng === undefined) return alert("Could not find coordinates");

    const coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
    if (activeTab === "tourist") {
      const newEntry = { id: place.place_id || Date.now(), name: place.name, address: place.display_name, lat: coords.lat, lng: coords.lng };
      if (!itinerary.find((i) => i.id === newEntry.id)) setItinerary([...itinerary, newEntry]);
    } else {
      setNewPoint(coords);
      setNewName(place.name);
    }
    setSearchResults([]);
    setSearchQuery("");
  };

  const confirmAddPoint = () => {
    if (!newPoint.lat) return;
    const newLocation = { id: Date.now().toString(), name: newName, lat: newPoint.lat, lng: newPoint.lng, open_time: parseInt(newOpen), close_time: parseInt(newClose) };
    setLocations([...locations, newLocation]);
    setNewPoint({ lat: null, lng: null });
  };

  const handleOptimize = async () => {
    if (locations.length < 2) return alert("Add at least a start point and one destination!");
    setLoading(true);
    try {
      const data = await apiService.optimizeDailyRoute(activeTab, locations);
      setRoute(data.route_shape);
      setLocations(data.optimized_stops);
    } catch (err) {
      alert("Optimization failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeTouristRoute = async (currentItinerary) => {
    setLoading(true);
    try {
      const formatted = currentItinerary.map(p => ({ id: p.id.toString(), name: p.name || "Tourist Stop", lat: parseFloat(p.lat), lng: parseFloat(p.lng), open_time: 8, close_time: 22 }));
      const data = await apiService.optimizeTouristRoute(formatted);
      if (data.error) return alert(data.error);

      if (data.optimized_route) {
        const reordered = data.optimized_route.map(opt => currentItinerary.find(item => item.id.toString() === (opt.id || "").toString())).filter(Boolean);
        setItinerary(reordered);
      }
      setRoutePath(data.route_shape || data.optimized_route.map(l => [l.lat, l.lng]));
      alert("Route Optimized!");
    } catch (error) {
      console.error(error);
      alert("Optimization failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleShareItinerary = async () => {
    if (itinerary.length === 0) return alert("Add some places first!");
    if (!session) return alert("Login to share!");
    setLoading(true);
    try {
      const { data, error } = await supabase.from("itineraries").insert([{ user_id: session.user.id, name: `${session.user.email}'s Trip`, locations: itinerary, route_shape: routePath }]).select().single();
      if (error) throw error;
      const shareUrl = `${window.location.origin}${window.location.pathname}?itinerary_id=${data.id}`;
      setShareModalState({ isOpen: true, url: shareUrl });
    } catch (err) {
      alert("Sharing failed!");
    } finally {
      setLoading(false);
    }
  };

  const setAsStart = (id) => {
    const selected = locations.find(l => l.id === id);
    if (!selected) return;
    setLocations([selected, ...locations.filter(l => l.id !== id)]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return {
    session, activeTab, setActiveTab, searchQuery, setSearchQuery, searchResults, isSearching, locations, setLocations, newPoint, setNewPoint, newName, setNewName, newOpen, setNewOpen, newClose, setNewClose, relocateId, setRelocateId, route, setRoute, loading, setLoading, shareModalState, setShareModalState, routePath, setRoutePath, itinerary, setItinerary, suggestions, setSuggestions, citySearch, setCitySearch, coords, setCoords, mapRef, inputRef, autoCompleteRef, fetchDiscovery, handleMapClick, useCurrentLocation, selectSearchResult, confirmAddPoint, handleOptimize, handleOptimizeTouristRoute, handleShareItinerary, setAsStart, handleLogout,
  };
}
