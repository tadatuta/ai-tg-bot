import 'dotenv/config';
import { Bot, webhookCallback, InlineQueryResultBuilder } from 'grammy';
import { generateResponse } from './gemini.js';
const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error('BOT_TOKEN environment variable not provided.');
}

export const bot = new Bot(token);

bot.command('start', async (ctx) => {
    await ctx.reply('Hello! I am a bot connected to Gemini Flash. Send me a message!');
});

bot.on('message:text', async (ctx) => {
    const userMessage = ctx.message.text;

    // Show typing indicator
    await ctx.replyWithChatAction('typing');

    const replyText = await generateResponse(userMessage);

    await ctx.reply(replyText, {
        reply_parameters: { message_id: ctx.message.message_id }
    });
});

bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;

    if (!query) {
        return;
    }

    try {
        const replyText = await generateResponse(query);

        const result = InlineQueryResultBuilder.article('1', 'Gemini Response', {
            description: replyText.substring(0, 50) + '...'
        }).text(replyText);

        await ctx.answerInlineQuery([result], { cache_time: 0 });
    } catch (e) {
        console.error('Inline query error:', e);
    }
});

bot.catch((err) => {
    console.error(`Error while handling update ${err.ctx.update.update_id}:`);
    err.error && console.error(err.error);
});

if (require.main === module) {
    console.log('Starting bot locally...');
    bot.start();

    // Enable graceful stop
    process.once('SIGINT', () => {
        bot.stop();
        console.log('Bot stopped.');
    });
    process.once('SIGTERM', () => {
        bot.stop();
        console.log('Bot stopped.');
    });
}