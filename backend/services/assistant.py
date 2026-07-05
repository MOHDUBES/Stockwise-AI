import os
import json
import logging
from typing import Any

import logging
from typing import Any, Optional
from enum import Enum
from pydantic import BaseModel, Field, field_validator

from services.data_store import get_products_store, search_product_by_name, update_product_stock_by_name
from services.reorder_engine import compute_reorder_recommendations
from services.analytics import get_sales_trend

logger = logging.getLogger(__name__)

class ActionType(str, Enum):
    check_stock = "check_stock"
    reorder_recs = "get_reorder_recs"
    sales_trend = "get_sales_trend"
    update_stock = "update_stock"
    unknown = "unknown"

class IntentParameters(BaseModel):
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    days: Optional[int] = Field(default=7)

class ParsedIntent(BaseModel):
    action: ActionType
    parameters: IntentParameters

    @field_validator("parameters")
    @classmethod
    def validate_parameters(cls, v: IntentParameters, info):
        action = info.data.get("action")
        if action == ActionType.update_stock:
            if v.quantity is None or v.quantity <= 0:
                raise ValueError("Quantity must be a positive number for updating stock.")
            if not v.product_name:
                raise ValueError("Product name is required for updating stock.")
            # Verify product exists
            if not search_product_by_name(v.product_name):
                raise ValueError(f"Could not find product matching '{v.product_name}' to update.")
        return v

# Configure Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None
GEMINI_AVAILABLE = False

try:
    from google import genai as google_genai
    if API_KEY:
        gemini_client = google_genai.Client(api_key=API_KEY)
        GEMINI_AVAILABLE = True
        logger.info("✅ Gemini AI (google-genai SDK) initialized successfully")
    else:
        logger.warning("⚠️ GEMINI_API_KEY not set. Running in keyword-fallback mode.")
except ImportError:
    # Try old SDK as fallback
    try:
        import google.generativeai as genai_old
        if API_KEY:
            genai_old.configure(api_key=API_KEY)
            gemini_client = genai_old.GenerativeModel("gemini-2.5-flash")
            GEMINI_AVAILABLE = True
            logger.info("✅ Gemini AI (legacy SDK) initialized")
        else:
            logger.warning("⚠️ GEMINI_API_KEY not set. Running in keyword-fallback mode.")
    except ImportError:
        logger.warning("⚠️ google-genai package not found. Running in fallback mode.")


def _keyword_parse_intent(query: str) -> dict[str, Any]:
    """
    Fallback keyword-based intent parser used when Gemini is unavailable.
    Handles the most common patterns without requiring an API key.
    """
    q = query.lower()
    
    # update_stock: "add X units of PRODUCT" or "stock update PRODUCT X"
    import re
    add_match = re.search(r"add\s+(\d+)\s+units?\s+(?:of\s+)?(.+)", q)
    if add_match:
        qty = int(add_match.group(1))
        prod = add_match.group(2).strip().rstrip(".")
        return {"action": "update_stock", "parameters": {"product_name": prod, "quantity": qty}}
    
    # check_stock: "check stock of PRODUCT" or "how much PRODUCT"
    if any(kw in q for kw in ["check stock", "stock level", "how much", "how many"]):
        # Extract product name after keyword
        for kw in ["check stock of", "stock level of", "how much", "how many"]:
            if kw in q:
                prod = q.split(kw)[-1].strip().rstrip(".")
                if prod:
                    return {"action": "check_stock", "parameters": {"product_name": prod}}
    
    # reorder_recs: "reorder", "low stock", "what to order"
    if any(kw in q for kw in ["reorder", "low stock", "out of stock", "what to order", "what needs"]):
        return {"action": "get_reorder_recs", "parameters": {}}
    
    # sales_trend: "sales trend", "sales this week", "how are sales"
    if any(kw in q for kw in ["sales trend", "sales this week", "sales today", "how are sales", "weekly sales"]):
        days_match = re.search(r"(\d+)\s+days?", q)
        days = int(days_match.group(1)) if days_match else 7
        return {"action": "get_sales_trend", "parameters": {"days": days}}
    
    return {"action": "unknown", "parameters": {}}


def parse_intent(query: str) -> dict[str, Any]:
    """Parse user query into a structured intent using Gemini."""
    if not GEMINI_AVAILABLE:
        raise ValueError("AI assistant unavailable — check API configuration")

    prompt = f"""
    You are an intent parser for an inventory management app (StockWise AI).
    Given the user's natural language query, determine their intent and extract relevant parameters.
    
    Supported actions:
    - get_reorder_recs: User wants to know what needs reordering or the reorder recommendations.
    - check_stock: User wants to check the current stock level of a specific product.
    - update_stock: User wants to add or update stock for a product.
    - get_sales_trend: User wants to see sales trends over a period of time.
    - unknown: If the intent doesn't match the above.

    Return the result strictly as a JSON object with the following format (NO markdown wrappers, JUST the raw JSON):
    {{
        "action": "action_name",
        "parameters": {{
            "product_name": "extracted product name or null",
            "quantity": extracted numerical quantity or null,
            "days": extracted days for trend (default 7 if not specified) or null
        }}
    }}
    
    User Query: "{query}"
    """
    
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text.strip()
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        raise ValueError(f"AI assistant unavailable — check API configuration (Error: {str(e)})")

    # Clean markdown if accidentally included
    if text.startswith("```json"):
        text = text[7:-3].strip()
    elif text.startswith("```"):
        text = text[3:-3].strip()
        
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse Gemini intent JSON: {text}")
        return {"action": "unknown", "parameters": {}}


