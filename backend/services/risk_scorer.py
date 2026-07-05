"""Risk scoring service: assesses per-product risk across multiple dimensions."""

from __future__ import annotations
from datetime import datetime, timedelta
from services.analytics import get_sales_df, get_product_velocity
from services.data_store import get_products_store
from models.schemas import RiskLevel


def _risk_level(score: float) -> RiskLevel:
    if score >= 75:
        return RiskLevel.CRITICAL
    elif score >= 50:
        return RiskLevel.HIGH
    elif score >= 25:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def compute_risk_scores() -> list[dict]:
    """
    Compute a multi-dimensional risk score for each product.

    Dimensions:
    - Velocity Risk: Is demand dropping sharply?
    - Stockout Risk: Current stock relative to safety stock
    - Spoilage Risk: Perishables approaching expiry
    - Price Risk: Margin compression

    Returns list of RiskScore dicts sorted by overall score descending.
    """
    products = get_products_store()
    sales_df = get_sales_df()
    scores = []

    now = datetime.utcnow()

    for pid, product in products.items():
        current_stock = float(product["current_stock"])
        reorder_point = float(product["reorder_point"])
        cost_price = float(product["cost_price"])
        selling_price = float(product["selling_price"])
        shelf_life = product.get("shelf_life_days")

        # --- Velocity Risk (0-100) ---
        velocity_30 = get_product_velocity(pid, days=30)
        velocity_7 = get_product_velocity(pid, days=7)

        if velocity_30 == 0:
            velocity_risk = 60.0  # Dead stock risk
        elif velocity_7 < velocity_30 * 0.5:
            velocity_risk = 80.0  # Demand dropped >50%
        elif velocity_7 < velocity_30 * 0.8:
            velocity_risk = 40.0  # Demand slightly down
        else:
            velocity_risk = 10.0  # Demand stable/growing

        # --- Stockout Risk (0-100) ---
        if current_stock == 0:
            stockout_risk = 100.0
        elif current_stock <= reorder_point * 0.5:
            stockout_risk = 85.0
        elif current_stock <= reorder_point:
            stockout_risk = 60.0
        elif current_stock <= reorder_point * 1.5:
            stockout_risk = 30.0
        else:
            stockout_risk = 5.0

        # --- Spoilage Risk (0-100) ---
        if shelf_life is None:
            spoilage_risk = 5.0  # Non-perishable
        else:
            # Estimate stock age from last reorder (proxy: assume avg stock age = shelf_life/2)
            days_in_stock_estimate = shelf_life * 0.6  # Conservative
            spoilage_pct = min(days_in_stock_estimate / shelf_life, 1.0)
            spoilage_risk = spoilage_pct * 100

        # --- Price Risk (0-100) ---
        if cost_price == 0:
            price_risk = 0.0
        else:
            margin_pct = (selling_price - cost_price) / cost_price * 100
            if margin_pct < 5:
                price_risk = 90.0
            elif margin_pct < 10:
                price_risk = 60.0
            elif margin_pct < 15:
                price_risk = 30.0
            else:
                price_risk = 5.0

        # Overall weighted score
        overall = (
            velocity_risk * 0.25
            + stockout_risk * 0.40
            + spoilage_risk * 0.20
            + price_risk * 0.15
        )
        overall = min(overall, 100.0)

        # Recommendation
        risk_level = _risk_level(overall)
        if risk_level == RiskLevel.CRITICAL:
            recommendation = "Immediate action needed: place urgent reorder now."
        elif risk_level == RiskLevel.HIGH:
            recommendation = "High risk: reorder within 24 hours before stockout."
        elif risk_level == RiskLevel.MEDIUM:
            recommendation = "Monitor closely: consider reordering this week."
        else:
            recommendation = "Stock levels healthy. Review again next week."

        scores.append({
            "product_id": pid,
            "product_name": product["name"],
            "category": product["category"],
            "overall_score": round(overall, 1),
            "risk_level": risk_level.value,
            "velocity_risk": round(velocity_risk, 1),
            "stockout_risk": round(stockout_risk, 1),
            "spoilage_risk": round(spoilage_risk, 1),
            "price_risk": round(price_risk, 1),
            "recommendation": recommendation,
        })

    scores.sort(key=lambda x: x["overall_score"], reverse=True)
    return scores
