"""
TraceEye Python FastAPI Microservice
Handles computer vision seal verification and IoT weather simulation
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from typing import Optional
import httpx
import asyncio
from pydantic import BaseModel
import base64
import io
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TraceEye Microservice",
    description="Computer Vision and IoT Simulation for TraceEye",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class SealVerificationRequest(BaseModel):
    original_image_base64: str
    current_image_base64: str
    threshold: float = 0.15

class SealVerificationResponse(BaseModel):
    verification_status: str  # "verified_intact", "verified_tampered", "flagged_review"
    difference_score: float
    confidence: float
    message: str
    details: dict

class WeatherData(BaseModel):
    city: str
    temperature: float
    weather_code: int
    is_cloudy: bool

class IoTSimulationResponse(BaseModel):
    solar_voltage: float
    battery_status: str
    grid_status: str
    weather_data: WeatherData
    thermal_holdover_hours: float
    warning: Optional[str] = None

def base64_to_image(base64_string: str) -> np.ndarray:
    """Convert base64 string to OpenCV image"""
    try:
        # Remove header if present
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        return opencv_image
    except Exception as e:
        logger.error(f"Error converting base64 to image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image data")

def calculate_image_difference(img1: np.ndarray, img2: np.ndarray) -> float:
    """Calculate structural difference between two images using OpenCV"""
    try:
        # Resize images to same dimensions
        height = 300
        width = 300
        dim = (width, height)
        
        img1_resized = cv2.resize(img1, dim)
        img2_resized = cv2.resize(img2, dim)
        
        # Convert to grayscale
        gray1 = cv2.cvtColor(img1_resized, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2_resized, cv2.COLOR_BGR2GRAY)
        
        # Calculate absolute difference
        diff = cv2.absdiff(gray1, gray2)
        
        # Calculate difference score (ratio of different pixels)
        total_pixels = diff.size
        different_pixels = np.count_nonzero(diff)
        difference_score = different_pixels / total_pixels
        
        return difference_score
    except Exception as e:
        logger.error(f"Error calculating image difference: {e}")
        raise HTTPException(status_code=500, detail="Image processing failed")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "TraceEye Microservice",
        "version": "1.0.0",
        "endpoints": {
            "seal_verification": "/verify-seal",
            "iot_simulation": "/simulate-iot",
            "health": "/health"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "TraceEye Microservice"}

@app.post("/verify-seal", response_model=SealVerificationResponse)
async def verify_seal(request: SealVerificationRequest):
    """
    Verify seal integrity using computer vision
    Compares original seal image with current seal image
    """
    try:
        # Convert base64 images to OpenCV format
        original_img = base64_to_image(request.original_image_base64)
        current_img = base64_to_image(request.current_image_base64)
        
        # Calculate image difference
        difference_score = calculate_image_difference(original_img, current_img)
        
        # Determine verification status based on threshold
        threshold = request.threshold
        
        if difference_score < threshold * 0.5:
            verification_status = "verified_intact"
            confidence = 0.9 + (threshold - difference_score) * 2
            message = "Seal appears intact - minimal visual differences detected"
        elif difference_score < threshold:
            verification_status = "flagged_review"
            confidence = 0.7 + (threshold - difference_score)
            message = "Minor visual inconsistencies detected - manual review recommended"
        else:
            verification_status = "verified_tampered"
            confidence = min(0.95, difference_score * 2)
            message = "Significant visual differences detected - potential tampering"
        
        confidence = min(0.99, max(0.5, confidence))
        
        return SealVerificationResponse(
            verification_status=verification_status,
            difference_score=round(difference_score, 4),
            confidence=round(confidence, 2),
            message=message,
            details={
                "threshold_used": threshold,
                "image_dimensions": original_img.shape[:2],
                "processing_method": "opencv_structural_difference"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Seal verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.get("/simulate-iot", response_model=IoTSimulationResponse)
async def simulate_iot(city: str = "Pune"):
    """
    Simulate IoT hardware based on real weather data
    Fetches weather from Open-Meteo API and adjusts solar/battery accordingly
    """
    try:
        # Fetch weather data from Open-Meteo API (free, no API key required)
        async with httpx.AsyncClient() as client:
            # Get coordinates for city (simplified - using Pune as default)
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude=18.5204&longitude=73.8567&current_weather=true"
            
            response = await client.get(weather_url, timeout=10.0)
            response.raise_for_status()
            
            weather_data = response.json()
            current_weather = weather_data.get("current_weather", {})
            
            temperature = current_weather.get("temperature", 25)
            weather_code = current_weather.get("weathercode", 0)
            
            # Determine if cloudy based on weather code
            # Weather codes: 0-3 for clear, 45-48 for fog, 51-67 for drizzle/rain, 80-82 for showers
            is_cloudy = weather_code in [1, 2, 3, 45, 48, 51, 53, 55, 61, 63, 65, 80, 81, 82]
            
            weather_data_obj = WeatherData(
                city=city,
                temperature=temperature,
                weather_code=weather_code,
                is_cloudy=is_cloudy
            )
            
            # Simulate solar voltage based on weather
            if is_cloudy:
                solar_voltage = 12.0 + np.random.uniform(-2, 2)  # Lower voltage on cloudy days
                battery_status = "discharging"
                grid_status = "online"  # Grid compensates
            else:
                solar_voltage = 22.0 + np.random.uniform(-3, 3)  # Higher voltage on sunny days
                battery_status = "charging"
                grid_status = "offline"  # Solar sufficient
            
            # Calculate thermal holdover based on battery status
            if battery_status == "charging":
                thermal_holdover_hours = 48.0  # Essentially unlimited when charging
                warning = None
            else:
                # Simulate battery percentage based on solar voltage
                battery_percent = ((solar_voltage - 10) / 14) * 100  # Rough approximation
                battery_percent = max(0, min(100, battery_percent))
                
                # Calculate holdover (simplified model)
                thermal_holdover_hours = (battery_percent / 100) * 24
                
                if battery_percent < 30:
                    warning = f"Low battery ({battery_percent:.1f}%): {thermal_holdover_hours:.1f} hours thermal holdover remaining"
                elif battery_percent < 50:
                    warning = f"Moderate battery ({battery_percent:.1f}%): Monitor power levels"
                else:
                    warning = None
            
            return IoTSimulationResponse(
                solar_voltage=round(solar_voltage, 2),
                battery_status=battery_status,
                grid_status=grid_status,
                weather_data=weather_data_obj,
                thermal_holdover_hours=round(thermal_holdover_hours, 1),
                warning=warning
            )
            
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching weather: {e}")
        raise HTTPException(status_code=503, detail="Weather service unavailable")
    except Exception as e:
        logger.error(f"IoT simulation error: {e}")
        raise HTTPException(status_code=500, detail=f"IoT simulation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)