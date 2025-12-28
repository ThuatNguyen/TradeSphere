#!/bin/bash
#
# Automatic Zalo OAuth Token Flow
# This script generates the authorization URL and waits for you to paste the code
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_ID="548847842150265811"
REDIRECT_URI="https://thuatnguyen.io.vn/api/v1/zalo/oauth/callback"
SCOPE="manage_oa,send_message,get_user_info"

echo "============================================================"
echo "Zalo OAuth Token Flow - Automated"
echo "============================================================"
echo ""

# Step 1: Generate authorization URL
AUTH_URL="https://oauth.zaloapp.com/v4/oa/permission?app_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}"

echo -e "${YELLOW}Step 1: Get Authorization Code${NC}"
echo ""
echo "Please open this URL in your browser:"
echo ""
echo -e "${GREEN}${AUTH_URL}${NC}"
echo ""
echo "After authorization, you will be redirected to:"
echo "https://thuatnguyen.io.vn/api/v1/zalo/oauth/callback?code=XXXXX"
echo ""
echo -e "${YELLOW}Copy the 'code' parameter from the URL${NC}"
echo ""

# Step 2: Wait for user to paste the code
read -p "Paste the authorization code here: " AUTH_CODE

if [ -z "$AUTH_CODE" ]; then
    echo -e "${RED}Error: No authorization code provided${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Exchanging code for tokens...${NC}"
echo ""

# Step 3: Exchange code for tokens
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "${SCRIPT_DIR}/exchange_zalo_code.py" "$AUTH_CODE"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN}SUCCESS! Tokens obtained and saved${NC}"
    echo -e "${GREEN}============================================================${NC}"
else
    echo ""
    echo -e "${RED}============================================================${NC}"
    echo -e "${RED}FAILED! Could not obtain tokens${NC}"
    echo -e "${RED}============================================================${NC}"
    echo ""
    echo -e "${YELLOW}Possible reasons:${NC}"
    echo "1. Authorization code expired (valid for ~1-2 minutes)"
    echo "2. Code already used (can only use once)"
    echo "3. Network error"
    echo ""
    echo -e "${YELLOW}Solution: Run this script again to get a new code${NC}"
    exit 1
fi
