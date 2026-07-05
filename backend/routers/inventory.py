"""Inventory CRUD router."""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from models.schemas import Product, ProductCreate, ProductUpdate
from services.data_store import get_products_store
from services.analytics import compute_kpis

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("", response_model=dict)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
):
    """List all products with pagination, search, and filter."""
    products = list(get_products_store().values())

    # Filter
    if search:
        q = search.lower()
        products = [p for p in products if q in p["name"].lower() or q in p["id"].lower()]
    if category:
        products = [p for p in products if p["category"] == category]
    if status == "low_stock":
        products = [p for p in products if 0 < p["current_stock"] <= p["reorder_point"]]
    elif status == "out_of_stock":
        products = [p for p in products if p["current_stock"] == 0]
    elif status == "in_stock":
        products = [p for p in products if p["current_stock"] > p["reorder_point"]]

    total = len(products)
    start = (page - 1) * page_size
    end = start + page_size
    page_items = products[start:end]

    # Enrich with stock_status
    for p in page_items:
        if p["current_stock"] == 0:
            p["stock_status"] = "out_of_stock"
        elif p["current_stock"] <= p["reorder_point"]:
            p["stock_status"] = "low_stock"
        elif p["current_stock"] <= p["reorder_point"] * 1.5:
            p["stock_status"] = "warning"
        else:
            p["stock_status"] = "in_stock"

    return {
        "items": page_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.get("/kpis", response_model=dict)
async def get_kpis():
    """Return dashboard KPI metrics."""
    return compute_kpis()


@router.get("/{product_id}", response_model=dict)
async def get_product(product_id: str):
    """Get a single product by ID."""
    products = get_products_store()
    if product_id not in products:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    return products[product_id]


@router.post("", response_model=dict, status_code=201)
async def create_product(payload: ProductCreate):
    """Create a new product in inventory."""
    products = get_products_store()
    new_id = f"SKU{len(products) + 1:04d}"
    # Ensure uniqueness
    while new_id in products:
        new_id = f"SKU{uuid.uuid4().hex[:6].upper()}"

    product_dict = payload.model_dump()
    product_dict["id"] = new_id
    product_dict["last_updated"] = datetime.utcnow().isoformat()
    product_dict["category"] = product_dict["category"].value if hasattr(product_dict["category"], "value") else product_dict["category"]

    products[new_id] = product_dict
    return product_dict


@router.put("/{product_id}", response_model=dict)
async def update_product(product_id: str, payload: ProductUpdate):
    """Update an existing product."""
    products = get_products_store()
    if product_id not in products:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")

    update_data = payload.model_dump(exclude_none=True)
    if "category" in update_data and hasattr(update_data["category"], "value"):
        update_data["category"] = update_data["category"].value

    products[product_id].update(update_data)
    products[product_id]["last_updated"] = datetime.utcnow().isoformat()
    return products[product_id]


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: str):
    """Delete a product from inventory."""
    products = get_products_store()
    if product_id not in products:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    del products[product_id]
