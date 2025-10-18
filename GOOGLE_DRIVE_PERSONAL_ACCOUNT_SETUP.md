# Google Drive Setup for Personal Accounts

## Problem
Service accounts don't have their own storage quota. When you try to upload files using a service account, Google Drive rejects the upload with:

> "Service Accounts do not have storage quota. Leverage shared drives or use OAuth delegation instead."

## Solutions

### Option 1: Use Google Workspace with Shared Drives (Requires paid account)
- **Cost**: $6-18/month per user
- **Best for**: Organizations and teams
- Not applicable for personal Gmail accounts

### Option 2: Use OAuth 2.0 with Your Personal Account (Recommended for personal use)
This allows the application to upload files directly to **your** Google Drive using **your** storage quota.

#### Steps:

1. **Create an OAuth 2.0 Client ID** (not a service account)
   - Go to: https://console.cloud.google.com/apis/credentials?project=learnbytesting-ai
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Choose "Desktop app" as the application type
   - Name it: "Files Service Desktop Client"
   - Click "CREATE"
   - Download the JSON file
   - Save it as: `/home/hipolito/repos/lbt/files/config/google-oauth-client.json`

2. **Authorize the application**
   ```bash
   cd /home/hipolito/repos/lbt/files
   node scripts/setup-oauth.js
   ```

   This will:
   - Open a browser window
   - Ask you to log in with 212marines@gmail.com
   - Request permission to access your Google Drive
   - Save a refresh token to `config/google-drive-token.json`

3. **Update the files service to use OAuth credentials**
   - Modify `file.service.ts` to use OAuth2 client instead of service account
   - Use the refresh token to get access tokens

### Option 3: Use Local File Storage Instead
If Google Drive integration is not critical, you could:
- Store files locally on the server
- Use Azure Blob Storage (already implemented)
- Use AWS S3 or other cloud storage

## Current Status
- ✅ Service account created: `files-uploader@learnbytesting-ai.iam.gserviceaccount.com`
- ✅ Credentials file: `config/google-credentials.json`
- ❌ Service account cannot upload (no storage quota)
- ⏳ Need to create OAuth 2.0 client for personal account access

## Recommendation
For a personal Google account (212marines@gmail.com), **Option 2 (OAuth 2.0)** is the best approach. It's free, works with personal Gmail accounts, and uses your existing 15GB storage quota.

Would you like me to create the OAuth setup script?
