"""
Smart Inventory & Sales Decision Assistant — FastAPI Backend
Author: Antigravity / Google DeepMind
"""

import os
import logging
from contextlib import asynccontextmanager

# Load .env file before any other imports that might read env vars
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, rely on system env vars

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from routers import inventory, sales, reorder, forecast, risk, benchmark, upload, assistant, auth
from services.seed_data import seed_sample_data

# GPU Acceleration injection: cudf.pandas
if os.getenv("USE_REAL_CUDF", "false").lower() == "true":
    try:
        import cudf.pandas
        cudf.pandas.install()
        logging.info("⚡ cudf.pandas activated: all pandas operations are now GPU-accelerated")
    except ImportError:
        logging.warning("⚠️ USE_REAL_CUDF=true but cudf is not installed. Falling back to CPU pandas.")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    logger.info("🚀 Starting Smart Inventory & Sales Decision Assistant API")
    # Seed sample data on fresh start disabled for real CSV upload
    # await seed_sample_data()
    # logger.info("✅ Sample data seeded")
    yield
    logger.info("🛑 Shutting down API")


app = FastAPI(
    title="Smart Inventory & Sales Decision Assistant",
    description=(
        "AI-powered inventory management for kirana stores and local retail shops. "
        "Transforms daily reorder decisions from hours of manual work to seconds."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Routers
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["Inventory"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Sales"])
app.include_router(reorder.router, prefix="/api/v1/reorder", tags=["Reorder"])
app.include_router(forecast.router, prefix="/api/v1/forecast", tags=["Forecast"])
app.include_router(risk.router, prefix="/api/v1/risk", tags=["Risk"])
app.include_router(benchmark.router, prefix="/api/v1/benchmark", tags=["Benchmark"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["Upload"])
app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["Assistant"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint for Cloud Run."""
    return {
        "status": "healthy",
        "service": "smart-inventory-assistant",
        "version": "1.0.0",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."},
    )

# End of main.py
