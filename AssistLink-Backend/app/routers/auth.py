from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import RedirectResponse, JSONResponse
from app.schemas import UserCreate, UserResponse, LoginRequest
from app.database import supabase, supabase_admin
from app.dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional
import sys

router = APIRouter()


class GoogleOAuthCallback(BaseModel):
    code: Optional[str] = None
    error: Optional[str] = None
    state: Optional[str] = None


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name,
                    "role": user_data.role
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )
        
        # Get user ID from auth response
        user_id = auth_response.user.id if hasattr(auth_response.user, 'id') else auth_response.user.get('id') if isinstance(auth_response.user, dict) else str(auth_response.user)
        
        # Create user profile in database
        user_profile = {
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "phone": user_data.phone,
            "date_of_birth": user_data.date_of_birth.isoformat() if user_data.date_of_birth else None,
            "role": user_data.role,
            "address": user_data.address,
            "profile_photo_url": user_data.profile_photo_url
        }
        
        # Use supabase_admin (service role) to bypass RLS policies for profile creation
        profile_response = supabase_admin.table("users").insert(user_profile).execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user profile"
            )
        
        return profile_response.data[0]
    
    except Exception as e:
        if "already registered" in str(e).lower() or "already exists" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/login")
async def login(credentials: LoginRequest):
    """Login user and get access token"""
    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if session exists and has access_token
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login failed: No session created. Please check your credentials."
            )
        
        if not hasattr(response.session, 'access_token') or not response.session.access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login failed: Invalid session. Please try again."
            )
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token if hasattr(response.session, 'refresh_token') else None,
            "token_type": "bearer",
            "user": response.user
        }
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_message = str(e).lower()
        sys.stderr.write(f"[ERROR] Login error: {str(e)}\n")
        sys.stderr.flush()
        
        # Provide more specific error messages
        if "invalid login credentials" in error_message or "invalid_credentials" in error_message:
            detail = "Invalid email or password. Please check your credentials."
        elif "email not confirmed" in error_message or "email_not_confirmed" in error_message:
            detail = "Email not verified. Please check your email for verification link."
        elif "network" in error_message or "connection" in error_message:
            detail = "Network error: Unable to connect to authentication service. Please try again."
        else:
            detail = f"Login failed: {str(e)}"
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    try:
        from app.dependencies import get_user_id
        
        user_id = get_user_id(current_user)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user data: user ID not found"
            )
        
        # Use supabase_admin to bypass RLS policies
        response = supabase_admin.table("users").select("*").eq("id", user_id).single().execute()
        
        if not response.data:
            # Auto-provision user profile if it doesn't exist
            sys.stderr.write(f"[INFO] User {user_id} not found in users table, auto-provisioning profile...\n")
            sys.stderr.flush()
            try:
                email = current_user.get("email") if isinstance(current_user, dict) else None
                full_name = None
                
                # Try to get name from user_metadata
                metadata = None
                if isinstance(current_user, dict):
                    metadata = current_user.get("user_metadata") or current_user.get("userMetaData")
                if isinstance(metadata, dict):
                    full_name = metadata.get("full_name") or metadata.get("name")
                
                if not full_name and email:
                    full_name = email.split("@")[0].replace(".", " ").title()
                full_name = full_name or "User"
                
                # Determine role from metadata or default to care_recipient
                role = "care_recipient"
                if isinstance(metadata, dict):
                    role = metadata.get("role", "care_recipient")
                
                insert_payload = {
                    "id": str(user_id),
                    "email": email or f"user-{user_id}@example.com",
                    "full_name": full_name,
                    "role": role,
                    "is_active": True,
                }
                
                insert_resp = supabase_admin.table("users").insert(insert_payload).execute()
                if insert_resp.data:
                    sys.stderr.write(f"[INFO] Auto-provisioned user profile for {user_id}\n")
                    sys.stderr.flush()
                    return insert_resp.data[0]
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create user profile"
                    )
            except Exception as provision_error:
                sys.stderr.write(f"[ERROR] Error auto-provisioning user profile: {provision_error}\n")
                sys.stderr.flush()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User profile not found and could not be created: {str(provision_error)}"
                )
        
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        sys.stderr.write(f"[ERROR] Error in /api/auth/me: {str(e)}\n")
        sys.stderr.write(f"Traceback: {error_details}\n")
        sys.stderr.flush()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}"
        )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout current user"""
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/google/url")
async def get_google_oauth_url(redirect_to: Optional[str] = None):
    """
    Get Google OAuth URL for authentication.
    This endpoint returns the URL that the frontend should redirect to for Google sign-in.
    The frontend should use Supabase client directly for OAuth, but this endpoint provides
    a helper to get the OAuth URL.
    """
    try:
        from app.config import settings
        
        # Get the redirect URL - use the one provided or construct from frontend URL
        if not redirect_to:
            # Default redirect URL - frontend should provide their actual redirect URL
            redirect_to = "http://localhost:19006"  # Expo default
        
        # Construct Supabase OAuth URL
        # Supabase OAuth URL format: {SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to={redirect_to}
        supabase_url = settings.SUPABASE_URL.rstrip('/')
        oauth_url = f"{supabase_url}/auth/v1/authorize?provider=google&redirect_to={redirect_to}"
        
        sys.stderr.write(f"[INFO] Generated Google OAuth URL with redirect_to: {redirect_to}\n")
        sys.stderr.flush()
        
        return {
            "url": oauth_url,
            "redirect_to": redirect_to,
            "provider": "google"
        }
        
    except Exception as e:
        sys.stderr.write(f"[ERROR] Error generating Google OAuth URL: {str(e)}\n")
        sys.stderr.flush()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate OAuth URL: {str(e)}"
        )


@router.get("/google/callback")
async def google_oauth_callback(request: Request, code: Optional[str] = None, error: Optional[str] = None):
    """
    Handle Google OAuth callback.
    This endpoint is called by Google after authentication.
    """
    try:
        if error:
            sys.stderr.write(f"[ERROR] Google OAuth error: {error}\n")
            sys.stderr.flush()
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": error, "message": "Google authentication failed"}
            )
        
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code not provided"
            )
        
        # Exchange code for session
        # Note: Supabase handles this automatically, but we need to handle the callback
        # The frontend should handle the redirect and extract the session
        
        # For now, return a response that tells the frontend to extract the session
        return JSONResponse(
            content={
                "message": "OAuth callback received. Please extract session from URL hash.",
                "code": code
            }
        )
        
    except Exception as e:
        sys.stderr.write(f"[ERROR] Error in Google OAuth callback: {str(e)}\n")
        sys.stderr.flush()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )


@router.post("/google/verify")
async def verify_google_session(session_data: dict):
    """
    Verify and process Google OAuth session from frontend.
    The frontend should call this after receiving the OAuth callback from Supabase.
    Supabase handles the OAuth flow, and the frontend receives a session.
    This endpoint verifies the session and ensures the user profile exists.
    """
    try:
        access_token = session_data.get("access_token")
        refresh_token = session_data.get("refresh_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Access token not provided"
            )
        
        # Verify the token by getting the user
        # Use the access token to get user info
        user_response = supabase.auth.get_user(access_token)
        
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token"
            )
        
        user = user_response.user
        user_id = user.id if hasattr(user, 'id') else user.get('id') if isinstance(user, dict) else str(user)
        
        # Ensure user profile exists
        profile_check = supabase_admin.table("users").select("*").eq("id", user_id).single().execute()
        
        if not profile_check.data:
            # Auto-provision user profile from Google OAuth data
            email = user.email if hasattr(user, 'email') else user.get('email') if isinstance(user, dict) else None
            metadata = user.user_metadata if hasattr(user, 'user_metadata') else user.get('user_metadata') if isinstance(user, dict) else {}
            
            # Extract name from metadata
            full_name = None
            if isinstance(metadata, dict):
                full_name = metadata.get("full_name") or metadata.get("name")
            
            # If no name in metadata, try to construct from email
            if not full_name and email:
                full_name = email.split("@")[0].replace(".", " ").title()
            
            full_name = full_name or "User"
            
            # Get profile photo from metadata
            profile_photo_url = None
            if isinstance(metadata, dict):
                profile_photo_url = metadata.get("avatar_url") or metadata.get("picture")
            
            # Default role to care_recipient (can be changed later)
            role = metadata.get("role", "care_recipient") if isinstance(metadata, dict) else "care_recipient"
            
            profile_data = {
                "id": str(user_id),
                "email": email or f"user-{user_id}@example.com",
                "full_name": full_name,
                "role": role,
                "is_active": True,
                "profile_photo_url": profile_photo_url
            }
            
            insert_response = supabase_admin.table("users").insert(profile_data).execute()
            if not insert_response.data:
                sys.stderr.write(f"[WARN] Failed to create user profile for {user_id}\n")
                sys.stderr.flush()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token or "",
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        sys.stderr.write(f"[ERROR] Error verifying Google session: {str(e)}\n")
        sys.stderr.flush()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify session: {str(e)}"
        )

