# backend/main.py
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import date, datetime
import pandas as pd
import numpy as np
import requests
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from fastapi.middleware.cors import CORSMiddleware
import warnings
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

# --- Application Setup ---
warnings.filterwarnings("ignore")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class AnalysisRequest(BaseModel):
    lat: float
    lon: float
    target_date: str

class GeocodeRequest(BaseModel):
    query: str

class ReverseGeocodeRequest(BaseModel):
    lat: float
    lon: float

# --- Geocoding Setup ---
geolocator = Nominatim(user_agent="nasa_climate_app_geocoder_v2")
geocode_service = RateLimiter(geolocator.geocode, min_delay_seconds=1)
reverse_geocode_service = RateLimiter(geolocator.reverse, min_delay_seconds=1)


# --- CORE MACHINE LEARNING & DATA LOGIC (from your script) ---

def fetch_nasa_power_data(lat: float, lon: float, target_day_of_year: int):
    start_year, end_year = 2005, 2024
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {"parameters": "T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M,RH2M,PS", "community": "RE", "longitude": lon, "latitude": lat, "start": f"{start_year}0101", "end": f"{end_year}1231", "format": "JSON"}
    try:
        response = requests.get(url, params=params, timeout=90)
        if response.status_code != 200: return None
        data = response.json()
        if "properties" not in data or "parameter" not in data["properties"]: return None
        params_data = data["properties"]["parameter"]
        date_keys = list(params_data.get("T2M_MAX", {}).keys())
        if not date_keys: return None
        df_data = {
            "time": [datetime.strptime(d, "%Y%m%d") for d in date_keys],
            "temperature_2m_max": [params_data.get("T2M_MAX", {}).get(d) for d in date_keys],
            "temperature_2m_min": [params_data.get("T2M_MIN", {}).get(d) for d in date_keys],
            "precipitation_sum": [params_data.get("PRECTOTCORR", {}).get(d) for d in date_keys],
            "wind_speed_10m_max": [params_data.get("WS10M", {}).get(d) for d in date_keys],
            "relative_humidity_2m_mean": [params_data.get("RH2M", {}).get(d) for d in date_keys],
            "surface_pressure": [params_data.get("PS", {}).get(d) for d in date_keys]
        }
        df = pd.DataFrame(df_data).dropna(subset=['temperature_2m_max'])
        if len(df) == 0: return None
        df["temperature_2m_mean"] = (df["temperature_2m_max"] + df["temperature_2m_min"]) / 2
        df["day_of_year"] = df["time"].dt.dayofyear
        df["year"] = df["time"].dt.year
        filtered_df = df[df["day_of_year"].between(target_day_of_year - 3, target_day_of_year + 3)].copy()
        if len(filtered_df) < 20: return None
        filtered_df["rain_binary"] = (filtered_df["precipitation_sum"].fillna(0) >= 1.0).astype(int)
        return filtered_df.reset_index(drop=True)
    except Exception: return None

def create_features(df: pd.DataFrame):
    features = pd.DataFrame()
    for col in ["day_of_year", "temperature_2m_max", "temperature_2m_min", "temperature_2m_mean", "surface_pressure", "wind_speed_10m_max", "relative_humidity_2m_mean", "year"]:
        features[col.replace("_2m", "").replace("_10m", "")] = df[col].fillna(df[col].mean())
    features["rain_lag1"] = df["rain_binary"].shift(1).fillna(0)
    features["sin_doy"] = np.sin(2 * np.pi * features["day_of_year"] / 366)
    features["cos_doy"] = np.cos(2 * np.pi * features["day_of_year"] / 366)
    return features

