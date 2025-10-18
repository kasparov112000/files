# Google Drive Upload Setup for Files Service

This guide explains how to configure the files service to upload files to Google Drive instead of Azure Storage.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to Google Drive API

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"

## Step 3: Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `files-service-uploader` (or any name you prefer)
   - Description: `Service account for uploading files to Google Drive`
4. Click "Create and Continue"
5. Grant the service account the "Editor" role (or create a custom role with Drive permissions)
6. Click "Done"

## Step 4: Create and Download Service Account Key

1. In the "Credentials" page, find your newly created service account
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Click "Create" - this will download a JSON file

**IMPORTANT**: Keep this JSON file secure. It contains sensitive credentials!

## Step 5: Configure the Files Service

### Option A: Using File Path

1. Save the downloaded JSON file to `/home/hipolito/repos/lbt/files/config/google-credentials.json`

```bash
# Create config directory if it doesn't exist
mkdir -p /home/hipolito/repos/lbt/files/config

# Copy your credentials file
cp ~/Downloads/your-project-xxxxx-xxxxx.json /home/hipolito/repos/lbt/files/config/google-credentials.json
```

### Option B: Using Environment Variable

Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/credentials.json"
```

Or in your `.env` file:
```
GOOGLE_APPLICATION_CREDENTIALS=/home/hipolito/repos/lbt/files/config/google-credentials.json
```

## Step 6: Enable Google Drive Upload

Set the environment variable to use Google Drive:

```bash
export USE_GOOGLE_DRIVE=true
```

Or add to your `.env` file:
```
USE_GOOGLE_DRIVE=true
```

## Step 7: Grant Drive Access (Optional but Recommended)

If you want to access uploaded files from a specific Google Drive account:

1. Get your service account email from the JSON file (look for the `client_email` field)
2. In Google Drive, create a folder for uploads
3. Share this folder with the service account email
4. The service account will now be able to upload files to this shared folder

To upload to a specific folder, you'll need to modify the `uploadFileToDrive` method to include a `parents` field with the folder ID.

## Environment Variables Summary

Add these to `/home/hipolito/repos/lbt/files/.env`:

```env
# Enable Google Drive uploads
USE_GOOGLE_DRIVE=true

# Path to Google Drive credentials (choose one method)
GOOGLE_APPLICATION_CREDENTIALS=/home/hipolito/repos/lbt/files/config/google-credentials.json
# OR
GOOGLE_CREDENTIALS_PATH=/home/hipolito/repos/lbt/files/config/google-credentials.json

# Database settings (if not already set)
ENV_NAME=LOCAL
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_NAME=mdr-files
```

## Testing

After setup, restart the files service and test with:

```bash
curl -X POST http://localhost:8080/api/files/attachments/upload \
  -F "file=@/path/to/test-file.pdf"
```

Successful response:
```json
{
  "statusCode": 200,
  "message": "File uploaded successfully to Google Drive",
  "result": {
    "fileId": "1abc123def456...",
    "fileName": "test-file.pdf",
    "size": 12345,
    "metadata": {...}
  }
}
```

## Troubleshooting

### Error: "Google credentials file not found"
- Verify the credentials file exists at the specified path
- Check the `GOOGLE_APPLICATION_CREDENTIALS` or `GOOGLE_CREDENTIALS_PATH` environment variable

### Error: "Invalid grant"
- The service account key may have expired or been revoked
- Generate a new key from the Google Cloud Console

### Error: "Insufficient Permission"
- Ensure the Google Drive API is enabled for your project
- Verify the service account has the correct permissions

### Error: "User Rate Limit Exceeded"
- Google Drive API has usage quotas
- Implement rate limiting or request a quota increase

## Security Best Practices

1. **Never commit credentials to git**: Add `config/google-credentials.json` to `.gitignore`
2. **Rotate keys regularly**: Create new service account keys periodically
3. **Use environment-specific credentials**: Different keys for dev/staging/production
4. **Limit permissions**: Only grant the minimum required Drive permissions
5. **Monitor usage**: Check Google Cloud Console for unexpected API usage

## Additional Features

### Upload to Specific Folder

To upload to a specific Google Drive folder, modify the `fileMetadata` in `uploadFileToDrive`:

```typescript
const fileMetadata = {
  name: fileObject.originalname,
  parents: ['YOUR_FOLDER_ID_HERE'] // Add this line
};
```

### Share Files Automatically

To make uploaded files accessible, add permissions after upload:

```typescript
await drive.permissions.create({
  fileId: response.data.id,
  requestBody: {
    role: 'reader',
    type: 'anyone'
  }
});
```

## Deployment Considerations

For Kubernetes deployment:

1. Create a Kubernetes secret with the credentials:
```bash
kubectl create secret generic google-drive-credentials \
  --from-file=credentials.json=/path/to/your/credentials.json
```

2. Mount the secret in the deployment:
```yaml
volumeMounts:
  - name: google-credentials
    mountPath: /var/secrets/google
    readOnly: true
volumes:
  - name: google-credentials
    secret:
      secretName: google-drive-credentials
```

3. Set environment variable:
```yaml
env:
  - name: GOOGLE_APPLICATION_CREDENTIALS
    value: /var/secrets/google/credentials.json
  - name: USE_GOOGLE_DRIVE
    value: "true"
```
