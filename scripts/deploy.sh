#!/bin/bash
# scripts/deploy.sh
# Deploys the code to Yandex Cloud Functions

set -e

# Load from .env if present
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

if [ -z "$FUNCTION_NAME" ] || [ -z "$SERVICE_ACCOUNT" ] || [ -z "$BUCKET_NAME" ] || [ -z "$MOUNT_PREFIX" ] || [ -z "$MOUNT_POINT" ]; then
  echo "Error: Required deployment variables are not set."
  echo "Please set FUNCTION_NAME, SERVICE_ACCOUNT, BUCKET_NAME, MOUNT_PREFIX, and MOUNT_POINT in your .env file."
  exit 1
fi

ENTRYPOINT="dist/index.handler"
RUNTIME="nodejs22"

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
SA_ID=$(yc iam service-account get "$SERVICE_ACCOUNT" --format yaml 2>/dev/null | awk '/^id:/ {print $2}')

if [ -z "$SA_ID" ]; then
  echo "Error: Could not find service account ID for $SERVICE_ACCOUNT."
  exit 1
fi

yc serverless function version create \
  --function-name "$FUNCTION_NAME" \
  --runtime "$RUNTIME" \
  --entrypoint "$ENTRYPOINT" \
  --memory 256m \
  --execution-timeout 6s \
  --environment VERTEX_PROJECT_ID=$VERTEX_PROJECT_ID,VERTEX_LOCATION=$VERTEX_LOCATION,GEMINI_MODEL_ID=$GEMINI_MODEL_ID,BOT_TOKEN=$BOT_TOKEN,GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS \
  --service-account-id "$SA_ID" \
  --mount type=object-storage,bucket=$BUCKET_NAME,prefix=$MOUNT_PREFIX,mount-point=$MOUNT_POINT,mode=ro \
  --source-path build.zip

echo "Deployment complete."
