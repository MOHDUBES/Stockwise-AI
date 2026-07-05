"""Seed sample data into the in-memory store on startup."""

from __future__ import annotations
import uuid
import random
from datetime import datetime, timedelta
from services.data_store import (
    get_products_store, get_sales_store, SEED_PRODUCTS
)


async def seed_sample_data():
    """Populate the in-memory store with sample products and 90 days of sales."""
    products = get_products_store()
    sales = get_sales_store()

    if products:
        return  # Already seeded

    # Seed products
    now = datetime.utcnow()
    for p in SEED_PRODUCTS:
        products[p["id"]] = {**p, "last_updated": now.isoformat()}

    # Generate 90 days of realistic sales data
    product_list = list(products.values())
    rng = random.Random(42)  # Deterministic seed

    for day_offset in range(90):
        date = now - timedelta(days=90 - day_offset)
        # Weekend boost: Fri/Sat/Sun sell ~30% more
        weekend_factor = 1.3 if date.weekday() >= 4 else 1.0

        for product in product_list:
            # Sales velocity varies by category
            base_velocity = {
                "Dairy & Eggs": 8,
                "Beverages": 5,
                "Snacks & Confectionery": 6,
                "Grains & Pulses": 3,
                "Household & Cleaning": 2,
                "Personal Care": 2,
                "Spices & Condiments": 1,
                "Oils & Ghee": 2,
                "Frozen Foods": 1,
                "Other": 1,
            }.get(product["category"], 2)

            # Poisson-distributed daily sales
            qty = rng.gauss(base_velocity * weekend_factor, base_velocity * 0.3)
            qty = max(0, round(qty, 1))

            if qty > 0:
                sales.append({
                    "id": str(uuid.uuid4()),
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "quantity": qty,
                    "unit_price": product["selling_price"],
                    "total_amount": round(qty * product["selling_price"], 2),
                    "date": date.isoformat(),
                    "category": product["category"],
                })
