"""Forecasting service: demand forecasting using statsmodels exponential smoothing."""

from __future__ import annotations
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from services.analytics import get_sales_df, get_product_velocity
from services.data_store import get_products_store


def forecast_product_demand(product_id: str, horizon_days: int = 30) -> dict:
    """
    Generate a demand forecast for a product using Holt-Winters exponential smoothing.

    Parameters
    ----------
    product_id : str
        The product SKU to forecast
    horizon_days : int
        Number of days to forecast (default 30)

    Returns
    -------
    dict compatible with ProductForecast schema
    """
    df = get_sales_df()
    product_df = df[df["product_id"] == product_id].copy()

    products = get_products_store()
    product = products.get(product_id)
    product_name = product["name"] if product else product_id

    if product_df.empty or len(product_df) < 7:
        # Fall back to velocity-based linear forecast
        velocity = get_product_velocity(product_id)
        return _fallback_forecast(product_id, product_name, velocity, horizon_days)

    # Resample to daily totals
    product_df = product_df.set_index("date").resample("D")["quantity"].sum().fillna(0)

    # Need at least 14 days for seasonal model
    use_seasonal = len(product_df) >= 14

    try:
        if use_seasonal and len(product_df) >= 14:
            model = ExponentialSmoothing(
                product_df.values,
                trend="add",
                seasonal="add" if len(product_df) >= 14 else None,
                seasonal_periods=7,
                initialization_method="estimated",
            )
        else:
            model = ExponentialSmoothing(
                product_df.values,
                trend="add",
                initialization_method="estimated",
            )

        fit = model.fit(optimized=True)
        forecast_values = fit.forecast(horizon_days)
        forecast_values = np.maximum(forecast_values, 0)

        # Compute confidence intervals (±1.5 std of residuals)
        residuals = fit.resid
        std_err = float(np.std(residuals))
        interval_factor = 1.5

        # Compute trend direction
        last_7_avg = float(product_df.values[-7:].mean())
        first_7_avg = float(product_df.values[:7].mean()) if len(product_df) >= 7 else last_7_avg
        if last_7_avg > first_7_avg * 1.1:
            trend = "increasing"
        elif last_7_avg < first_7_avg * 0.9:
            trend = "decreasing"
        else:
            trend = "stable"

        # Build forecast points
        start_date = datetime.utcnow().date() + timedelta(days=1)
        forecast_points = []
        for i, val in enumerate(forecast_values):
            date = start_date + timedelta(days=i)
            forecast_points.append({
                "date": str(date),
                "predicted": round(float(val), 2),
                "lower_bound": round(max(0.0, float(val) - interval_factor * std_err), 2),
                "upper_bound": round(float(val) + interval_factor * std_err, 2),
            })

        # Confidence based on data length and model fit
        confidence = min(0.95, 0.6 + (len(product_df) / 90) * 0.35)

        return {
            "product_id": product_id,
            "product_name": product_name,
            "forecast": forecast_points,
            "trend": trend,
            "seasonality_detected": use_seasonal,
            "confidence": round(confidence, 2),
        }

    except Exception:
        velocity = get_product_velocity(product_id)
        return _fallback_forecast(product_id, product_name, velocity, horizon_days)


def _fallback_forecast(
    product_id: str, product_name: str, velocity: float, horizon_days: int
) -> dict:
    """Linear velocity-based fallback forecast."""
    start_date = datetime.utcnow().date() + timedelta(days=1)
    points = []
    for i in range(horizon_days):
        date = start_date + timedelta(days=i)
        val = max(0.0, velocity + np.random.normal(0, velocity * 0.1))
        points.append({
            "date": str(date),
            "predicted": round(val, 2),
            "lower_bound": round(max(0.0, val * 0.7), 2),
            "upper_bound": round(val * 1.3, 2),
        })
    return {
        "product_id": product_id,
        "product_name": product_name,
        "forecast": points,
        "trend": "stable",
        "seasonality_detected": False,
        "confidence": 0.5,
    }
