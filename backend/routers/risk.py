"""Risk scoring router."""
from fastapi import APIRouter, HTTPException
from services.risk_scorer import compute_risk_scores
from services.data_store import get_products_store

router = APIRouter()


@router.get("", response_model=list)
async def get_all_risk_scores():
    """Get risk scores for all products, sorted by overall risk descending."""
    return compute_risk_scores()


@router.get("/{product_id}", response_model=dict)
async def get_product_risk(product_id: str):
    """Get risk score for a specific product."""
    products = get_products_store()
    if product_id not in products:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    scores = compute_risk_scores()
    for s in scores:
        if s["product_id"] == product_id:
            return s
    raise HTTPException(status_code=404, detail="Risk score not found")
