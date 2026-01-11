# main.py
from fastapi import FastAPI, Request, Form, Depends, HTTPException, Header
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

# Import your existing DB/session/models/auth helpers
# Ensure these modules exist and export the names used below
from database import SessionLocal, engine
import models
from models import User, OTP, DriverProfile, LogEntry

# auth helpers you already used earlier
from auth import (
    get_password_hash, verify_password, create_access_token,
    decode_access_token, generate_otp_code, send_otp
)

# Create DB tables (safe to call on every start)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vehicle Safety - Web Frontend")

# Serve static files from ./static
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# Dependency: DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Pages ---
@app.get("/", response_class=HTMLResponse)
async def landing_page(request: Request):
    return templates.TemplateResponse("landing.html", {"request": request})


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    # you can check token here in prod; for demo we just render template
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/drivers", response_class=HTMLResponse)
async def drivers_page(request: Request):
    return templates.TemplateResponse("drivers.html", {"request": request, "drivers": list(MOCK_DRIVERS.values())})


# API Models
class DriverModel(BaseModel):
    name: str
    vehicle: str
    phone: str
    license: Optional[str] = "PENDING"
    status: Optional[str] = "Active Now"
    bg_color: Optional[str] = "#10b981" # Green default

@app.post("/api/drivers")
async def add_driver(driver: DriverModel):
    new_id = max(MOCK_DRIVERS.keys()) + 1 if MOCK_DRIVERS else 1
    new_driver = driver.dict()
    new_driver['id'] = new_id
    new_driver['score'] = 100 # Default score
    new_driver['status_color'] = "#34d399"
    new_driver['drive_time'] = "0h 0m"
    new_driver['distance'] = "0 km"
    new_driver['photo'] = "/static/img/driver_1.png" # Placeholder
    new_driver['ear'] = 0.30
    new_driver['mar'] = 0.02
    new_driver['auth_status'] = "Verified"
    new_driver['face_confidence'] = 99.0
    new_driver['last_verified'] = "Just now"

    MOCK_DRIVERS[new_id] = new_driver
    return {"success": True, "driver": new_driver}

@app.put("/api/drivers/{driver_id}")
async def update_driver(driver_id: int, driver: DriverModel):
    if driver_id not in MOCK_DRIVERS:
        return {"success": False, "error": "Driver not found"}
    
    # Update existing fields
    MOCK_DRIVERS[driver_id].update(driver.dict(exclude_unset=True))
    return {"success": True, "driver": MOCK_DRIVERS[driver_id]}

@app.delete("/api/drivers/{driver_id}")
async def delete_driver(driver_id: int):
    if driver_id in MOCK_DRIVERS:
        del MOCK_DRIVERS[driver_id]
        return {"success": True}
    return {"success": False, "error": "Driver not found"}


# Mock Drivers Database (unchanged)
MOCK_DRIVERS = {
    1: {
        "id": 1, 
        "name": "Akash", 
        "vehicle": "KA-01-A-1234", 
        "phone": "+91 98765 43210", 
        "status": "Active Now",
        "status_color": "#34d399",
        "license": "DL-1234-5678",
        "shift_start": "08:00 AM",
        "drive_time": "4h 15m",
        "distance": "142 km",
        "score": 94,
        "ear": 0.32,
        "mar": 0.02,
        "auth_status": "Verified",
        "face_confidence": 99.2,
        "last_verified": "Just now",
        "bg_color": "#10b981",
        "photo": "/static/img/driver_1.png"
    },
    2: {
        "id": 2, 
        "name": "Ravi", 
        "vehicle": "KA-09-B-5678", 
        "phone": "+91 87654 32109", 
        "status": "Inactive (Resting)",
        "status_color": "#fbbf24",
        "license": "DL-8765-4321",
        "shift_start": "06:00 AM",
        "drive_time": "6h 30m",
        "distance": "210 km",
        "score": 88,
        "ear": 0.28,
        "mar": 0.05,
        "auth_status": "Verified",
        "face_confidence": 98.5,
        "last_verified": "5 mins ago",
        "bg_color": "#f59e0b",
        "photo": "/static/img/driver_2.png"
    },
    3: {
        "id": 3, 
        "name": "Sneha", 
        "vehicle": "KL-07-C-2345", 
        "phone": "+91 76543 21098", 
        "status": "Active Now",
        "status_color": "#34d399",
        "license": "DL-5678-1234",
        "shift_start": "10:30 AM",
        "drive_time": "2h 45m",
        "distance": "85 km",
        "score": 98,
        "ear": 0.35,
        "mar": 0.01,
        "auth_status": "Verified",
        "face_confidence": 99.8,
        "last_verified": "Just now",
        "bg_color": "#10b981",
        "photo": "/static/img/driver_3.png"
    }
}

