import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiService = {
  // --- Geocoding ---
  async reverseGeocode(lat, lon) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/geocoder/reverse`, {
        params: { lat, lon },
      });
      return res.data;
    } catch (error) {
      console.error("Geocoding failed:", error);
      throw error;
    }
  },

  async searchPlaces(query) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/search?q=${query}`);
      return res.data;
    } catch (error) {
      console.error("Search failed:", error);
      throw error;
    }
  },

  // --- Optimization ---
  async optimizeDailyRoute(mode, locations) {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/optimize`, {
        mode: mode,
        locations: locations,
      });
      return res.data;
    } catch (error) {
      console.error("Daily optimization failed:", error);
      throw error;
    }
  },

  async optimizeTouristRoute(locations) {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/optimize-tourist-route`,
        { locations: locations },
        { headers: { "Content-Type": "application/json" } }
      );
      return res.data;
    } catch (error) {
      console.error("Tourist optimization failed:", error);
      throw error;
    }
  },

  // --- Discovery ---
  async discoverTouristPlaces(lat, lng) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tourist/discover`, {
        params: { lat, lng },
      });
      return res.data;
    } catch (error) {
      console.error("Discovery failed:", error);
      throw error;
    }
  },

  // --- SOS ---
  async triggerSOS() {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/sos`);
      return res.data;
    } catch (error) {
      console.error("SOS trigger failed:", error);
      throw error;
    }
  }
};

export default apiService;
