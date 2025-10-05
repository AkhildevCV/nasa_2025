# backend/main.py
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import date, datetime, timedelta
import pandas as pd
import numpy as np
import requests
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import cross_val_score
from sklearn.multioutput import MultiOutputRegressor
from fastapi.middleware.cors import CORSMiddleware
import warnings
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

# ------------------------------------------------------------------
# 1.  FastAPI  setup
# ------------------------------------------------------------------
warnings.filterwarnings("ignore")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# 2.  Pydantic models
# ------------------------------------------------------------------
class AnalysisRequest(BaseModel):
    lat: float
    lon: float
    target_date: str

class GeocodeRequest(BaseModel):
    query: str

class ReverseGeocodeRequest(BaseModel):
    lat: float
    lon: float

# ------------------------------------------------------------------
# 3.  Geocoder objects
# ------------------------------------------------------------------
geolocator = Nominatim(user_agent="nasa_climate_app_geocoder_v2")
geocode_service = RateLimiter(geolocator.geocode, min_delay_seconds=1)
reverse_geocode_service = RateLimiter(geolocator.reverse, min_delay_seconds=1)

# ------------------------------------------------------------------
# 4.  LOCAL ALIAS TABLE
# ------------------------------------------------------------------
LOCAL_ALIAS = {
    "pallur"        : (10.8505, 76.2711, "Pallur, Kerala, India"),
    "pallur,kerala" : (10.8505, 76.2711, "Pallur, Kerala, India"),
}

# ------------------------------------------------------------------
# 5.  NASA-POWER  helpers  (unchanged for daily stats)
# ------------------------------------------------------------------
def fetch_nasa_power_data(lat: float, lon: float, target_day_of_year: int):
    start_year, end_year = 2005, 2024
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M,RH2M,PS",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "start": f"{start_year}0101",
        "end": f"{end_year}1231",
        "format": "JSON",
    }
    try:
        response = requests.get(url, params=params, timeout=90)
        if response.status_code != 200:
            return None
        data = response.json()
        if "properties" not in data or "parameter" not in data["properties"]:
            return None
        params_data = data["properties"]["parameter"]
        date_keys = list(params_data.get("T2M_MAX", {}).keys())
        if not date_keys:
            return None
        df_data = {
            "time": [datetime.strptime(d, "%Y%m%d") for d in date_keys],
            "temperature_2m_max": [params_data.get("T2M_MAX", {}).get(d) for d in date_keys],
            "temperature_2m_min": [params_data.get("T2M_MIN", {}).get(d) for d in date_keys],
            "precipitation_sum": [params_data.get("PRECTOTCORR", {}).get(d) for d in date_keys],
            "wind_speed_10m_max": [params_data.get("WS10M", {}).get(d) for d in date_keys],
            "relative_humidity_2m_mean": [params_data.get("RH2M", {}).get(d) for d in date_keys],
            "surface_pressure": [params_data.get("PS", {}).get(d) for d in date_keys],
        }
        df = pd.DataFrame(df_data).dropna(subset=["temperature_2m_max"])
        if len(df) == 0:
            return None
        df["temperature_2m_mean"] = (df["temperature_2m_max"] + df["temperature_2m_min"]) / 2
        df["day_of_year"] = df["time"].dt.dayofyear
        df["year"] = df["time"].dt.year
        filtered_df = df[df["day_of_year"].between(target_day_of_year - 3, target_day_of_year + 3)].copy()
        if len(filtered_df) < 20:
            return None
        filtered_df["rain_binary"] = (filtered_df["precipitation_sum"].fillna(0) >= 1.0).astype(int)
        return filtered_df.reset_index(drop=True)
    except Exception:
        return None

