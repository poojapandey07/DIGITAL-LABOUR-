from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new worker or employer account."""
    # Normalize phone
    clean_phone = user_in.phone.strip().replace(" ", "")

    existing_user = db.query(User).filter(User.phone == clean_phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="यह मोबाइल नंबर पहले से पंजीकृत है (Mobile number is already registered)"
        )

    # Hash password and create record
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        name=user_in.name.strip(),
        phone=clean_phone,
        role=user_in.role,
        hashed_password=hashed_pwd,
        location=user_in.location.strip() if user_in.location else None,
        skills=user_in.skills or [],
        experience_years=user_in.experience_years,
        daily_wage=user_in.daily_wage,
        bio=user_in.bio,
        company_name=user_in.company_name,
        business_type=user_in.business_type,
        contact_person=user_in.contact_person
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with phone and password, returning JWT access token."""
    clean_phone = login_in.phone.strip().replace(" ", "")
    user = db.query(User).filter(User.phone == clean_phone).first()

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="गलत मोबाइल नंबर या पासवर्ड (Invalid phone or password)"
        )

    if login_in.expected_role and user.role != login_in.expected_role:
        expected_name = "श्रमिक" if login_in.expected_role == UserRole.WORKER else "नियोक्ता"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"यह खाता {user.role.value} के रूप में पंजीकृत है। कृपया सही {expected_name} पोर्टल से लॉगिन करें।"
        )

    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Get profile of current authenticated user from JWT token."""
    return UserOut.model_validate(current_user)
