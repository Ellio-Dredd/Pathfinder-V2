import os
import math
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import random
import requests
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from genetic_solver import GeneticRouteOptimizer
from fastapi import Request

load_dotenv()

app = FastAPI()
OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "http://localhost:5000")


GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print("WARNING: GOOGLE_API_KEY is not set. Search and Discovery features will fail.")

@app.get("/")
def home():
    return {"status": "Pathfinder Main API is Online"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class Location(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    open_time: int 
    close_time: int
    original_index: Optional[int] = None 
    arrival_time: Optional[str] = None
    violation: Optional[bool] = False
    reasoning: Optional[str] = None

class RouteRequest(BaseModel):
    mode: str
    locations: List[Location]

class TouristRouteRequest(BaseModel):
    locations: List[Location]


# --- 1. REAL OSRM MATRIX ---
def get_osrm_matrix(locations):
    coords = ";".join([f"{loc.lng},{loc.lat}" for loc in locations])
    url = f"{OSRM_BASE_URL}/table/v1/driving/{coords}?annotations=duration"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if "durations" in data:
                # OSRM returns seconds. Convert to HOURS.
                return [[d / 3600.0 for d in row] for row in data["durations"]]
    except Exception as e:
        print(f"OSRM Matrix Error: {e}")
    
    # Fallback to Euclidean
    n = len(locations)
    matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            dist = math.sqrt((locations[i].lat - locations[j].lat)**2 + 
                           (locations[i].lng - locations[j].lng)**2) * 111.0
            matrix[i][j] = dist / 30.0 
    return matrix

# --- 2. OSRM VISUALS ---
def get_road_geometry(sorted_locations):
    coords = ";".join([f"{loc.lng},{loc.lat}" for loc in sorted_locations])
    url = f"{OSRM_BASE_URL}/route/v1/driving/{coords}?overview=full&geometries=geojson"
    try:
        response = requests.get(url)
        if response.status_code == 200 and "routes" in response.json():
            data = response.json()
            if len(data["routes"]) > 0:
                geometry = data["routes"][0]["geometry"]["coordinates"]
                return [[lat, lng] for lng, lat in geometry]
    except Exception as e:
        print(f"OSRM Route Error: {e}")
    return []

# --- 3. FITNESS LOGIC ---
def calculate_cost(route, matrix):
    current_time = 8.0 
    total_cost = 0.0
    service_time = 0.5 

    for i in range(len(route) - 1):
        u_idx = route[i].original_index
        v_idx = route[i+1].original_index
        
        # Travel Cost
        travel_time = matrix[u_idx][v_idx]
        total_cost += travel_time # Minimize Travel Time is Priority #1
        current_time += travel_time
        
        # Time Window Penalties
        v = route[i+1]
        open_t = float(v.open_time)
        close_t = float(v.close_time)
        
        if current_time > close_t:
            penalty = (current_time - close_t) * 5000 
            total_cost += penalty
        elif current_time < open_t:
            wait_time = open_t - current_time
            total_cost += wait_time # Wait is bad, but better than late
            current_time = open_t
            
        current_time += service_time

    return total_cost

# --- 4. HEURISTIC: NEAREST NEIGHBOR (The Fix) ---
def create_nearest_neighbor_route(locations, matrix):
    # Start at Depot (Index 0)
    route = [locations[0]]
    unvisited = set(range(1, len(locations))) # Indices of other stops
    current_idx = 0
    
    while unvisited:
        # Find closest unvisited node to current node
        nearest_idx = min(unvisited, key=lambda x: matrix[current_idx][x])
        route.append(locations[nearest_idx])
        unvisited.remove(nearest_idx)
        current_idx = nearest_idx
        
    return route

# --- 5. SCHEDULE APPLIER ---
def apply_schedule(route, matrix):
    current_time = 8.0
    service_time = 0.5
    final_schedule = []
    
    start_node = route[0].model_copy()
    start_node.arrival_time = "08:00"
    start_node.reasoning = "Started route here at 08:00."
    final_schedule.append(start_node)

    for i in range(len(route) - 1):
        u_idx = route[i].original_index
        v_idx = route[i+1].original_index
        
        travel_time = matrix[u_idx][v_idx]
        current_time += travel_time
        
        v = route[i+1]
        open_t = float(v.open_time)
        close_t = float(v.close_time)
        violation = False
        
        reasons = [f"Travel from '{route[i].name}' took {int(travel_time * 60)} mins."]
        
        if current_time > close_t:
            violation = True
            reasons.append(f"WARNING: Missed {int(close_t)}:00 closing time.")
        elif current_time < open_t:
            wait_mins = int((open_t - current_time) * 60)
            reasons.append(f"Arrived early. Waiting {wait_mins} mins until it opens at {int(open_t)}:00.")
            current_time = open_t
        else:
            if close_t < 24:
                reasons.append(f"Arrived safely before {int(close_t)}:00.")
            else:
                reasons.append(f"Arrived on time.")
            
        hours = int(current_time)
        minutes = int((current_time - hours) * 60)
        time_str = f"{hours:02d}:{minutes:02d}"
        
        new_loc = v.model_copy()
        new_loc.arrival_time = time_str
        new_loc.violation = violation
        new_loc.reasoning = " ".join(reasons)
        final_schedule.append(new_loc)
        current_time += service_time
        
    return final_schedule

# --- 6. GENETIC ALGORITHM ---
def solve_ga(locations):
    # Set Indices
    for idx, loc in enumerate(locations):
        loc.original_index = idx
        
    matrix = get_osrm_matrix(locations)
    
    pop_size = 100
    generations = 500
    
    start_node = locations[0]
    other_nodes = locations[1:]
    
    population = []
    
    # A. Inject "Smart" Routes (Nearest Neighbor)
    # This guarantees we start with a logical path, not random mess
    nn_route = create_nearest_neighbor_route(locations, matrix)
    population.append(nn_route)
    
    # B. Fill rest with Random Routes
    for _ in range(pop_size - 1):
        shuffled = random.sample(other_nodes, len(other_nodes))
        route = [start_node] + shuffled
        population.append(route)
    
    # Evolution
    for _ in range(generations):
        population.sort(key=lambda r: calculate_cost(r, matrix))
        
        survivors = population[:pop_size//2]
        next_gen = survivors[:]
        
        while len(next_gen) < pop_size:
            parent = random.choice(survivors)
            child = parent[:] 
            
            # Mix of mutations
            if random.random() < 0.3 and len(child) > 2: # Swap
                idx1, idx2 = random.sample(range(1, len(child)), 2)
                child[idx1], child[idx2] = child[idx2], child[idx1]
            elif random.random() < 0.3 and len(child) > 3: # Reverse (Untangle)
                idx1, idx2 = sorted(random.sample(range(1, len(child)), 2))
                child[idx1:idx2+1] = reversed(child[idx1:idx2+1])
                
            next_gen.append(child)
        population = next_gen

    best_route = population[0]
    return apply_schedule(best_route, matrix)

# --- ENDPOINTS ---
@app.post("/api/optimize")
def optimize_route(request: RouteRequest):
    optimized_stops = solve_ga(request.locations)
    route_shape = get_road_geometry(optimized_stops)
    return {
        "optimized_stops": optimized_stops,
        "route_shape": route_shape
    }

@app.get("/api/sos")
def trigger_sos():
    return {
        "message": "SOS Signal Received",
        "nearest_provider": "Kumara Auto Works (Rank 1 - TOPSIS Score 0.92)",
        "eta": "15 mins"
    }



@app.get("/api/geocoder/reverse")
def reverse_geocode(lat: float, lon: float):
    url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}"
    headers = {
        'User-Agent': 'Pathfinder_University_Project_Yasas'
    }
    try:
        response = requests.get(url, headers=headers)
        return response.json()
    except Exception as e:
        return {"error": str(e)}
    

@app.post("/api/optimize-tourist-route")
async def optimize_tourist_route(data: TouristRouteRequest):
    locations_list = [loc.model_dump() for loc in data.locations] 
    
    if len(locations_list) < 2:
        return {"error": "Need at least 2 locations"}
    
    try:
        # 1. Get the best order of stops
        optimizer = GeneticRouteOptimizer(locations_list)
        optimized_path = optimizer.solve() 
        
        # 2. Ask LOCAL OSRM Server for the road geometry
        route_shape = []
        try:
            # BULLETPROOF FIX: Handle both Dictionaries and Objects
            coords_list = []
            for loc in optimized_path:
                # If it's a dict, use .get(), if it's an object, use .lat
                lat = loc.get('lat') if isinstance(loc, dict) else getattr(loc, 'lat', 0)
                lng = loc.get('lng') if isinstance(loc, dict) else getattr(loc, 'lng', 0)
                coords_list.append(f"{lng},{lat}")
                
            coords = ";".join(coords_list)
            
            # Pointing back to your local OSRM_BASE_URL (http://localhost:5000)
            url = f"{OSRM_BASE_URL}/route/v1/driving/{coords}?overview=full&geometries=geojson"
            
            print(f"\n--- DEBUG OSRM URL --- \n{url}\n")
            
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                route_data = response.json()
                if "routes" in route_data and len(route_data["routes"]) > 0:
                    geometry = route_data["routes"][0]["geometry"]["coordinates"]
                    route_shape = [[lat, lng] for lng, lat in geometry]
                    print("--- DEBUG: Local OSRM Success! Roads generated. ---")
            else:
                print(f"--- DEBUG: Local OSRM Rejected Request ---")
                print(f"Status: {response.status_code}, Error: {response.text}")
                
        except Exception as osrm_error:
            print(f"--- DEBUG: Python crashed while asking OSRM: {osrm_error} ---")
                
        # 3. Return both to React
        return {
            "optimized_route": optimized_path, 
            "route_shape": route_shape         
        }
        
    except Exception as e:
        print("GA ERROR:", str(e))
        return {"error": f"Optimizer failed: {str(e)}"}


@app.get("/api/tourist/discover")
def discover_places(lat: float, lng: float):
    places_url = "https://places.googleapis.com/v1/places:searchNearby"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        # ADDED 'places.photos' to the end of this list!
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos"
    }
    
    payload = {
        "includedTypes": ["tourist_attraction", "historical_landmark", "national_park", "beach"],
        "maxResultCount": 15, 
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": 10000.0 
            }
        }
    }

    try:
        res = requests.post(places_url, json=payload, headers=headers)
        data = res.json()

        raw_places = data.get("places", [])
        
        high_rated_places = [
            p for p in raw_places 
            if p.get("rating", 0) >= 4.2 and p.get("userRatingCount", 0) > 50
        ]
        high_rated_places.sort(key=lambda x: x.get("rating", 0), reverse=True)

        suggestions = []
        for p in high_rated_places[:8]: 
            # 1. EXTRACT THE PHOTO URL
            photo_url = None
            photos = p.get("photos", [])
            if photos:
                photo_name = photos[0].get("name") 
                # Create the direct image link using your API key
                photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?maxHeightPx=400&maxWidthPx=400&key={GOOGLE_API_KEY}"

            suggestions.append({
                "id": p.get("id"),
                "name": p.get("displayName", {}).get("text"),
                "address": p.get("formattedAddress"),
                "lat": p.get("location", {}).get("latitude"),
                "lng": p.get("location", {}).get("longitude"),
                "rating": p.get("rating"),
                "photoUrl": photo_url # 2. Send it to React!
            })
            
        return suggestions
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/search")
def search_places(q: str):
    # Google Places API (New) endpoint
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location"
    }

    payload = {
        "textQuery": q,
        "locationBias": {
            "circle": {
                "center": {"latitude": 6.9271, "longitude": 79.8612}, # Bias to Sri Lanka
                "radius": 50000.0
            }
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        
        # Format the data so the frontend gets exactly what it needs
        results = []
        for p in data.get("places", []):
            results.append({
                "place_id": p.get("id"),
                "name": p.get("displayName", {}).get("text"),
                "display_name": p.get("formattedAddress"),
                "lat": p.get("location", {}).get("latitude"), # Number
                "lng": p.get("location", {}).get("longitude")  # Number ..
            })
        return results
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)