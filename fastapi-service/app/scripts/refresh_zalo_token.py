#!/usr/bin/env python3
"""
Script tự động refresh Zalo Access Token
Chạy script này mỗi 24 giờ để refresh token trước khi hết hạn
"""
import os
import sys
import requests
from pathlib import Path

# Zalo OAuth2 Config
APP_ID = "548847842150265811"
SECRET_KEY = "33M7kiqYXVXljIHS6vp7"
TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token"


def refresh_access_token(refresh_token: str) -> dict:
    """
    Refresh Zalo access token using refresh token
    
    Args:
        refresh_token: Refresh token từ lần lấy token trước
        
    Returns:
        dict: {
            'access_token': str,
            'refresh_token': str,
            'expires_in': int
        }
    """
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "secret_key": SECRET_KEY
    }
    
    data = {
        "app_id": APP_ID,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }
    
    try:
        response = requests.post(TOKEN_URL, headers=headers, data=data, timeout=10)
        result = response.json()
        
        if "access_token" in result:
            print("✅ Refresh thành công!")
            print(f"New Access Token: {result['access_token']}")
            print(f"New Refresh Token: {result['refresh_token']}")
            print(f"Expires in: {result.get('expires_in', 'N/A')} seconds")
            return result
        else:
            print(f"❌ Lỗi: {result}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None


def update_env_file(access_token: str, env_file: str = ".env"):
    """
    Cập nhật ZALO_ACCESS_TOKEN trong file .env
    
    Args:
        access_token: Access token mới
        env_file: Path đến file .env
    """
    env_path = Path(env_file)
    
    if not env_path.exists():
        print(f"❌ File {env_file} không tồn tại")
        return False
    
    # Đọc nội dung file
    content = env_path.read_text()
    lines = content.split('\n')
    
    # Update ZALO_ACCESS_TOKEN
    updated = False
    for i, line in enumerate(lines):
        if line.startswith('ZALO_ACCESS_TOKEN='):
            lines[i] = f'ZALO_ACCESS_TOKEN={access_token}'
            updated = True
            break
    
    if updated:
        # Ghi lại file
        env_path.write_text('\n'.join(lines))
        print(f"✅ Đã cập nhật {env_file}")
        return True
    else:
        print(f"⚠️ Không tìm thấy ZALO_ACCESS_TOKEN trong {env_file}")
        return False


def main():
    """Main function"""
    print("=" * 50)
    print("ZALO TOKEN REFRESHER")
    print("=" * 50)
    print()
    
    # Lấy refresh token từ argument hoặc input
    if len(sys.argv) > 1:
        refresh_token = sys.argv[1]
    else:
        refresh_token = input("Nhập Refresh Token: ").strip()
    
    if not refresh_token:
        print("❌ Refresh token không được để trống!")
        sys.exit(1)
    
    # Refresh token
    result = refresh_access_token(refresh_token)
    
    if result:
        # Hỏi có muốn update .env không
        update = input("\nCập nhật vào .env? (y/n): ").strip().lower()
        if update == 'y':
            update_env_file(result['access_token'])
        
        # Lưu refresh token mới để dùng lần sau
        print("\n" + "=" * 50)
        print("⚠️ LƯU REFRESH TOKEN MỚI NÀY:")
        print("=" * 50)
        print(result['refresh_token'])
        print()
        print("Dùng refresh token này để refresh lần tiếp theo (sau ~24 giờ)")
        
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
