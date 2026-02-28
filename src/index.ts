import { webhookCallback } from 'grammy';
import { bot } from './bot.js';

// Yandex Cloud Functions adapter
// We use the "express" adapter since Yandex Cloud Functions passes req, res
// that are very similar to Express req, res.
export const handler = async (event: any, context: any) => {
    try {
        // For Yandex Cloud Http Handler, the event usually wraps the HTTP request.
        // However, typical Serverless HTTP functions in Yandex with Node.js 16+ expose (req, res).
        // Wait, let's verify standard syntax: module.exports.handler = async function (event, context)
        // If it's an HTTP function, `event` is the HTTP request object, but we need native Express-like request.
        // Actually, Yandex Cloud supports 'express' framework via webhookCallback if we map it properly, 
        // BUT the simplest way is to manually feed the update to the bot.

        // Parse the body
        let body;
        if (event.body) {
            body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            }
        } else {
            // In some configurations, the body is directly the event
            body = event;
        }

        if (body && body.update_id) {
            if (!bot.isInited()) {
                await bot.init();
            }
            await bot.handleUpdate(body);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true })
        };
    } catch (err: any) {
        console.error('Handler error', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ ok: false, error: err.message })
        };
    }
};
