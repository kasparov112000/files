# Quick Start: Upload to Your Personal Google Drive

## 5-Minute Setup

### Step 1: Create Google Cloud Service Account (2 minutes)

1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Click **"APIs & Services"** > **"Credentials"**
4. Click **"Create Credentials"** > **"Service Account"**
5. Name it: `files-uploader`, click **"Create and Continue"**
6. Skip roles (click "Continue" twice)
7. Click on the service account email
8. Go to **"Keys"** tab > **"Add Key"** > **"Create new key"** > **"JSON"**
9. Save the downloaded JSON file

### Step 2: Enable Google Drive API (30 seconds)

1. In Google Cloud Console: **"APIs & Services"** > **"Library"**
2. Search: **"Google Drive API"**
3. Click it > **"Enable"**

### Step 3: Share Folder with Service Account (1 minute)

1. Go to: https://drive.google.com
2. Create a new folder: **"LBT Uploads"** (or any name)
3. Right-click folder > **"Share"**
4. Paste the service account email from the JSON file:
   - Look for `"client_email"` in the JSON
   - Example: `files-uploader@your-project.iam.gserviceaccount.com`
5. Set permission to **"Editor"**
6. Click **"Share"** (ignore the warning about sending invite)
7. **Copy the folder ID**:
   - Open the folder
   - Look at URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - Copy everything after `/folders/`

### Step 4: Configure Service (1 minute)

```bash
cd /home/hipolito/repos/lbt/files

# Copy your credentials
cp ~/Downloads/your-service-account-key.json ./config/google-credentials.json

# Edit .env file and add your folder ID:
# GOOGLE_DRIVE_FOLDER_ID=paste_your_folder_id_here
nano .env
```

Update this line in `.env`:
```
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_from_step_3
```

### Step 5: Rebuild and Test (30 seconds)

```bash
# Rebuild
npm run build

# Restart service
pkill -f "node.*build/app/server.js"
node ./build/app/server.js > /tmp/files-service.log 2>&1 &

# Wait a moment
sleep 3

# Test upload
curl -X POST http://localhost:8080/api/files/attachments/upload \
  -F "file=@./QUICKSTART.md"
```

## Success!

If successful, you'll see:
```json
{
  "statusCode": 200,
  "message": "File uploaded successfully to Google Drive",
  "result": {
    "fileId": "1abc123def456...",
    "fileName": "QUICKSTART.md",
    ...
  }
}
```

**Check your Google Drive folder** - the file will be there! 🎉

---

## Troubleshooting

### "Google credentials file not found"
```bash
# Check file exists:
ls -la ./config/google-credentials.json

# Verify path in .env:
cat .env | grep GOOGLE_APPLICATION_CREDENTIALS
```

### "Permission denied" or "404 Not Found"
- Verify you shared the folder with the service account email
- Check the folder ID is correct
- Make sure the service account has "Editor" permission

### "Google Drive API has not been enabled"
- Go back to Step 2 and enable the API
- Wait a few minutes for it to propagate

### Service not starting
```bash
# Check logs:
tail -50 /tmp/files-service.log

# Check if port 3008 is in use:
lsof -ti:3008

# Kill and restart:
lsof -ti:3008 | xargs kill -9
node ./build/app/server.js > /tmp/files-service.log 2>&1 &
```

---

## What's Next?

### View Uploaded Files
All files will appear in your shared folder at:
```
https://drive.google.com/drive/folders/YOUR_FOLDER_ID
```

### Production Deployment
See `GOOGLE_DRIVE_SETUP.md` for Kubernetes deployment with secrets.

### Multiple Folders
To upload to different folders for different users/contexts, you can:
1. Pass folder ID in the request body
2. Use user-specific folders based on authentication
3. Create folder per project/category

### Security
- Keep `google-credentials.json` secure (never commit to git!)
- Rotate service account keys regularly
- Use different credentials for dev/prod

---

## Complete Example

```bash
# Navigate to files service
cd /home/hipolito/repos/lbt/files

# 1. Copy credentials
cp ~/Downloads/your-key.json ./config/google-credentials.json

# 2. Set folder ID in .env
echo 'GOOGLE_DRIVE_FOLDER_ID=1A2B3C4D5E6F7G8H9I' >> .env

# 3. Rebuild
npm run build

# 4. Restart
lsof -ti:3008 | xargs kill -9 2>/dev/null
node ./build/app/server.js > /tmp/files-service.log 2>&1 &
sleep 3

# 5. Test
curl -X POST http://localhost:8080/api/files/attachments/upload \
  -F "file=@/home/hipolito/repos/lbt/orchestrator/AUDIT_LOGGING_CONTROL.md"

# 6. Check your Google Drive folder!
```

That's it! Files are now uploading to your personal Google Drive! 🚀
