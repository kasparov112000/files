#!/bin/bash

# Automated Google Drive Setup using gcloud CLI
# This script creates a service account and credentials for uploading to Google Drive

set -e

GCLOUD="/home/hipolito/google-cloud-sdk/bin/gcloud"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${SCRIPT_DIR}/config"
CREDENTIALS_FILE="${CONFIG_DIR}/google-credentials.json"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Google Drive Setup for Files Service${NC}"
echo -e "${BLUE}================================================${NC}"
echo

# Check if gcloud is authenticated
echo -e "${YELLOW}Step 1: Checking gcloud authentication...${NC}"
if ! $GCLOUD auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${RED}Error: Not authenticated with gcloud${NC}"
    echo "Please run: $GCLOUD auth login"
    exit 1
fi

ACTIVE_ACCOUNT=$($GCLOUD auth list --filter=status:ACTIVE --format="value(account)" | head -1)
echo -e "${GREEN}✓ Authenticated as: ${ACTIVE_ACCOUNT}${NC}"
echo

# Check/set project
echo -e "${YELLOW}Step 2: Setting up Google Cloud project...${NC}"
CURRENT_PROJECT=$($GCLOUD config get-value project 2>/dev/null || echo "")

if [ -z "$CURRENT_PROJECT" ]; then
    echo "No project currently set."
    echo "Available projects:"
    $GCLOUD projects list --format="table(projectId,name)"
    echo
    read -p "Enter project ID (or press Enter to create new): " PROJECT_ID

    if [ -z "$PROJECT_ID" ]; then
        read -p "Enter new project name: " PROJECT_NAME
        PROJECT_ID=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')-$(date +%s | tail -c 5)
        echo "Creating project: $PROJECT_ID"
        $GCLOUD projects create "$PROJECT_ID" --name="$PROJECT_NAME"
        $GCLOUD config set project "$PROJECT_ID"
    else
        $GCLOUD config set project "$PROJECT_ID"
    fi
else
    PROJECT_ID="$CURRENT_PROJECT"
    echo -e "${GREEN}✓ Using project: ${PROJECT_ID}${NC}"
    read -p "Use this project? (y/n): " USE_CURRENT
    if [ "$USE_CURRENT" != "y" ]; then
        echo "Available projects:"
        $GCLOUD projects list --format="table(projectId,name)"
        read -p "Enter project ID: " PROJECT_ID
        $GCLOUD config set project "$PROJECT_ID"
    fi
fi
echo

# Enable required APIs
echo -e "${YELLOW}Step 3: Enabling Google Drive API...${NC}"
echo "This may take a minute..."
$GCLOUD services enable drive.googleapis.com --project="$PROJECT_ID" 2>/dev/null || true
$GCLOUD services enable iam.googleapis.com --project="$PROJECT_ID" 2>/dev/null || true
sleep 3
echo -e "${GREEN}✓ APIs enabled${NC}"
echo

# Create service account
echo -e "${YELLOW}Step 4: Creating service account...${NC}"
SERVICE_ACCOUNT_NAME="files-uploader"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if service account already exists
if $GCLOUD iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
    echo -e "${YELLOW}Service account already exists: ${SERVICE_ACCOUNT_EMAIL}${NC}"
    read -p "Use existing service account? (y/n): " USE_EXISTING
    if [ "$USE_EXISTING" != "y" ]; then
        SERVICE_ACCOUNT_NAME="files-uploader-$(date +%s | tail -c 5)"
        SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
        echo "Creating new service account: $SERVICE_ACCOUNT_NAME"
    fi
fi

# Create if doesn't exist
if ! $GCLOUD iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
    $GCLOUD iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --display-name="Files Service Uploader" \
        --description="Service account for uploading files to Google Drive" \
        --project="$PROJECT_ID"
    echo -e "${GREEN}✓ Service account created${NC}"
else
    echo -e "${GREEN}✓ Using existing service account${NC}"
fi

echo -e "${BLUE}Service account email: ${SERVICE_ACCOUNT_EMAIL}${NC}"
echo

# Create credentials
echo -e "${YELLOW}Step 5: Creating service account key...${NC}"
mkdir -p "$CONFIG_DIR"

# Remove old key if exists
if [ -f "$CREDENTIALS_FILE" ]; then
    echo "Backing up existing credentials..."
    mv "$CREDENTIALS_FILE" "${CREDENTIALS_FILE}.backup.$(date +%s)"
fi

$GCLOUD iam service-accounts keys create "$CREDENTIALS_FILE" \
    --iam-account="$SERVICE_ACCOUNT_EMAIL" \
    --project="$PROJECT_ID"

echo -e "${GREEN}✓ Credentials saved to: ${CREDENTIALS_FILE}${NC}"
echo

# Instructions for sharing folder
echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}IMPORTANT: Share Google Drive Folder${NC}"
echo -e "${BLUE}================================================${NC}"
echo
echo -e "1. Go to: ${BLUE}https://drive.google.com${NC}"
echo "2. Create a new folder (e.g., 'LBT Uploads')"
echo "3. Right-click the folder → Share"
echo -e "4. Add this email as ${GREEN}Editor${NC}:"
echo
echo -e "   ${GREEN}${SERVICE_ACCOUNT_EMAIL}${NC}"
echo
echo "5. Click Share (ignore the warning about sending invite)"
echo "6. Open the folder and copy the ID from the URL:"
echo "   https://drive.google.com/drive/folders/FOLDER_ID_HERE"
echo
read -p "Press Enter after you've shared the folder and copied the ID..."
echo

# Get folder ID
read -p "Paste the Google Drive folder ID: " FOLDER_ID

if [ -z "$FOLDER_ID" ]; then
    echo -e "${YELLOW}Warning: No folder ID provided. Files will upload to root of service account drive.${NC}"
else
    echo -e "${GREEN}✓ Folder ID: ${FOLDER_ID}${NC}"
fi
echo

# Update .env file
echo -e "${YELLOW}Step 6: Updating .env configuration...${NC}"
ENV_FILE="${SCRIPT_DIR}/.env"

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%s)"
fi

# Update or create .env
cat > "$ENV_FILE" << EOF
# Files Service Configuration
# Generated by setup-gdrive-gcloud.sh on $(date)

# Enable Google Drive uploads
USE_GOOGLE_DRIVE=true

# Google Drive credentials
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json

# Google Drive folder ID
GOOGLE_DRIVE_FOLDER_ID=${FOLDER_ID}

# Database configuration
ENV_NAME=LOCAL
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_NAME=mdr-files
EOF

echo -e "${GREEN}✓ Configuration saved to: ${ENV_FILE}${NC}"
echo

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Setup Complete! 🎉${NC}"
echo -e "${BLUE}================================================${NC}"
echo
echo "Summary:"
echo "  • Project: $PROJECT_ID"
echo "  • Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "  • Credentials: $CREDENTIALS_FILE"
echo "  • Folder ID: ${FOLDER_ID:-'(not set)'}"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Rebuild the service:"
echo "     cd $SCRIPT_DIR"
echo "     npm run build"
echo
echo "  2. Restart the service:"
echo "     lsof -ti:3008 | xargs kill -9 2>/dev/null"
echo "     node ./build/app/server.js > /tmp/files-service.log 2>&1 &"
echo
echo "  3. Test upload:"
echo "     curl -X POST http://localhost:8080/api/files/attachments/upload \\"
echo "       -F \"file=@./QUICKSTART.md\""
echo
echo -e "${GREEN}Files will now upload to your Google Drive folder!${NC}"
echo
