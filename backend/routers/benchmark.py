"""Benchmark router: pandas vs cuDF GPU acceleration comparison."""
from fastapi import APIRouter, Query, BackgroundTasks
from services.benchmark import run_benchmark

router = APIRouter()


@router.post("/run", response_model=dict)
async def run_benchmark_endpoint(
    n_rows: int = Query(default=500_000, ge=10_000, le=5_000_000),
):
    """
    Run the pandas vs cuDF benchmark on a synthetic dataset.

    Executes 5 operations:
    - GroupBy Aggregation
    - Rolling Average (7-day)
    - DataFrame Merge (JOIN)
    - Multi-Column Sort
    - Filter & Risk Compute

    Returns timing results for each operation with speedup multiplier.
    """
    return run_benchmark(n_rows)


@router.get("/operations", response_model=list)
async def get_benchmark_operations():
    """Return metadata about the available benchmark operations."""
    return [
        {
            "key": "groupby_aggregation",
            "label": "GroupBy Aggregation",
            "description": "Group sales by category+product, compute sum/mean/count",
            "typical_speedup": "7-9×",
        },
        {
            "key": "rolling_average",
            "label": "Rolling Average (7-day)",
            "description": "Calculate 7-day moving average demand per product",
            "typical_speedup": "10-14×",
        },
        {
            "key": "dataframe_merge",
            "label": "DataFrame Merge (JOIN)",
            "description": "Join sales data with inventory table on product_id",
            "typical_speedup": "8-11×",
        },
        {
            "key": "sort_values",
            "label": "Multi-Column Sort",
            "description": "Sort 500k rows by category, product, date, revenue",
            "typical_speedup": "5-8×",
        },
        {
            "key": "filter_and_compute",
            "label": "Filter & Risk Compute",
            "description": "Filter by stockout risk and compute margin statistics",
            "typical_speedup": "7-10×",
        },
    ]
