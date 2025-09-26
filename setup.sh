#!/bin/bash

# Ruby Telegram Bot Setup Script
# Interactive setup for first-time deployment

echo "🤖 Ruby Telegram Bot Setup"
echo "=========================="
echo "This script will help you set up Ruby for TopV1 LLC"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js (v16+) first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
if [ "$MAJOR_VERSION" -lt 16 ]; then
    echo "❌ Node.js version $NODE_VERSION found. Please upgrade to v16 or higher."
    exit 1
fi

echo "✅ Node.js $NODE_VERSION found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm."
    exit 1
fi

echo "✅ npm found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Install wrangler if not present
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

echo "✅ Dependencies installed"

# Cloudflare authentication
echo ""
echo "🔑 Cloudflare Authentication"
echo "=============================="

if ! wrangler whoami &> /dev/null; then
    echo "Please authenticate with Cloudflare:"
    echo "This will open a browser window for authentication."
    read -p "Press Enter to continue..."
    wrangler login
    
    if ! wrangler whoami &> /dev/null; then
        echo "❌ Authentication failed. Please try again."
        exit 1
    fi
fi

echo "✅ Authenticated with Cloudflare"

# Collect bot configuration
echo ""
echo "🤖 Bot Configuration"
echo "==================="

# Telegram Bot Token
echo ""
echo "1. Telegram Bot Token"
echo "   - Go to @BotFather on Telegram"
echo "   - Create a new bot with /newbot"
echo "   - Copy the bot token"
echo ""
read -p "Enter your Telegram Bot Token: " BOT_TOKEN

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Bot token is required"
    exit 1
fi

# OpenAI API Key
echo ""
echo "2. OpenAI API Key"
echo "   - Go to https://platform.openai.com/api-keys"
echo "   - Create a new API key"
echo "   - Copy the key (starts with sk-)"
echo ""
read -p "Enter your OpenAI API Key: " OPENAI_KEY

if [ -z "$OPENAI_KEY" ]; then
    echo "❌ OpenAI API key is required"
    exit 1
fi

# Admin User IDs
echo ""
echo "3. Admin User IDs"
echo "   - Get your Telegram User ID from @userinfobot"
echo "   - For multiple admins, separate with commas"
echo "   - Example: 123456789,987654321"
echo ""
read -p "Enter Admin User ID(s): " ADMIN_IDS

if [ -z "$ADMIN_IDS" ]; then
    echo "❌ At least one admin user ID is required"
    exit 1
fi

# Set secrets
echo ""
echo "🔐 Setting up secrets..."

echo "$BOT_TOKEN" | wrangler secret put TELEGRAM_BOT_TOKEN
echo "$OPENAI_KEY" | wrangler secret put OPENAI_API_KEY
echo "$ADMIN_IDS" | wrangler secret put ADMIN_USER_IDS

echo "✅ Secrets configured"

# Create and setup database
echo ""
echo "📊 Setting up database..."

# Create D1 database
DATABASE_OUTPUT=$(wrangler d1 create ruby-bot-db 2>&1)
echo "$DATABASE_OUTPUT"

# Extract database ID
DATABASE_ID=$(echo "$DATABASE_OUTPUT" | grep -oP '(?<=database_id = ")[^"]*' | head -1)

if [ -z "$DATABASE_ID" ]; then
    echo "⚠️  Could not automatically extract database ID."
    echo "Please manually update wrangler.toml with your database ID."
    read -p "Enter your database ID manually: " DATABASE_ID
fi

if [ -n "$DATABASE_ID" ]; then
    # Update wrangler.toml
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/database_id = \"placeholder-database-id\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
    else
        # Linux
        sed -i "s/database_id = \"placeholder-database-id\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
    fi
    echo "✅ Updated wrangler.toml with database ID: $DATABASE_ID"
fi

# Setup database schema
echo "📋 Creating database schema..."
wrangler d1 execute ruby-bot-db --file=./schema.sql

echo "✅ Database configured"

# Deploy the bot
echo ""
echo "🚀 Deploying Ruby..."
wrangler deploy

if [ $? -eq 0 ]; then
    WORKER_URL=$(wrangler whoami 2>/dev/null | grep -o 'https://[^[:space:]]*' | head -1)
    
    if [ -z "$WORKER_URL" ]; then
        WORKER_URL="https://ruby-telegram-bot.your-subdomain.workers.dev"
    fi
    
    echo ""
    echo "🎉 Ruby deployed successfully!"
    echo ""
    echo "📋 Final Steps:"
    echo "=============="
    echo ""
    echo "1. Set up your Telegram webhook:"
    echo "   Run this command:"
    echo ""
    echo "   curl -X POST \"https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$WORKER_URL\""
    echo ""
    echo "2. Test your bot:"
    echo "   - Open Telegram"
    echo "   - Find your bot"
    echo "   - Send /start"
    echo ""
    echo "3. Admin commands (for configured admins):"
    echo "   - /stats - View bot statistics"
    echo "   - /reset [user_id] - Reset user state"
    echo "   - /broadcast [message] - Message all users"
    echo ""
    echo "✨ Ruby is ready to welcome users to TopV1!"
    echo ""
    
    # Offer to set webhook automatically
    read -p "Would you like me to set the webhook automatically? (y/n): " SET_WEBHOOK
    
    if [ "$SET_WEBHOOK" = "y" ] || [ "$SET_WEBHOOK" = "Y" ]; then
        WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$WORKER_URL")
        
        if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
            echo "✅ Webhook set successfully!"
        else
            echo "❌ Failed to set webhook. Please set it manually."
            echo "Response: $WEBHOOK_RESPONSE"
        fi
    fi
    
    echo ""
    echo "🎊 Setup Complete! Ruby is ready to serve TopV1 community!"
    
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi
