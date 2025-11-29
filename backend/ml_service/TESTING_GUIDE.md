# 🚀 Quick Start Guide - Testing ML Service

## Step 1: Install Python Dependencies

```powershell
cd backend\ml_service
pip install -r requirements.txt
```

## Step 2: Start the ML Service

```powershell
python main.py
```

✅ Service should start on `http://localhost:8000`
📚 API docs available at `http://localhost:8000/docs`

## Step 3: Test All Agents

Open a **new terminal** and run:

```powershell
cd backend\ml_service
python test_agents.py
```

This will test all 5 agents:

1. ✅ Lab Agent - Outbreak Prediction
2. ✅ City Agent - Crisis Prediction
3. ✅ Hospital Agent - HSI Calculation
4. ✅ Pharmacy Agent - Demand Classification
5. ✅ Supplier Agent - Order Prioritization

## Expected Output

```
============================================================
  HEALSYNC ML SERVICE - COMPREHENSIVE TEST
============================================================

============================================================
  1. HEALTH CHECK
============================================================
Status: 200
{
  "status": "healthy",
  "service": "ml_service"
}

============================================================
  2. LAB AGENT - Outbreak Prediction
============================================================
Status: 200

🔬 DENGUE:
   Risk Level: HIGH
   Growth Rate: 16.0
   Predicted 24h: 40
   Trigger Outbreak: 🚨 YES
   Recommendation: ⚠️ OUTBREAK DETECTED!

... (more agents)

============================================================
  TEST SUMMARY
============================================================
  Health Check: ✅ PASSED
  Lab Agent: ✅ PASSED
  City Agent: ✅ PASSED
  Hospital Agent: ✅ PASSED
  Pharmacy Agent: ✅ PASSED
  Supplier Agent: ✅ PASSED

  Overall: ✅ ALL TESTS PASSED
============================================================
```

## Troubleshooting

### Error: Cannot connect to ML Service

**Problem**: `ConnectionError: Cannot connect to http://localhost:8000`

**Solution**: Make sure ML service is running in another terminal:

```powershell
cd backend\ml_service
python main.py
```

### Error: Module not found

**Problem**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**: Install dependencies:

```powershell
pip install -r requirements.txt
```

## Next Steps

Once all tests pass (✅ ALL TESTS PASSED), you can:

1. **Integrate with Node.js**: Update the remaining Node.js agents to call the ML service
2. **Start Full System**: Run all 3 servers (ML service, Node.js backend, React frontend)
3. **Test in Dashboard**: Trigger scenarios and see ML predictions in action!

## API Endpoints Reference

| Endpoint                     | Agent    | Method | Purpose                        |
| ---------------------------- | -------- | ------ | ------------------------------ |
| `/predict/outbreak`          | Lab      | POST   | Disease outbreak prediction    |
| `/predict/crisis`            | City     | POST   | Citywide crisis prediction     |
| `/calculate/hospital_strain` | Hospital | POST   | HSI calculation                |
| `/classify/pharmacy_demand`  | Pharmacy | POST   | Medicine demand classification |
| `/prioritize/orders`         | Supplier | POST   | Order prioritization           |

## Interactive API Documentation

Visit `http://localhost:8000/docs` while ML service is running to:

- 📖 View all endpoints
- 🧪 Test API calls interactively
- 📋 See request/response schemas
- 💡 Get code examples