@app.get("/driver/{driver_id}", response_class=HTMLResponse)
async def driver_details_page(request: Request, driver_id: int):
    driver = MOCK_DRIVERS.get(driver_id, MOCK_DRIVERS[1]) 
    return templates.TemplateResponse("driver_details.html", {"request": request, "driver": driver})


@app.get("/logs", response_class=HTMLResponse)
async def logs_page(request: Request):
    return templates.TemplateResponse("logs.html", {"request": request})


@app.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request):
    return templates.TemplateResponse("settings.html", {"request": request})


# New: verify page that shows OTP input and pre-fills email if provided
@app.get("/verify", response_class=HTMLResponse)
async def verify_page(request: Request, email: Optional[str] = None):
    return templates.TemplateResponse("verify.html", {"request": request, "email": email or ""})


# --- API endpoints ---

@app.post("/api/register")
def api_register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # ensure unique
    exists = db.query(User).filter((User.username == username) | (User.email == email)).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username or email already taken.")
    # secure password
    hashed = get_password_hash(password)
    
    try:
        user = User(username=username, email=email, password_hash=hashed, is_admin=False, is_verified=False)
        db.add(user)
        db.commit()
        db.refresh(user)

        # create OTP record
        code = generate_otp_code(6)
        expiry = datetime.utcnow() + timedelta(minutes=10)
        otp = OTP(user_id=user.id, email=email, code=code, expiry=expiry, purpose="register")
        db.add(otp)
        db.commit()

        # send OTP
        try:
            send_otp(email, code, purpose="register")
        except Exception as e:
            # log warning but don't fail registration
            print(f"OTP Send Error: {e}")
            return JSONResponse(status_code=200, content={"ok": True, "message": "User created. OTP failed to send. Check logs.", "email": email})

        return {"ok": True, "message": "User created. OTP sent to email.", "email": email}

    except Exception as e:
        db.rollback()
        print(f"Registration Error: {e}")
        return JSONResponse(status_code=500, content={"detail": f"Registration failed: {str(e)}"})


@app.post("/api/verify-otp")
def api_verify_otp(email: str = Form(...), code: str = Form(...), purpose: str = Form("register"), db: Session = Depends(get_db)):
    rec = (
        db.query(OTP)
        .filter(OTP.email == email, OTP.code == code, OTP.purpose == purpose)
        .order_by(OTP.id.desc())
        .first()
    )
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if rec.expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    # Only mark user as verified if this was a registration OTP
    if purpose == "register":
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.is_verified = True
            db.commit()

    return {"ok": True, "message": "Verified"}


@app.post("/api/login")
def api_login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Account not verified")
    token = create_access_token({"sub": user.email, "user_id": user.id})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/api/request-reset")
