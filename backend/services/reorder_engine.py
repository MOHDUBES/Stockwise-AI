"""Reorder engine: generates intelligent reorder recommendations."""

from __future__ import annotations
import math
from datetime import datetime
import os
from services.analytics import get_product_velocity, get_products_df
from services.data_store import get_products_store
from models.schemas import RiskLevel

# Try to configure Gemini
# Use dummy key if not present so local demo won't crash
API_KEY = os.getenv("GEMINI_API_KEY")
try:
    from google import genai
    if API_KEY:
        gemini_client = genai.Client(api_key=API_KEY)
        GEMINI_AVAILABLE = True
    else:
        gemini_client = None
        GEMINI_AVAILABLE = False
except (ModuleNotFoundError, ImportError):
    gemini_client = None
    GEMINI_AVAILABLE = False
    print("WARNING: google-genai package not found. Running in fallback mode.")


def _urgency_level(score: float) -> RiskLevel:
    if score >= 75:
        return RiskLevel.CRITICAL
    elif score >= 50:
        return RiskLevel.HIGH
    elif score >= 25:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def compute_reorder_recommendations() -> list[dict]:
    """
    Generate AI-powered reorder recommendations for all products.

    Algorithm:
    1. Calculate average daily sales velocity (last 30 days)
    2. Compute days-to-stockout
    3. Factor in lead time to determine urgency
    4. Compute economic order quantity (EOQ) adjusted recommendation
    5. Suggest optimal reorder price based on margin targets

    Returns list of ReorderRecommendation dicts sorted by urgency.
    """
    products = get_products_store()
    recommendations = []

    for pid, product in products.items():
        velocity = get_product_velocity(pid, days=30)  # avg units/day

        current_stock = float(product["current_stock"])
        reorder_point = float(product["reorder_point"])
        lead_time = int(product.get("lead_time_days", 2))
        cost_price = float(product["cost_price"])
        selling_price = float(product["selling_price"])

        # Days until stockout at current velocity
        if velocity > 0:
            days_to_stockout = current_stock / velocity
        else:
            days_to_stockout = None

        # Urgency score: 0-100
        score = 0.0
        reasoning_parts = []

        # Factor 1: Stock vs reorder point (max 40 pts)
        if current_stock == 0:
            score += 40
            reasoning_parts.append("❌ Out of stock — immediate reorder required")
        elif current_stock <= reorder_point:
            ratio = 1 - (current_stock / max(reorder_point, 1))
            score += ratio * 40
            reasoning_parts.append(
                f"⚠️ Stock ({current_stock:.0f}) below reorder point ({reorder_point:.0f})"
            )

        # Factor 2: Days to stockout vs lead time (max 35 pts)
        if days_to_stockout is not None:
            if days_to_stockout <= lead_time:
                score += 35
                reasoning_parts.append(
                    f"🚨 Will stock out in {days_to_stockout:.1f} days — lead time is {lead_time} days"
                )
            elif days_to_stockout <= lead_time * 1.5:
                score += 20
                reasoning_parts.append(
                    f"⚡ Only {days_to_stockout:.1f} days of stock remaining"
                )
            elif days_to_stockout <= 7:
                score += 10
                reasoning_parts.append(f"📉 Less than 1 week of stock")

        # Factor 3: High velocity (fast-moving items need priority) (max 25 pts)
        if velocity > 5:
            score += 25
            reasoning_parts.append(f"🔥 High velocity: {velocity:.1f} units/day")
        elif velocity > 2:
            score += 12

        score = min(score, 100)

        # EOQ-based recommended quantity
        # EOQ = sqrt(2 * demand * order_cost / holding_cost)
        annual_demand = velocity * 365
        order_cost = 150  # ₹150 per order (shipping/handling)
        holding_cost_pct = 0.20  # 20% annual holding cost
        holding_cost = cost_price * holding_cost_pct

        if annual_demand > 0 and holding_cost > 0:
            eoq = math.sqrt(2 * annual_demand * order_cost / holding_cost)
            # Round to nearest supplier MOQ (assume 10-unit lots)
            recommended_qty = max(
                product["reorder_qty"],
                round(eoq / 10) * 10,
            )
        else:
            recommended_qty = float(product["reorder_qty"])

        # Suggested price: maintain ≥20% margin
        target_margin = 0.20
        suggested_price = cost_price * (1 + target_margin)
        if selling_price > suggested_price:
            suggested_price = selling_price  # Keep existing price if already good

        reasoning = ". ".join(reasoning_parts) if reasoning_parts else (
            "✅ Stock levels are adequate. Consider reviewing in 7 days."
        )

        recommendations.append({
            "product_id": pid,
            "product_name": product["name"],
            "category": product["category"],
            "current_stock": current_stock,
            "reorder_point": reorder_point,
            "recommended_qty": round(recommended_qty),
            "urgency": _urgency_level(score).value,
            "urgency_score": round(score, 1),
            "suggested_price": round(suggested_price, 2),
            "reasoning": reasoning,
            "estimated_days_to_stockout": (
                round(days_to_stockout, 1) if days_to_stockout else None
            ),
            "avg_daily_sales": round(velocity, 2),
            "total_cost": round(recommended_qty * cost_price, 2),
        })

    # Sort by urgency score descending
    recommendations.sort(key=lambda x: x["urgency_score"], reverse=True)
    return recommendations


def generate_gemini_summary(recs: list[dict], user_name: str = "Shop Owner") -> dict:
    """
    Use Gemini API to generate a natural language summary of reorder recommendations
    for a non-technical shop owner.
    """
    if not recs:
        return {"summary": "You have no items that need reordering right now. Your stock is healthy!", "provider": "local"}
        
    urgent_recs = [r for r in recs if r["urgency"] in ("high", "critical")]
    
    if not GEMINI_AVAILABLE or not gemini_client:
        # Fallback if API key is not set
        if urgent_recs:
            top = urgent_recs[0]
            summary = (
                f"You have {len(urgent_recs)} items that need immediate attention. "
                f"Most urgently, please reorder {top['recommended_qty']} units of {top['product_name']}. "
                f"It is currently {top['reasoning']}."
            )
        else:
            summary = "Your stock levels look okay for now, but keep an eye on your low stock items."
            
        return {"summary": summary, "provider": "fallback"}
        
    # Construct the prompt for Gemini
    prompt = (
        f"You are an AI assistant for a local Kirana shop owner named {user_name}. "
        "Analyze the following urgent reorder recommendations and provide a friendly, 2-3 sentence summary. "
        "Highlight the most critical item to reorder immediately, how much to reorder, and briefly explain why (e.g., demand is rising, out of stock). "
        "Do NOT use markdown bold/italic formatting. Keep it conversational and encouraging.\n\n"
        "Urgent Items:\n"
    )
    for r in urgent_recs[:3]:  # Send top 3 to keep prompt small
        prompt += f"- {r['product_name']}: Needs {r['recommended_qty']} units. Reason: {r['reasoning']}\n"
        
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return {"summary": response.text.strip(), "provider": "gemini"}
    except Exception as e:
        return {"summary": f"Failed to generate AI summary: {str(e)}", "provider": "error"}
