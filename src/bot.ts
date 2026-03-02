import 'dotenv/config';
import { Bot, webhookCallback, InlineQueryResultBuilder, InlineKeyboard } from 'grammy';
import { generateResponse } from './gemini.js';
const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error('BOT_TOKEN environment variable not provided.');
}

export const bot = new Bot(token);

bot.command('start', async (ctx) => {
    await ctx.reply('Hello! I am a bot connected to Gemini Flash. Send me a message!');
});

const processedMediaGroups = new Set<string>();

bot.on('message:is_automatic_forward', async (ctx) => {
    if (process.env.AUTO_COMMENT_ENABLED !== 'true') return;

    const message = ctx.message;
    const mediaGroupId = message.media_group_id;

    if (mediaGroupId) {
        if (processedMediaGroups.has(mediaGroupId)) {
            return; // Skip if already processed this album
        }
        processedMediaGroups.add(mediaGroupId);

        // Prevent memory leak by capping the Set size
        if (processedMediaGroups.size > 1000) {
            const firstItem = processedMediaGroups.values().next().value;
            if (firstItem) processedMediaGroups.delete(firstItem);
        }
    }

    const postText = message.text || message.caption;
    if (!postText) return;

    try {
        const replyText = await generateResponse(postText);
        await ctx.reply(replyText, {
            // New Telegram API format replacing reply_to_message_id
            reply_parameters: { message_id: message.message_id }
        });
    } catch (e) {
        console.error('Error generating auto-comment:', e);
    }
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
        const keyboard = new InlineKeyboard().text('⏳ Обработка...', 'ignore');

        const result = InlineQueryResultBuilder.article('1', 'Сгенерировать ответ', {
            description: `Запрос: ${query}`,
            reply_markup: keyboard
        }).text(`⏳ Сгенерировать ответ для: ${query}`);

        await ctx.answerInlineQuery([result], { cache_time: 0 });
    } catch (e) {
        console.error('Inline query error:', e);
    }
});

bot.on('chosen_inline_result', async (ctx) => {
    const query = ctx.chosenInlineResult.query;
    const inlineMessageId = ctx.chosenInlineResult.inline_message_id;

    if (!inlineMessageId) {
        console.warn('No inline_message_id received. Ensure inline feedback is enabled.');
        return;
    }

    try {
        // Query the LLM
        const replyText = await generateResponse(query);

        // Update the sent message with the final response
        await ctx.api.editMessageTextInline(
            inlineMessageId,
            replyText,
            { reply_markup: { inline_keyboard: [] } } // Remove the loading button
        );
    } catch (e) {
        console.error('Error updating inline message:', e);
        try {
            await ctx.api.editMessageTextInline(
                inlineMessageId,
                'Произошла ошибка при генерации ответа.',
                { reply_markup: { inline_keyboard: [] } }
            );
        } catch (innerError) {
            console.error('Failed to send error message:', innerError);
        }
    }
});

bot.callbackQuery('ignore', async (ctx) => {
    await ctx.answerCallbackQuery('Подождите, ответ генерируется...');
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