# ------------------------------------------------------------------
# 5B. ACCURATE SEASON DETERMINATION using climate zones
# ------------------------------------------------------------------
def determine_season(month: int, lat: float, lon: float):
    """
    Determine season based on climate zones and geographical patterns.
    More accurate than simple hemisphere division.
    """
    
    # Tropical Zone (-23.5° to 23.5°)
    if -23.5 <= lat <= 23.5:
        # Indian Subcontinent Monsoon (65°E to 95°E, 5°N to 30°N)
        if 65 <= lon <= 95 and 5 <= lat <= 30:
            if month in [6, 7, 8, 9]:
                return "Monsoon"
            elif month in [10, 11]:
                return "Post-Monsoon"
            elif month in [12, 1, 2]:
                return "Winter"
            else:  # [3, 4, 5]
                return "Summer"
        
        # Southeast Asia Monsoon (95°E to 145°E, -10°S to 25°N)
        elif 95 <= lon <= 145 and -10 <= lat <= 25:
            if month in [5, 6, 7, 8, 9, 10]:
                return "Wet Season"
            else:
                return "Dry Season"
        
        # East Africa (25°E to 55°E, -10°S to 10°N)
        elif 25 <= lon <= 55 and -10 <= lat <= 10:
            if month in [3, 4, 5]:
                return "Long Rains"
            elif month in [10, 11, 12]:
                return "Short Rains"
            elif month in [1, 2]:
                return "Dry Season"
            else:
                return "Hot Dry Season"
        
        # Caribbean/Central America (-95°W to -60°W, 5°N to 25°N)
        elif -95 <= lon <= -60 and 5 <= lat <= 25:
            if month in [6, 7, 8, 9, 10, 11]:
                return "Wet Season"
            else:
                return "Dry Season"
        
        # Amazon Basin (-80°W to -45°W, -10°S to 5°N)
        elif -80 <= lon <= -45 and -10 <= lat <= 5:
            if month in [12, 1, 2, 3, 4, 5]:
                return "Wet Season"
            else:
                return "Dry Season"
        
        # Australia Tropical North (110°E to 155°E, -25°S to -10°S)
        elif 110 <= lon <= 155 and -25 <= lat <= -10:
            if month in [12, 1, 2, 3]:
                return "Wet Season"
            else:
                return "Dry Season"
        
        # General Tropical fallback
        else:
            if (lat > 0 and month in [5, 6, 7, 8, 9, 10]) or \
               (lat < 0 and month in [11, 12, 1, 2, 3, 4]):
                return "Wet Season"
            else:
                return "Dry Season"
    
    # Subtropical Zone (23.5° to 35° and -23.5° to -35°)
    elif 23.5 < abs(lat) <= 35:
        if lat > 0:  # Northern Subtropical
            if month in [12, 1, 2]:
                return "Winter"
            elif month in [3, 4, 5]:
                return "Spring"
            elif month in [6, 7, 8]:
                return "Summer"
            else:  # [9, 10, 11]
                return "Autumn"
        else:  # Southern Subtropical
            if month in [6, 7, 8]:
                return "Winter"
            elif month in [9, 10, 11]:
                return "Spring"
            elif month in [12, 1, 2]:
                return "Summer"
            else:  # [3, 4, 5]
                return "Autumn"
    
    # Temperate Zone (35° to 66.5° and -35° to -66.5°)
    elif 35 < abs(lat) <= 66.5:
        if lat > 0:  # Northern Temperate
            if month in [12, 1, 2]:
                return "Winter"
            elif month in [3, 4, 5]:
                return "Spring"
            elif month in [6, 7, 8]:
                return "Summer"
            else:  # [9, 10, 11]
                return "Autumn"
        else:  # Southern Temperate
            if month in [6, 7, 8]:
                return "Winter"
            elif month in [9, 10, 11]:
                return "Spring"
            elif month in [12, 1, 2]:
                return "Summer"
            else:  # [3, 4, 5]
                return "Autumn"
    
    # Polar Zone (above 66.5° and below -66.5°)
    else:
        if lat > 0:  # Northern Polar
            if month in [11, 12, 1, 2, 3]:
                return "Polar Night/Winter"
            elif month in [4, 5]:
                return "Spring"
            elif month in [6, 7, 8]:
                return "Midnight Sun/Summer"
            else:  # [9, 10]
                return "Autumn"
        else:  # Southern Polar (Antarctica)
            if month in [5, 6, 7, 8, 9]:
                return "Polar Night/Winter"
            elif month in [10, 11]:
                return "Spring"
            elif month in [12, 1, 2]:
                return "Midnight Sun/Summer"
            else:  # [3, 4]
                return "Autumn"

