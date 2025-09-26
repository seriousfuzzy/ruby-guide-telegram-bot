# Ruby Bot Testing Guide 🧪

This guide covers how to test Ruby the AI Telegram bot throughout development and after deployment.

## 🚀 Pre-Deployment Testing

### Local Development Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
# Or directly: wrangler dev
```

3. **Set up ngrok for webhook testing:**
```bash
# Install ngrok: https://ngrok.com/
ngrok http 8787

# Use the HTTPS URL for webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://abc123.ngrok.io"
```

### Manual Testing Checklist

#### ✅ Basic Bot Functionality
- [ ] Bot responds to `/start` command
- [ ] Welcome message is sent with Ruby's personality
- [ ] Bot handles unknown commands gracefully
- [ ] Error handling works (try invalid inputs)

#### ✅ Conversation Flow Testing
- [ ] **Exchange 1**: Bot asks engaging follow-up question
- [ ] **Exchange 2**: Bot maintains conversation context
- [ ] **Exchange 3**: Bot starts building toward CTA
- [ ] **Exchange 4**: Call-to-action is presented with inline buttons

#### ✅ AI Integration Testing
- [ ] OpenAI API integration works
- [ ] Fallback responses work when AI fails
- [ ] Response personality matches Ruby's brand
- [ ] Response length is appropriate (2-3 sentences)

#### ✅ Database Operations
- [ ] User registration works on first `/start`
- [ ] Conversation state is tracked correctly
- [ ] Exchange count increments properly
- [ ] User data persists between interactions

#### ✅ Call-to-Action Flow
- [ ] CTA buttons appear after 3-4 exchanges
- [ ] "Yes, show me around!" button works
- [ ] "Tell me more first" button works
- [ ] Community links are correct
- [ ] User join status is tracked

## 🔧 Admin Features Testing

### Admin Command Testing (requires admin user ID)

#### ✅ Stats Command (`/stats`)
- [ ] Returns current bot statistics
- [ ] Shows total users count
- [ ] Shows conversation metrics
- [ ] Shows community conversion rate
- [ ] Shows active users (24h)
- [ ] Displays deployment timestamp

#### ✅ Reset Command (`/reset`)
- [ ] Shows usage instructions when no user ID provided
- [ ] Resets specific user state when user ID provided
- [ ] Confirms reset action
- [ ] Logs admin action

#### ✅ Broadcast Command (`/broadcast`)
- [ ] Shows usage instructions when no message provided
- [ ] Sends message to all registered users
- [ ] Reports success/failure counts
- [ ] Logs admin action with message content

#### ✅ Admin Authorization
- [ ] Commands work for configured admin users
- [ ] Commands are denied for non-admin users
- [ ] Proper error messages for unauthorized access

## 📊 Database Testing

### Data Integrity Tests

```bash
# Check user creation
wrangler d1 execute ruby-bot-db --command="SELECT * FROM users ORDER BY created_at DESC LIMIT 5"

# Check conversation logging
wrangler d1 execute ruby-bot-db --command="SELECT * FROM conversation_history ORDER BY timestamp DESC LIMIT 10"

# Check bot statistics
wrangler d1 execute ruby-bot-db --command="SELECT * FROM bot_stats"

# Check admin actions
wrangler d1 execute ruby-bot-db --command="SELECT * FROM admin_actions ORDER BY timestamp DESC LIMIT 5"
```

#### ✅ Database Operations
- [ ] Users table populates on first interaction
- [ ] Conversation history logs all messages
- [ ] Bot stats increment correctly
- [ ] Admin actions are logged
- [ ] Database queries perform well

## 🎯 Production Testing

### Post-Deployment Verification

1. **Webhook Setup:**
```bash
# Verify webhook is set
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Should return your worker URL and "ok": true
```

2. **Worker Health Check:**
```bash
# Check worker is responding
curl https://your-worker-url.workers.dev
# Should return: "Ruby Bot is running! 🤖✨"
```

#### ✅ Production Readiness
- [ ] Bot responds within 2-3 seconds
- [ ] No 5xx errors in Cloudflare dashboard
- [ ] Database connections are stable
- [ ] Memory usage is reasonable
- [ ] API rate limits are respected

### Load Testing (Optional)

For high-traffic scenarios:

```bash
# Send multiple concurrent requests
for i in {1..10}; do
  curl -X POST "https://your-worker-url.workers.dev" \
    -H "Content-Type: application/json" \
    -d '{"message":{"text":"/start","from":{"id":'$i'}}}' &
