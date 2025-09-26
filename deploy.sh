#!/bin/bash

# Ruby Telegram Bot Deployment Script
# For TopV1 LLC

echo "🤖 Deploying Ruby Telegram Bot..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

# Check if user is authenticated
if ! wrangler whoami &> /dev/null; then
    echo "❌ Please authenticate with Cloudflare first:"
    echo "   wrangler login"
    exit 1
fi

echo "✅ Wrangler CLI found and authenticated"

# Create D1 database
echo "📊 Creating D1 database..."
DATABASE_OUTPUT=$(wrangler d1 create ruby-bot-db 2>&1)
echo "$DATABASE_OUTPUT"

# Extract database ID from output
DATABASE_ID=$(echo "$DATABASE_OUTPUT" | grep -oP '(?<=database_id = ")[^"]*' | head -1)

if [ -z "$DATABASE_ID" ]; then
    echo "❌ Failed to create database or extract database ID"
    echo "Please check the output above and manually update wrangler.toml"
else
    echo "✅ Database created with ID: $DATABASE_ID"
    
    # Update wrangler.toml with the actual database ID
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/database_id = \"placeholder-database-id\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
    else
        # Linux
        sed -i "s/database_id = \"placeholder-database-id\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
    fi
    echo "✅ Updated wrangler.toml with database ID"
fi

# Execute database schema
echo "📋 Setting up database schema..."
wrangler d1 execute ruby-bot-db --file=./schema.sql

# Check for required secrets
echo "🔐 Checking required secrets..."

MISSING_SECRETS=""

if ! wrangler secret list | grep -q "TELEGRAM_BOT_TOKEN"; then
    MISSING_SECRETS="$MISSING_SECRETS\n  - TELEGRAM_BOT_TOKEN"
fi

if ! wrangler secret list | grep -q "OPENAI_API_KEY"; then
    MISSING_SECRETS="$MISSING_SECRETS\n  - OPENAI_API_KEY"
fi

if ! wrangler secret list | grep -q "ADMIN_USER_IDS"; then
    MISSING_SECRETS="$MISSING_SECRETS\n  - ADMIN_USER_IDS"
fi

if [ -n "$MISSING_SECRETS" ]; then
    echo "❌ Missing required secrets:"
    echo -e "$MISSING_SECRETS"
    echo ""
    echo "Please set them using:"
    echo "  wrangler secret put TELEGRAM_BOT_TOKEN"
    echo "  wrangler secret put OPENAI_API_KEY"
    echo "  wrangler secret put ADMIN_USER_IDS"
    echo ""
    echo "After setting secrets, run: wrangler deploy"
    exit 1
fi

echo "✅ All secrets are configured"

# Deploy the worker
echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Ruby Bot deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up your Telegram webhook:"
    echo "   curl -X POST \"https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>\""
    echo "2. Test the bot by sending /start"
    echo "3. Use admin commands if you're configured as an admin"
    echo ""
    echo "✨ Ruby is ready to welcome users to TopV1!"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi
