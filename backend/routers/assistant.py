from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict
import time

from services.assistant import process_query, execute_confirmed_intent, generate_response

router = APIRouter()


class AssistantRequest(BaseModel):
    query: str

class ConfirmRequest(BaseModel):
    query: str
    intent: Dict[str, Any]

@router.post("/query")
async def assistant_query(req: AssistantRequest):
    """
    Process a natural language query via the AI Assistant.
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    start_time = time.perf_counter()
    
    try:
        result = process_query(req.query)
    except Exception as e:
        # Instead of a silent 500, return a graceful error payload
        result = {
            "response": f"Sorry, I encountered an error processing that: {str(e)}",
            "intent": {"action": "unknown", "parameters": {}},
            "data": {"error": str(e)},
            "status": "error"
        }
        
    processing_time_ms = round((time.perf_counter() - start_time) * 1000, 1)
    
    return {
        "response": result["response"],
        "intent": result["intent"],
        "data": result["data"],
        "status": result.get("status", "success"),
        "processing_time_ms": processing_time_ms
    }

@router.post("/confirm")
async def assistant_confirm(req: ConfirmRequest):
    """
    Confirm and execute a write-action intent.
    """
    start_time = time.perf_counter()
    
    try:
        data = execute_confirmed_intent(req.intent)
        response_text = generate_response(req.query, data, req.intent)
    except Exception as e:
        # Graceful error payload instead of 500
        data = {"error": str(e), "status": "error"}
        response_text = f"An error occurred while executing the action: {str(e)}"
        
    processing_time_ms = round((time.perf_counter() - start_time) * 1000, 1)
    
    return {
        "response": response_text,
        "intent": req.intent,
        "data": data,
        "status": "success",
        "processing_time_ms": processing_time_ms
    }
