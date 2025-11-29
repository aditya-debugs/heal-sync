"""
City Agent - Citywide Crisis Prediction

Implementation Mandate: Hybrid Logic
- Formula: Calculate Crisis Prediction Score (CPS) and use a rule to determine severity
  CPS Formula: Weighted sum of risk factors
  
- Rule: If CPS is ELEVATED, trigger simulated Gemini API call for
  reasonable Advisory text. Must display Advisory in city dashboard
"""

from typing import Dict, Optional
import requests


class CityAgent:
    """City Agent for citywide health crisis prediction"""
    
    def __init__(self):
        self.GEMINI_API_ENABLED = False  # Set to True when using real API
        self.GEMINI_API_URL = "https://api.gemini.com/v1/advisory"  # Placeholder
        
    def predict_crisis(
        self,
        disease_stats: Dict[str, int],  # Active cases per disease
        hospital_capacity: Dict[str, any],  # Bed availability, utilization
        medicine_stock: Dict[str, int],  # Stock levels
        zone_risks: Dict[str, str]  # Risk level per zone
    ) -> Dict:
        """
        Predict citywide crisis using Crisis Prediction Score (CPS)
        
        CPS Formula:
        CPS = (Disease_Weight * Disease_Score) + 
              (Capacity_Weight * Capacity_Score) + 
              (Medicine_Weight * Medicine_Score) +
              (Zone_Weight * Zone_Score)
        
        Weights: Disease=40%, Capacity=30%, Medicine=20%, Zone=10%
        """
        
        # Calculate individual scores (0-100)
        disease_score = self._calculate_disease_score(disease_stats)
        capacity_score = self._calculate_capacity_score(hospital_capacity)
        medicine_score = self._calculate_medicine_score(medicine_stock)
        zone_score = self._calculate_zone_score(zone_risks)
        
        # Calculate weighted CPS
        cps = (
            disease_score * 0.40 +
            capacity_score * 0.30 +
            medicine_score * 0.20 +
            zone_score * 0.10
        )
        
        # Determine severity level
        severity = "LOW"
        advisory = "City health status is stable. Continue monitoring."
        trigger_alert = False
        
        if cps >= 70:
            severity = "CRITICAL"
            trigger_alert = True
            advisory = self._get_gemini_advisory(cps, disease_stats, "CRITICAL")
        elif cps >= 50:
            severity = "ELEVATED"
            trigger_alert = True
            advisory = self._get_gemini_advisory(cps, disease_stats, "ELEVATED")
        elif cps >= 30:
            severity = "MEDIUM"
            advisory = "Moderate risk detected. Prepare response measures."
        
        return {
            "severity": severity,
            "cps_score": round(cps, 2),
            "trigger_alert": trigger_alert,
            "advisory": advisory,
            "breakdown": {
                "disease_score": round(disease_score, 1),
                "capacity_score": round(capacity_score, 1),
                "medicine_score": round(medicine_score, 1),
                "zone_score": round(zone_score, 1)
            },
            "recommendations": self._get_recommendations(severity, cps)
        }
    
    def _calculate_disease_score(self, disease_stats: Dict[str, int]) -> float:
        """Calculate disease risk score (0-100)"""
        if not disease_stats:
            return 0
        
        total_cases = sum(disease_stats.values())
        
        # Thresholds
        if total_cases >= 200:
            return 100
        elif total_cases >= 150:
            return 80
        elif total_cases >= 100:
            return 60
        elif total_cases >= 50:
            return 40
        elif total_cases >= 20:
            return 20
        else:
            return 10
    
    def _calculate_capacity_score(self, hospital_capacity: Dict) -> float:
        """Calculate hospital capacity stress score (0-100)"""
        utilization = hospital_capacity.get('utilization_percent', 0)
        
        if utilization >= 90:
            return 100
        elif utilization >= 80:
            return 80
        elif utilization >= 70:
            return 60
        elif utilization >= 60:
            return 40
        elif utilization >= 50:
            return 20
        else:
            return 10
    
    def _calculate_medicine_score(self, medicine_stock: Dict[str, int]) -> float:
        """Calculate medicine shortage risk score (0-100)"""
        if not medicine_stock:
            return 0
        
        # Count medicines below threshold
        low_stock_count = sum(1 for stock in medicine_stock.values() if stock < 100)
        critical_stock_count = sum(1 for stock in medicine_stock.values() if stock < 50)
        
        total_medicines = len(medicine_stock)
        
        shortage_rate = (low_stock_count / total_medicines * 100) if total_medicines > 0 else 0
        critical_rate = (critical_stock_count / total_medicines * 100) if total_medicines > 0 else 0
        
        # Critical stock has more weight
        score = (shortage_rate * 0.6) + (critical_rate * 0.4)
        
        return min(100, score)
    
    def _calculate_zone_score(self, zone_risks: Dict[str, str]) -> float:
        """Calculate zone risk score (0-100)"""
        if not zone_risks:
            return 0
        
        risk_values = {
            'LOW': 10,
            'MEDIUM': 40,
            'ELEVATED': 70,
            'HIGH': 90,
            'CRITICAL': 100
        }
        
        total_risk = sum(risk_values.get(risk, 0) for risk in zone_risks.values())
        avg_risk = total_risk / len(zone_risks) if zone_risks else 0
        
        return avg_risk
    
    def _get_gemini_advisory(self, cps: float, disease_stats: Dict, severity: str) -> str:
        """
        Get advisory from Gemini API (simulated)
        In production, this would call actual Gemini API
        """
        if self.GEMINI_API_ENABLED:
            try:
                # Actual API call would go here
                response = requests.post(
                    self.GEMINI_API_URL,
                    json={
                        "cps_score": cps,
                        "disease_stats": disease_stats,
                        "severity": severity
                    },
                    timeout=5
                )
                return response.json().get('advisory', self._generate_advisory(severity))
            except:
                return self._generate_advisory(severity)
        else:
            # Simulated advisory
            return self._generate_advisory(severity)
    
    def _generate_advisory(self, severity: str) -> str:
        """Generate advisory text based on severity"""
        advisories = {
            "CRITICAL": "🚨 CRITICAL CITY HEALTH CRISIS: Immediate action required! Activate emergency response protocols. Deploy additional medical resources. Coordinate with all healthcare facilities for capacity expansion. Consider requesting state/national assistance.",
            "ELEVATED": "⚠️ ELEVATED RISK: Citywide health strain detected. Hospitals should prepare for increased patient load. Ensure adequate medicine stocks. Monitor disease trends closely. Activate coordination between facilities.",
            "MEDIUM": "📊 MODERATE RISK: Some health indicators show concerning trends. Increase surveillance and monitoring. Ensure resource availability. Prepare contingency plans.",
            "LOW": "✅ STABLE: City health status is within normal parameters. Continue routine monitoring and preparedness activities."
        }
        
        return advisories.get(severity, "No advisory available")
    
    def _get_recommendations(self, severity: str, cps: float) -> list:
        """Get actionable recommendations based on severity"""
        if severity == "CRITICAL":
            return [
                "Activate emergency response coordination center",
                "Deploy mobile medical units to affected zones",
                "Request additional medical supplies from state stockpile",
                "Issue public health advisory",
                "Prepare temporary medical facilities"
            ]
        elif severity == "ELEVATED":
            return [
                "Increase hospital bed capacity",
                "Accelerate medicine procurement",
                "Enhance inter-facility communication",
                "Prepare isolation wards",
                "Alert public health officials"
            ]
        elif severity == "MEDIUM":
            return [
                "Monitor trends closely",
                "Ensure adequate staff availability",
                "Review emergency protocols",
                "Stock essential medicines"
            ]
        else:
            return [
                "Continue routine monitoring",
                "Maintain standard preparedness"
            ]
