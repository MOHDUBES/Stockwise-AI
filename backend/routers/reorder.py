"""Reorder recommendations router."""
from fastapi import APIRouter
from services.reorder_engine import compute_reorder_recommendations, generate_gemini_summary

router = APIRouter()


@router.get("", response_model=list)
async def get_reorder_recommendations():
    """
    Get AI-generated reorder recommendations for all products.
    Sorted by urgency score (highest first).
    """
    return compute_reorder_recommendations()


@router.get("/urgent", response_model=list)
async def get_urgent_reorders():
    """Return only high/critical urgency reorder recommendations."""
    all_recs = compute_reorder_recommendations()
    return [r for r in all_recs if r["urgency"] in ("high", "critical")]


from routers.auth import get_current_user
from fastapi import APIRouter, Depends

@router.get("/summary", response_model=dict)
async def get_reorder_summary(user: dict = Depends(get_current_user)):
    """Generate a natural language AI summary of current reorder needs."""
    all_recs = compute_reorder_recommendations()
    user_name = user.get("name", "Shop Owner") if user else "Shop Owner"
    return generate_gemini_summary(all_recs, user_name)
