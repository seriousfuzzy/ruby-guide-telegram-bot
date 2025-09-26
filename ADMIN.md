# Ruby Bot Admin Guide 👑

This guide covers administrative features and management of Ruby, the AI-powered Telegram bot for TopV1 LLC.

## 🔑 Admin Access

### Setting Up Admin Users

Admins are configured via the `ADMIN_USER_IDS` secret:

```bash
# Set single admin
wrangler secret put ADMIN_USER_IDS
# Enter: 123456789

# Set multiple admins (comma-separated)
wrangler secret put ADMIN_USER_IDS  
# Enter: 123456789,987654321,456789123
```

### Finding Your Telegram User ID

1. Open Telegram
2. Message @userinfobot
3. Copy the "User ID" number (not the @username)

## 📊 Admin Commands

All admin commands are only available to users configured in `ADMIN_USER_IDS`.

### `/stats` - Bot Statistics

View comprehensive bot metrics and analytics.

**Usage:** `/stats`

**Example Response:**
```
📊 Ruby Bot Statistics

👥 Total Users: 1,247
💬 Conversations Started: 1,180  
🌟 Community Conversions: 89
🔥 Active Users (24h): 23
⚡ Bot Deployed: 2024-01-15 10:30:00
```

**Metrics Explained:**
- **Total Users**: Unique users who've interacted with Ruby
- **Conversations Started**: Users who sent `/start`
- **Community Conversions**: Users who clicked "Join Community"
- **Active Users (24h)**: Users active in last 24 hours
- **Bot Deployed**: When the current version was deployed

### `/reset [user_id]` - Reset User State

Reset a user's conversation state back to initial.

**Usage:** 
```
/reset 123456789
```

**Use Cases:**
- User got stuck in conversation flow
- User wants to restart onboarding
- Testing conversation flow
- Debugging user issues

**Example:**
```
Admin: /reset 123456789
Ruby: User 123456789 has been reset.
```

### `/broadcast [message]` - Send Message to All Users

Send a message to all registered users.

**Usage:**
```
/broadcast Important update: Ruby now has new features!
```

**Features:**
- Supports Markdown formatting
- Tracks delivery success/failure
- Logs admin action
- Shows delivery statistics

**Example:**
```
Admin: /broadcast Welcome to Ruby 2.0! 🎉 Check out our new features.

Ruby: Starting broadcast to 1,247 users...
      Broadcast completed!
      ✅ Sent: 1,198
      ❌ Failed: 49
```

**Failed Deliveries:** Usually due to:
- Users who blocked the bot
- Deleted Telegram accounts
- Network issues

## 📈 Analytics & Insights

### Understanding User Behavior

#### Conversation Completion Rate
```sql
-- Check how many users complete full conversation flow
SELECT 
  COUNT(CASE WHEN exchange_count >= 3 THEN 1 END) as completed,
  COUNT(*) as total,
  ROUND(COUNT(CASE WHEN exchange_count >= 3 THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM users;
```

#### Community Conversion Rate
```sql
-- Check conversion from conversation to community join
SELECT 
  COUNT(CASE WHEN joined_community = 1 THEN 1 END) as conversions,
  COUNT(*) as total_users,
  ROUND(COUNT(CASE WHEN joined_community = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate
FROM users;
```

#### Daily Activity
```sql
-- Users active each day
SELECT 
  DATE(last_interaction) as date,
  COUNT(*) as active_users
FROM users 
WHERE last_interaction >= date('now', '-30 days')
GROUP BY DATE(last_interaction)
ORDER BY date DESC;
```

### Database Queries

Access the database directly for detailed analysis:

```bash
# Connect to database
wrangler d1 execute ruby-bot-db --command="[SQL_QUERY]"

# Export data for analysis
wrangler d1 export ruby-bot-db --output=backup.sql
```

#### Useful Queries

**Recent User Activity:**
```sql
SELECT telegram_id, username, first_name, exchange_count, 
       conversation_state, joined_community, last_interaction
FROM users 
WHERE last_interaction >= datetime('now', '-24 hours')
ORDER BY last_interaction DESC;
```

**Conversation Quality Analysis:**
```sql
SELECT message_type, ai_response, COUNT(*) as count
FROM conversation_history 
WHERE timestamp >= datetime('now', '-7 days')
GROUP BY message_type, ai_response;
```

**Top User Engagement:**
```sql
SELECT u.telegram_id, u.username, u.first_name, 
       COUNT(ch.id) as message_count,
       u.exchange_count, u.joined_community
FROM users u
LEFT JOIN conversation_history ch ON u.telegram_id = ch.telegram_id
GROUP BY u.telegram_id
ORDER BY message_count DESC
LIMIT 20;
```

## 🔧 Maintenance Tasks

### Daily Tasks

1. **Check `/stats`** for overall health
2. **Review error logs** in Cloudflare Dashboard
3. **Monitor response times** and user complaints

### Weekly Tasks

1. **Analyze conversation completion rates**
2. **Review community conversion metrics**
3. **Check for stuck users** (high exchange count, no conversion)
4. **Update community links** if needed

