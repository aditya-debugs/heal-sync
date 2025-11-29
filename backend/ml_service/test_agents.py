"""
Test script for HealSync ML Service
Tests all 5 agents independently before integration
"""

import requests
import json
from datetime import datetime

ML_SERVICE_URL = "http://localhost:8000"

def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_health_check():
    """Test ML service health"""
    print_section("1. HEALTH CHECK")
    response = requests.get(f"{ML_SERVICE_URL}/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.status_code == 200

def test_lab_agent():
    """Test Lab Agent outbreak prediction"""
    print_section("2. LAB AGENT - Outbreak Prediction")
    
    test_data = {
        "current_tests": {
            "dengue": 24,
            "malaria": 8,
            "covid": 15
        },
        "baseline_tests": {
            "dengue": 8,
            "malaria": 3,
            "covid": 10
        },
        "positive_tests": {
            "dengue": 6,
            "malaria": 2,
            "covid": 3
        }
    }
    
    response = requests.post(
        f"{ML_SERVICE_URL}/predict/outbreak",
        json=test_data
    )
    
    print(f"Status: {response.status_code}")
    predictions = response.json()
    
    for pred in predictions:
        print(f"\n🔬 {pred['disease'].upper()}:")
        print(f"   Risk Level: {pred['risk_level']}")
        print(f"   Growth Rate: {pred['growth_rate']}")
        print(f"   Predicted 24h: {pred['predicted_cases_24h']}")
        print(f"   Trigger Outbreak: {'🚨 YES' if pred['trigger_outbreak'] else '✅ NO'}")
        print(f"   Recommendation: {pred['recommendation']}")
    
    return response.status_code == 200

def test_city_agent():
    """Test City Agent crisis prediction"""
    print_section("3. CITY AGENT - Crisis Prediction")
    
    test_data = {
        "disease_stats": {
            "dengue": 45,
            "covid": 30,
            "malaria": 15
        },
        "hospital_capacity": {
            "utilization_percent": 75,
            "available_beds": 50,
            "total_beds": 200
        },
        "medicine_stock": {
            "dengue_medicine": 80,
            "paracetamol": 45,
            "antibiotics": 120
        },
        "zone_risks": {
            "Zone-1": "MEDIUM",
            "Zone-2": "HIGH",
            "Zone-3": "LOW"
        }
    }
    
    response = requests.post(
        f"{ML_SERVICE_URL}/predict/crisis",
        json=test_data
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    
    print(f"\n🌆 CITYWIDE CRISIS ANALYSIS:")
    print(f"   CPS Score: {result['cps_score']}")
    print(f"   Severity: {result['severity']}")
    print(f"   Trigger Alert: {'🚨 YES' if result['trigger_alert'] else '✅ NO'}")
    print(f"\n   Score Breakdown:")
    for key, value in result['breakdown'].items():
        print(f"     - {key}: {value}")
    print(f"\n   Advisory: {result['advisory']}")
    
    return response.status_code == 200

def test_hospital_agent():
    """Test Hospital Agent HSI calculation"""
    print_section("4. HOSPITAL AGENT - Hospital Strain Index")
    
    test_data = {
        "total_beds": 200,
        "available_beds": 35,
        "icu_total": 20,
        "icu_available": 3,
        "er_wait_time": 75,
        "incoming_patients": 15
    }
    
    response = requests.post(
        f"{ML_SERVICE_URL}/calculate/hospital_strain",
        json=test_data
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    
    print(f"\n🏥 HOSPITAL STRAIN ANALYSIS:")
    print(f"   HSI Score: {result['hsi_score']}")
    print(f"   Strain Level: {result['strain_level']}")
    print(f"   Resource Request: {'📦 YES' if result['trigger_resource_request'] else '✅ NO'}")
    print(f"\n   Utilization Breakdown:")
    breakdown = result['breakdown']
    print(f"     - Bed Utilization: {breakdown['bed_utilization']}% (Score: {breakdown['bed_score']})")
    print(f"     - ICU Utilization: {breakdown['icu_utilization']}% (Score: {breakdown['icu_score']})")
    print(f"     - ER Wait Time: {breakdown['er_wait_time']} min (Score: {breakdown['er_score']})")
    
    if result.get('resource_request'):
        print(f"\n   Resource Request Details:")
        print(f"     - Urgency: {result['resource_request']['urgency']}")
        print(f"     - Items: {len(result['resource_request']['requested_items'])}")
    
    return response.status_code == 200

def test_pharmacy_agent():
    """Test Pharmacy Agent demand classification"""
    print_section("5. PHARMACY AGENT - Demand Classification")
    
    test_data = {
        "medicine_stocks": {
            "dengue_medicine": 45,
            "paracetamol": 180,
            "antibiotics": 120,
            "iv_fluids": 60,
            "malaria_medicine": 30
        },
        "consumption_rates": {
            "dengue_medicine": 40,  # High consumption
            "paracetamol": 25,
            "antibiotics": 15,
            "iv_fluids": 10,
            "malaria_medicine": 5
        },
        "outbreak_alerts": ["dengue"]
    }
    
    response = requests.post(
        f"{ML_SERVICE_URL}/classify/pharmacy_demand",
        json=test_data
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    
    print(f"\n💊 PHARMACY DEMAND ANALYSIS:")
    print(f"   Inventory Health: {result['inventory_health']['status']} ({result['inventory_health']['score']})")
    print(f"   Medicines Needing Order: {result['medicines_needing_order']}")
    print(f"   Pre-emptive Orders: {len(result['preemptive_orders'])}")
    
    print(f"\n   Medicine Classifications:")
    for med in result['classifications']:
        icon = "🚨" if med['demand_level'] == 'SURGE' else "⚠️" if med['demand_level'] == 'HIGH' else "✅"
        print(f"     {icon} {med['medicine']}: {med['demand_level']} (Stock: {med['current_stock']}, Days left: {med['days_remaining']})")
    
    if result['preemptive_orders']:
        print(f"\n   Pre-emptive Orders Generated:")
        for order in result['preemptive_orders']:
            print(f"     📦 {order['medicine']}: {order['order_quantity']} units ({order['urgency']})")
    
    return response.status_code == 200

def test_supplier_agent():
    """Test Supplier Agent order prioritization"""
    print_section("6. SUPPLIER AGENT - Order Prioritization")
    
    test_data = {
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
                "medicine": "paracetamol",
                "quantity": 200,
                "urgency": "MEDIUM",
                "requester_strain": 45
            },
            {
                "order_id": "ORD003",
                "requester_id": "H2",
                "medicine": "dengue_medicine",
                "quantity": 100,
                "urgency": "HIGH",
                "requester_strain": 70
            }
        ],
        "inventory": {
            "oxygen": 80,
            "paracetamol": 500,
            "dengue_medicine": 200,
            "antibiotics": 150
        },
        "delivery_capacity": 4
    }
    
    response = requests.post(
        f"{ML_SERVICE_URL}/prioritize/orders",
        json=test_data
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    
    print(f"\n🚚 SUPPLIER ORDER PRIORITIZATION:")
    print(f"   Total Orders: {result['metrics']['total_orders']}")
    print(f"   Fulfilled: {result['metrics']['fulfilled_count']}")
    print(f"   Pending: {result['metrics']['pending_count']}")
    print(f"   Fulfillment Rate: {result['metrics']['fulfillment_rate']}%")
    print(f"   Vehicles Used: {result['metrics']['vehicles_used']}/{result['metrics']['vehicles_used'] + result['metrics']['vehicles_available']}")
    
    print(f"\n   Prioritized Orders (by Priority Score):")
    for order in result['prioritized_orders']:
        status_icon = "✅" if any(f['order_id'] == order['order_id'] for f in result['fulfilled_orders']) else "⏳"
        print(f"     {status_icon} {order['order_id']}: {order['medicine']} (Priority: {order['priority_score']})")
    
    return response.status_code == 200

def run_all_tests():
    """Run all agent tests"""
    print("\n" + "="*60)
    print("  HEALSYNC ML SERVICE - COMPREHENSIVE TEST")
    print("="*60)
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Target: {ML_SERVICE_URL}")
    print("="*60)
    
    results = {
        "Health Check": test_health_check(),
        "Lab Agent": test_lab_agent(),
        "City Agent": test_city_agent(),
        "Hospital Agent": test_hospital_agent(),
        "Pharmacy Agent": test_pharmacy_agent(),
        "Supplier Agent": test_supplier_agent()
    }
    
    print_section("TEST SUMMARY")
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {test_name}: {status}")
    
    all_passed = all(results.values())
    print(f"\n  Overall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    print("="*60 + "\n")
    
    return all_passed

if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to ML Service")
        print("   Make sure the service is running on http://localhost:8000")
        print("   Run: python main.py")
        exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        exit(1)