def execute_intent(intent_data: dict[str, Any]) -> dict[str, Any]:
    """Execute the parsed intent by calling appropriate backend services."""
    action = intent_data.get("action")
    params = intent_data.get("parameters", {})
    
    try:
        if action == ActionType.reorder_recs:
            recs = compute_reorder_recommendations()
            # If product is specified, filter recs
            prod_name = params.get("product_name")
            if prod_name:
                recs = [r for r in recs if prod_name.lower() in r["name"].lower()]
            return {"data": recs, "status": "success"}
            
        elif action == ActionType.check_stock:
            prod_name = params.get("product_name")
            if not prod_name:
                return {"error": "Product name not specified.", "status": "error"}
            product = search_product_by_name(prod_name)
            if product:
                return {"data": product, "status": "success"}
            return {"error": f"Product '{prod_name}' not found.", "status": "error"}
            
        elif action == ActionType.update_stock:
            # We don't execute update_stock here, it requires confirmation
            return {"error": "Update stock requires confirmation.", "status": "error"}
            
        elif action == ActionType.sales_trend:
            days = params.get("days") or 7
            trend = get_sales_trend(days=int(days))
            return {"data": trend, "status": "success"}
            
        else:
            return {"error": "I couldn't understand what action to perform.", "status": "error"}
            
    except Exception as e:
        logger.exception(f"Error executing intent {action}")
        return {"error": str(e), "status": "error"}


def execute_confirmed_intent(intent_data: dict[str, Any]) -> dict[str, Any]:
    """Execute a write-action intent after it has been confirmed by the user."""
    action = intent_data.get("action")
    params = intent_data.get("parameters", {})
    
    if action == ActionType.update_stock:
        try:
            prod_name = params.get("product_name")
            qty = params.get("quantity")
            result = update_product_stock_by_name(prod_name, int(qty))
            return {"data": result, "status": "success"}
        except Exception as e:
            logger.exception(f"Error executing confirmed intent {action}")
            return {"error": str(e), "status": "error"}
    else:
        return execute_intent(intent_data)


def _template_response(query: str, result: dict[str, Any], intent: dict | None = None) -> str:
    """Template-based response generator used when Gemini is unavailable."""
    if result.get("status") == "error":
        return f"Sorry, something went wrong: {result.get('error', 'Unknown error')}. Please try again."

    action = (intent or {}).get("action", "unknown")
    data = result.get("data", {})

    if action == "check_stock":
        if data:
            return (f"Here's what I found for '{data.get('name', 'that product')}': "
                    f"Current stock is {data.get('current_stock', 'N/A')} units, "
                    f"selling at ₹{data.get('selling_price', 'N/A')} each.")
        return "I couldn't find that product in the database."

    if action == "update_stock":
        if data:
            return (f"Done! I've added {data.get('added', 0)} units to {data.get('name', 'the product')}. "
                    f"New total stock is {data.get('new_stock', 'N/A')} units.")
        return "Stock updated successfully."

    if action == "get_reorder_recs":
        recs = data if isinstance(data, list) else []
        critical = [r for r in recs if r.get("risk_level") in ("CRITICAL", "HIGH")]
        if critical:
            names = ", ".join(r["name"] for r in critical[:3])
            return f"⚠️ {len(critical)} products need urgent attention: {names}. Check the Reorder AI page for full details."
        return f"Found {len(recs)} reorder recommendations. Most items are well-stocked!"

    if action == "get_sales_trend":
        return "Here's your recent sales trend data. Check the Forecast page for detailed charts."

    return "Here is the data I found for your query."


def generate_response(query: str, result: dict[str, Any], intent: dict | None = None) -> str:
    """Generate a friendly natural language response using Gemini."""
    if not GEMINI_AVAILABLE:
        raise ValueError("AI assistant unavailable — check API configuration")
        
    prompt = f"""
    You are the friendly AI mascot of StockWise AI, talking to a shop owner (Kirana store owner).
    The user asked: "{query}"
    
    The backend processed this and returned the following data:
    {json.dumps(result, indent=2)}
    
    Write a brief, friendly, and actionable response summarizing the data. 
    Use a helpful and warm tone. Keep it concise (1-3 sentences max).
    If there is an error in the data, apologize gracefully and tell the user what went wrong.
    Do NOT include markdown formatting like **bold** unless strictly necessary.
    """
    
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini response generation failed: {e}")
        raise ValueError(f"AI assistant unavailable — check API configuration (Error: {str(e)})")


def process_query(query: str) -> dict[str, Any]:
    """Orchestrate the parsing, execution, and response generation."""
    raw_intent = parse_intent(query)
    
    if raw_intent.get("action") == "unknown":
        return {
            "response": "I'm not sure what you mean — try asking about reorder recommendations, checking stock levels, adding inventory, or viewing sales trends.",
            "intent": raw_intent,
            "data": None,
            "status": "success"
        }
        
    # Pydantic Validation
    try:
        validated_intent = ParsedIntent(**raw_intent)
        intent_dict = validated_intent.model_dump()
    except Exception as e:
        logger.warning(f"Intent validation failed: {e}")
        return {
            "response": "I understood what you want to do, but some details were missing or invalid. Please check your spelling and quantities and try again.",
            "intent": raw_intent,
            "data": {"error": str(e)},
            "status": "error"
        }
    
    if intent_dict["action"] == ActionType.update_stock:
        # Require confirmation for write actions
        prod_name = intent_dict["parameters"]["product_name"]
        qty = intent_dict["parameters"]["quantity"]
        return {
            "response": f"Are you sure you want to add {qty} units to {prod_name}?",
            "intent": intent_dict,
            "data": None,
            "status": "awaiting_confirmation"
        }
        
    # For read actions, execute immediately
    result = execute_intent(intent_dict)
    response_text = generate_response(query, result, intent_dict)
    
    return {
        "response": response_text,
        "intent": intent_dict,
        "data": result,
        "status": "success"
    }
