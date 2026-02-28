#!/bin/bash
# scripts/delete-webhook.sh
# Deletes the Telegram Webhook for the specified bot to allow local polling

if [ -z "$BOT_TOKEN" ]; then
  # Try to load from .env if present
  if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
  fi
fi

if [ -z "$BOT_TOKEN" ]; then
  echo "Error: BOT_TOKEN is not set."
  echo "Usage: BOT_TOKEN=xxx ./scripts/delete-webhook.sh"
  exit 1
fi

curl -v "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=true"
echo ""
echo "Webhook deleted successfully."