# ------------------------------------------------------------------
# 5C. PREDICTIVE HOURLY MODEL using historical same-date patterns
# ------------------------------------------------------------------
def fetch_historical_hourly_data(lat: float, lon: float, target_date: date, years_back: int = 20):
    """
    Fetch hourly data for the same date across previous years.
    Returns DataFrame with year, hour, and weather variables.
    """
    try:
        all_data = []
        today = date.today()
        
        # Fetch data for the same date in previous years
        for year_offset in range(1, years_back + 1):
            historical_year = target_date.year - year_offset
            
            # Skip if year is too old (Open-Meteo archive starts from 1940)
            if historical_year < 1940:
                continue
            
            historical_date = date(historical_year, target_date.month, target_date.day)
            
            # Skip if this historical date is in the future (hasn't happened yet)
            if historical_date > today:
                continue
            
            # Fetch from Open-Meteo Archive API
            url = "https://archive-api.open-meteo.com/v1/archive"
            params = {
                "latitude": lat,
                "longitude": lon,
                "start_date": historical_date.strftime("%Y-%m-%d"),
                "end_date": historical_date.strftime("%Y-%m-%d"),
                "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,surface_pressure,cloud_cover",
                "timezone": "auto"
            }
            
            response = requests.get(url, params=params, timeout=30)
            if response.status_code != 200:
                continue
                
            data = response.json()
            if "hourly" not in data:
                continue
                
            hourly = data["hourly"]
            df = pd.DataFrame({
                "datetime": pd.to_datetime(hourly["time"]),
                "year": historical_year,
                "temperature": hourly["temperature_2m"],
                "humidity": hourly["relative_humidity_2m"],
                "precipitation": hourly["precipitation"],
                "wind_speed": hourly["wind_speed_10m"],
                "pressure": hourly["surface_pressure"],
                "cloud_cover": hourly["cloud_cover"]
            })
            
            df["hour"] = df["datetime"].dt.hour
            df["year_offset"] = year_offset  # For weighting
            
            all_data.append(df)
        
        if not all_data:
            return None
            
        # Combine all years
        combined_df = pd.concat(all_data, ignore_index=True)
        return combined_df
        
    except Exception as e:
        print(f"Error fetching historical hourly data: {e}")
        return None

def train_hourly_prediction_model(historical_df: pd.DataFrame):
    """
    Train Gradient Boosting model to predict hourly weather variables.
    Uses exponential decay weighting for recent years.
    """
    try:
        # Calculate exponential decay weights
        # weight = 0.9^(year_offset)
        historical_df["weight"] = 0.9 ** historical_df["year_offset"]
        
        # Create features
        features = pd.DataFrame({
            "hour": historical_df["hour"],
            "year": historical_df["year"],
            "day_of_year": historical_df["datetime"].dt.dayofyear,
            "sin_hour": np.sin(2 * np.pi * historical_df["hour"] / 24),
            "cos_hour": np.cos(2 * np.pi * historical_df["hour"] / 24),
            "sin_doy": np.sin(2 * np.pi * historical_df["datetime"].dt.dayofyear / 366),
            "cos_doy": np.cos(2 * np.pi * historical_df["datetime"].dt.dayofyear / 366),
        })
        
        # Target variables to predict
        targets = historical_df[["temperature", "humidity", "precipitation", "wind_speed", "pressure", "cloud_cover"]]
        
        # Remove rows with missing values
        valid_mask = ~(features.isna().any(axis=1) | targets.isna().any(axis=1))
        features = features[valid_mask]
        targets = targets[valid_mask]
        weights = historical_df.loc[valid_mask, "weight"]
        
        if len(features) < 50:
            return None, None
        
        # Scale features
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        # Train multi-output Gradient Boosting model
        model = MultiOutputRegressor(
            GradientBoostingRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42
            )
        )
        
        model.fit(features_scaled, targets, sample_weight=weights)
        
        return model, scaler
        
    except Exception as e:
        print(f"Error training hourly model: {e}")
        return None, None

