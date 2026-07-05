"""In-memory data store for development (replaces Firestore in local mode)."""

from __future__ import annotations
import uuid
from datetime import datetime, timedelta
import random
from typing import Optional
from models.schemas import Product, SaleRecord, Category

# ---------------------------------------------------------------------------
# In-memory stores
# ---------------------------------------------------------------------------
_products: dict[str, dict] = {}
_sales: list[dict] = []


def get_products_store() -> dict[str, dict]:
    return _products


def get_sales_store() -> list[dict]:
    return _sales


def clear_stores():
    _products.clear()
    _sales.clear()


def search_product_by_name(name: str) -> Optional[dict]:
    """Find a product that roughly matches the given name."""
    name_lower = name.lower()
    for product in _products.values():
        if name_lower in product["name"].lower():
            return product
    return None


def update_product_stock_by_name(name: str, qty_added: int) -> dict:
    """Find a product by name and update its stock, returning the result."""
    product = search_product_by_name(name)
    if not product:
        raise ValueError(f"Product matching '{name}' not found.")
    
    product["current_stock"] += qty_added
    return {
        "id": product["id"],
        "name": product["name"],
        "new_stock": product["current_stock"],
        "added": qty_added
    }


# ---------------------------------------------------------------------------
# Seed data — realistic kirana store inventory
# ---------------------------------------------------------------------------
SEED_PRODUCTS = [
    {
        "id": "SKU001", "name": "Basmati Rice (5 kg)", "category": Category.GRAINS,
        "unit": "bag", "cost_price": 320, "selling_price": 380,
        "current_stock": 8, "reorder_point": 15, "reorder_qty": 50,
        "lead_time_days": 3, "shelf_life_days": 365, "supplier": "Daawat Foods",
    },
    {
        "id": "SKU002", "name": "Toor Dal (1 kg)", "category": Category.GRAINS,
        "unit": "pack", "cost_price": 95, "selling_price": 120,
        "current_stock": 42, "reorder_point": 30, "reorder_qty": 100,
        "lead_time_days": 2, "shelf_life_days": 180, "supplier": "Local Wholesaler",
    },
    {
        "id": "SKU003", "name": "Amul Full Cream Milk (1 L)", "category": Category.DAIRY,
        "unit": "pouch", "cost_price": 62, "selling_price": 68,
        "current_stock": 5, "reorder_point": 20, "reorder_qty": 60,
        "lead_time_days": 1, "shelf_life_days": 7, "supplier": "Amul Distributor",
    },
    {
        "id": "SKU004", "name": "Parle-G Biscuits (800 g)", "category": Category.SNACKS,
        "unit": "pack", "cost_price": 38, "selling_price": 45,
        "current_stock": 0, "reorder_point": 25, "reorder_qty": 80,
        "lead_time_days": 2, "shelf_life_days": 180, "supplier": "Parle Distributor",
    },
    {
        "id": "SKU005", "name": "Maggi Noodles (70 g × 12)", "category": Category.SNACKS,
        "unit": "carton", "cost_price": 98, "selling_price": 120,
        "current_stock": 18, "reorder_point": 20, "reorder_qty": 60,
        "lead_time_days": 2, "shelf_life_days": 270, "supplier": "Nestle Distributor",
    },
    {
        "id": "SKU006", "name": "Surf Excel (1 kg)", "category": Category.HOUSEHOLD,
        "unit": "pack", "cost_price": 90, "selling_price": 115,
        "current_stock": 30, "reorder_point": 15, "reorder_qty": 40,
        "lead_time_days": 3, "shelf_life_days": None, "supplier": "HUL Distributor",
    },
    {
        "id": "SKU007", "name": "Sunflower Oil (1 L)", "category": Category.OILS,
        "unit": "bottle", "cost_price": 138, "selling_price": 160,
        "current_stock": 12, "reorder_point": 20, "reorder_qty": 50,
        "lead_time_days": 2, "shelf_life_days": 365, "supplier": "Fortune Oils",
    },
    {
        "id": "SKU008", "name": "Colgate Toothpaste (200 g)", "category": Category.PERSONAL_CARE,
        "unit": "tube", "cost_price": 72, "selling_price": 95,
        "current_stock": 22, "reorder_point": 15, "reorder_qty": 40,
        "lead_time_days": 3, "shelf_life_days": None, "supplier": "Colgate Distributor",
    },
    {
        "id": "SKU009", "name": "Tata Tea Premium (500 g)", "category": Category.BEVERAGES,
        "unit": "pack", "cost_price": 145, "selling_price": 175,
        "current_stock": 7, "reorder_point": 20, "reorder_qty": 50,
        "lead_time_days": 2, "shelf_life_days": 730, "supplier": "Tata Consumer",
    },
    {
        "id": "SKU010", "name": "MDH Garam Masala (100 g)", "category": Category.SPICES,
        "unit": "pack", "cost_price": 52, "selling_price": 70,
        "current_stock": 3, "reorder_point": 10, "reorder_qty": 30,
        "lead_time_days": 3, "shelf_life_days": 365, "supplier": "MDH Spices",
    },
    {
        "id": "SKU011", "name": "Amul Butter (500 g)", "category": Category.DAIRY,
        "unit": "pack", "cost_price": 250, "selling_price": 290,
        "current_stock": 9, "reorder_point": 10, "reorder_qty": 30,
        "lead_time_days": 1, "shelf_life_days": 90, "supplier": "Amul Distributor",
    },
    {
        "id": "SKU012", "name": "Coca-Cola (2 L)", "category": Category.BEVERAGES,
        "unit": "bottle", "cost_price": 85, "selling_price": 100,
        "current_stock": 24, "reorder_point": 15, "reorder_qty": 48,
        "lead_time_days": 2, "shelf_life_days": 180, "supplier": "Coca-Cola Distributor",
    },
    {
        "id": "SKU013", "name": "Dettol Hand Wash (500 ml)", "category": Category.PERSONAL_CARE,
        "unit": "bottle", "cost_price": 102, "selling_price": 135,
        "current_stock": 16, "reorder_point": 12, "reorder_qty": 36,
        "lead_time_days": 3, "shelf_life_days": None, "supplier": "Reckitt Distributor",
    },
    {
        "id": "SKU014", "name": "Chana Dal (1 kg)", "category": Category.GRAINS,
        "unit": "pack", "cost_price": 88, "selling_price": 110,
        "current_stock": 35, "reorder_point": 25, "reorder_qty": 80,
        "lead_time_days": 2, "shelf_life_days": 180, "supplier": "Local Wholesaler",
    },
    {
        "id": "SKU015", "name": "Ariel Detergent (1 kg)", "category": Category.HOUSEHOLD,
        "unit": "pack", "cost_price": 115, "selling_price": 148,
        "current_stock": 4, "reorder_point": 12, "reorder_qty": 36,
        "lead_time_days": 3, "shelf_life_days": None, "supplier": "P&G Distributor",
    },
]
