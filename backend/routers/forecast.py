"""Demand forecast router."""
from fastapi import APIRouter, HTTPException, Query
from services.forecasting import forecast_product_demand
from services.data_store import get_products_store

router = APIRouter()


@router.get("/{product_id}", response_model=dict)
async def get_product_forecast(
    product_id: str,
    horizon_days: int = Query(30, ge=7, le=90),
):
    """Generate demand forecast for a specific product."""
    products = get_products_store()
    if product_id not in products:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    return forecast_product_demand(product_id, horizon_days)


@router.get("", response_model=list)
async def get_all_forecasts(
    horizon_days: int = Query(30, ge=7, le=90),
    limit: int = Query(5, ge=1, le=20),
):
    """Get demand forecasts for top N products by velocity."""
    products = get_products_store()
    product_ids = list(products.keys())[:limit]
    return [forecast_product_demand(pid, horizon_days) for pid in product_ids]
