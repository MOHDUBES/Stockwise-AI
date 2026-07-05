"""
conftest.py — pytest session-level fixtures.
Seeds data before tests run.
"""
import pytest
import asyncio
from services.data_store import clear_stores


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def reset_store():
    """Reset in-memory store before each test for isolation."""
    clear_stores()
    from services.seed_data import seed_sample_data
    await seed_sample_data()
    yield
    # Cleanup handled by next test
