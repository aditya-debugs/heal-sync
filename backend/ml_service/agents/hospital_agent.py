"""
Hospital Agent - Capacity Management Prediction

Implementation Mandate: Hybrid Logic
- Formula: Calculate Hospital Strain Index (HSI)
  HSI = (Bed Utilization * 0.4) + (ICU Risk * 0.3) + (ER Wait * 0.3)
  
- Rule: If HSI is ELEVATED, autonomously send a resource request to the Supplier Agent
"""

from typing import Dict, Optional


class HospitalAgent:
    """Hospital Agent for capacity management and strain prediction"""
    
    def __init__(self):
        self.HSI_THRESHOLDS = {
            'CRITICAL': 80,
            'HIGH': 65,
            'ELEVATED': 50,
            'MEDIUM': 35,
            'LOW': 0
        }
    
    def calculate_hospital_strain(
        self,
        total_beds: int,
        available_beds: int,
        icu_total: int,
        icu_available: int,
        er_wait_time: int,  # in minutes
        incoming_patients: int = 0
    ) -> Dict:
        """
        Calculate Hospital Strain Index (HSI)
        
        HSI Formula (Utility Formula):
        HSI = (Bed_Utilization_Score * 0.4) + 
              (ICU_Risk_Score * 0.3) + 
              (ER_Wait_Score * 0.3)
        
        Returns HSI score (0-100) and strain level
        """
        
        # Calculate bed utilization score (0-100)
        bed_utilization = ((total_beds - available_beds) / total_beds * 100) if total_beds > 0 else 0
        bed_score = self._score_utilization(bed_utilization)
        
        # Calculate ICU risk score (0-100)
        icu_utilization = ((icu_total - icu_available) / icu_total * 100) if icu_total > 0 else 0
        icu_score = self._score_utilization(icu_utilization)
        
        # Calculate ER wait time score (0-100)
        er_score = self._score_wait_time(er_wait_time)
        
        # Calculate weighted HSI
        hsi = (bed_score * 0.4) + (icu_score * 0.3) + (er_score * 0.3)
        
        # Determine strain level
        strain_level = self._determine_strain_level(hsi)
        
        # Determine if resource request should be sent
        trigger_resource_request = hsi >= self.HSI_THRESHOLDS['ELEVATED']
        
        # Calculate predicted capacity in 24 hours
        predicted_capacity = self._predict_capacity(
            available_beds, 
            bed_utilization,
            incoming_patients
        )
        
        return {
            "hsi_score": round(hsi, 2),
            "strain_level": strain_level,
            "trigger_resource_request": trigger_resource_request,
            "breakdown": {
                "bed_utilization": round(bed_utilization, 1),
                "bed_score": round(bed_score, 1),
                "icu_utilization": round(icu_utilization, 1),
                "icu_score": round(icu_score, 1),
                "er_wait_time": er_wait_time,
                "er_score": round(er_score, 1)
            },
            "capacity_status": {
                "available_beds": available_beds,
                "total_beds": total_beds,
                "icu_available": icu_available,
                "icu_total": icu_total,
                "predicted_available_24h": predicted_capacity
            },
            "recommendations": self._get_recommendations(strain_level, hsi),
            "resource_request": self._generate_resource_request(strain_level) if trigger_resource_request else None
        }
    
    def _score_utilization(self, utilization: float) -> float:
        """Convert utilization percentage to risk score (0-100)"""
        if utilization >= 95:
            return 100
        elif utilization >= 90:
            return 90
        elif utilization >= 85:
            return 80
        elif utilization >= 75:
            return 65
        elif utilization >= 65:
            return 50
        elif utilization >= 50:
            return 35
        else:
            return utilization * 0.6  # Linear scaling below 50%
    
    def _score_wait_time(self, wait_minutes: int) -> float:
        """Convert ER wait time to risk score (0-100)"""
        if wait_minutes >= 180:  # 3+ hours
            return 100
        elif wait_minutes >= 120:  # 2+ hours
            return 85
        elif wait_minutes >= 90:  # 1.5+ hours
            return 70
        elif wait_minutes >= 60:  # 1+ hour
            return 55
        elif wait_minutes >= 45:
            return 40
        elif wait_minutes >= 30:
            return 25
        else:
            return wait_minutes * 0.5  # Linear scaling below 30 min
    
    def _determine_strain_level(self, hsi: float) -> str:
        """Determine strain level based on HSI score"""
        if hsi >= self.HSI_THRESHOLDS['CRITICAL']:
            return "CRITICAL"
        elif hsi >= self.HSI_THRESHOLDS['HIGH']:
            return "HIGH"
        elif hsi >= self.HSI_THRESHOLDS['ELEVATED']:
            return "ELEVATED"
        elif hsi >= self.HSI_THRESHOLDS['MEDIUM']:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _predict_capacity(
        self, 
        current_available: int,
        utilization: float,
        incoming: int
    ) -> int:
        """Predict available beds in 24 hours"""
        # Simple prediction: current - incoming + estimated discharges
        estimated_discharges = int(current_available * 0.15)  # 15% discharge rate
        predicted = current_available - incoming + estimated_discharges
        return max(0, predicted)
    
    def _get_recommendations(self, strain_level: str, hsi: float) -> list:
        """Get actionable recommendations based on strain level"""
        if strain_level == "CRITICAL":
            return [
                "🚨 EMERGENCY: Activate surge capacity protocols",
                "Contact other hospitals for patient transfers",
                "Deploy additional staff immediately",
                "Convert non-critical wards to patient beds",
                "Request emergency medical supplies",
                "Defer non-urgent procedures"
            ]
        elif strain_level == "HIGH":
            return [
                "⚠️ HIGH STRAIN: Prepare surge capacity",
                "Ensure adequate staffing for next 24-48 hours",
                "Stock essential medicines and supplies",
                "Review discharge plans to free beds",
                "Alert management and staff"
            ]
        elif strain_level == "ELEVATED":
            return [
                "📊 ELEVATED: Monitor capacity closely",
                "Reserve isolation beds if outbreak suspected",
                "Ensure supply chain continuity",
                "Prepare contingency staffing plans",
                "Review bed allocation efficiency"
            ]
        elif strain_level == "MEDIUM":
            return [
                "Monitor admission trends",
                "Ensure adequate supplies",
                "Maintain standard protocols"
            ]
        else:
            return [
                "Capacity is adequate",
                "Continue normal operations"
            ]
    
    def _generate_resource_request(self, strain_level: str) -> Dict:
        """Generate resource request for Supplier Agent"""
        urgency_map = {
            "CRITICAL": "URGENT",
            "HIGH": "HIGH",
            "ELEVATED": "MEDIUM"
        }
        
        return {
            "urgency": urgency_map.get(strain_level, "NORMAL"),
            "requested_items": [
                {"item": "general_beds", "quantity": 20 if strain_level == "CRITICAL" else 10},
                {"item": "icu_equipment", "quantity": 5 if strain_level == "CRITICAL" else 3},
                {"item": "emergency_medicines", "quantity": "stock_check"}
            ],
            "reason": f"Hospital strain level: {strain_level}",
            "delivery_timeframe": "4-8 hours" if strain_level == "CRITICAL" else "24 hours"
        }
