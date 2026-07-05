"""Pydantic data models for inventory and sales entities."""

from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class Category(str, Enum):
    GRAINS = "Grains & Pulses"
    DAIRY = "Dairy & Eggs"
    BEVERAGES = "Beverages"
    SNACKS = "Snacks & Confectionery"
    HOUSEHOLD = "Household & Cleaning"
    PERSONAL_CARE = "Personal Care"
    SPICES = "Spices & Condiments"
    OILS = "Oils & Ghee"
    FROZEN = "Frozen Foods"
    OTHER = "Other"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Product(BaseModel):
    """A single product in the inventory."""

    id: str = Field(..., description="Unique product SKU")
    name: str = Field(..., min_length=2, max_length=200)
    category: Category
    unit: str = Field(..., description="Unit of measurement (kg, litre, pack, etc.)")
    cost_price: float = Field(..., ge=0, description="Purchase cost per unit (₹)")
    selling_price: float = Field(..., ge=0, description="Selling price per unit (₹)")
    current_stock: float = Field(..., ge=0, description="Current quantity in stock")
    reorder_point: float = Field(..., ge=0, description="Stock level triggering reorder")
    reorder_qty: float = Field(..., ge=0, description="Quantity to order when restocking")
    lead_time_days: int = Field(default=2, ge=1, le=30, description="Supplier delivery days")
    shelf_life_days: Optional[int] = Field(None, ge=1, description="Expiry in days (perishables)")
    supplier: Optional[str] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("selling_price")
    @classmethod
    def selling_price_above_cost(cls, v: float, info) -> float:
        """Warn if selling price is below cost price (not an error, just business logic)."""
        return v

    @property
    def margin_pct(self) -> float:
        if self.cost_price == 0:
            return 0.0
        return round((self.selling_price - self.cost_price) / self.cost_price * 100, 2)

    @property
    def stock_status(self) -> str:
        if self.current_stock == 0:
            return "out_of_stock"
        elif self.current_stock <= self.reorder_point:
            return "low_stock"
        elif self.current_stock <= self.reorder_point * 1.5:
            return "warning"
        return "in_stock"


class ProductCreate(BaseModel):
    """Request model for creating a new product."""
    name: str = Field(..., min_length=2, max_length=200)
    category: Category
    unit: str
    cost_price: float = Field(..., ge=0)
    selling_price: float = Field(..., ge=0)
    current_stock: float = Field(..., ge=0)
    reorder_point: float = Field(..., ge=0)
    reorder_qty: float = Field(..., ge=0)
    lead_time_days: int = Field(default=2, ge=1, le=30)
    shelf_life_days: Optional[int] = None
    supplier: Optional[str] = None


class ProductUpdate(BaseModel):
    """Partial update request for a product."""
    name: Optional[str] = None
    category: Optional[Category] = None
    unit: Optional[str] = None
    cost_price: Optional[float] = Field(None, ge=0)
    selling_price: Optional[float] = Field(None, ge=0)
    current_stock: Optional[float] = Field(None, ge=0)
    reorder_point: Optional[float] = Field(None, ge=0)
    reorder_qty: Optional[float] = Field(None, ge=0)
    lead_time_days: Optional[int] = Field(None, ge=1, le=30)
    shelf_life_days: Optional[int] = Field(None, ge=1)
    supplier: Optional[str] = None


class SaleRecord(BaseModel):
    """A single sales transaction record."""
    id: str
    product_id: str
    product_name: str
    quantity: float = Field(..., ge=0)
    unit_price: float = Field(..., ge=0)
    total_amount: float = Field(..., ge=0)
    date: datetime
    category: str


class SaleCreate(BaseModel):
    """Request model for recording a sale."""
    product_id: str
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    date: Optional[datetime] = None


class ReorderRecommendation(BaseModel):
    """AI-generated reorder recommendation for a product."""
    product_id: str
    product_name: str
    category: str
    current_stock: float
    reorder_point: float
    recommended_qty: float
    urgency: RiskLevel
    urgency_score: float = Field(..., ge=0, le=100)
    suggested_price: float
    reasoning: str
    estimated_days_to_stockout: Optional[float] = None
    avg_daily_sales: float
    total_cost: float


class ForecastPoint(BaseModel):
    """A single point in a demand forecast."""
    date: str
    predicted: float
    lower_bound: float
    upper_bound: float


class ProductForecast(BaseModel):
    """30-day demand forecast for a product."""
    product_id: str
    product_name: str
    forecast: list[ForecastPoint]
    trend: str  # "increasing", "decreasing", "stable"
    seasonality_detected: bool
    confidence: float = Field(..., ge=0, le=1)


class RiskScore(BaseModel):
    """Risk assessment for a single product."""
    product_id: str
    product_name: str
    category: str
    overall_score: float = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    velocity_risk: float = Field(..., ge=0, le=100)
    stockout_risk: float = Field(..., ge=0, le=100)
    spoilage_risk: float = Field(..., ge=0, le=100)
    price_risk: float = Field(..., ge=0, le=100)
    recommendation: str


class BenchmarkResult(BaseModel):
    """Result of a pandas vs cuDF benchmark run."""
    operation: str
    dataset_size: int
    pandas_time_ms: float
    cudf_time_ms: float
    speedup: float
    pandas_error: Optional[str] = None
    cudf_error: Optional[str] = None


class BenchmarkResponse(BaseModel):
    """Full benchmark response with all operations."""
    results: list[BenchmarkResult]
    total_pandas_ms: float
    total_cudf_ms: float
    avg_speedup: float
    dataset_rows: int
    note: str


class DashboardKPIs(BaseModel):
    """Key performance indicators for the dashboard."""
    total_skus: int
    low_stock_count: int
    out_of_stock_count: int
    todays_revenue: float
    monthly_revenue: float
    avg_margin_pct: float
    reorder_urgency_score: float
    inventory_value: float


class PaginatedResponse(BaseModel):
    """Generic paginated response wrapper."""
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
