
class UserProfileUpdate(BaseModel):
    username: str
    email: EmailStr

@app.post("/api/profile/update")
def update_profile(
    username: str = Form(...),
    email: str = Form(...),
    token: str = Form(...), # Simple token auth for now as per other endpoints
    db: Session = Depends(get_db)
):
    # Verify token (simple decode)
    try:
        payload = decode_access_token(token)
        user_email = payload.get("sub")
        if user_email is None:
             raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if new email/username is taken by ANOTHER user
    existing = db.query(User).filter(
        ((User.email == email) | (User.username == username)) & (User.id != user.id)
    ).first()
    if existing:
         raise HTTPException(status_code=400, detail="Username or Email already in use")

    user.username = username
    user.email = email
    db.commit()
    db.refresh(user)
    
    return {"ok": True, "message": "Profile updated successfully", "username": user.username, "email": user.email}
