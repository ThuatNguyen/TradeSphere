#!/bin/bash

# Deploy broadcast feature to VPS
# Usage: bash deploy-broadcast.sh

set -e

VPS_HOST="root@103.130.218.214"
VPS_DIR="/home/root/tradesphere"

echo "🚀 Deploying Broadcast Feature to VPS..."
echo ""

# Step 1: Upload migration
echo "📤 Step 1: Uploading migration..."
scp migrations/add_broadcast_tables.sql $VPS_HOST:$VPS_DIR/migrations/

# Step 2: Run migration on VPS
echo "🔧 Step 2: Running database migration..."
ssh $VPS_HOST "cd $VPS_DIR && docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d tradesphere -f /docker-entrypoint-initdb.d/add_broadcast_tables.sql"

# Step 3: Copy updated Python files
echo "📦 Step 3: Updating FastAPI service..."
scp fastapi-service/app/models/__init__.py $VPS_HOST:$VPS_DIR/fastapi-service/app/models/
scp fastapi-service/app/schemas/__init__.py $VPS_HOST:$VPS_DIR/fastapi-service/app/schemas/
scp fastapi-service/app/services/zalo_service.py $VPS_HOST:$VPS_DIR/fastapi-service/app/services/
scp fastapi-service/app/api/v1/endpoints/zalo.py $VPS_HOST:$VPS_DIR/fastapi-service/app/api/v1/endpoints/

# Step 4: Restart FastAPI
echo "🔄 Step 4: Restarting FastAPI service..."
ssh $VPS_HOST "cd $VPS_DIR && docker-compose -f docker-compose.prod.yml restart fastapi"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Build and deploy frontend: npm run build"
echo "2. Test API: curl https://thuatnguyen.io.vn/api/v1/zalo/broadcast/campaigns"
echo "3. Access UI: https://thuatnguyen.io.vn/admin/broadcast"
echo ""
