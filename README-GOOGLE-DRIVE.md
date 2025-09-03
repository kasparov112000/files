# Google Drive Integration Setup

## Setting up Google Service Account Credentials

This microservice uses Google Drive API for file uploads. To configure it properly:

### 1. Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create a Service Account with appropriate permissions
5. Generate and download the JSON credentials file

### 2. Configure the Credentials

**NEVER commit the credentials file to the repository!**

Choose one of these methods:

#### Method 1: Environment Variable (Recommended for Production)
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/credentials.json"
```

#### Method 2: Custom Path
```bash
export GOOGLE_CREDENTIALS_PATH="/path/to/your/credentials.json"
```

#### Method 3: Default Config Location (Development Only)
Place the credentials file at:
```
config/google-credentials.json
```

### 3. Docker/Kubernetes Deployment

For containerized deployments, use Kubernetes Secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: google-credentials
type: Opaque
data:
  credentials.json: <base64-encoded-credentials>
```

Then mount it in your deployment:

```yaml
volumeMounts:
  - name: google-creds
    mountPath: /app/config
    readOnly: true
volumes:
  - name: google-creds
    secret:
      secretName: google-credentials
```

And set the environment variable:
```yaml
env:
  - name: GOOGLE_CREDENTIALS_PATH
    value: /app/config/credentials.json
```

### Security Notes

1. The `credentials.json` file is in `.gitignore` to prevent accidental commits
2. Never share or expose the credentials file
3. Use different service accounts for different environments
4. Regularly rotate credentials
5. Limit the service account permissions to only what's needed

### Troubleshooting

If you see warnings about missing credentials:
1. Check that the environment variable is set correctly
2. Verify the file exists at the specified path
3. Ensure the file has proper read permissions
4. Check that the service account has the necessary Google Drive API permissions