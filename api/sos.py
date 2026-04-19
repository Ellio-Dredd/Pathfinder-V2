import os
import math
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Pathfinder SOS Service with TOPSIS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print("WARNING: GOOGLE_API_KEY is not set. SOS features will fail.")

@app.get("/")
@app.get("/api/sos")
def home():
    return {"status": "Pathfinder SOS Service is Online"}

# --- MATHEMATICAL HELPER FUNCTIONS bg---

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculates distance between two GPS coordinates using Haversine formula (in km)"""
    R = 6371.0 
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def topsis_rank(alternatives):
    """
    Applies the TOPSIS algorithm to rank mechanics.
    Criteria: [Distance, Rating, ReviewCount]
    Impacts:  [- (Cost), + (Benefit), + (Benefit)]
    Weights:  [0.5, 0.3, 0.2] (Distance is most important for SOS)
    """
    if not alternatives:
        return []

    # 1. Create Decision Matrix
    matrix = []
    for alt in alternatives:
        # Default fallback values if a mechanic has no reviews
        dist = alt['distance_km']
        rating = alt['rating'] if alt['rating'] else 0.1
        reviews = alt['user_ratings_total'] if alt['user_ratings_total'] else 1
        matrix.append([dist, rating, reviews])
        
    m = len(matrix)
    n = 3 # Number of criteria
    weights = [0.5, 0.3, 0.2]
    impacts = ['-', '+', '+']

    # 2. Normalize the Matrix
    sq_sums = [math.sqrt(sum(matrix[i][j]**2 for i in range(m))) for j in range(n)]
    norm_matrix = [[matrix[i][j] / sq_sums[j] if sq_sums[j] != 0 else 0 for j in range(n)] for i in range(m)]

    # 3. Apply Weights
    weighted_matrix = [[norm_matrix[i][j] * weights[j] for j in range(n)] for i in range(m)]

    # 4. Determine Ideal Best and Ideal Worst
    ideal_best = []
    ideal_worst = []
    for j in range(n):
        col = [weighted_matrix[i][j] for i in range(m)]
        if impacts[j] == '+':
            ideal_best.append(max(col))
            ideal_worst.append(min(col))
        else:
            ideal_best.append(min(col))
            ideal_worst.append(max(col))

    # 5. Calculate Distances to Ideal Best/Worst and Final Score
    for i in range(m):
        dist_best = math.sqrt(sum((weighted_matrix[i][j] - ideal_best[j])**2 for j in range(n)))
        dist_worst = math.sqrt(sum((weighted_matrix[i][j] - ideal_worst[j])**2 for j in range(n)))
        
        # Calculate TOPSIS Score
        score = dist_worst / (dist_best + dist_worst) if (dist_best + dist_worst) != 0 else 0
        alternatives[i]['topsis_score'] = round(score, 4)

    # 6. Sort by highest score first
    alternatives.sort(key=lambda x: x['topsis_score'], reverse=True)
    return alternatives

# --- MAIN API ENDPOINT ---

@app.get("/api/sos/nearby")
def get_nearby_assistance(lat: float, lng: float):
    url = "https://places.googleapis.com/v1/places:searchNearby"
    
    # Notice we ask for userRatingCount now too!
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location"
    }
    
    payload = {
        "includedTypes": ["car_repair"],
        "maxResultCount": 10, # Get 10 mechanics so TOPSIS has data to compare
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": 5000.0
            }
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if "error" in data:
        raise HTTPException(status_code=500, detail=f"Google API Error: {data['error']['message']}")
        
    # Extract data and calculate distance
    raw_candidates = []
    for place in data.get("places", []):
        p_lat = place.get("location", {}).get("latitude")
        p_lng = place.get("location", {}).get("longitude")
        dist = calculate_distance(lat, lng, p_lat, p_lng)
        
        raw_candidates.append({
            "name": place.get("displayName", {}).get("text", "Unknown Mechanic"),
            "address": place.get("formattedAddress", "No address provided"),
            "rating": place.get("rating", 0),
            "user_ratings_total": place.get("userRatingCount", 0),
            "lat": p_lat,
            "lng": p_lng,
            "distance_km": round(dist, 2)
        })
        
    # Apply TOPSIS Algorithm
    ranked_providers = topsis_rank(raw_candidates)
        
    return {
        "status": "success",
        "search_center": {"lat": lat, "lng": lng},
        "providers": ranked_providers
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)