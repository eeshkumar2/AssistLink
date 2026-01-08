"""
Notification service for creating and managing notifications
"""
from typing import Optional, Dict, Any
from app.database import supabase_admin
from datetime import datetime
import json


async def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Create a notification for a user
    
    Args:
        user_id: UUID of the user to notify
        notification_type: Type of notification (video_call, message, booking, etc.)
        title: Notification title
        body: Notification body/message
        data: Additional data (JSONB) - can include IDs, metadata, etc.
    
    Returns:
        Created notification dict or None if failed
    """
    try:
        import sys
        print(f"\n🔔 CREATING NOTIFICATION", file=sys.stderr, flush=True)
        print(f"User ID: {user_id}", file=sys.stderr, flush=True)
        print(f"Type: {notification_type}", file=sys.stderr, flush=True)
        print(f"Title: {title}", file=sys.stderr, flush=True)
        
        notification_dict = {
            "user_id": str(user_id),
            "type": notification_type,
            "title": title,
            "body": body,
            "is_read": False,
            "data": data or {}
        }
        
        response = supabase_admin.table("notifications").insert(notification_dict).execute()
        
        if response.data and len(response.data) > 0:
            notification = response.data[0]
            print(f"✅ Notification created in database with ID: {notification.get('id')}", file=sys.stderr, flush=True)
            print(f"   User ID: {notification.get('user_id')}", file=sys.stderr, flush=True)
            print(f"   Type: {notification.get('type')}", file=sys.stderr, flush=True)
            # Trigger push notification (async, don't wait)
            print(f"📤 Triggering push notification...", file=sys.stderr, flush=True)
            try:
                push_result = await send_push_notification(user_id, title, body, data)
                print(f"Push notification result: {push_result}", file=sys.stderr, flush=True)
            except Exception as push_error:
                print(f"⚠️ Push notification failed (but in-app notification created): {push_error}", file=sys.stderr, flush=True)
            return notification
        else:
            print(f"❌ Failed to create notification in database - no data returned", file=sys.stderr, flush=True)
            print(f"   Response: {response}", file=sys.stderr, flush=True)
        
        return None
    except Exception as e:
        import sys
        import traceback
        print(f"❌ Error creating notification: {e}", file=sys.stderr, flush=True)
        traceback.print_exc()
        return None


async def send_push_notification(
    user_id: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Send push notification via FCM to all user's active devices using Firebase Admin SDK
    
    Args:
        user_id: UUID of the user
        title: Notification title
        body: Notification body
        data: Additional data payload
    
    Returns:
        True if sent successfully, False otherwise
    """
    try:
        import sys
        from app.config import settings
        import os
        from pathlib import Path
        
        print(f"\n=== PUSH NOTIFICATION DEBUG ===", file=sys.stderr, flush=True)
        print(f"User ID: {user_id}", file=sys.stderr, flush=True)
        print(f"Title: {title}", file=sys.stderr, flush=True)
        print(f"Body: {body}", file=sys.stderr, flush=True)
        
        # Check if FCM is configured
        service_account_path = settings.FCM_SERVICE_ACCOUNT_PATH
        google_app_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        
        print(f"Service Account Path (from config): {service_account_path}", file=sys.stderr, flush=True)
        print(f"GOOGLE_APPLICATION_CREDENTIALS: {google_app_creds}", file=sys.stderr, flush=True)
        
        # Resolve relative path to absolute
        if service_account_path:
            # Handle relative paths
            if not os.path.isabs(service_account_path):
                # Get project root (assuming this file is in app/services/)
                project_root = Path(__file__).parent.parent.parent
                service_account_path = str(project_root / service_account_path)
            
            print(f"Resolved Service Account Path: {service_account_path}", file=sys.stderr, flush=True)
            print(f"File exists: {os.path.exists(service_account_path)}", file=sys.stderr, flush=True)
        
        if not service_account_path and not google_app_creds:
            print("❌ FCM Service Account not configured. Set FCM_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS", file=sys.stderr, flush=True)
            return False
        
        # Get all active device tokens for user
        print(f"Fetching devices for user_id: {user_id}", file=sys.stderr, flush=True)
        devices_response = supabase_admin.table("user_devices").select("device_token, platform").eq("user_id", user_id).eq("is_active", True).execute()
        
        print(f"Devices found: {len(devices_response.data) if devices_response.data else 0}", file=sys.stderr, flush=True)
        if devices_response.data:
            for device in devices_response.data:
                print(f"  - Platform: {device.get('platform')}, Token: {device.get('device_token')[:20]}...", file=sys.stderr, flush=True)
        
        if not devices_response.data:
            print("❌ No devices registered for this user", file=sys.stderr, flush=True)
            return False
        
        # Initialize Firebase Admin SDK
        try:
            import firebase_admin
            from firebase_admin import credentials, messaging
            
            # Initialize Firebase Admin if not already initialized
            if not firebase_admin._apps:
                if service_account_path:
                    # Use service account file path
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred)
                elif google_app_creds:
                    # Use GOOGLE_APPLICATION_CREDENTIALS env var
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred)
                else:
                    print("Firebase credentials not found")
                    return False
        except ImportError:
            print("firebase-admin not installed. Install with: pip install firebase-admin")
            return False
        except Exception as e:
            print(f"Error initializing Firebase Admin: {e}")
            return False
        
        # Prepare data payload
        data_payload = data or {}
        data_payload["type"] = data.get("type", "general") if data else "general"
        
        # Send to all devices
        results = []
        from firebase_admin import messaging
        
        for device in devices_response.data:
            device_token = device["device_token"]
            platform = device["platform"]
            
            print(f"\nSending to device: {platform}", file=sys.stderr, flush=True)
            print(f"Token: {device_token[:30]}...", file=sys.stderr, flush=True)
            
            try:
                # Create message based on platform
                if platform == "ios":
                    message = messaging.Message(
                        token=device_token,
                        notification=messaging.Notification(
                            title=title,
                            body=body
                        ),
                        data={str(k): str(v) for k, v in data_payload.items()},
                        apns=messaging.APNSConfig(
                            payload=messaging.APNSPayload(
                                aps=messaging.Aps(
                                    sound="default",
                                    badge=1
                                )
                            )
                        )
                    )
                elif platform == "android":
                    message = messaging.Message(
                        token=device_token,
                        notification=messaging.Notification(
                            title=title,
                            body=body
                        ),
                        data={str(k): str(v) for k, v in data_payload.items()},
                        android=messaging.AndroidConfig(
                            priority="high",
                            notification=messaging.AndroidNotification(
                                sound="default",
                                channel_id="default"
                            )
                        )
                    )
                else:  # web
                    message = messaging.Message(
                        token=device_token,
                        notification=messaging.Notification(
                            title=title,
                            body=body
                        ),
                        data={str(k): str(v) for k, v in data_payload.items()},
                        webpush=messaging.WebpushConfig(
                            notification=messaging.WebpushNotification(
                                title=title,
                                body=body,
                                icon="/icon-192x192.png"
                            )
                        )
                    )
                
                # Send message
                print(f"Sending message to {platform} device...", file=sys.stderr, flush=True)
                response = messaging.send(message)
                print(f"✅ Successfully sent message to {platform} device. Message ID: {response}", file=sys.stderr, flush=True)
                results.append(True)
                
            except messaging.UnregisteredError:
                # Token is invalid, mark device as inactive
                print(f"❌ Device token is invalid/unregistered, marking as inactive", file=sys.stderr, flush=True)
                supabase_admin.table("user_devices").update({"is_active": False}).eq("device_token", device_token).execute()
                results.append(False)
            except Exception as e:
                print(f"❌ Error sending push to device: {e}", file=sys.stderr, flush=True)
                import traceback
                traceback.print_exc()
                results.append(False)
        
        success_count = len([r for r in results if r])
        total_devices = len(devices_response.data)
        print(f"\n=== PUSH NOTIFICATION SUMMARY ===", file=sys.stderr, flush=True)
        print(f"Successfully sent to: {success_count}/{total_devices} devices", file=sys.stderr, flush=True)
        print(f"===================================\n", file=sys.stderr, flush=True)
        
        return success_count > 0
    except Exception as e:
        print(f"❌ Error sending push notification: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc()
        return False


# Helper functions for specific notification types

async def notify_video_call_request(caregiver_id: str, care_recipient_name: str, video_call_id: str):
    """Notify caregiver about new video call request"""
    return await create_notification(
        user_id=caregiver_id,
        notification_type="video_call",
        title="New Video Call Request",
        body=f"{care_recipient_name} wants to schedule a 15-second video call with you",
        data={
            "video_call_id": video_call_id,
            "action": "view_video_call"
        }
    )


async def notify_video_call_created_for_recipient(care_recipient_id: str, caregiver_name: str, video_call_id: str):
    """Notify care recipient that their video call request was created"""
    return await create_notification(
        user_id=care_recipient_id,
        notification_type="video_call",
        title="Video Call Requested",
        body=f"Your video call request to {caregiver_name} has been created",
        data={
            "video_call_id": video_call_id,
            "action": "view_video_call"
        }
    )


async def notify_video_call_accepted(user_id: str, other_party_name: str, video_call_id: str, is_caregiver: bool):
    """Notify when video call is accepted"""
    role = "caregiver" if is_caregiver else "care recipient"
    return await create_notification(
        user_id=user_id,
        notification_type="video_call",
        title="Video Call Accepted",
        body=f"{other_party_name} ({role}) has accepted the video call request",
        data={
            "video_call_id": video_call_id,
            "action": "join_call"
        }
    )


async def notify_video_call_status_change(user_id: str, other_party_name: str, video_call_id: str, status: str):
    """Notify user about video call status updates (e.g., declined)."""
    status_text = "accepted" if status == "accepted" else "declined"
    return await create_notification(
        user_id=user_id,
        notification_type="video_call",
        title="Video Call Update",
        body=f"{other_party_name} has {status_text} the video call request",
        data={
            "video_call_id": video_call_id,
            "status": status,
            "action": "view_video_call"
        }
    )


async def notify_new_message(recipient_id: str, sender_name: str, message_id: str, chat_session_id: str, message_preview: str):
    """Notify user about new message"""
    return await create_notification(
        user_id=recipient_id,
        notification_type="message",
        title=f"New message from {sender_name}",
        body=message_preview[:100],  # First 100 chars
        data={
            "message_id": message_id,
            "chat_session_id": chat_session_id,
            "action": "open_chat"
        }
    )


async def notify_booking_created(caregiver_id: str, care_recipient_name: str, booking_id: str):
    """Notify caregiver about new booking"""
    return await create_notification(
        user_id=caregiver_id,
        notification_type="booking",
        title="New Booking Request",
        body=f"{care_recipient_name} has created a new booking request",
        data={
            "booking_id": booking_id,
            "action": "view_booking"
        }
    )


async def notify_booking_status_change(user_id: str, booking_id: str, status: str, other_party_name: str):
    """Notify user about booking status change"""
    status_messages = {
        "accepted": "has accepted your booking",
        "declined": "has declined your booking",
        "cancelled": "has cancelled the booking",
        "in_progress": "booking has started",
        "completed": "booking has been completed"
    }
    
    message = status_messages.get(status, f"booking status changed to {status}")
    
    return await create_notification(
        user_id=user_id,
        notification_type="booking",
        title="Booking Status Update",
        body=f"{other_party_name} {message}",
        data={
            "booking_id": booking_id,
            "status": status,
            "action": "view_booking"
        }
    )


async def notify_chat_enabled(user_id: str, other_party_name: str, chat_session_id: str):
    """Notify user that chat session is now enabled"""
    return await create_notification(
        user_id=user_id,
        notification_type="chat_session",
        title="Chat Enabled",
        body=f"Chat with {other_party_name} is now enabled. You can start messaging!",
        data={
            "chat_session_id": chat_session_id,
            "action": "open_chat"
        }
    )

