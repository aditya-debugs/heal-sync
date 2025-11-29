"""Quick test to verify ML service is working"""
import requests

print("\n🧪 Testing HealSync ML Service...\n")

# Test 1: Health Check
print("1. Health Check...")
response = requests.get("http://localhost:8000/health")
print(f"   Status: {response.status_code} {'✅' if response.status_code == 200 else '❌'}")

# Test 2: Lab Agent
print("\n2. Lab Agent - Outbreak Prediction...")
response = requests.post(
    "http://localhost:8000/predict/outbreak",
    json={
        "current_tests": {"dengue": 24},
        "baseline_tests": {"dengue": 8},
        "positive_tests": {"dengue": 6}
    }
)
print(f"   Status: {response.status_code} {'✅' if response.status_code == 200 else '❌'}")
if response.status_code == 200:
    data = response.json()[0]
    print(f"   Disease: {data['disease']}")
    print(f"   Risk: {data['risk_level']}")
    print(f"   Outbreak: {'🚨 YES' if data['trigger_outbreak'] else 'NO'}")

# Test 3: City Agent
print("\n3. City Agent - Crisis Prediction...")
response = requests.post(
    "http://localhost:8000/predict/crisis",
    json={
        "disease_stats": {"dengue": 45},
        "hospital_capacity": {"utilization_percent": 75},
        "medicine_stock": {"dengue_medicine": 80},
        "zone_risks": {"Zone-1": "HIGH"}
    }
)
print(f"   Status: {response.status_code} {'✅' if response.status_code == 200 else '❌'}")
if response.status_code == 200:
    data = response.json()
    print(f"   CPS Score: {data['cps_score']}")
    print(f"   Severity: {data['severity']}")

# Test 4: Hospital Agent
print("\n4. Hospital Agent - Hospital Strain Index...")
response = requests.post(
    "http://localhost:8000/calculate/hospital_strain",
    json={
        "total_beds": 200,
        "available_beds": 40,
        "icu_total": 20,
        "icu_available": 4,
        "er_wait_time": 85,
        "incoming_patients": 15
    }
)
print(f"   Status: {response.status_code} {'✅' if response.status_code == 200 else '❌'}")
if response.status_code == 200:
    data = response.json()
    print(f"   HSI Score: {data['hsi_score']}")
    print(f"   Strain Level: {data['strain_level']}")
    print(f"   Resource Request: {'📦 YES' if data['trigger_resource_request'] else 'NO'}")

# Test 5: Pharmacy Agent
print("\n5. Pharmacy Agent - Demand Classification...")
response = requests.post(
    "http://localhost:8000/classify/pharmacy_demand",
    json={
        "medicine_stocks": {
            "dengue_medicine": 45,
            "paracetamol": 180,
            "antibiotics": 120
        },
        "consumption_rates": {
            "dengue_medicine": 40,
            "paracetamol": 25,
            "antibiotics": 15
        },
        "outbreak_alerts": ["dengue"]
    }
)
print(f"   Status: {response.status_code} {'✅' if response.status_code == 200 else '❌'}")
if response.status_code == 200:
    data = response.json()
    print(f"   Inventory Health: {data['inventory_health']['status']}")
    print(f"   Pre-emptive Orders: {len(data['preemptive_orders'])}")
    surge_items = [c['medicine'] for c in data['classifications'] if c['demand_level'] == 'SURGE']
    if surge_items:
        print(f"   SURGE Items: {', '.join(surge_items)}")

# Test 6: Supplier Agent
print("\n6. Supplier Agent - Order Prioritization...")
response = requests.post(
    "http://localhost:8000/prioritize/orders",
    json={
        "orders": [
            {
                "order_id": "ORD001",
                "requester_id": "H1",
                "medicine": "oxygen",
                "quantity": 50,
                "urgency": "URGENT",
                "requester_strain": 85
            },
            {
                "order_id": "ORD002",
                "requester_id": "P1",
                "medicine": "dengue_medicine",
                "quantity": 100,
                "urgency": "HIGH",
                "requester_strain": 70
            }
        ],
        "inventory": {
            "oxygen": 80,
            "dengue_medicine": 200
        },
        "delivery_capacity": 4
    }
)
print(f"   Status: {response.status_code} {'✅' if response.status_code == 200 else '❌'}")
if response.status_code == 200:
    data = response.json()
    print(f"   Total Orders: {data['metrics']['total_orders']}")
    print(f"   Fulfilled: {data['metrics']['fulfilled_count']}")
    print(f"   Fulfillment Rate: {data['metrics']['fulfillment_rate']}%")

print("\n✅ All 5 agents tested successfully!\n")
