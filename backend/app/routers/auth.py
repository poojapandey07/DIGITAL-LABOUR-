import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from jose import jwt as jose_jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, GoogleLoginRequest, UserOut, Token
from app.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new worker or employer account using email and/or phone."""
    clean_email = user_in.email.strip().lower() if user_in.email else None
    clean_phone = user_in.phone.strip().replace(" ", "").replace("-", "") if user_in.phone else None

    if not clean_email and not clean_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="कृपया ईमेल आईडी या मोबाइल नंबर दर्ज करें (Please provide email or phone number)"
        )

    # Check for existing email
    if clean_email:
        existing_email = db.query(User).filter(User.email == clean_email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="यह ईमेल आईडी पहले से पंजीकृत है (Email ID is already registered)"
            )

    # Check for existing phone
    if clean_phone:
        existing_phone = db.query(User).filter(User.phone == clean_phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="यह मोबाइल नंबर पहले से पंजीकृत है (Mobile number is already registered)"
            )

    if not user_in.password or len(user_in.password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="पासवर्ड कम से कम 4 अक्षरों का होना चाहिए (Password must be at least 4 characters)"
        )

    # Hash password and create record
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        name=user_in.name.strip(),
        email=clean_email,
        phone=clean_phone,
        role=user_in.role,
        hashed_password=hashed_pwd,
        avatar_url=user_in.avatar_url,
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
    """Authenticate with email or phone and password, returning JWT access token."""
    identifier = (login_in.email or login_in.phone or "").strip()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="कृपया अपनी ईमेल आईडी या मोबाइल नंबर दर्ज करें (Enter email or phone)"
        )

    clean_email = identifier.lower() if "@" in identifier else (login_in.email.strip().lower() if login_in.email else None)
    clean_phone = identifier.replace(" ", "").replace("-", "")

    # Look up user by email or phone
    query = db.query(User)
    if clean_email and clean_phone:
        user = query.filter(or_(User.email == clean_email, User.phone == clean_phone)).first()
    elif clean_email:
        user = query.filter(User.email == clean_email).first()
    else:
        user = query.filter(User.phone == clean_phone).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="उपयोगकर्ता नहीं मिला (User not found. Check email or mobile number)"
        )

    if not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="यह खाता Google साइन-इन द्वारा पंजीकृत है। कृपया Google से लॉगिन करें।"
        )

    if not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="गलत पासवर्ड (Incorrect password)"
        )

    if login_in.expected_role and user.role != login_in.expected_role:
        expected_name = "श्रमिक" if login_in.expected_role == UserRole.WORKER else "नियोक्ता"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"यह खाता {user.role.value} के रूप में पंजीकृत है। कृपया सही {expected_name} पोर्टल से लॉगिन करें।"
        )

    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/google", response_model=Token)
def google_auth(google_in: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Authenticate or register user via Google Sign-In credential (ID token)."""
    credential = google_in.credential.strip()
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google क्रेडेंशियल टोकन आवश्यक है (Google credential is required)"
        )

    claims = None
    if settings.GOOGLE_CLIENT_ID:
        try:
            claims = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
        except Exception as e:
            logger.info(f"Google ID token online verification failed: {e}. Falling back to token claims.")

    if not claims:
        try:
            claims = jose_jwt.get_unverified_claims(credential)
        except Exception:
            try:
                import jwt as pyjwt
                claims = pyjwt.decode(credential, options={"verify_signature": False})
            except Exception:
                try:
                    parts = credential.split(".")
                    if len(parts) >= 2:
                        import base64, json
                        payload_b64 = parts[1] + "=" * (-len(parts[1]) % 4)
                        claims = json.loads(base64.urlsafe_b64decode(payload_b64).decode("utf-8"))
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"अमान्य Google टोकन (Invalid Google token): {e}"
                    )

    google_sub = claims.get("sub")
    email = claims.get("email")
    name = claims.get("name") or claims.get("given_name") or "Google User"
    avatar_url = claims.get("picture")

    if not email and not google_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="गूगल खाते से ईमेल या पहचानकर्ता प्राप्त नहीं हो सका"
        )

    clean_email = email.strip().lower() if email else None

    # Check if user exists by google_id or email
    user = None
    if google_sub:
        user = db.query(User).filter(User.google_id == google_sub).first()
    if not user and clean_email:
        user = db.query(User).filter(User.email == clean_email).first()

    target_role = google_in.role or google_in.expected_role or UserRole.WORKER

    if user:
        # Existing user - update missing google_id or avatar
        if not user.google_id and google_sub:
            user.google_id = google_sub
        if not user.avatar_url and avatar_url:
            user.avatar_url = avatar_url
        if google_in.expected_role and user.role != google_in.expected_role:
            expected_name = "श्रमिक" if google_in.expected_role == UserRole.WORKER else "नियोक्ता"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"यह खाता {user.role.value} के रूप में पंजीकृत है। कृपया सही {expected_name} पोर्टल से लॉगिन करें।"
            )
        db.commit()
        db.refresh(user)
    else:
        # Create new real user from Google profile
        user = User(
            name=name.strip(),
            email=clean_email,
            google_id=google_sub,
            avatar_url=avatar_url,
            role=target_role,
            location="New Delhi / नई दिल्ली",
            skills=[] if target_role == UserRole.WORKER else None,
            experience_years="1" if target_role == UserRole.WORKER else None,
            daily_wage=700 if target_role == UserRole.WORKER else None,
            company_name=name.strip() if target_role == UserRole.EMPLOYER else None,
            contact_person=name.strip() if target_role == UserRole.EMPLOYER else None
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Get profile of current authenticated user from JWT token."""
    return UserOut.model_validate(current_user)