def predict_future_hourly(lat: float, lon: float, target_date: date):
    """
    Predict hourly weather for a future date using historical patterns.
    """
    try:
        # Fetch historical data for the same date in previous years
        historical_df = fetch_historical_hourly_data(lat, lon, target_date, years_back=20)
        
        if historical_df is None or len(historical_df) < 50:
            return None
        
        # Train the model
        model, scaler = train_hourly_prediction_model(historical_df)
        
        if model is None or scaler is None:
            return None
        
        # Create prediction features for each hour of target date
        hours = list(range(24))
        prediction_features = pd.DataFrame({
            "hour": hours,
            "year": [target_date.year] * 24,
            "day_of_year": [target_date.timetuple().tm_yday] * 24,
            "sin_hour": [np.sin(2 * np.pi * h / 24) for h in hours],
            "cos_hour": [np.cos(2 * np.pi * h / 24) for h in hours],
            "sin_doy": [np.sin(2 * np.pi * target_date.timetuple().tm_yday / 366)] * 24,
            "cos_doy": [np.cos(2 * np.pi * target_date.timetuple().tm_yday / 366)] * 24,
        })
        
        # Scale and predict
        prediction_features_scaled = scaler.transform(prediction_features)
        predictions = model.predict(prediction_features_scaled)
        
        # Format results
        hourly_data = []
        for i, hour in enumerate(hours):
            hourly_data.append({
                "hour": hour,
                "time": f"{target_date.strftime('%Y-%m-%d')} {hour:02d}:00",
                "temperature": round(float(predictions[i][0]), 1),
                "humidity": round(float(predictions[i][1]), 1),
                "precipitation": max(0, round(float(predictions[i][2]), 2)),
                "wind_speed": max(0, round(float(predictions[i][3]), 1)),
                "pressure": round(float(predictions[i][4]), 1),
                "cloud_cover": max(0, min(100, round(float(predictions[i][5])))),
                "predicted": True
            })
        
        # Determine season using accurate method
        season = determine_season(target_date.month, lat, lon)
        
        return {
            "hourly_data": hourly_data,
            "season": season,
            "prediction_method": "ML (Gradient Boosting with Exponential Decay)",
            "years_used": len(historical_df["year"].unique())
        }
        
    except Exception as e:
        print(f"Error predicting hourly weather: {e}")
        return None

def fetch_actual_hourly_data(lat: float, lon: float, target_date: date):
    """
    Fetch actual historical hourly data for past dates.
    """
    try:
        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": target_date.strftime("%Y-%m-%d"),
            "end_date": target_date.strftime("%Y-%m-%d"),
            "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,surface_pressure,cloud_cover",
            "timezone": "auto"
        }
        
        response = requests.get(url, params=params, timeout=30)
        if response.status_code != 200:
            return None
            
        data = response.json()
        if "hourly" not in data:
            return None
            
        hourly = data["hourly"]
        hourly_data = []
        
        for i in range(len(hourly["time"])):
            dt = pd.to_datetime(hourly["time"][i])
            hourly_data.append({
                "hour": dt.hour,
                "time": dt.strftime("%Y-%m-%d %H:%M"),
                "temperature": round(hourly["temperature_2m"][i], 1) if hourly["temperature_2m"][i] is not None else None,
                "humidity": round(hourly["relative_humidity_2m"][i], 1) if hourly["relative_humidity_2m"][i] is not None else None,
                "precipitation": round(hourly["precipitation"][i], 2) if hourly["precipitation"][i] is not None else 0,
                "wind_speed": round(hourly["wind_speed_10m"][i], 1) if hourly["wind_speed_10m"][i] is not None else None,
                "pressure": round(hourly["surface_pressure"][i], 1) if hourly["surface_pressure"][i] is not None else None,
                "cloud_cover": int(hourly["cloud_cover"][i]) if hourly["cloud_cover"][i] is not None else None,
                "predicted": False
            })
        
        # Determine season using accurate method
        season = determine_season(target_date.month, lat, lon)
        
        return {
            "hourly_data": hourly_data,
            "season": season,
            "prediction_method": "Historical Data",
            "years_used": 1
        }
        
    except Exception as e:
        print(f"Error fetching actual hourly data: {e}")
        return None

