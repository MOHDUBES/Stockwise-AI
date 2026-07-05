from fastapi import APIRouter, Response, Request, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from jose import jwt, JWTError
from datetime import datetime, timedelta
import random
import logging
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter()

SECRET_KEY = "super-secret-demo-key-do-not-use-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str

class ForgotPasswordRequest(BaseModel):
    username: str

class VerifyOTPRequest(BaseModel):
    username: str
    otp: str

class ResetPasswordRequest(BaseModel):
    username: str
    reset_token: str
    new_password: str

DB_FILE = "users_db.json"

def load_users():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "demo": {
            "password": "password",
            "name": "Raju (Demo User)"
        }
    }

def save_users(db):
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=4)

fake_users_db = load_users()

# OTP Store: username -> {"otp": "123456", "expires_at": datetime, "reset_token": "token"}
otp_store = {}

def send_otp_email(to_email: str, otp: str):
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    if not smtp_email or not smtp_password or smtp_email == "your_email@gmail.com":
        logging.warning("SMTP credentials not configured. Skipping real email dispatch.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_email
        msg['To'] = to_email
        msg['Subject'] = "StockWise AI - Password Reset OTP"
        
        body = f"""
        Hello,
        
        Your OTP for resetting your StockWise AI password is: {otp}
        
        It is valid for 10 minutes.
        
        If you did not request this, please ignore this email.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
        logging.info(f"✅ Real OTP email successfully sent to {to_email}")
    except Exception as e:
        logging.error(f"❌ Failed to send OTP email to {to_email}: {e}")

class UserResponse(BaseModel):
    username: str
    name: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        name: str = payload.get("name")
        if username is None:
            return None
        return {"username": username, "name": name}
    except JWTError:
        return None

@router.post("/register")
async def register(req: RegisterRequest, response: Response):
    if req.username in fake_users_db:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    fake_users_db[req.username] = {
        "password": req.password,
        "name": req.name
    }
    save_users(fake_users_db)
    
    access_token = create_access_token(data={"sub": req.username, "name": req.name})
    response.set_cookie(
        key="session_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False
    )
    return {"status": "success", "message": "Registered successfully"}

@router.post("/login")
async def login(req: LoginRequest, response: Response):
    user = fake_users_db.get(req.username)
    if user and user["password"] == req.password:
        access_token = create_access_token(data={"sub": req.username, "name": user["name"]})
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=access_token,
            httponly=True,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax",
            secure=False # Set to True in production with HTTPS
        )
        return {"status": "success", "message": "Logged in successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

@router.post("/google")
async def google_login(response: Response):
    # This is a demo endpoint that bypasses real OAuth and creates a mock Google session
    mock_google_username = "google_user"
    mock_google_name = "Google User (Demo)"
    
    # Ensure they exist in our fake db
    if mock_google_username not in fake_users_db:
        fake_users_db[mock_google_username] = {
            "password": "mock_google_password_never_used",
            "name": mock_google_name
        }
        save_users(fake_users_db)
        
    access_token = create_access_token(data={"sub": mock_google_username, "name": mock_google_name})
    response.set_cookie(
        key="session_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False
    )
    return {"status": "success", "message": "Logged in with Google successfully", "user": {"username": mock_google_username, "name": mock_google_name}}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="session_token")
    return {"status": "success", "message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    if req.username not in fake_users_db:
        # Prevent username enumeration by returning success anyway
        return {"status": "success", "message": "If an account exists, an OTP has been sent."}
    
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    otp_store[req.username] = {
        "otp": otp,
        "expires_at": expires_at,
        "reset_token": None
    }
    
    # Mock Email Sending Logs
    logging.info(f"========== EMAIL SENT ==========")
    logging.info(f"To: {req.username}")
    logging.info(f"Subject: Password Reset OTP")
    logging.info(f"Body: Your OTP for StockWise AI is {otp}. It is valid for 10 minutes.")
    logging.info(f"================================")
    
    # Real Email Sending queued in background
    background_tasks.add_task(send_otp_email, req.username, otp)
    
    return {"status": "success", "message": "If an account exists, an OTP has been sent."}

@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    record = otp_store.get(req.username)
    
    if not record or record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    # Generate a temporary reset token
    reset_token = f"reset_{random.randint(1000000, 9999999)}"
    record["reset_token"] = reset_token
    
    return {"status": "success", "message": "OTP verified successfully", "reset_token": reset_token}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    record = otp_store.get(req.username)
    
    if not record or record["reset_token"] != req.reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    if req.username not in fake_users_db:
        raise HTTPException(status_code=400, detail="User not found")
        
    # Update password
    fake_users_db[req.username]["password"] = req.new_password
    save_users(fake_users_db)
    
    # Clear OTP record
    del otp_store[req.username]
    
    return {"status": "success", "message": "Password reset successfully. You can now login."}
