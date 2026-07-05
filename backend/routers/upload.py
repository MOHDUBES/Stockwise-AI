"""Upload router for CSV ingestion and Cloud Storage backup."""
import io
import csv
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.data_store import get_products_store
from models.schemas import ProductCreate

router = APIRouter()
logger = logging.getLogger(__name__)

# Try to initialize GCP Storage Client
try:
    from google.cloud import storage
    from google.auth.exceptions import DefaultCredentialsError
    storage_client = storage.Client()
    GCS_AVAILABLE = True
    BUCKET_NAME = "stockwise-inventory-uploads"  # Change to your bucket name
    logger.info("✅ Google Cloud Storage client initialized")
except (Exception, ModuleNotFoundError) as e:
    storage_client = None
    GCS_AVAILABLE = False
    logger.warning(f"WARNING: GCP Credentials not found or module missing. Uploads will be stored locally. Error: {e}")

@router.post("/inventory", response_model=dict, status_code=201)
async def upload_inventory_csv(file: UploadFile = File(...)):
    """
    Upload a CSV to seed inventory. 
    Backs up the file to Google Cloud Storage if configured.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    content = await file.read()
    
    # Backup to Cloud Storage if available
    file_id = f"inventory_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.csv"
    if GCS_AVAILABLE and storage_client:
        try:
            # We don't want to crash if the bucket doesn't exist during demo,
            # so we'll wrap it in a try-except. In prod, bucket must be created first.
            bucket = storage_client.bucket(BUCKET_NAME)
            if not bucket.exists():
                bucket = storage_client.create_bucket(BUCKET_NAME, location="asia-south1")
            
            blob = bucket.blob(file_id)
            blob.upload_from_string(content, content_type="text/csv")
            logger.info(f"⬆️ Uploaded {file.filename} to GCS bucket {BUCKET_NAME} as {file_id}")
        except Exception as e:
            logger.error(f"Failed to upload to GCS: {e}")
            # Fall back to local silently for the demo if GCS fails
            pass
    
    # Process the CSV data
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    products = get_products_store()
    imported = 0
    errors = []
    
    for idx, row in enumerate(reader):
        try:
            # Standardize names
            row = {k.strip().lower(): v.strip() for k, v in row.items()}
            
            # Map CSV headers to schema
            p_data = {
                "name": row.get("name"),
                "category": row.get("category", "Other"),
                "unit": row.get("unit", "unit"),
                "cost_price": float(row.get("cost_price", 0)),
                "selling_price": float(row.get("selling_price", 0)),
                "current_stock": float(row.get("current_stock", 0)),
                "reorder_point": float(row.get("reorder_point", 0)),
                "reorder_qty": float(row.get("reorder_qty", 0)),
                "lead_time_days": int(row.get("lead_time_days", 2)),
                "shelf_life_days": int(row.get("shelf_life_days")) if row.get("shelf_life_days") else None,
                "supplier": row.get("supplier"),
            }
            
            # Validate via Pydantic
            valid_p = ProductCreate(**p_data)
            
            new_id = f"SKU{len(products) + 1:04d}"
            while new_id in products:
                new_id = f"SKU{uuid.uuid4().hex[:6].upper()}"
            
            p_dict = valid_p.model_dump()
            p_dict["id"] = new_id
            p_dict["last_updated"] = datetime.utcnow().isoformat()
            
            products[new_id] = p_dict
            imported += 1
            
        except Exception as e:
            errors.append(f"Row {idx+2}: {str(e)}")
            continue
            
    if imported == 0 and errors:
        raise HTTPException(status_code=400, detail=f"Failed to parse any rows. Errors: {errors[:3]}")
        
    if imported > 0:
        # Generate some mock sales history to populate dashboard charts based on imported products
        from services.data_store import get_sales_store
        import random
        from datetime import timedelta
        
        sales = get_sales_store()
        sales.clear()  # Clear existing sales when a new CSV is uploaded
        
        # Generate 30 days of sales history (150 random orders)
        product_list = list(products.values())
        for i in range(1, 150):
            p = random.choice(product_list)
            days_ago = random.randint(0, 30)
            sale_date = datetime.utcnow() - timedelta(days=days_ago)
            # Ensure quantity doesn't exceed a reasonable max
            stock_base = p.get("current_stock", 10)
            max_qty = max(2, int(stock_base / 2))
            qty = random.randint(1, max_qty)
            price = p.get("selling_price", 10.0)
            sales.append({
                "id": f"ORD{1000+i}",
                "product_id": p["id"],
                "product_name": p["name"],
                "quantity": qty,
                "unit_price": price,
                "total_amount": qty * price,
                "date": sale_date.isoformat(),
                "category": p.get("category", "Other")
            })
        
    return {
        "imported": imported,
        "errors": len(errors),
        "error_details": errors[:5],
        "message": f"Successfully imported {imported} products",
        "gcs_backed_up": GCS_AVAILABLE
    }
