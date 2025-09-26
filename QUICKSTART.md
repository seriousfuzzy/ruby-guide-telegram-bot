# Ruby Bot - Quick Start Guide ⚡

Get Ruby up and running in 5 minutes!

## 🚀 One-Command Setup

### Prerequisites (2 minutes)

1. **Get Telegram Bot Token**:
   - Message @BotFather on Telegram
   - Send `/newbot`
   - Follow prompts and copy the token

2. **Get OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create new key, copy it

3. **Get Your Telegram User ID**:
   - Message @userinfobot on Telegram  
   - Copy the "User ID" number

### Deploy Ruby (3 minutes)

```bash
# Navigate to project
cd ruby-telegram-bot

# Run interactive setup (handles everything)
bash setup.sh

# Or on Windows:
# setup.sh
```

**The setup script will:**
- ✅ Install dependencies
- ✅ Authenticate with Cloudflare  
- ✅ Configure your bot token and API keys
- ✅ Create and setup database
- ✅ Deploy to Cloudflare Workers
- ✅ Set up Telegram webhook
- ✅ Test the deployment

## 🎯 Immediate Next Steps

1. **Test Ruby**:
   - Open Telegram
   - Search for your bot
   - Send `/start`
   - Have a conversation!

2. **Test Admin Features**:
   - Send `/stats` to see metrics
   - Try `/broadcast Hello TopV1!`

3. **Update Community Links** (if needed):
   - Edit `src/index.js`
   - Update TopV1 community URLs
   - Redeploy: `wrangler deploy`

## 📱 Ruby in Action

### User Experience
```
User: /start

Ruby: Hello there! 👋 I'm Ruby, and I'm absolutely thrilled to meet you!

I'm here as a friendly face for the TopV1 community - think of me as your warm welcome into something pretty special we're building together.

What brings you our way today? I'd love to hear a bit about what you're interested in! ✨

User: I'm interested in AI and community building

Ruby: That's fantastic! AI and community building are such an exciting combination - there's so much potential when technology serves people rather than the other way around. 

What drew you to that intersection? Are you working on anything in that space, or is it more of a personal interest you're exploring?

User: I'm working on a startup in this space

Ruby: How exciting! Building a startup at the intersection of AI and community is such meaningful work. The challenges must be interesting - balancing the technical complexity with creating genuine human connections.

You know what? I think you'd really enjoy our TopV1 community! We're building something special - a place where technology feels human-first, and every voice matters.

Would you like me to show you around? 🚀

[Join Community] [Tell me more first]
```

### Admin Experience
```
Admin: /stats

Ruby: 📊 Ruby Bot Statistics

👥 Total Users: 247
💬 Conversations Started: 218  
🌟 Community Conversions: 23
🔥 Active Users (24h): 12
⚡ Bot Deployed: 2024-01-15 14:30:22

Admin: /broadcast Ruby 2.0 is live with new features! 🎉

Ruby: Starting broadcast to 247 users...
      Broadcast completed!
      ✅ Sent: 234
      ❌ Failed: 13
```

## ⚙️ Configuration Options

### Personality Tuning
Edit the system prompt in `src/index.js` around line 125:

```javascript
const systemPrompt = `You are Ruby, a warm and engaging AI brand ambassador...`;
```

### Community Links  
Update in `src/index.js` around line 200:

```javascript
// Update these URLs
- Join our main community: [TopV1 Community](https://t.me/topv1community)  
- Follow updates: [TopV1 Announcements](https://t.me/topv1announcements)
- Check out our platform: https://topv1.com
```

### Conversation Flow
Modify exchange count trigger in `handleConversation()`:

```javascript
// Change from 3 to different number
if (user.exchange_count >= 3) {
    await this.sendCallToAction(ctx, response);
}
```

## 📊 Monitoring Ruby

### Daily Checks
```bash
# Quick health check
curl https://your-worker-url.workers.dev

# Admin stats via bot
# Send /stats in Telegram
```

### Database Queries
```bash
# Check recent users
wrangler d1 execute ruby-bot-db --command="SELECT * FROM users ORDER BY created_at DESC LIMIT 5"

# Check conversation activity
wrangler d1 execute ruby-bot-db --command="SELECT COUNT(*) FROM conversation_history WHERE timestamp >= datetime('now', '-24 hours')"
```

### Performance Monitoring
- **Target Response Time**: < 3 seconds
- **Target Conversion Rate**: > 5%
- **Target Completion Rate**: > 80%

## 🛠️ Common Customizations

### Change CTA Timing
```javascript
// In handleConversation(), change the exchange count:
if (user.exchange_count >= 4) {  // Was 3, now 4
    await this.sendCallToAction(ctx, response);
}
```

### Add New Admin
```bash
# Add additional admin user ID
wrangler secret put ADMIN_USER_IDS
# Enter: 123456789,NEW_USER_ID,987654321
```

### Update Bot Personality
```javascript
// In generateAIResponse(), modify the system prompt:
const systemPrompt = `You are Ruby, a [CUSTOMIZE PERSONALITY HERE]...`;
```

## 🔥 Advanced Features

### Custom Analytics
Add tracking for specific metrics:

```javascript
// In conversation flow
await this.incrementBotStat('feature_usage_count');
await this.logConversation(userId, 'event', 'custom_event_name');
```

### A/B Testing
Test different conversation approaches:

```javascript
// Randomly assign users to test group
const isTestGroup = Math.random() < 0.5;
const systemPrompt = isTestGroup ? testPrompt : normalPrompt;
```

### Rich Responses
Add images, documents, or custom keyboards:

```javascript
await ctx.replyWithPhoto('https://example.com/image.jpg', {
    caption: 'Welcome to TopV1!',
    reply_markup: keyboard
});
```

## 🎯 Success Metrics

Track these KPIs for Ruby's success:

**Growth Metrics:**
- New users per day/week
- User retention rate
- Community conversion rate

**Engagement Metrics:**
- Conversation completion rate
- Average exchanges per user
- Response satisfaction (manual review)

**Technical Metrics:**
- Response time
- Error rate  
- Uptime
- API costs

## 💡 Tips for Success

1. **Start Simple**: Launch with basic flow, iterate based on user feedback
2. **Monitor Closely**: Watch metrics daily for first week
3. **Gather Feedback**: Manually review conversations for improvement ideas
4. **Test Changes**: Use small admin broadcasts to test new messaging
5. **Keep It Human**: Ruby's strength is feeling personal, not robotic

## 🆘 Need Help?

1. **Check**: TESTING.md for debugging procedures
2. **Review**: ADMIN.md for advanced management
3. **Read**: README.md for comprehensive documentation
4. **Debug**: Use `wrangler tail` to see live logs

---

**Ready to launch Ruby? Run `bash setup.sh` and start welcoming users to TopV1!** 🚀✨
