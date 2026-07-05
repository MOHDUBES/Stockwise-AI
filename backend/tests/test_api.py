"""
Backend tests for Smart Inventory & Sales Decision Assistant.
Run with: pytest tests/ -v
"""
import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_health_check(client):
    """Test health check endpoint returns 200."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


@pytest.mark.asyncio
async def test_list_products(client):
    """Test product listing returns paginated results."""
    response = await client.get("/api/v1/inventory")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert data["page"] == 1


@pytest.mark.asyncio
async def test_create_product(client):
    """Test product creation with valid payload."""
    payload = {
        "name": "Test Product",
        "category": "Beverages",
        "unit": "bottle",
        "cost_price": 50.0,
        "selling_price": 70.0,
        "current_stock": 100.0,
        "reorder_point": 20.0,
        "reorder_qty": 50.0,
        "lead_time_days": 2,
    }
    response = await client.post("/api/v1/inventory", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Product"
    assert data["id"].startswith("SKU")


@pytest.mark.asyncio
async def test_get_nonexistent_product(client):
    """Test 404 for unknown product ID."""
    response = await client.get("/api/v1/inventory/NONEXISTENT123")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_kpis(client):
    """Test KPI endpoint returns expected fields."""
    response = await client.get("/api/v1/inventory/kpis")
    assert response.status_code == 200
    data = response.json()
    expected_fields = [
        "total_skus", "low_stock_count", "out_of_stock_count",
        "todays_revenue", "monthly_revenue", "avg_margin_pct",
        "reorder_urgency_score", "inventory_value"
    ]
    for field in expected_fields:
        assert field in data, f"Missing KPI field: {field}"


@pytest.mark.asyncio
async def test_sales_trend(client):
    """Test sales trend endpoint returns a list."""
    response = await client.get("/api/v1/sales/trend?days=30")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_reorder_recommendations(client):
    """Test reorder recommendations return valid structure."""
    response = await client.get("/api/v1/reorder")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        rec = data[0]
        assert "product_id" in rec
        assert "urgency" in rec
        assert "recommended_qty" in rec
        assert rec["urgency"] in ("low", "medium", "high", "critical")


@pytest.mark.asyncio
async def test_risk_scores(client):
    """Test risk scores endpoint returns valid structure."""
    response = await client.get("/api/v1/risk")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        score = data[0]
        assert "overall_score" in score
        assert 0 <= score["overall_score"] <= 100
        assert score["risk_level"] in ("low", "medium", "high", "critical")


@pytest.mark.asyncio
async def test_category_revenue(client):
    """Test category revenue endpoint."""
    response = await client.get("/api/v1/sales/category-revenue")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_benchmark_operations_metadata(client):
    """Test benchmark operations metadata endpoint."""
    response = await client.get("/api/v1/benchmark/operations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    assert all("key" in op and "label" in op for op in data)


@pytest.mark.asyncio
async def test_product_search(client):
    """Test product search filtering."""
    response = await client.get("/api/v1/inventory?search=rice")
    assert response.status_code == 200
    data = response.json()
    # Should find Basmati Rice
    assert any("Rice" in item["name"] for item in data["items"])


@pytest.mark.asyncio
async def test_product_validation_negative_price(client):
    """Test that negative cost_price is rejected."""
    payload = {
        "name": "Bad Product",
        "category": "Beverages",
        "unit": "bottle",
        "cost_price": -10.0,  # Invalid
        "selling_price": 50.0,
        "current_stock": 10.0,
        "reorder_point": 5.0,
        "reorder_qty": 20.0,
    }
    response = await client.post("/api/v1/inventory", json=payload)
    assert response.status_code == 422  # Validation error
