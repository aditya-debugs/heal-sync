"""
HealSync ML Service - FastAPI Backend
Provides ML-powered predictions for all healthcare agents
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import uvicorn

from agents.lab_agent import LabAgent
from agents.city_agent import CityAgent
from agents.hospital_agent import HospitalAgent
from agents.pharmacy_agent import PharmacyAgent
from agents.supplier_agent import SupplierAgent

app = FastAPI(
    title="HealSync ML Service",
    description="Machine Learning predictions for healthcare agents",
    version="1.0.0"
)

# CORS middleware to allow Node.js backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents
lab_agent = LabAgent()
city_agent = CityAgent()
hospital_agent = HospitalAgent()
pharmacy_agent = PharmacyAgent()
supplier_agent = SupplierAgent()

# ============= PYDANTIC MODELS =============

class OutbreakPredictionRequest(BaseModel):
    """Request model for outbreak prediction"""
    current_tests: Dict[str, int]  # e.g., {"dengue": 24, "malaria": 5}
    baseline_tests: Dict[str, int]  # e.g., {"dengue": 8, "malaria": 3}
    positive_tests: Optional[Dict[str, int]] = None

class OutbreakPredictionResponse(BaseModel):
    """Response model for outbreak prediction"""
    disease: str
    risk_level: str  # LOW, ELEVATED, HIGH
    growth_rate: float
    predicted_cases_24h: int
    recommendation: str
    trigger_outbreak: bool

class CrisisPredictionRequest(BaseModel):
    """Request model for city crisis prediction"""
    disease_stats: Dict[str, int]
    hospital_capacity: Dict
    medicine_stock: Dict[str, int]
    zone_risks: Dict[str, str]

class HospitalStrainRequest(BaseModel):
    """Request model for hospital strain calculation"""
    total_beds: int
    available_beds: int
    icu_total: int
    icu_available: int
    er_wait_time: int
    incoming_patients: Optional[int] = 0

class PharmacyDemandRequest(BaseModel):
    """Request model for pharmacy demand classification"""
    medicine_stocks: Dict[str, int]
    consumption_rates: Dict[str, int]
    outbreak_alerts: Optional[List[str]] = None

class SupplierOrderRequest(BaseModel):
    """Request model for supplier order prioritization"""
    orders: List[Dict]
    inventory: Dict[str, int]
    delivery_capacity: Optional[int] = 4

# ============= API ENDPOINTS =============

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "HealSync ML Service",
        "status": "operational",
        "version": "1.0.0",
        "agents": ["lab", "city", "hospital", "pharmacy", "supplier"]
    }

@app.get("/health")
async def health_check():
    """Service health check"""
    return {"status": "healthy", "service": "ml_service"}

@app.post("/predict/outbreak", response_model=List[OutbreakPredictionResponse])
async def predict_outbreak(request: OutbreakPredictionRequest):
    """
    Lab Agent: Predict disease outbreak using Linear Regression
    
    Formula from screenshot:
    Q_future = Q_current + m * t
    where m = (Q_current - Q_baseline) / t
    
    Rule: If Q_future exceeds 2x baseline AND positive cases spike, trigger OUTBREAK DETECTED
    """
    try:
        predictions = lab_agent.predict_outbreak(
            current_tests=request.current_tests,
            baseline_tests=request.baseline_tests,
            positive_tests=request.positive_tests or {}
        )
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/crisis")
async def predict_crisis(request: CrisisPredictionRequest):
    """
    City Agent: Predict citywide health crisis
    
    Formula: CPS = weighted sum of disease, capacity, medicine, and zone scores
    Rule: If CPS is ELEVATED, trigger Gemini API call for advisory
    """
    try:
        prediction = city_agent.predict_crisis(
            disease_stats=request.disease_stats,
            hospital_capacity=request.hospital_capacity,
            medicine_stock=request.medicine_stock,
            zone_risks=request.zone_risks
        )
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate/hospital_strain")
async def calculate_hospital_strain(request: HospitalStrainRequest):
    """
    Hospital Agent: Calculate Hospital Strain Index (HSI)
    
    Formula: HSI = (Bed_Utilization * 0.4) + (ICU_Risk * 0.3) + (ER_Wait * 0.3)
    Rule: If HSI is ELEVATED, send resource request to Supplier Agent
    """
    try:
        result = hospital_agent.calculate_hospital_strain(
            total_beds=request.total_beds,
            available_beds=request.available_beds,
            icu_total=request.icu_total,
            icu_available=request.icu_available,
            er_wait_time=request.er_wait_time,
            incoming_patients=request.incoming_patients
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classify/pharmacy_demand")
async def classify_pharmacy_demand(request: PharmacyDemandRequest):
    """
    Pharmacy Agent: Classify medicine demand levels
    
    Formula: Classification Rule-Set (Low, Medium, High, Surge)
    Rule: If demand is SURGE, place pre-emptive order to Supplier
    """
    try:
        result = pharmacy_agent.classify_medicine_demand(
            medicine_stocks=request.medicine_stocks,
            consumption_rates=request.consumption_rates,
            outbreak_alerts=request.outbreak_alerts
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/prioritize/orders")
async def prioritize_orders(request: SupplierOrderRequest):
    """
    Supplier Agent: Prioritize and fulfill orders
    
    Formula: Priority_Score = (Requester_Strain * 0.4) + (Medicine_Criticality * 0.3) + (Urgency * 0.3)
    Rule: Fulfill strictly by Priority Score (highest first)
    """
    try:
        result = supplier_agent.prioritize_orders(
            orders=request.orders,
            inventory=request.inventory,
            delivery_capacity=request.delivery_capacity
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============= RUN SERVER =============

if __name__ == "__main__":
    print("🚀 Starting HealSync ML Service on http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