done
wait
```

#### ✅ Performance Testing
- [ ] Handles 10+ concurrent users
- [ ] Response time stays under 5s under load
- [ ] No memory leaks during extended use
- [ ] Database queries remain fast

## 🐛 Common Issues & Solutions

### Issue: Bot Not Responding
**Symptoms:** No response to messages
**Check:**
- [ ] Webhook URL is correct
- [ ] Worker is deployed and running
- [ ] Secrets are set properly
- [ ] Check worker logs: `wrangler tail`

### Issue: AI Responses Not Working
**Symptoms:** Generic fallback responses only
**Check:**
- [ ] OpenAI API key is valid
- [ ] API quota not exceeded
- [ ] Network connectivity to OpenAI
- [ ] Error logs for API failures

### Issue: Database Errors
**Symptoms:** User data not persisting
**Check:**
- [ ] D1 database is created and bound
- [ ] Database ID in wrangler.toml is correct
- [ ] Schema was executed successfully
- [ ] Check database with: `wrangler d1 execute ruby-bot-db --command="SELECT 1"`

### Issue: Admin Commands Not Working
**Symptoms:** "Not authorized" messages
**Check:**
- [ ] ADMIN_USER_IDS secret is set
- [ ] User ID format is correct (numbers only)
- [ ] Multiple IDs are comma-separated
- [ ] Get correct user ID from @userinfobot

## 📈 Monitoring & Analytics

### Key Metrics to Monitor

1. **User Engagement:**
   - New users per day
   - Conversation completion rate
   - Community conversion rate

2. **Technical Performance:**
   - Response time
   - Error rate
   - Database query performance

3. **AI Quality:**
   - Fallback response rate
   - Conversation flow completion
   - User satisfaction (manual review)

### Monitoring Commands

```bash
# Check recent activity
wrangler d1 execute ruby-bot-db --command="
  SELECT DATE(created_at) as date, COUNT(*) as new_users 
  FROM users 
  WHERE created_at >= date('now', '-7 days') 
  GROUP BY DATE(created_at)"

# Check conversation quality
wrangler d1 execute ruby-bot-db --command="
  SELECT ai_response, COUNT(*) as count 
  FROM conversation_history 
  WHERE timestamp >= datetime('now', '-24 hours') 
  GROUP BY ai_response"
```

## 🎉 Test Scenarios

### Scenario 1: New User Journey
1. Send `/start`
2. Respond naturally to Ruby's questions
3. Continue conversation for 3-4 exchanges
4. Click "Yes, show me around!" when CTA appears
5. Verify community links work

### Scenario 2: Admin Workflow
1. Login as admin user
2. Use `/stats` to check metrics
3. Use `/broadcast` to send test message
4. Use `/reset` to reset a test user
5. Verify all actions are logged

### Scenario 3: Error Handling
1. Send invalid commands
2. Try to break conversation flow
3. Simulate network failures
4. Verify graceful error handling

### Scenario 4: Multi-User Testing
1. Test with multiple Telegram accounts
2. Verify conversations don't interfere
3. Check database handles concurrent users
4. Test admin features with multiple active users

## 📋 Release Checklist

Before marking Ruby as production-ready:

#### ✅ Functionality
- [ ] All core features tested and working
- [ ] AI conversation flow feels natural
- [ ] Call-to-action conversion works
- [ ] Admin features function properly

#### ✅ Quality
- [ ] No critical bugs or errors
- [ ] Performance meets requirements
- [ ] User experience is smooth
- [ ] Error handling is comprehensive

#### ✅ Security
- [ ] Secrets are properly configured
- [ ] Admin authorization works
- [ ] No sensitive data exposed
- [ ] Input validation in place

#### ✅ Documentation
- [ ] README is complete and accurate
- [ ] Deployment instructions work
- [ ] Admin guide is clear
- [ ] Troubleshooting covers common issues

---

**Ready to test? Start with the basic functionality checklist and work your way through each section!** 🚀
