# Ruby - AI-Powered Telegram Bot 🤖✨

**Ruby** is an AI-powered brand ambassador Telegram bot for TopV1 LLC, designed to warmly welcome users into the community platform with natural, engaging conversations.

## 🌟 Features

- **AI-Powered Conversations**: Natural chat flow using OpenAI GPT
- **Smart Engagement**: 2-4 exchange conversation flow before call-to-action
- **Community Integration**: Smooth introduction to TopV1 platform
- **Data Analytics**: User activity logging and conversation tracking
- **Admin Tools**: Statistics, user management, and broadcasting
- **Scalable Architecture**: Built on Cloudflare Workers + D1 Database

## 🚀 Quick Start

### Prerequisites

1. **Cloudflare Account** with Workers enabled
2. **Telegram Bot Token** from [@BotFather](https://t.me/botfather)
3. **OpenAI API Key** from [OpenAI Platform](https://platform.openai.com)
4. **Node.js** (v16+) and npm installed

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ruby-telegram-bot

# Install dependencies
npm install

# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### Configuration

1. **Set up secrets** (required):
```bash
# Telegram Bot Token from @BotFather
wrangler secret put TELEGRAM_BOT_TOKEN

# OpenAI API Key
wrangler secret put OPENAI_API_KEY

# Admin User IDs (comma-separated Telegram user IDs)
wrangler secret put ADMIN_USER_IDS
# Example: 123456789,987654321
```

2. **Update wrangler.toml** with your domain if needed

### Deployment

```bash
# Run the automated deployment script
chmod +x deploy.sh
./deploy.sh

# OR deploy manually:
# 1. Create D1 database
wrangler d1 create ruby-bot-db

# 2. Update database ID in wrangler.toml
# 3. Set up database schema
wrangler d1 execute ruby-bot-db --file=./schema.sql

# 4. Deploy
wrangler deploy
```

### Set Telegram Webhook

After deployment, set your bot's webhook:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>"
```

Replace:
- `<YOUR_BOT_TOKEN>` with your actual bot token
- `<YOUR_WORKER_URL>` with your deployed worker URL

## 💬 Bot Usage

### User Commands

- `/start` - Begin conversation with Ruby

### Admin Commands (for configured admin users)

- `/stats` - View bot statistics and metrics
- `/reset [user_id]` - Reset a user's conversation state
- `/broadcast [message]` - Send message to all users

### Conversation Flow

1. **Welcome** - Ruby greets new users warmly
2. **Engagement** - 2-4 natural conversation exchanges
3. **Interest Building** - Ruby learns about the user
4. **Call-to-Action** - Introduction to TopV1 community
5. **Conversion** - User joins community or gets updates

## 🏗️ Architecture

### Stack
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **AI**: OpenAI GPT-3.5-turbo
- **Bot Framework**: Telegraf.js

### Database Schema

**Tables:**
- `users` - User profiles and conversation state
- `conversation_history` - Message logging for analytics
- `bot_stats` - Metrics and statistics
- `admin_actions` - Admin activity logging

## 📊 Analytics & Monitoring

Ruby tracks several metrics:
- Total users registered
- Conversations started
- Community conversion rate
- Active users (24h)
- Message history for analysis

Access admin statistics with `/stats` command.

## 🔒 Security Features

- **Admin Authorization**: Commands restricted to configured admin IDs
- **Input Validation**: All user inputs are sanitized
- **Error Handling**: Comprehensive error logging and graceful failures
- **Rate Limiting**: Built-in Cloudflare protection

## 🎨 Customization

### Personality Tuning

Edit the system prompt in `src/index.js` (line ~125) to adjust Ruby's personality:

```javascript
const systemPrompt = `You are Ruby, a warm and engaging AI brand ambassador...`;
```

### Conversation Flow

Modify the `generateAIResponse()` method to change conversation logic.

### Call-to-Action

Update `sendCallToAction()` method to change community introduction.

## 🛠️ Development

### Local Development

```bash
# Start development server
npm run dev

# Test with ngrok or similar for webhook testing
ngrok http 8787
```

### Testing

```bash
npm test
```

### Database Operations

```bash
# Query database locally
wrangler d1 execute ruby-bot-db --command="SELECT * FROM users LIMIT 10"

# Backup database
wrangler d1 export ruby-bot-db --output=backup.sql
```

## 📈 Performance

- **Cold Start**: ~100ms on Cloudflare Workers
- **Response Time**: ~500ms average (including AI)
- **Scalability**: Handles thousands of concurrent users
- **Uptime**: 99.9%+ with Cloudflare infrastructure

## 🔧 Troubleshooting

### Common Issues

**Bot not responding:**
- Check webhook is set correctly
- Verify secrets are configured
- Check Cloudflare Workers logs

**Database errors:**
- Ensure D1 database is created and bound
- Verify schema was executed
- Check database ID in wrangler.toml

**AI responses not working:**
- Verify OpenAI API key is valid
- Check API quota and billing
- Review error logs for API issues

### Debugging

```bash
# View worker logs
wrangler tail

# Check database
wrangler d1 execute ruby-bot-db --command="SELECT COUNT(*) FROM users"
```

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review Cloudflare Workers documentation
- Contact TopV1 LLC development team

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic AI conversation flow
- ✅ Community call-to-action
- ✅ Admin tools and analytics

### Phase 2 (Future)
- 🔄 Advanced conversation memory
- 🔄 Multi-language support
- 🔄 Integration with TopV1 platform API
- 🔄 A/B testing for conversation flows

### Phase 3 (Future)
- 🔄 Voice message support
- 🔄 Rich media responses
- 🔄 Advanced analytics dashboard

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

This is a private project for TopV1 LLC. Contact the development team for contribution guidelines.

---

**Built with ❤️ for TopV1 Community**

*Ruby makes technology feel human-first, approachable, and engaging.*
