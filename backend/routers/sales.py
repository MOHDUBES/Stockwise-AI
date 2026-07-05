"""Sales data router."""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from models.schemas import SaleCreate
from services.data_store import get_sales_store, get_products_store
from services.analytics import get_sales_trend, get_category_revenue

router = APIRouter()


@router.get("", response_model=dict)
async def list_sales(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    product_id: Optional[str] = None,
    days: int = Query(30, ge=1, le=365),
):
    """List sales records with optional product filter."""
    sales = get_sales_store()
    cutoff = datetime.utcnow().timestamp() - days * 86400

    filtered = [
        s for s in sales
        if datetime.fromisoformat(s["date"]).timestamp() >= cutoff
    ]
    if product_id:
        filtered = [s for s in filtered if s["product_id"] == product_id]

    filtered.sort(key=lambda x: x["date"], reverse=True)
    total = len(filtered)
    start = (page - 1) * page_size
    return {
        "items": filtered[start: start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.get("/trend", response_model=list)
async def sales_trend(days: int = Query(30, ge=7, le=90)):
    """Return daily aggregated revenue trend."""
    return get_sales_trend(days)


@router.get("/category-revenue", response_model=list)
async def category_revenue():
    """Return revenue breakdown by product category (last 30 days)."""
    return get_category_revenue()


@router.post("", response_model=dict, status_code=201)
async def record_sale(payload: SaleCreate):
    """Record a new sales transaction."""
    products = get_products_store()
    if payload.product_id not in products:
        raise HTTPException(status_code=404, detail=f"Product '{payload.product_id}' not found")

    product = products[payload.product_id]
    if product["current_stock"] < payload.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock: {product['current_stock']} available"
        )

    # Deduct stock
    products[payload.product_id]["current_stock"] -= payload.quantity

    sale = {
        "id": str(uuid.uuid4()),
        "product_id": payload.product_id,
        "product_name": product["name"],
        "quantity": payload.quantity,
        "unit_price": payload.unit_price or product["selling_price"],
        "total_amount": round(payload.quantity * (payload.unit_price or product["selling_price"]), 2),
        "date": (payload.date or datetime.utcnow()).isoformat(),
        "category": product["category"],
    }
    get_sales_store().append(sale)
    return sale
