#!/usr/bin/env python3
"""
Script to exchange Zalo OAuth authorization code for access_token and refresh_token
Usage: python exchange_zalo_code.py <authorization_code>
"""

import os
import sys
import requests
import json
from datetime import datetime, timedelta

# Zalo OAuth configuration
APP_ID = "548847842150265811"
SECRET_KEY = "33M7kiqYXVXljIHS6vp7"
TOKEN_ENDPOINT = "https://oauth.zaloapp.com/v4/oa/access_token"

def exchange_code_for_token(auth_code: str):
    """Exchange authorization code for access_token and refresh_token"""
    
    print(f"[{datetime.now()}] Exchanging authorization code...")
    print(f"Code: {auth_code[:50]}...")
    
    # Prepare request
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "secret_key": SECRET_KEY
    }
    
    data = {
        "app_id": APP_ID,
        "code": auth_code,
        "grant_type": "authorization_code"
    }
    
    try:
        # Make request
        response = requests.post(TOKEN_ENDPOINT, headers=headers, data=data)
        response.raise_for_status()
        
        result = response.json()
        
        # Check for errors
        if result.get("error"):
            print(f"❌ Error: {result.get('error')}")
            print(f"Message: {result.get('error_description', 'No description')}")
            return None
        
        # Extract tokens
        access_token = result.get("access_token")
        refresh_token = result.get("refresh_token")
        expires_in = result.get("expires_in", 90000)  # Default 25 hours
        
        # Convert expires_in to int if it's a string
        if isinstance(expires_in, str):
            expires_in = int(expires_in)
        
        if not access_token or not refresh_token:
            print(f"❌ Missing tokens in response: {result}")
            return None
        
        # Calculate expiration time
        expires_at = datetime.now() + timedelta(seconds=expires_in)
        
        print("\n✅ Successfully obtained tokens!")
        print(f"Access Token: {access_token[:50]}...")
        print(f"Refresh Token: {refresh_token[:50]}...")
        print(f"Expires in: {expires_in} seconds (~{expires_in//3600} hours)")
        print(f"Expires at: {expires_at}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": expires_in,
            "expires_at": expires_at.isoformat()
        }
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def save_tokens(tokens: dict):
    """Save tokens to files"""
    
    if not tokens:
        return False
    
    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "../../../.."))
    env_file = os.path.join(project_root, ".env")
    
    # Try to find .env file
    if not os.path.exists(env_file):
        # Check current directory
        env_file = os.path.abspath(".env")
        if not os.path.exists(env_file):
            # Check parent directories
            current = os.getcwd()
            for _ in range(5):  # Check up to 5 levels up
                test_path = os.path.join(current, ".env")
                if os.path.exists(test_path):
                    env_file = test_path
                    break
                parent = os.path.dirname(current)
                if parent == current:  # Reached root
                    break
                current = parent
    refresh_token_file = os.path.join(script_dir, "zalo_refresh_token.txt")
    
    try:
        # 1. Save refresh token to dedicated file
        print(f"\n📝 Saving refresh token to: {refresh_token_file}")
        with open(refresh_token_file, 'w') as f:
            f.write(tokens['refresh_token'])
        os.chmod(refresh_token_file, 0o600)  # Read/write for owner only
        print("✅ Refresh token saved")
        
        # 2. Update .env file with access token
        print(f"\n📝 Updating .env file: {env_file}")
        
        if not os.path.exists(env_file):
            print(f"❌ .env file not found: {env_file}")
            return False
        
        # Read current .env content
        with open(env_file, 'r') as f:
            lines = f.readlines()
        
        # Update ZALO_ACCESS_TOKEN line
        updated = False
        for i, line in enumerate(lines):
            if line.startswith('ZALO_ACCESS_TOKEN='):
                lines[i] = f'ZALO_ACCESS_TOKEN={tokens["access_token"]}\n'
                updated = True
                break
        
        # If not found, append it
        if not updated:
            lines.append(f'ZALO_ACCESS_TOKEN={tokens["access_token"]}\n')
        
        # Write back to .env
        with open(env_file, 'w') as f:
            f.writelines(lines)
        
        print("✅ .env file updated")
        
        # 3. Save token metadata
        metadata_file = os.path.join(script_dir, "zalo_token_metadata.json")
        print(f"\n📝 Saving token metadata to: {metadata_file}")
        
        metadata = {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "expires_in": tokens["expires_in"],
            "expires_at": tokens["expires_at"],
            "obtained_at": datetime.now().isoformat(),
            "app_id": APP_ID
        }
        
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        os.chmod(metadata_file, 0o600)
        
        print("✅ Token metadata saved")
        
        return True
        
    except Exception as e:
        print(f"❌ Error saving tokens: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python exchange_zalo_code.py <authorization_code>")
        print("\nExample:")
        print("  python exchange_zalo_code.py AhgD3fHa81iVih0Ac7uy...")
        sys.exit(1)
    
    auth_code = sys.argv[1]
    
    print("=" * 60)
    print("Zalo OAuth Token Exchange")
    print("=" * 60)
    
    # Exchange code for tokens
    tokens = exchange_code_for_token(auth_code)
    
    if not tokens:
        print("\n❌ Failed to obtain tokens")
        sys.exit(1)
    
    # Save tokens
    if save_tokens(tokens):
        print("\n" + "=" * 60)
        print("✅ SUCCESS!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Upload .env to VPS:")
        print("   rsync -avz -e 'ssh -i ~/.ssh/id_ed25519' .env root@103.130.218.214:/root/tradesphere/")
        print("\n2. Restart FastAPI container on VPS:")
        print("   ssh -i ~/.ssh/id_ed25519 root@103.130.218.214")
        print("   cd /root/tradesphere")
        print("   docker-compose -f docker-compose.prod.yml restart fastapi")
        print("\n3. Test sending message via webhook")
        print("\n4. Setup auto-refresh cron job:")
        print("   ./refresh_zalo_token_cron.sh")
    else:
        print("\n⚠️  Tokens obtained but failed to save")
        print("Access Token:", tokens['access_token'])
        print("Refresh Token:", tokens['refresh_token'])
        sys.exit(1)

if __name__ == "__main__":
    main()
