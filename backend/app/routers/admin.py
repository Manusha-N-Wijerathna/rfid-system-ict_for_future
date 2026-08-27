from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/admin", tags=["Admin"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def ensure_default_admin(db: Session):
    try:
        admin = db.query(models.Admin).first()
        if not admin:
            default_admin = models.Admin(
                full_name="System Administrator",
                username="admin",
                password_hash=hash_password("admin123"),
                profile_picture=None,
            )
            db.add(default_admin)
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Admin table check error: {e}")


@router.post("/login")
def login(data: schemas.AdminLoginIn, db: Session = Depends(get_db)):
    ensure_default_admin(db)
    admin = db.query(models.Admin).filter(
        models.Admin.username == data.username.strip()
    ).first()

    if not admin or admin.password_hash != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "message": "Login successful",
        "token": f"admin-token-{admin.id}",
        "admin": {
            "id": admin.id,
            "full_name": admin.full_name,
            "username": admin.username,
            "profile_picture": admin.profile_picture,
        }
    }


@router.get("/profile", response_model=schemas.AdminProfileOut)
def get_profile(db: Session = Depends(get_db)):
    ensure_default_admin(db)
    admin = db.query(models.Admin).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")
    return admin


@router.put("/profile", response_model=schemas.AdminProfileOut)
def update_profile(data: schemas.AdminProfileUpdate, db: Session = Depends(get_db)):
    ensure_default_admin(db)
    admin = db.query(models.Admin).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin profile not found")

    if data.full_name is not None and data.full_name.strip():
        admin.full_name = data.full_name.strip()

    if data.username is not None and data.username.strip():
        existing = db.query(models.Admin).filter(
            models.Admin.username == data.username.strip(),
            models.Admin.id != admin.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username is already in use")
        admin.username = data.username.strip()

    if data.password is not None and data.password.strip():
        admin.password_hash = hash_password(data.password.strip())

    if data.profile_picture is not None:
        admin.profile_picture = data.profile_picture

    db.commit()
    db.refresh(admin)
    return admin