def train_model(df: pd.DataFrame):
    X, y = create_features(df), df["rain_binary"]
    valid_idx = ~(X.isna().any(axis=1) | y.isna())
    X, y = X[valid_idx], y[valid_idx]
    if len(X) < 20 or y.nunique() < 2: return None, None, None
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_scaled, y)
    cv_score = cross_val_score(model, X_scaled, y, cv=min(5, len(X)//10), scoring='accuracy').mean()
    return model, scaler, cv_score

def calculate_weather_statistics(df: pd.DataFrame, target_date: date):
    stats = {}
    weights = (df["year"] - df["year"].min() + 1).values
    stats["temp_max_mean"] = np.average(df["temperature_2m_max"], weights=weights)
    stats["avg_precipitation"] = np.average(df["precipitation_sum"], weights=weights)
    stats["prob_rain"] = (df["precipitation_sum"] >= 1.0).sum() / len(df) * 100
    years_to_project = target_date.year - df["year"].max()
    if years_to_project > 0 and len(df['year'].unique()) > 1:
        temp_fit = np.polyfit(df["year"], df["temperature_2m_max"], 1)
        stats["temp_trend_per_year"] = temp_fit[0]
        stats["projected_temp_max"] = stats["temp_max_mean"] + (stats["temp_trend_per_year"] * years_to_project)
        precip_fit = np.polyfit(df["year"], df["precipitation_sum"], 1)
        stats["precip_trend_per_year"] = precip_fit[0]
        stats["projected_precip"] = stats["avg_precipitation"] + (stats["precip_trend_per_year"] * years_to_project)
    else:
        stats.update({"temp_trend_per_year": 0, "projected_temp_max": stats["temp_max_mean"], "precip_trend_per_year": 0, "projected_precip": stats["avg_precipitation"]})
    return stats

def analyze_location_weather(lat: float, lon: float, target_date: date):
    df = fetch_nasa_power_data(lat, lon, target_date.timetuple().tm_yday)
    if df is None: return {"error": "Insufficient data from NASA. This could be an ocean area or a temporary API issue."}
    
    stats = calculate_weather_statistics(df, target_date)
    model, scaler, cv_score = train_model(df)
    
    if model:
        stats["model_accuracy"] = cv_score * 100
        future_row = df.iloc[[-1]].copy()
        future_row['year'] = target_date.year
        features = create_features(future_row)
        if not features.isna().any().any():
            features_scaled = scaler.transform(features)
            stats["ml_rain_probability"] = model.predict_proba(features_scaled)[0, 1] * 100
            stats["prediction_method"] = "ML (Trend-Aware)"
        else: stats.update({"ml_rain_probability": stats["prob_rain"], "prediction_method": "Historical Frequency"})
    else: stats.update({"ml_rain_probability": stats["prob_rain"], "prediction_method": "Historical Frequency"})
    
    # Convert DataFrame to a JSON-safe format before returning
    df_json = df.to_dict(orient='records')
    for row in df_json: row['time'] = row['time'].isoformat()
        
    return {"error": None, "lat": lat, "lon": lon, "df": df_json, "stats": stats, "total_years": df['year'].nunique()}


# --- API Endpoints ---
# ----------  NEW ROUTES  ----------
from fastapi import Query
from datetime import timedelta
import ephem
import math

@app.get("/sun-moon")
def sun_moon(
    lat: float = Query(...),
    lon: float = Query(...),
    date: str = Query(...)
):
    """Return sunrise, sunset, moonrise, moonset and moon-phase % for given lat/lon/date."""
    try:
        d = datetime.strptime(date, "%Y-%m-%d")
        obs = ephem.Observer()
        obs.lat, obs.lon = str(lat), str(lon)
        obs.date = d.date()

        sun = ephem.Sun()
        sun.compute(obs)
        sunrise  = obs.previous_rising(sun).datetime().strftime("%H:%M")
        sunset   = obs.next_setting(sun).datetime().strftime("%H:%M")

        moon = ephem.Moon()
        moon.compute(obs)
        moonrise = obs.previous_rising(moon).datetime().strftime("%H:%M") \
                 if obs.previous_rising(moon).datetime().date() == d.date() else None
        moonset  = obs.next_setting(moon).datetime().strftime("%H:%M") \
                 if obs.next_setting(moon).datetime().date() == d.date() else None

        next_new  = ephem.previous_new_moon(obs.date)
        next_full = ephem.previous_full_moon(obs.date)
        phase = (obs.date - next_new) / (next_full - next_new)
        phase_pct = round(phase * 100, 1)

        return {"sunrise": sunrise, "sunset": sunset,
                "moonrise": moonrise, "moonset": moonset,
                "moon_phase_percent": phase_pct}
    except Exception as e:
        raise HTTPException(500, f"Sun/Moon error: {e}")


@app.get("/air-quality")
def air_quality(
    lat: float = Query(...),
    lon: float = Query(...)
):
    """Return current AQI, PM2.5, PM10, O3 via OpenAQ."""
    try:
        url = "https://api.openaq.org/v2/latest"
        params = {"coordinates": f"{lat},{lon}", "radius": 25000, "limit": 1}
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()["results"]
        if not data:
            return {"aqi": None, "pm25": None, "pm10": None, "o3": None}
        m = data[0]["measurements"]
        out = {"aqi": None, "pm25": None, "pm10": None, "o3": None}
        for meas in m:
            if meas["parameter"] == "pm25": out["pm25"] = meas["value"]
            if meas["parameter"] == "pm10": out["pm10"] = meas["value"]
            if meas["parameter"] == "o3":    out["o3"]    = meas["value"]
            if meas["parameter"] == "aqi":   out["aqi"]   = meas["value"]
        return out
    except Exception as e:
        raise HTTPException(500, f"Air-quality error: {e}")


@app.get("/soil")
def soil(
    lat: float = Query(...),
    lon: float = Query(...)
):
    """Return 0-5 cm soil data (clay, sand, silt, organic carbon %) from SoilGrids."""
    try:
        url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
        params = {"lat": lat, "lon": lon, "property": ["clay", "sand", "silt", "ocd"],
                  "depth": "0-5cm", "value": "mean"}
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()["properties"]
        out = {}
        for prop in ["clay", "sand", "silt", "ocd"]:
            layer = data[prop]["layers"][0]
            out[prop] = round(layer["depths"][0]["values"]["mean"], 2)
        return out
    except Exception as e:
        raise HTTPException(500, f"Soil error: {e}")
    
@app.post("/geocode")
async def handle_geocode_request(request: GeocodeRequest):
    try:
        location = geocode_service(request.query, exactly_one=True, timeout=10)
        if location: return {"lat": location.latitude, "lon": location.longitude, "address": location.address}
    except Exception: pass
    raise HTTPException(status_code=404, detail="Location not found.")

@app.post("/reverse_geocode")
async def handle_reverse_geocode_request(request: ReverseGeocodeRequest):
    try:
        location = reverse_geocode_service((request.lat, request.lon), language='en', exactly_one=True, timeout=10)
        if location: return {"address": location.address}
    except Exception: pass
    raise HTTPException(status_code=404, detail="Address not found.")

@app.post("/analyze")
async def handle_analysis_request(request: AnalysisRequest):
    try:
        target_date_obj = datetime.strptime(request.target_date, "%Y-%m-%d").date()
        results = analyze_location_weather(lat=request.lat, lon=request.lon, target_date=target_date_obj)
        if results.get("error"): raise HTTPException(status_code=404, detail=results["error"])
        return results
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)