from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import User
from app.schemas.common import Token, UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    user = User(
        email=user_in.email,
        hashed_password=f"hash_{user_in.password}", # Safe mock/local hash
        full_name=user_in.full_name,
        role=user_in.role or "researcher",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        # Auto-create demo cadet if login as cadet for convenience
        user = User(
            email=login_data.email,
            hashed_password="hash_password",
            full_name="ECHO Analyst",
            role="student",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return Token(
        access_token=f"echo_jwt_token_{user.id}_{user.role}",
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserOut)
def get_current_user(db: Session = Depends(get_db)):
    # Default active session user
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found.")
    return user
