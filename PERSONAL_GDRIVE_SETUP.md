# Upload to Personal Google Drive Account

This guide explains how to configure the files service to upload directly to your personal Google Drive account using OAuth 2.0.

## Quick Setup (Simpler Approach)

The easiest way is to use a **Service Account with folder sharing**:

### Step 1: Create Service Account (Same as Before)

Follow steps 1-4 from `GOOGLE_DRIVE_SETUP.md` to create a service account and download credentials.

### Step 2: Share a Folder with Service Account

1. Go to your personal Google Drive (drive.google.com)
2. Create a new folder (e.g., "LBT Uploads")
3. Right-click the folder > "Share"
4. Add the service account email as an "Editor"
   - The email is in your credentials JSON file: `client_email` field
   - Example: `files-service@your-project.iam.gserviceaccount.com`
5. Click "Share"
6. **Copy the folder ID from the URL**:
   - Open the folder
   - URL will be: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - Copy the folder ID

### Step 3: Configure Upload to Specific Folder

Set the folder ID in your environment:

```bash
# Add to /home/hipolito/repos/lbt/files/.env
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
```

The service will upload all files to this folder in your personal Drive!

---

## Advanced Setup (OAuth 2.0)

For OAuth 2.0 (where users authenticate with their own Google accounts):

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click "Create Credentials" > "OAuth client ID"
4. Choose "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:8080/api/files/oauth/callback`
   - `http://localhost:3008/oauth/callback`
6. Click "Create"
7. Download the JSON file (client secret)

### Step 2: Configure OAuth Credentials

Save the OAuth credentials:

```bash
# The downloaded file will look like:
{
  "web": {
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost:8080/api/files/oauth/callback"],
    ...
  }
}
```

Save it to: `/home/hipolito/repos/lbt/files/config/google-oauth-credentials.json`

### Step 3: Add OAuth Configuration

Add to `.env`:

```env
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/api/files/oauth/callback
```

### Step 4: OAuth Flow

1. User visits: `http://localhost:8080/api/files/oauth/authorize`
2. Redirects to Google sign-in
3. User authorizes the app
4. Returns with access token
5. Token used for uploads

---

## Comparison

| Method | Pros | Cons |
|--------|------|------|
| **Service Account + Sharing** | ✅ Simple setup<br>✅ No user auth needed<br>✅ Works immediately | ⚠️ All users share same folder<br>⚠️ Service account visible as editor |
| **OAuth 2.0** | ✅ Users upload to their own Drive<br>✅ Better permission control | ⚠️ Requires user authentication<br>⚠️ Token management needed |

## Recommendation

**Use Service Account + Folder Sharing** because:
- Much simpler to set up (just share a folder)
- No authentication flow needed
- Files appear in your Drive immediately
- You control access to the folder

All files uploaded through the service will appear in your personal Google Drive folder!
