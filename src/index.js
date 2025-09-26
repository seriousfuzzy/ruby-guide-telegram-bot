/**
 * Ruby - AI-powered Telegram Bot Brand Ambassador
 * For TopV1 LLC Community Platform
 */

import { Telegraf } from 'telegraf';
import OpenAI from 'openai';

class RubyBot {
    constructor(env) {
        this.env = env;
        this.bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
        this.openai = new OpenAI({
            apiKey: env.OPENAI_API_KEY,
        });
        this.db = env.DB;
        this.adminIds = env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id.trim())) || [];
        
        this.initializeHandlers();
    }

    initializeHandlers() {
        // Start command
        this.bot.start(async (ctx) => {
            await this.handleStart(ctx);
        });

        // Admin commands
        this.bot.command('stats', async (ctx) => {
            if (this.isAdmin(ctx.from.id)) {
                await this.handleStats(ctx);
            } else {
                await ctx.reply('Sorry, this command is only available to admins.');
            }
        });

        this.bot.command('reset', async (ctx) => {
            if (this.isAdmin(ctx.from.id)) {
                await this.handleReset(ctx);
            } else {
                await ctx.reply('Sorry, this command is only available to admins.');
            }
        });

        this.bot.command('broadcast', async (ctx) => {
            if (this.isAdmin(ctx.from.id)) {
                await this.handleBroadcast(ctx);
            } else {
                await ctx.reply('Sorry, this command is only available to admins.');
            }
        });

        // Handle all text messages
        this.bot.on('text', async (ctx) => {
            if (!ctx.message.text.startsWith('/')) {
                await this.handleConversation(ctx);
            }
        });

        // Handle callback queries (inline buttons)
        this.bot.on('callback_query', async (ctx) => {
            await this.handleCallbackQuery(ctx);
        });

        // Error handling
        this.bot.catch(async (err, ctx) => {
            console.error('Bot error:', err);
            await this.logError(err, ctx);
        });
    }

    async handleStart(ctx) {
        const userId = ctx.from.id;
        const user = await this.getOrCreateUser(ctx.from);
        
        await this.logConversation(userId, 'user', '/start');
        
        const welcomeMessage = `Hello there! 👋 I'm Ruby, and I'm absolutely thrilled to meet you!

I'm here as a friendly face for the TopV1 community - think of me as your warm welcome into something pretty special we're building together.

What brings you our way today? I'd love to hear a bit about what you're interested in! ✨`;

        await ctx.reply(welcomeMessage);
        await this.logConversation(userId, 'bot', welcomeMessage);
        
        // Update user state
        await this.updateUserState(userId, 'greeting', 1);
        await this.incrementBotStat('conversations_started');
    }

    async handleConversation(ctx) {
        const userId = ctx.from.id;
        const userMessage = ctx.message.text;
        const user = await this.getUser(userId);
        
        if (!user) {
            await ctx.reply("Hi! Please use /start to begin our conversation!");
            return;
        }

        await this.logConversation(userId, 'user', userMessage);

        // Determine conversation stage and generate appropriate response
        const response = await this.generateAIResponse(userMessage, user);
        
        // Send response
        if (user.exchange_count >= 3) {
            // Time for call-to-action
            await this.sendCallToAction(ctx, response);
        } else {
            await ctx.reply(response);
            await this.logConversation(userId, 'bot', response, true);
        }
        
        // Update user exchange count
        await this.updateUserState(userId, user.conversation_state, user.exchange_count + 1);
    }

    async generateAIResponse(userMessage, user) {
        const systemPrompt = `You are Ruby, a warm and engaging AI brand ambassador for TopV1 LLC, a community-driven technology platform. Your personality is:

- Warm, genuine, and approachable
- Curious about people and their interests
- Subtly enthusiastic about technology and community
- Professional but not stuffy - like talking to a friendly colleague
- Focused on making people feel welcomed and heard

Current conversation context:
- User has had ${user.exchange_count} exchanges
- Current state: ${user.conversation_state}
- This is exchange #${user.exchange_count + 1}

Guidelines:
- Keep responses conversational and natural (2-3 sentences max)
- Ask engaging follow-up questions to learn about the user
- Show genuine interest in their responses
- If this is exchange 3-4, start building toward introducing TopV1 community
- Never be pushy or overly sales-y
- Match their communication style and energy level`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 150,
                temperature: 0.8
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('OpenAI API error:', error);
            return this.getFallbackResponse(user.exchange_count);
        }
    }

    getFallbackResponse(exchangeCount) {
        const responses = [
            "That's really interesting! I love learning about what motivates different people. What got you started with that?",
            "Thanks for sharing that with me! It sounds like you have some great insights. What's been the most exciting part for you?",
            "I really appreciate you telling me about that! You know, the TopV1 community has people with all kinds of fascinating backgrounds and interests...",
        ];
        
        return responses[Math.min(exchangeCount, responses.length - 1)];
    }

    async sendCallToAction(ctx, aiResponse) {
        const message = `${aiResponse}

You know what? I think you'd really enjoy our TopV1 community! We're building something special - a place where technology feels human-first, and every voice matters.

Would you like me to show you around? 🚀`;

        const keyboard = {
            inline_keyboard: [[
                { text: '🌟 Yes, show me around!', callback_data: 'join_community' },
                { text: '💬 Tell me more first', callback_data: 'learn_more' }
            ]]
        };

        await ctx.reply(message, { reply_markup: keyboard });
        await this.logConversation(ctx.from.id, 'bot', message + ' [CTA sent]', true);
    }

    async handleCallbackQuery(ctx) {
        const callbackData = ctx.callbackQuery.data;
        const userId = ctx.from.id;

        await ctx.answerCbQuery();

        if (callbackData === 'join_community') {
            await this.updateUserJoinedCommunity(userId, true);
            await this.incrementBotStat('community_conversions');
            
            const welcomeMsg = `🎉 Fantastic! Welcome to TopV1!

Here's how to get started:
• Join our main community: [TopV1 Community](https://t.me/topv1community)  
• Follow updates: [TopV1 Announcements](https://t.me/topv1announcements)
• Check out our platform: https://topv1.com

I'm excited to see you around! Feel free to mention that Ruby sent you 😊`;

            await ctx.editMessageText(welcomeMsg, { parse_mode: 'Markdown' });
            
        } else if (callbackData === 'learn_more') {
            const infoMsg = `TopV1 is where technology meets humanity! 🌟

Here's what makes us different:
✨ **Human-First Technology** - We believe tech should feel approachable and respectful
🤝 **Community-Driven** - Every member has a voice in shaping our direction  
🚀 **Innovation Focus** - We're building the next generation of community platforms
🔒 **Safe & Inclusive** - A respectful space for meaningful conversations

Ready to dive in?`;

            const keyboard = {
                inline_keyboard: [[
                    { text: '🚀 Yes, let\'s do this!', callback_data: 'join_community' },
                    { text: '📧 Get updates first', callback_data: 'get_updates' }
                ]]
            };

            await ctx.editMessageText(infoMsg, { reply_markup: keyboard, parse_mode: 'Markdown' });
            
        } else if (callbackData === 'get_updates') {
            const updatesMsg = `Perfect! Here's how to stay in the loop:

📢 **TopV1 Announcements**: https://t.me/topv1announcements
🌐 **Website**: https://topv1.com
📧 **Newsletter**: Sign up at topv1.com/newsletter

When you're ready to join the conversation, just let me know! I'll be here 😊`;

            await ctx.editMessageText(updatesMsg, { parse_mode: 'Markdown' });
        }

        await this.logConversation(userId, 'user', `Callback: ${callbackData}`);
    }

    // Admin Commands
    async handleStats(ctx) {
        try {
            const stats = await this.getBotStats();
            const activeUsers = await this.getActiveUsersCount();
            
            let statsMessage = `📊 **Ruby Bot Statistics**\n\n`;
            statsMessage += `👥 Total Users: ${stats.total_users || 0}\n`;
            statsMessage += `💬 Conversations Started: ${stats.conversations_started || 0}\n`;
            statsMessage += `🌟 Community Conversions: ${stats.community_conversions || 0}\n`;
            statsMessage += `🔥 Active Users (24h): ${activeUsers}\n`;
            statsMessage += `⚡ Bot Deployed: ${stats.bot_deployed_at || 'Unknown'}\n`;

            await ctx.reply(statsMessage, { parse_mode: 'Markdown' });
            await this.logAdminAction(ctx.from.id, 'stats_requested');
            
        } catch (error) {
            console.error('Stats error:', error);
            await ctx.reply('Error retrieving stats. Please try again.');
        }
    }

    async handleReset(ctx) {
        // Extract user ID from command if provided
        const args = ctx.message.text.split(' ');
        if (args.length > 1) {
            const targetUserId = parseInt(args[1]);
            if (targetUserId) {
                await this.resetUserState(targetUserId);
                await ctx.reply(`User ${targetUserId} has been reset.`);
                await this.logAdminAction(ctx.from.id, 'user_reset', targetUserId);
                return;
            }
        }

        await ctx.reply('Usage: /reset [user_id]\nExample: /reset 123456789');
    }

    async handleBroadcast(ctx) {
        const args = ctx.message.text.split(' ');
        if (args.length < 2) {
            await ctx.reply('Usage: /broadcast [message]\nExample: /broadcast Hello everyone!');
            return;
        }

        const message = args.slice(1).join(' ');
        const users = await this.getAllUsers();
        let successCount = 0;
        let errorCount = 0;

        await ctx.reply(`Starting broadcast to ${users.length} users...`);

        for (const user of users) {
            try {
                await this.bot.telegram.sendMessage(user.telegram_id, `📢 **Message from TopV1 Team:**\n\n${message}`, { parse_mode: 'Markdown' });
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Failed to send to user ${user.telegram_id}:`, error);
            }
        }

        await ctx.reply(`Broadcast completed!\n✅ Sent: ${successCount}\n❌ Failed: ${errorCount}`);
        await this.logAdminAction(ctx.from.id, 'broadcast_sent', null, `Message: "${message}", Success: ${successCount}, Errors: ${errorCount}`);
    }

    // Database operations
    async getOrCreateUser(telegramUser) {
        try {
            let user = await this.getUser(telegramUser.id);
            
            if (!user) {
                // Create new user
                const stmt = await this.db.prepare(`
                    INSERT INTO users (telegram_id, username, first_name, last_name)
                    VALUES (?, ?, ?, ?)
                `);
                await stmt.bind(
                    telegramUser.id,
                    telegramUser.username || null,
                    telegramUser.first_name || null,
                    telegramUser.last_name || null
                ).run();
                
                await this.incrementBotStat('total_users');
                user = await this.getUser(telegramUser.id);
            }
            
            return user;
        } catch (error) {
            console.error('Database error in getOrCreateUser:', error);
            throw error;
        }
    }

    async getUser(telegramId) {
        try {
            const stmt = await this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
            const result = await stmt.bind(telegramId).first();
            return result;
        } catch (error) {
            console.error('Database error in getUser:', error);
            return null;
        }
    }

    async updateUserState(telegramId, state, exchangeCount) {
        try {
            const stmt = await this.db.prepare(`
                UPDATE users 
                SET conversation_state = ?, exchange_count = ?, last_interaction = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE telegram_id = ?
            `);
            await stmt.bind(state, exchangeCount, telegramId).run();
        } catch (error) {
            console.error('Database error in updateUserState:', error);
        }
    }

    async updateUserJoinedCommunity(telegramId, joined = true) {
        try {
            const stmt = await this.db.prepare(`
                UPDATE users 
                SET joined_community = ?, updated_at = CURRENT_TIMESTAMP
                WHERE telegram_id = ?
            `);
            await stmt.bind(joined, telegramId).run();
        } catch (error) {
            console.error('Database error in updateUserJoinedCommunity:', error);
        }
    }

    async logConversation(telegramId, messageType, content, aiResponse = false) {
        try {
            const stmt = await this.db.prepare(`
                INSERT INTO conversation_history (telegram_id, message_type, content, ai_response)
                VALUES (?, ?, ?, ?)
            `);
            await stmt.bind(telegramId, messageType, content, aiResponse).run();
        } catch (error) {
            console.error('Database error in logConversation:', error);
        }
    }

    async getBotStats() {
        try {
            const stmt = await this.db.prepare('SELECT metric_name, metric_value FROM bot_stats');
            const results = await stmt.all();
            
            const stats = {};
            results.results.forEach(row => {
                stats[row.metric_name] = row.metric_value;
            });
            
            return stats;
        } catch (error) {
            console.error('Database error in getBotStats:', error);
            return {};
        }
    }

    async incrementBotStat(metricName, incrementBy = 1) {
        try {
            // Get current value
            const stmt1 = await this.db.prepare('SELECT metric_value FROM bot_stats WHERE metric_name = ?');
            const result = await stmt1.bind(metricName).first();
            
            const currentValue = result ? parseInt(result.metric_value) : 0;
            const newValue = currentValue + incrementBy;
            
            // Update or insert
            const stmt2 = await this.db.prepare(`
                INSERT OR REPLACE INTO bot_stats (metric_name, metric_value)
                VALUES (?, ?)
            `);
            await stmt2.bind(metricName, newValue.toString()).run();
        } catch (error) {
            console.error('Database error in incrementBotStat:', error);
        }
    }

    async getActiveUsersCount() {
        try {
            const stmt = await this.db.prepare(`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE last_interaction >= datetime('now', '-24 hours')
            `);
            const result = await stmt.first();
            return result?.count || 0;
        } catch (error) {
            console.error('Database error in getActiveUsersCount:', error);
            return 0;
        }
    }

    async getAllUsers() {
        try {
            const stmt = await this.db.prepare('SELECT telegram_id FROM users');
            const result = await stmt.all();
            return result.results || [];
        } catch (error) {
            console.error('Database error in getAllUsers:', error);
            return [];
        }
    }

    async resetUserState(telegramId) {
        try {
            const stmt = await this.db.prepare(`
                UPDATE users 
                SET conversation_state = 'initial', exchange_count = 0, updated_at = CURRENT_TIMESTAMP
                WHERE telegram_id = ?
            `);
            await stmt.bind(telegramId).run();
        } catch (error) {
            console.error('Database error in resetUserState:', error);
        }
    }

    async logAdminAction(adminId, action, targetUserId = null, details = null) {
        try {
            const stmt = await this.db.prepare(`
                INSERT INTO admin_actions (admin_id, action, target_user_id, details)
                VALUES (?, ?, ?, ?)
            `);
            await stmt.bind(adminId, action, targetUserId, details).run();
        } catch (error) {
            console.error('Database error in logAdminAction:', error);
        }
    }

    async logError(error, ctx) {
        try {
            const errorDetails = {
                message: error.message,
                stack: error.stack,
                user: ctx?.from?.id,
                chat: ctx?.chat?.id,
                timestamp: new Date().toISOString()
            };
            
            console.error('Bot Error Log:', errorDetails);
            
            // You could also save this to database if needed
        } catch (logError) {
            console.error('Error logging error:', logError);
        }
    }

    isAdmin(userId) {
        return this.adminIds.includes(userId);
    }
}

// Cloudflare Workers export
export default {
    async fetch(request, env, ctx) {
        try {
            const bot = new RubyBot(env);
            
            // Handle webhook verification
            if (request.method === 'GET') {
                return new Response('Ruby Bot is running! 🤖✨', { 
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
            
            // Handle Telegram webhook
            if (request.method === 'POST') {
                const update = await request.json();
                await bot.bot.handleUpdate(update);
                
                return new Response('OK', { status: 200 });
            }
            
            return new Response('Method not allowed', { status: 405 });
            
        } catch (error) {
            console.error('Worker error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    },
};
