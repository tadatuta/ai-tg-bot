#!/bin/bash
# scripts/set-webhook.sh
# Sets the Telegram Webhook for the specified bot

if [ -z "$BOT_TOKEN" ]; then
  echo "Error: BOT_TOKEN is not set."
  exit 1
fi

if [ -z "$FUNCTION_URL" ]; then
  echo "Error: FUNCTION_URL is not set."
  echo "Usage: BOT_TOKEN=xxx FUNCTION_URL=yyy ./scripts/set-webhook.sh"
  exit 1
fi

curl -v "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${FUNCTION_URL}"
echo ""
echo "Webhook setup request completed."
