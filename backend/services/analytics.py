"""Analytics service: pandas-based data analysis pipeline."""

from __future__ import annotations
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from services.data_store import get_products_store, get_sales_store


def get_sales_df() -> pd.DataFrame:
    """Return sales data as a cleaned pandas DataFrame."""
    sales = get_sales_store()
    if not sales:
        return pd.DataFrame(columns=["id", "product_id", "product_name",
                                     "quantity", "unit_price", "total_amount",
                                     "date", "category"])
    df = pd.DataFrame(sales)
    df["date"] = pd.to_datetime(df["date"])
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0)
    df["total_amount"] = pd.to_numeric(df["total_amount"], errors="coerce").fillna(0)
    return df


def get_products_df() -> pd.DataFrame:
    """Return inventory data as a cleaned pandas DataFrame."""
    products = get_products_store()
    if not products:
        return pd.DataFrame(columns=[
            "id", "name", "category", "unit", "cost_price", 
            "selling_price", "current_stock", "reorder_point", 
            "reorder_qty", "lead_time_days", "supplier"
        ])
    df = pd.DataFrame(list(products.values()))
    df["current_stock"] = pd.to_numeric(df["current_stock"], errors="coerce").fillna(0)
    df["cost_price"] = pd.to_numeric(df["cost_price"], errors="coerce").fillna(0)
    df["selling_price"] = pd.to_numeric(df["selling_price"], errors="coerce").fillna(0)
    return df


def compute_kpis() -> dict:
    """Compute dashboard KPIs from live data."""
    products_df = get_products_df()
    sales_df = get_sales_df()

    total_skus = len(products_df)
    low_stock = int((products_df["current_stock"] <= products_df["reorder_point"]).sum())
    out_of_stock = int((products_df["current_stock"] == 0).sum())

    today = datetime.utcnow().date()
    today_sales = sales_df[sales_df["date"].dt.date == today]
    today_revenue = float(today_sales["total_amount"].sum())

    month_start = today.replace(day=1)
    month_sales = sales_df[sales_df["date"].dt.date >= month_start]
    monthly_revenue = float(month_sales["total_amount"].sum())

    # Average margin %
    if len(products_df) > 0:
        products_df["margin"] = (
            (products_df["selling_price"] - products_df["cost_price"])
            / products_df["cost_price"].replace(0, np.nan)
            * 100
        )
        avg_margin = float(products_df["margin"].mean())
        if np.isnan(avg_margin):
            avg_margin = 0.0
    else:
        avg_margin = 0.0

    # Inventory value
    inventory_value = float(
        (products_df["current_stock"] * products_df["cost_price"]).sum()
    )

    # Reorder urgency score: (low_stock / total_skus) * 100
    urgency_score = round(low_stock / max(total_skus, 1) * 100, 1)

    return {
        "total_skus": total_skus,
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
        "todays_revenue": round(today_revenue, 2),
        "monthly_revenue": round(monthly_revenue, 2),
        "avg_margin_pct": round(avg_margin, 2),
        "reorder_urgency_score": urgency_score,
        "inventory_value": round(inventory_value, 2),
    }


def get_sales_trend(days: int = 30) -> list[dict]:
    """Return daily aggregated sales for the last N days."""
    df = get_sales_df()
    cutoff = datetime.utcnow() - timedelta(days=days)
    df = df[df["date"] >= cutoff]

    if df.empty:
        return []

    daily = (
        df.groupby(df["date"].dt.date)["total_amount"]
        .sum()
        .reset_index()
        .rename(columns={"date": "date", "total_amount": "revenue"})
    )
    daily["date"] = daily["date"].astype(str)
    return daily.to_dict(orient="records")


def get_product_velocity(product_id: str, days: int = 30) -> float:
    """Return average daily sales quantity for a product."""
    df = get_sales_df()
    cutoff = datetime.utcnow() - timedelta(days=days)
    product_sales = df[
        (df["product_id"] == product_id) & (df["date"] >= cutoff)
    ]
    if product_sales.empty:
        return 0.0
    return float(product_sales["quantity"].sum() / days)


def get_category_revenue() -> list[dict]:
    """Return revenue breakdown by category for the last 30 days."""
    df = get_sales_df()
    cutoff = datetime.utcnow() - timedelta(days=30)
    df = df[df["date"] >= cutoff]

    if df.empty:
        return []

    cat = (
        df.groupby("category")["total_amount"]
        .sum()
        .reset_index()
        .rename(columns={"total_amount": "revenue"})
        .sort_values("revenue", ascending=False)
    )
    return cat.to_dict(orient="records")
