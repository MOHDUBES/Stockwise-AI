import pytest
from httpx import AsyncClient, ASGITransport
import json

# Must set before importing main to mock Gemini if API key is not present in CI
import os
os.environ["USE_REAL_CUDF"] = "false"

from main import app
from services.assistant import parse_intent, execute_intent


@pytest.mark.asyncio
async def test_assistant_query_empty():
    """Test that an empty query returns 400."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/assistant/query", json={"query": "   "})
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"].lower()


def test_parse_intent_fallback_without_gemini():
    """Test that intent parsing raises ValueError when Gemini is unavailable."""
    from services import assistant
    # Force mock Gemini offline
    assistant.GEMINI_AVAILABLE = False
    
    with pytest.raises(ValueError, match="AI assistant unavailable — check API configuration"):
        assistant.parse_intent("Add 50 units of Parle-G")


def test_execute_intent_check_stock():
    """Test executing a check_stock intent."""
    intent = {
        "action": "check_stock",
        "parameters": {"product_name": "Parle-G"}
    }
    result = execute_intent(intent)
    assert result["status"] == "success"
    assert result["data"]["name"] == "Parle-G Biscuits (800 g)"


def test_execute_intent_update_stock_awaiting():
    """Test executing an update_stock intent returns an error without confirmation."""
    intent = {
        "action": "update_stock",
        "parameters": {"product_name": "Parle-G", "quantity": 50}
    }
    result = execute_intent(intent)
    assert result["status"] == "error"
    assert "requires confirmation" in result["error"].lower()


def test_execute_confirmed_intent_update_stock():
    """Test executing a confirmed update_stock intent."""
    from services.assistant import execute_confirmed_intent
    intent = {
        "action": "update_stock",
        "parameters": {"product_name": "Parle-G", "quantity": 50}
    }
    result = execute_confirmed_intent(intent)
    assert result["status"] == "success"
    assert result["data"]["added"] == 50


def test_pydantic_validation_fails():
    """Test that the Pydantic model correctly rejects invalid inputs."""
    from services.assistant import process_query, ParsedIntent, ActionType, IntentParameters
    from pydantic import ValidationError
    
    # Negative quantity should fail
    try:
        ParsedIntent(action=ActionType.update_stock, parameters=IntentParameters(product_name="Parle-G", quantity=-10))
        assert False, "Should have raised ValidationError"
    except ValidationError:
        assert True
        
    # Non-existent product should fail
    try:
        ParsedIntent(action=ActionType.update_stock, parameters=IntentParameters(product_name="FakeProduct", quantity=10))
        assert False, "Should have raised ValidationError"
    except ValidationError:
        assert True


def test_execute_intent_unknown():
    """Test executing an unknown intent."""
    intent = {
        "action": "unknown",
        "parameters": {}
    }
    result = execute_intent(intent)
    assert result["status"] == "error"
    assert "couldn't understand" in result["error"]
