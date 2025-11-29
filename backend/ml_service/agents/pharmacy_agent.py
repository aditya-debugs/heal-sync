"""
Pharmacy Agent - Inventory Management

Implementation Mandate: Hybrid Logic
- Formula: Use a Classification Rule-Set (Low, Medium, High, Surge) for each
  medicine's demand level. If demand is "Surge", place a pre-emptive order
  to the Supplier Agent
"""

from typing import Dict, List, Optional


class PharmacyAgent:
    """Pharmacy Agent for medicine inventory optimization"""
    
    def __init__(self):
        self.DEMAND_THRESHOLDS = {
            'SURGE': 0.80,      # 80%+ consumption rate
            'HIGH': 0.60,       # 60-79% consumption rate
            'MEDIUM': 0.40,     # 40-59% consumption rate
            'LOW': 0.0          # 0-39% consumption rate
        }
        
        self.REORDER_POINTS = {
            'SURGE': 200,       # Reorder when below 200 units
            'HIGH': 150,        # Reorder when below 150 units
            'MEDIUM': 100,      # Reorder when below 100 units
            'LOW': 50           # Reorder when below 50 units
        }
    
    def classify_medicine_demand(
        self,
        medicine_stocks: Dict[str, int],  # Current stock levels
        consumption_rates: Dict[str, int],  # Daily consumption
        outbreak_alerts: List[str] = None  # Active disease outbreaks
    ) -> Dict:
        """
        Classify demand level for each medicine using Rule-Set
        
        Classification Rules:
        1. Calculate consumption rate = daily_consumption / current_stock
        2. Apply outbreak multiplier if disease outbreak detected
        3. Classify: SURGE (>80%), HIGH (60-80%), MEDIUM (40-60%), LOW (<40%)
        4. Generate pre-emptive orders for SURGE demand
        """
        
        outbreak_alerts = outbreak_alerts or []
        classifications = []
        preemptive_orders = []
        
        # Medicine-to-disease mapping for outbreak adjustment
        disease_medicine_map = {
            'dengue': ['dengue_medicine', 'paracetamol', 'iv_fluids'],
            'malaria': ['malaria_medicine', 'antimalarial', 'iv_fluids'],
            'covid': ['covid_medicine', 'oxygen', 'antibiotics', 'paracetamol'],
            'typhoid': ['typhoid_medicine', 'antibiotics', 'iv_fluids'],
            'influenza': ['flu_medicine', 'antivirals', 'paracetamol']
        }
        
        for medicine, stock in medicine_stocks.items():
            consumption = consumption_rates.get(medicine, 0)
            
            # Calculate base consumption rate
            if stock > 0:
                consumption_rate = consumption / stock
            else:
                consumption_rate = 1.0  # Out of stock = max urgency
            
            # Apply outbreak multiplier
            outbreak_multiplier = 1.0
            for outbreak in outbreak_alerts:
                if medicine in disease_medicine_map.get(outbreak.lower(), []):
                    outbreak_multiplier = 2.0  # 2x demand during outbreak
                    break
            
            adjusted_rate = min(1.0, consumption_rate * outbreak_multiplier)
            
            # Classify demand level
            demand_level = self._classify_demand(adjusted_rate)
            
            # Calculate days remaining
            days_remaining = (stock / consumption) if consumption > 0 else 999
            
            # Determine if order needed
            reorder_point = self.REORDER_POINTS[demand_level]
            needs_order = stock < reorder_point
            
            classification = {
                "medicine": medicine,
                "current_stock": stock,
                "daily_consumption": consumption,
                "consumption_rate": round(adjusted_rate, 3),
                "demand_level": demand_level,
                "days_remaining": round(days_remaining, 1),
                "reorder_point": reorder_point,
                "needs_order": needs_order,
                "outbreak_affected": outbreak_multiplier > 1.0
            }
            
            classifications.append(classification)
            
            # Generate pre-emptive order for SURGE demand
            if demand_level == "SURGE":
                order = self._generate_order(
                    medicine, 
                    stock, 
                    consumption, 
                    demand_level,
                    outbreak_multiplier > 1.0
                )
                preemptive_orders.append(order)
        
        # Calculate overall inventory health
        inventory_health = self._calculate_inventory_health(classifications)
        
        return {
            "classifications": classifications,
            "preemptive_orders": preemptive_orders,
            "inventory_health": inventory_health,
            "critical_medicines": [c["medicine"] for c in classifications if c["demand_level"] in ["SURGE", "HIGH"]],
            "total_medicines": len(classifications),
            "medicines_needing_order": len([c for c in classifications if c["needs_order"]]),
            "recommendations": self._get_recommendations(classifications, preemptive_orders)
        }
    
    def _classify_demand(self, consumption_rate: float) -> str:
        """Classify demand level based on consumption rate"""
        if consumption_rate >= self.DEMAND_THRESHOLDS['SURGE']:
            return "SURGE"
        elif consumption_rate >= self.DEMAND_THRESHOLDS['HIGH']:
            return "HIGH"
        elif consumption_rate >= self.DEMAND_THRESHOLDS['MEDIUM']:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _generate_order(
        self, 
        medicine: str, 
        current_stock: int,
        daily_consumption: int,
        demand_level: str,
        outbreak_active: bool
    ) -> Dict:
        """Generate pre-emptive order for supplier"""
        
        # Calculate order quantity (7-14 days supply)
        days_supply = 14 if outbreak_active else 10
        order_quantity = daily_consumption * days_supply
        
        # Minimum order quantity
        order_quantity = max(order_quantity, 100)
        
        urgency = "URGENT" if demand_level == "SURGE" else "HIGH"
        
        return {
            "medicine": medicine,
            "order_quantity": order_quantity,
            "urgency": urgency,
            "reason": f"Pre-emptive order: {demand_level} demand detected",
            "current_stock": current_stock,
            "daily_consumption": daily_consumption,
            "outbreak_related": outbreak_active,
            "estimated_stockout_days": round(current_stock / daily_consumption, 1) if daily_consumption > 0 else 999
        }
    
    def _calculate_inventory_health(self, classifications: List[Dict]) -> Dict:
        """Calculate overall inventory health metrics"""
        if not classifications:
            return {"status": "UNKNOWN", "score": 0}
        
        total = len(classifications)
        surge_count = sum(1 for c in classifications if c["demand_level"] == "SURGE")
        high_count = sum(1 for c in classifications if c["demand_level"] == "HIGH")
        low_stock_count = sum(1 for c in classifications if c["days_remaining"] < 7)
        
        # Calculate health score (0-100)
        surge_penalty = (surge_count / total) * 50
        high_penalty = (high_count / total) * 30
        low_stock_penalty = (low_stock_count / total) * 20
        
        health_score = 100 - surge_penalty - high_penalty - low_stock_penalty
        
        # Determine status
        if health_score >= 80:
            status = "EXCELLENT"
        elif health_score >= 60:
            status = "GOOD"
        elif health_score >= 40:
            status = "FAIR"
        elif health_score >= 20:
            status = "POOR"
        else:
            status = "CRITICAL"
        
        return {
            "status": status,
            "score": round(health_score, 1),
            "surge_items": surge_count,
            "high_demand_items": high_count,
            "low_stock_items": low_stock_count
        }
    
    def _get_recommendations(self, classifications: List[Dict], orders: List[Dict]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        surge_items = [c["medicine"] for c in classifications if c["demand_level"] == "SURGE"]
        if surge_items:
            recommendations.append(f"🚨 SURGE DEMAND: Immediate orders placed for {len(surge_items)} medicines: {', '.join(surge_items[:3])}")
        
        critical_stock = [c["medicine"] for c in classifications if c["days_remaining"] < 3]
        if critical_stock:
            recommendations.append(f"⚠️ CRITICAL: {len(critical_stock)} medicines have <3 days stock remaining")
        
        if orders:
            recommendations.append(f"📦 {len(orders)} pre-emptive orders generated for supplier")
        
        outbreak_affected = [c["medicine"] for c in classifications if c["outbreak_affected"]]
        if outbreak_affected:
            recommendations.append(f"🦠 {len(outbreak_affected)} medicines affected by outbreak alerts")
        
        if not recommendations:
            recommendations.append("✅ Inventory levels are healthy. Continue monitoring.")
        
        return recommendations
