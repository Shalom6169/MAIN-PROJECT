# auth.py
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
import random
from models import OTP
from database import SessionLocal
import os
import smtplib
from email.message import EmailMessage

# Secret key for JWT (change to secure in production)
SECRET_KEY = os.environ.get("JWT_SECRET", "change_me_please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60*24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# OTP helpers
def generate_otp_code(length=6):
    return "".join([str(random.randint(0,9)) for _ in range(length)])

def send_otp(email: str, code: str, purpose: str = "register"):
    """
    Send an OTP. If SMTP env variables are set it will send actual email.
    Otherwise it will print to console (useful for dev).
    """
    SMTP_HOST = os.environ.get("SMTP_HOST")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER = os.environ.get("SMTP_USER")
    SMTP_PASS = os.environ.get("SMTP_PASS")
    if SMTP_HOST and SMTP_USER and SMTP_PASS:
        msg = EmailMessage()
        msg["Subject"] = f"Your OTP for {purpose}"
        msg["From"] = SMTP_USER
        msg["To"] = email
        msg.set_content(f"Your OTP code: {code}\nIt will expire in 10 minutes.")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)
    else:
        # no SMTP configured — print to console (dev)
        print(f"[OTP] {purpose} -> {email} : {code}")
        return