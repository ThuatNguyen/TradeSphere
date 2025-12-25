#!/bin/bash

# TradeSphere - Quick Start Script
# This script helps you start the development environment quickly

set -e

echo "🚀 TradeSphere Quick Start"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.docker .env
    echo -e "${YELLOW}📝 Please edit .env file and add your API keys:${NC}"
    echo "   - OPENAI_API_KEY"
    echo "   - ZALO_ACCESS_TOKEN"
    echo "   - ZALO_SECRET_KEY"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

echo -e "${GREEN}✅ Environment file ready${NC}"
echo ""

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📋 Service URLs:"
echo "   - Express (Main App):  http://localhost:5000"
echo "   - FastAPI (Python):    http://localhost:8000"
echo "   - FastAPI Docs:        http://localhost:8000/docs"
echo "   - PostgreSQL:          localhost:5432"
echo "   - Redis:               localhost:6379"
echo "   - Nginx:               http://localhost:80"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
echo "🧪 Test APIs:"
echo "   curl http://localhost:8000/health"
echo "   curl http://localhost:8000/api/v1/scams/search?keyword=0123456789"
echo ""
echo -e "${GREEN}✨ Happy coding!${NC}"
