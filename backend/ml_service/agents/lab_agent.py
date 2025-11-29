"""
Lab Agent - Disease Outbreak Prediction using Linear Regression

Implementation Mandate: Hybrid Logic
- Formula: Use simple Linear Regression model for formula:
  Growth rate m = (Q_current - Q_baseline) / time
  Predicted cases: Q_future = Q_current + m * t
  
- Rule: If Q_future exceeds 2x baseline AND positive cases spike, 
  trigger "OUTBREAK DETECTED"
"""

from typing import Dict, List
import requests
from datetime import datetime


class LabAgent:
    """Lab Agent for early disease outbreak detection"""
    
    def __init__(self):
        self.diseases = ['dengue', 'malaria', 'typhoid', 'influenza', 'covid']
        # Time horizon for prediction (24 hours)
        self.prediction_horizon = 24
        
    def predict_outbreak(
        self, 
        current_tests: Dict[str, int],
        baseline_tests: Dict[str, int],
        positive_tests: Dict[str, int]
    ) -> List[dict]:
        """
        Predict disease outbreaks using Linear Regression
        
        Args:
            current_tests: Current test counts per disease
            baseline_tests: Historical baseline test counts
            positive_tests: Current positive test counts
            
        Returns:
            List of predictions for each disease
        """
        predictions = []
        
        for disease in self.diseases:
            Q_current = current_tests.get(disease, 0)
            Q_baseline = baseline_tests.get(disease, 1)  # Avoid division by zero
            positive_count = positive_tests.get(disease, 0)
            
            # Skip if no current tests
            if Q_current == 0:
                continue
            
            # Calculate growth rate (m)
            # Assuming baseline was from t=0 and current is at t=1 day
            time_elapsed = 1  # 1 day
            growth_rate = (Q_current - Q_baseline) / time_elapsed
            
            # Predict future test count in 24 hours
            # Q_future = Q_current + m * t
            Q_future = Q_current + (growth_rate * 1)  # 1 day ahead
            Q_future = max(0, int(Q_future))  # Ensure non-negative
            
            # Calculate risk metrics
            growth_percentage = ((Q_current - Q_baseline) / Q_baseline * 100) if Q_baseline > 0 else 0
            positive_rate = (positive_count / Q_current * 100) if Q_current > 0 else 0
            
            # Determine risk level
            risk_level = "LOW"
            trigger_outbreak = False
            recommendation = "Continue monitoring"
            
            # Rule-Based Logic: Outbreak Detection
            if Q_future >= (2 * Q_baseline) and positive_rate > 15:
                # Critical: 2x baseline + high positive rate
                risk_level = "HIGH"
                trigger_outbreak = True
                recommendation = "⚠️ OUTBREAK DETECTED! Alert hospitals & pharmacies immediately"
            elif Q_future >= (1.5 * Q_baseline) and positive_rate > 10:
                # Elevated risk
                risk_level = "ELEVATED"
                recommendation = "🔍 Outbreak risk detected. Prepare response measures"
            elif growth_rate > 0 and positive_rate > 8:
                # Low but increasing
                risk_level = "LOW"
                recommendation = "📊 Increasing trend observed. Monitor closely"
            
            predictions.append({
                "disease": disease,
                "risk_level": risk_level,
                "growth_rate": round(growth_rate, 2),
                "predicted_cases_24h": Q_future,
                "current_tests": Q_current,
                "baseline_tests": Q_baseline,
                "positive_rate": round(positive_rate, 1),
                "growth_percentage": round(growth_percentage, 1),
                "recommendation": recommendation,
                "trigger_outbreak": trigger_outbreak
            })
        
        return predictions
    
    def simulate_with_gemini_api(self, test_data: Dict) -> Dict:
        """
        Optional: Call Gemini API for advisory (simulation only)
        This simulates the Gemini API call mentioned in the screenshot
        """
        # In production, this would call actual Gemini API
        # For now, return a simulated response
        return {
            "advisory": "Based on test patterns, recommend enhanced surveillance",
            "confidence": 0.85
        }