def create_features(df: pd.DataFrame):
    features = pd.DataFrame()
    for col in [
        "day_of_year",
        "temperature_2m_max",
        "temperature_2m_min",
        "temperature_2m_mean",
        "surface_pressure",
        "wind_speed_10m_max",
        "relative_humidity_2m_mean",
        "year",
    ]:
        features[col.replace("_2m", "").replace("_10m", "")] = df[col].fillna(df[col].mean())
    features["rain_lag1"] = df["rain_binary"].shift(1).fillna(0)
    features["sin_doy"] = np.sin(2 * np.pi * features["day_of_year"] / 366)
    features["cos_doy"] = np.cos(2 * np.pi * features["day_of_year"] / 366)
    return features

def train_model(df: pd.DataFrame):
    X, y = create_features(df), df["rain_binary"]
    valid_idx = ~(X.isna().any(axis=1) | y.isna())
    X, y = X[valid_idx], y[valid_idx]
    if len(X) < 20 or y.nunique() < 2:
        return None, None, None
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_scaled, y)
    cv_score = cross_val_score(model, X_scaled, y, cv=min(5, len(X) // 10), scoring="accuracy").mean()
    return model, scaler, cv_score

def calculate_weather_statistics(df: pd.DataFrame, target_date: date):
    stats = {}
    weights = (df["year"] - df["year"].min() + 1).values
    stats["temp_max_mean"] = np.average(df["temperature_2m_max"], weights=weights)
    stats["avg_precipitation"] = np.average(df["precipitation_sum"], weights=weights)
    stats["prob_rain"] = (df["precipitation_sum"] >= 1.0).sum() / len(df) * 100
    years_to_project = target_date.year - df["year"].max()
    if years_to_project > 0 and len(df["year"].unique()) > 1:
        temp_fit = np.polyfit(df["year"], df["temperature_2m_max"], 1)
        stats["temp_trend_per_year"] = temp_fit[0]
        stats["projected_temp_max"] = stats["temp_max_mean"] + (stats["temp_trend_per_year"] * years_to_project)
        precip_fit = np.polyfit(df["year"], df["precipitation_sum"], 1)
        stats["precip_trend_per_year"] = precip_fit[0]
        stats["projected_precip"] = stats["avg_precipitation"] + (stats["precip_trend_per_year"] * years_to_project)
    else:
        stats.update(
            {
                "temp_trend_per_year": 0,
                "projected_temp_max": stats["temp_max_mean"],
                "precip_trend_per_year": 0,
                "projected_precip": stats["avg_precipitation"],
            }
        )
    return stats

def analyze_location_weather(lat: float, lon: float, target_date: date):
    # Fetch NASA POWER daily data (for long-term trends and ML)
    df = fetch_nasa_power_data(lat, lon, target_date.timetuple().tm_yday)
    if df is None:
        return {"error": "Insufficient data from NASA. This could be an ocean area or a temporary API issue."}
    
    # Calculate daily statistics
    stats = calculate_weather_statistics(df, target_date)
    model, scaler, cv_score = train_model(df)
    
    if model:
        stats["model_accuracy"] = cv_score * 100
        future_row = df.iloc[[-1]].copy()
        future_row["year"] = target_date.year
        features = create_features(future_row)
        if not features.isna().any().any():
            features_scaled = scaler.transform(features)
            stats["ml_rain_probability"] = model.predict_proba(features_scaled)[0, 1] * 100
            stats["prediction_method"] = "ML (Trend-Aware)"
        else:
            stats.update({"ml_rain_probability": stats["prob_rain"], "prediction_method": "Historical Frequency"})
    else:
        stats.update({"ml_rain_probability": stats["prob_rain"], "prediction_method": "Historical Frequency"})
    
    # Determine if date is past or future
    today = date.today()
    
    if target_date <= today:
        # Past date - fetch actual historical data
        hourly_result = fetch_actual_hourly_data(lat, lon, target_date)
    else:
        # Future date - use predictive model
        hourly_result = predict_future_hourly(lat, lon, target_date)
    
    # Prepare daily historical data for response
    df_json = df.to_dict(orient="records")
    for row in df_json:
        row["time"] = row["time"].isoformat()
    
    response = {
        "error": None,
        "lat": lat,
        "lon": lon,
        "df": df_json,
        "stats": stats,
        "total_years": df["year"].nunique()
    }
    
    if hourly_result:
        response.update(hourly_result)
    else:
        response["hourly_data"] = None
        response["season"] = determine_season(target_date.month, lat, lon)
    
    return response

# ------------------------------------------------------------------
# 6.  Extra utility endpoints
# ------------------------------------------------------------------
from fastapi import Query
import ephem

@app.get("/sun-moon")
def sun_moon(lat: float = Query(...), lon: float = Query(...), date: str = Query(...)):
    try:
        d = datetime.strptime(date, "%Y-%m-%d")
        obs = ephem.Observer()
        obs.lat, obs.lon = str(lat), str(lon)
        obs.date = d.date()
        sun = ephem.Sun()
        sun.compute(obs)
        sunrise = obs.previous_rising(sun).datetime().strftime("%H:%M")
        sunset = obs.next_setting(sun).datetime().strftime("%H:%M")
        moon = ephem.Moon()
        moon.compute(obs)
        moonrise = (
            obs.previous_rising(moon).datetime().strftime("%H:%M")
            if obs.previous_rising(moon).datetime().date() == d.date()
            else None
        )
        moonset = (
            obs.next_setting(moon).datetime().strftime("%H:%M")
            if obs.next_setting(moon).datetime().date() == d.date()
            else None
        )
        next_new = ephem.previous_new_moon(obs.date)
        next_full = ephem.previous_full_moon(obs.date)
        phase = (obs.date - next_new) / (next_full - next_new)
        phase_pct = round(phase * 100, 1)
        return {"sunrise": sunrise, "sunset": sunset, "moonrise": moonrise, "moonset": moonset, "moon_phase_percent": phase_pct}
    except Exception as e:
        raise HTTPException(500, f"Sun/Moon error: {e}")

@app.get("/air-quality")
def air_quality(lat: float = Query(...), lon: float = Query(...)):
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
            if meas["parameter"] == "pm25":
                out["pm25"] = meas["value"]
            if meas["parameter"] == "pm10":
                out["pm10"] = meas["value"]
            if meas["parameter"] == "o3":
                out["o3"] = meas["value"]
            if meas["parameter"] == "aqi":
                out["aqi"] = meas["value"]
        return out
    except Exception as e:
        raise HTTPException(500, f"Air-quality error: {e}")

@app.get("/soil")
def soil(lat: float = Query(...), lon: float = Query(...)):
    try:
        url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
        params = {
            "lat": lat,
            "lon": lon,
            "property": ["clay", "sand", "silt", "ocd"],
            "depth": "0-5cm",
            "value": "mean",
        }
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

# ------------------------------------------------------------------
# 7.  Geocoding endpoints
# ------------------------------------------------------------------
@app.post("/geocode")
async def handle_geocode_request(request: GeocodeRequest):
    q = request.query.strip().lower()
    if q in LOCAL_ALIAS:
        lat, lon, addr = LOCAL_ALIAS[q]
        return {"lat": lat, "lon": lon, "address": addr}
    try:
        location = geocode_service(request.query, exactly_one=True, timeout=10)
        if location:
            return {"lat": location.latitude, "lon": location.longitude, "address": location.address}
    except Exception:
        pass
    raise HTTPException(status_code=404, detail="Location not found.")

@app.post("/reverse_geocode")
async def handle_reverse_geocode_request(request: ReverseGeocodeRequest):
    try:
        location = reverse_geocode_service((request.lat, request.lon), language="en", exactly_one=True, timeout=10)
        if location:
            return {"address": location.address}
    except Exception:
        pass
    raise HTTPException(status_code=404, detail="Address not found.")

# ------------------------------------------------------------------
# 8.  Analysis endpoint
# ------------------------------------------------------------------
@app.post("/analyze")
async def handle_analysis_request(request: AnalysisRequest):
    try:
        target_date_obj = datetime.strptime(request.target_date, "%Y-%m-%d").date()
        results = analyze_location_weather(lat=request.lat, lon=request.lon, target_date=target_date_obj)
        if results.get("error"):
            raise HTTPException(status_code=404, detail=results["error"])
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------------
# 9.  Entrypoint
# ------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)