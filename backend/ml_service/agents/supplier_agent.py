"""
Supplier Agent - Supply Chain Optimization

Implementation Mandate: Hybrid Logic
- Formula: Calculate a Priority Score for all incoming orders:
  Priority_Score = (Requester_Strain * 0.4) + (Medicine_Criticality * 0.3) + 
                   (Requested_Urgency * 0.3)
  
- Rule: Fulfill strictly by Priority Score (highest first) and log the action
"""

from typing import Dict, List, Optional
from datetime import datetime


class SupplierAgent:
    """Supplier Agent for supply chain management and order prioritization"""
    
    def __init__(self):
        self.URGENCY_WEIGHTS = {
            'URGENT': 100,
            'HIGH': 75,
            'MEDIUM': 50,
            'NORMAL': 25,
            'LOW': 10
        }
        
        self.MEDICINE_CRITICALITY = {
            # Life-saving medicines
            'oxygen': 100,
            'iv_fluids': 95,
            'antibiotics': 90,
            'covid_medicine': 90,
            'dengue_medicine': 85,
            'malaria_medicine': 85,
            'typhoid_medicine': 85,
            
            # Important medicines
            'antimalarial': 75,
            'antivirals': 75,
            'flu_medicine': 70,
            'paracetamol': 60,
            
            # General supplies
            'syringes': 50,
            'bandages': 40,
            'surgical_masks': 40,
            'gloves': 35,
            'default': 50  # For unspecified medicines
        }
    
    def prioritize_orders(
        self,
        orders: List[Dict],  # List of incoming orders
        inventory: Dict[str, int],  # Current warehouse inventory
        delivery_capacity: int = 4  # Number of available delivery vehicles
    ) -> Dict:
        """
        Prioritize and fulfill orders based on Priority Score
        
        Priority Score Formula:
        PS = (Requester_Strain * 0.4) + (Medicine_Criticality * 0.3) + (Urgency * 0.3)
        
        Orders are fulfilled strictly by highest priority first
        """
        
        prioritized_orders = []
        fulfilled_orders = []
        pending_orders = []
        
        # Calculate priority score for each order
        for order in orders:
            priority_score = self._calculate_priority_score(
                requester_strain=order.get('requester_strain', 50),
                medicine=order.get('medicine', 'default'),
                urgency=order.get('urgency', 'NORMAL'),
                quantity=order.get('quantity', 0)
            )
            
            order_with_priority = {
                **order,
                'priority_score': priority_score,
                'timestamp': order.get('timestamp', datetime.now().isoformat())
            }
            
            prioritized_orders.append(order_with_priority)
        
        # Sort by priority score (highest first)
        prioritized_orders.sort(key=lambda x: x['priority_score'], reverse=True)
        
        # Fulfill orders based on priority and inventory availability
        available_vehicles = delivery_capacity
        
        for order in prioritized_orders:
            medicine = order.get('medicine', 'default')
            quantity = order.get('quantity', 0)
            requester = order.get('requester_id', 'UNKNOWN')
            
            # Check inventory availability
            available_stock = inventory.get(medicine, 0)
            
            if available_stock >= quantity and available_vehicles > 0:
                # Can fulfill order
                fulfillment = {
                    **order,
                    'status': 'FULFILLED',
                    'allocated_quantity': quantity,
                    'fulfillment_time': datetime.now().isoformat(),
                    'estimated_delivery': '4-8 hours' if order.get('urgency') == 'URGENT' else '24 hours'
                }
                fulfilled_orders.append(fulfillment)
                
                # Update inventory and vehicle availability
                inventory[medicine] -= quantity
                available_vehicles -= 1
                
            elif available_stock >= quantity and available_vehicles == 0:
                # Have stock but no vehicles
                pending_orders.append({
                    **order,
                    'status': 'PENDING',
                    'reason': 'No delivery vehicles available',
                    'estimated_fulfillment': 'Next delivery cycle'
                })
                
            elif available_stock < quantity:
                # Insufficient stock - partial fulfillment
                if available_stock > 0 and available_vehicles > 0:
                    fulfillment = {
                        **order,
                        'status': 'PARTIAL',
                        'allocated_quantity': available_stock,
                        'requested_quantity': quantity,
                        'shortage': quantity - available_stock,
                        'fulfillment_time': datetime.now().isoformat()
                    }
                    fulfilled_orders.append(fulfillment)
                    inventory[medicine] = 0
                    available_vehicles -= 1
                else:
                    pending_orders.append({
                        **order,
                        'status': 'PENDING',
                        'reason': 'Insufficient inventory',
                        'available_stock': available_stock
                    })
        
        # Calculate metrics
        fulfillment_rate = (len(fulfilled_orders) / len(orders) * 100) if orders else 0
        
        return {
            'prioritized_orders': prioritized_orders,
            'fulfilled_orders': fulfilled_orders,
            'pending_orders': pending_orders,
            'metrics': {
                'total_orders': len(orders),
                'fulfilled_count': len(fulfilled_orders),
                'pending_count': len(pending_orders),
                'fulfillment_rate': round(fulfillment_rate, 1),
                'vehicles_used': delivery_capacity - available_vehicles,
                'vehicles_available': available_vehicles
            },
            'inventory_status': self._get_inventory_status(inventory),
            'recommendations': self._get_recommendations(fulfilled_orders, pending_orders, inventory)
        }
    
    def _calculate_priority_score(
        self,
        requester_strain: float,  # 0-100 (Hospital HSI or Pharmacy urgency)
        medicine: str,
        urgency: str,
        quantity: int
    ) -> float:
        """
        Calculate Priority Score using weighted formula
        
        PS = (Requester_Strain * 0.4) + (Medicine_Criticality * 0.3) + (Urgency * 0.3)
        """
        
        # Normalize requester strain (0-100)
        strain_score = min(100, max(0, requester_strain))
        
        # Get medicine criticality (0-100)
        criticality_score = self.MEDICINE_CRITICALITY.get(
            medicine.lower(), 
            self.MEDICINE_CRITICALITY['default']
        )
        
        # Get urgency weight (0-100)
        urgency_score = self.URGENCY_WEIGHTS.get(urgency.upper(), 25)
        
        # Calculate weighted priority score
        priority_score = (
            strain_score * 0.4 +
            criticality_score * 0.3 +
            urgency_score * 0.3
        )
        
        return round(priority_score, 2)
    
    def _get_inventory_status(self, inventory: Dict[str, int]) -> Dict:
        """Get current inventory health status"""
        if not inventory:
            return {"status": "EMPTY", "critical_items": []}
        
        total_items = len(inventory)
        low_stock = [item for item, qty in inventory.items() if qty < 100]
        critical_stock = [item for item, qty in inventory.items() if qty < 50]
        
        if len(critical_stock) > total_items * 0.3:
            status = "CRITICAL"
        elif len(low_stock) > total_items * 0.5:
            status = "LOW"
        elif len(low_stock) > total_items * 0.3:
            status = "MODERATE"
        else:
            status = "HEALTHY"
        
        return {
            "status": status,
            "total_items": total_items,
            "low_stock_count": len(low_stock),
            "critical_stock_count": len(critical_stock),
            "critical_items": critical_stock[:5]  # Top 5 critical items
        }
    
    def _get_recommendations(
        self, 
        fulfilled: List[Dict], 
        pending: List[Dict],
        inventory: Dict[str, int]
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        if fulfilled:
            urgent_fulfilled = [o for o in fulfilled if o.get('urgency') == 'URGENT']
            if urgent_fulfilled:
                recommendations.append(f"✅ {len(urgent_fulfilled)} URGENT orders fulfilled immediately")
            recommendations.append(f"📦 Total {len(fulfilled)} orders dispatched")
        
        if pending:
            recommendations.append(f"⏳ {len(pending)} orders pending - requires attention")
            
            no_vehicle = [o for o in pending if 'vehicle' in o.get('reason', '').lower()]
            if no_vehicle:
                recommendations.append(f"🚚 {len(no_vehicle)} orders waiting for delivery vehicles")
            
            no_stock = [o for o in pending if 'inventory' in o.get('reason', '').lower()]
            if no_stock:
                recommendations.append(f"📦 {len(no_stock)} orders pending due to low stock - restock needed")
        
        # Inventory warnings
        critical_items = [item for item, qty in inventory.items() if qty < 50]
        if critical_items:
            recommendations.append(f"⚠️ RESTOCK ALERT: {len(critical_items)} items critically low: {', '.join(critical_items[:3])}")
        
        if not recommendations:
            recommendations.append("✅ All operations normal. Inventory levels healthy.")
        
        return recommendations