def api_request_reset(email: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user")
    code = generate_otp_code(6)
    expiry = datetime.utcnow() + timedelta(minutes=10)
    o = OTP(user_id=user.id, email=email, code=code, expiry=expiry, purpose="reset")
    db.add(o)
    db.commit()
    send_otp(email, code, purpose="reset")
    return {"ok": True, "message": "OTP sent"}


@app.post("/api/reset-password")
def api_reset_password(email: str = Form(...), code: str = Form(...), new_password: str = Form(...), db: Session = Depends(get_db)):
    rec = (
        db.query(OTP)
        .filter(OTP.email == email, OTP.code == code, OTP.purpose == "reset")
        .order_by(OTP.id.desc())
        .first()
    )
    if not rec or rec.expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    user = db.query(User).filter(User.email == email).first()
    user.password_hash = get_password_hash(new_password)
    user.is_verified = True  # Mark verified since they proved email ownership
    db.commit()
    return {"ok": True, "message": "Password reset successful"}


@app.get("/api/profile")
def api_get_profile(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        # Fallback: check validation of standard Bearer flow
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        payload = decode_access_token(token)
        if not payload:
             raise HTTPException(status_code=401, detail="Invalid token")
             
        user_email = payload.get("sub")
        user = db.query(User).filter(User.email == user_email).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "ok": True,
            "username": user.username,
            "email": user.email,
            "role": "System Administrator" if user.is_admin else "Standard User",
            "is_verified": user.is_verified
        }
    except Exception as e:
        print(f"Profile Fetch Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token or expired session")

@app.post("/api/update-profile")
def api_update_profile(
    username: str = Form(...),
    email: str = Form(...),
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    # secure token check
    try:
        payload = decode_access_token(token)
        user_email = payload.get("sub")
        if not user_email:
             raise HTTPException(status_code=401, detail="Invalid token")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check uniqueness if changing
    if username != user.username or email != user.email:
        existing = db.query(User).filter(
            ((User.username == username) | (User.email == email)) & (User.id != user.id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username or Email already taken")

    user.username = username
    user.email = email
    db.commit()
    
    return {"ok": True, "message": "Profile updated"}


@app.post("/api/change-password")
def api_change_password(
    current_password: str = Form(...),
    new_password: str = Form(...),
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    # 1. Verify Token
    try:
        payload = decode_access_token(token)
        user_email = payload.get("sub")
        if not user_email:
             raise HTTPException(status_code=401, detail="Invalid token")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Verify Current Password
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    # 3. Update Password
    user.password_hash = get_password_hash(new_password)
    db.commit()

    return {"ok": True, "message": "Password updated successfully"}


# Driver profile endpoints (examples)
@app.post("/api/driver/profile")
def create_driver_profile(token: str = Form(...), name: str = Form(...), phone: str = Form(None), vehicle_no: str = Form(None), db: Session = Depends(get_db)):
    # token validation omitted for brevity
    user = db.query(User).filter(User.email == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    dp = DriverProfile(user_id=user.id, name=name, phone=phone, vehicle_no=vehicle_no)
    db.add(dp)
    db.commit()
    db.refresh(dp)
    return {"ok": True, "driver_id": dp.id}


@app.post("/api/driver/log")
def driver_log(token: str = Form(...), driver_id: int = Form(...), event_type: str = Form(...), data: str = Form(None), db: Session = Depends(get_db)):
    log = LogEntry(driver_id=driver_id, event_type=event_type, data=data or "{}")
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"ok": True, "log_id": log.id}
@app.get("/logout")
async def logout():
    # Frontend will clear localStorage and redirect to login
    return {"ok": True, "message": "Logged out"}
@app.get("/forgot", response_class=HTMLResponse)
async def forgot_page(request: Request):
    return templates.TemplateResponse("forgot.html", {"request": request})

@app.get("/verify-reset", response_class=HTMLResponse)
async def page_verify_reset(request: Request):
    return templates.TemplateResponse("verify-reset.html", {"request": request})

@app.get("/reset-password", response_class=HTMLResponse)
async def page_reset_password(request: Request):
    return templates.TemplateResponse("reset-password.html", {"request": request})
@app.get("/forgot-password", response_class=HTMLResponse)
async def forgot_password_page(request: Request):
    return templates.TemplateResponse("forgot_password.html", {"request": request})