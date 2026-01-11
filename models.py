# models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from database import Base
from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OTP(Base):
    __tablename__ = "otps"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    email = Column(String(256), nullable=False)
    code = Column(String(8), nullable=False)
    expiry = Column(DateTime, nullable=False)
    purpose = Column(String(32), nullable=False)  # 'register' or 'reset'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DriverProfile(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    name = Column(String(128))
    phone = Column(String(32))
    vehicle_no = Column(String(32))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LogEntry(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, nullable=True)
    event_type = Column(String(64))
    data = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

# Pydantic schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_verified: bool
    is_admin: bool
    class Config:
        orm_mode = True