### Monthly Tasks

1. **Database cleanup** (old conversation history)
2. **Performance optimization** review
3. **A/B test** conversation flow improvements
4. **User feedback** collection and analysis

### Database Maintenance

**Clean Old Conversation History:**
```sql
-- Keep only last 30 days of conversation history
DELETE FROM conversation_history 
WHERE timestamp < datetime('now', '-30 days');
```

**Reset Stuck Users:**
```sql
-- Find users with high exchange count but no community join
SELECT telegram_id, exchange_count, conversation_state
FROM users 
WHERE exchange_count > 10 AND joined_community = 0;

-- Reset them
UPDATE users 
SET conversation_state = 'initial', exchange_count = 0 
WHERE exchange_count > 10 AND joined_community = 0;
```

## 🚨 Troubleshooting

### Common Admin Issues

#### Stats Not Loading
**Symptoms:** `/stats` shows errors or "0" values
**Solutions:**
1. Check database connection: `wrangler d1 execute ruby-bot-db --command="SELECT 1"`
2. Verify database ID in wrangler.toml
3. Check for database migration issues

#### Broadcast Failures
**Symptoms:** High failure rate in broadcasts
**Solutions:**
1. Check user count vs. failure rate (10-15% failure is normal)
2. Review message content (avoid spam triggers)
3. Check Telegram bot token validity

#### Reset Command Not Working
**Symptoms:** User state doesn't reset
**Solutions:**
1. Verify user ID is correct (numbers only)
2. Check admin authorization
3. Confirm database write permissions

### Emergency Procedures

#### Bot Down/Not Responding
1. **Check worker status** in Cloudflare Dashboard
2. **Verify webhook** is set correctly
3. **Check secrets** are configured
4. **Review recent deployments** for issues
5. **Check API quotas** (OpenAI, Telegram)

#### Database Issues
1. **Check D1 status** in Cloudflare Dashboard
2. **Verify database binding** in wrangler.toml
3. **Test connection** with simple query
4. **Restore from backup** if corrupted

#### High Error Rate
1. **Check worker logs**: `wrangler tail`
2. **Review OpenAI API** usage and errors
3. **Check Telegram API** rate limits
4. **Monitor memory usage** and performance

## 📊 Performance Monitoring

### Key Metrics to Watch

**Response Time:**
- Target: < 3 seconds average
- Alert: > 5 seconds sustained

**Error Rate:**
- Target: < 1% of requests
- Alert: > 5% in any hour

**Conversion Rate:**
- Target: > 5% conversation to community
- Review: < 3% needs investigation

**User Engagement:**
- Target: > 80% complete conversation flow
- Review: < 60% completion rate

### Monitoring Tools

**Cloudflare Analytics:**
- Worker invocation count
- Response time percentiles
- Error rate trends
- Geographic distribution

**Custom Metrics:**
```sql
-- Daily summary query
SELECT 
  DATE('now') as date,
  COUNT(DISTINCT telegram_id) as active_users,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN ai_response = 1 THEN 1 END) as ai_responses
FROM conversation_history 
WHERE timestamp >= date('now');
```

## 🎯 Optimization Tips

### Improving Conversion Rates

1. **A/B Test CTA Timing:**
   - Try 2-3 exchanges vs 3-4 exchanges
   - Test different trigger phrases

2. **Optimize AI Prompts:**
   - Monitor fallback response usage
   - Refine personality based on user feedback

3. **Update Community Links:**
   - Ensure links are current and working
   - Test mobile experience

### Performance Optimization

1. **Database Query Optimization:**
   - Add indexes for slow queries
   - Archive old conversation data

2. **Response Time Improvement:**
   - Optimize AI prompt length
   - Cache frequent responses

3. **Error Rate Reduction:**
   - Add more fallback responses
   - Improve input validation

## 🔒 Security Best Practices

### Admin Security

1. **Limit Admin Access:**
   - Only add necessary admin users
   - Regularly review admin list

2. **Monitor Admin Actions:**
   - Review admin_actions table regularly
   - Alert on unusual admin activity

3. **Secure API Keys:**
   - Rotate keys periodically
   - Monitor API usage

### Data Protection

1. **User Privacy:**
   - Only collect necessary data
   - Regularly clean old conversation history

2. **Secure Secrets:**
   - Use Wrangler secrets (never commit to git)
   - Regularly rotate tokens and keys

## 📞 Support Contacts

### Technical Issues
- **Cloudflare Workers**: Cloudflare Dashboard → Workers → Ruby Bot
- **Database (D1)**: Cloudflare Dashboard → D1 → ruby-bot-db
- **OpenAI API**: https://platform.openai.com/usage
- **Telegram Bot**: @BotFather for bot management

### Business Issues
- **TopV1 Community Links**: Verify all links are current
- **Brand Message**: Ensure Ruby's personality aligns with TopV1 values
- **User Feedback**: Monitor for suggestions and complaints

---

**Need help? Check the troubleshooting section first, then contact the development team with specific error messages and steps to reproduce issues.** 🛟
