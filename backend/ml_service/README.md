# HealSync ML Service

Python FastAPI microservice providing ML-powered predictions for healthcare agents.

## Architecture

This service implements the **Hybrid Logic** approach:

- **Formulas**: Mathematical models (Linear Regression, HSI calculations, etc.)
- **Rules**: Threshold-based decision logic
- **ML Integration**: Gemini API simulation for advisory (optional)

## Setup

### 1. Install Python Dependencies

```powershell
cd backend\ml_service
pip install -r requirements.txt
```

### 2. Run the ML Service

```powershell
python main.py
```

The service will start on `http://localhost:8000`

### 3. View API Documentation

Open `http://localhost:8000/docs` in your browser for interactive API documentation.

## Agents Implemented

### ✅ Lab Agent - Disease Outbreak Prediction

**Implementation**: `agents/lab_agent.py`

**Algorithm**: Linear Regression

- Formula: `Q_future = Q_current + m * t`
- Where: `m = (Q_current - Q_baseline) / time_elapsed`

**Rule**: Trigger outbreak if:

- Predicted cases ≥ 2x baseline AND
- Positive test rate > 15%

**API Endpoint**: `POST /predict/outbreak`

**Request**:

```json
{
  "current_tests": { "dengue": 24, "malaria": 8 },
  "baseline_tests": { "dengue": 8, "malaria": 3 },
  "positive_tests": { "dengue": 6, "malaria": 2 }
}
```

**Response**:

```json
[
  {
    "disease": "dengue",
    "risk_level": "HIGH",
    "growth_rate": 16.0,
    "predicted_cases_24h": 40,
    "positive_rate": 25.0,
    "recommendation": "⚠️ OUTBREAK DETECTED!",
    "trigger_outbreak": true
  }
]
```

## Testing

Test the service independently:

```powershell
# Health check
curl http://localhost:8000/health

# Test outbreak prediction
curl -X POST http://localhost:8000/predict/outbreak `
  -H "Content-Type: application/json" `
  -d '{
    "current_tests": {"dengue": 24},
    "baseline_tests": {"dengue": 8},
    "positive_tests": {"dengue": 6}
  }'
```

## Integration with Node.js

The Node.js LabAgent (`backend/agents/LabAgent.js`) calls this service:

```javascript
const response = await fetch("http://localhost:8000/predict/outbreak", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ current_tests, baseline_tests, positive_tests }),
});

const predictions = await response.json();
```

## Next Agents to Implement

- [ ] City Agent - Crisis Prediction
- [ ] Hospital Agent - HSI Formula
- [ ] Pharmacy Agent - Classification Rule-Set
- [ ] Supplier Agent - Priority Score Calculation

## Tech Stack

- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **Requests** - HTTP client (for Gemini API simulation)
- **Uvicorn** - ASGI server
