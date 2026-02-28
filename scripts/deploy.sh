#!/bin/bash
# scripts/deploy.sh
# Deploys the code to Yandex Cloud Functions

set -e

FUNCTION_NAME="electrovafin-bot"
ENTRYPOINT="dist/index.handler"
RUNTIME="nodejs20"

# Assuming you are already authenticated with 'yc' CLI

echo "Building TypeScript..."
npm run build

echo "Packaging..."
# We zip dist, package.json, node_modules (optional if installing in cloud), and prompt.txt
# Alternatively, deploy passing package.json and let yandex cloud install modules.

# Remove old build if any
rm -f build.zip || true

# We zip only the necessary files for cloud deployment.
# We will rely on Yandex Cloud to install dependencies via package.json.
zip -r build.zip dist/ package.json package-lock.json prompt.txt

echo "Deploying to Yandex Cloud..."
yc serverless function version create \
  --function-name "$FUNCTION_NAME" \
  --runtime "$RUNTIME" \
  --entrypoint "$ENTRYPOINT" \
  --memory 256m \
  --execution-timeout 60s \
  --environment VERTEX_PROJECT_ID=$VERTEX_PROJECT_ID,VERTEX_LOCATION=$VERTEX_LOCATION,GEMINI_MODEL_ID=$GEMINI_MODEL_ID,BOT_TOKEN=$BOT_TOKEN \
  --source build.zip

echo "Deployment complete."
