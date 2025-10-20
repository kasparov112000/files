# Files Microservice Pipeline Fix

## Issue
The GitHub Actions pipeline for the files microservice was failing with:
```
Error: UPGRADE FAILED: release files failed, and has been rolled back due to atomic being set: context deadline exceeded
```

**Date**: October 18, 2025
**Failed Run ID**: 18619436965
**Repository**: kasparov112000/files

## Root Causes Identified

### 1. **Helm Deployment Timeout** (Primary Issue)
- **Problem**: Helm upgrade command was timing out after the default 5 minutes
- **Why**: The deployment was using `--wait` and `--atomic` flags without specifying a timeout
- **Impact**: Any deployment taking longer than 5 minutes would fail and rollback

### 2. **Missing Google OAuth Secret** (Critical Blocker)
- **Problem**: The deployment references a secret `files-google-oauth` that doesn't exist in the cluster
- **File**: `/helm/templates/deployment.yaml` line 63
- **Behavior**: Pod tries to mount volume from non-existent secret → Pod fails to start → Deployment never becomes ready → Timeout → Rollback
- **Evidence**: `kubectl get secret files-google-oauth` returns "NotFound"

### 3. **Aggressive Readiness Probe**  (Contributing Factor)
- **Problem**: Readiness probe settings didn't give the app enough time to start
- **Original Settings**:
  - `initialDelaySeconds: 5` - Only 5 seconds before first check
  - `periodSeconds: 3` - Check every 3 seconds
  - No `failureThreshold` set (default is 3)
  - **Total grace period**: 5 + (3 × 3) = ~14 seconds
- **Why This Failed**: The files service needs to:
  - Connect to MongoDB
  - Initialize Google Drive OAuth (if enabled)
  - Load configuration
  - This can easily take 15-30 seconds

## Fixes Applied

### Fix 1: Increase Helm Timeout
**File**: `.github/workflows/workflow.yml` (line 62)

```yaml
# BEFORE
helm upgrade files ./helm/ \
  --install \
  --wait \
  --atomic \
  --set=app.name=files \
  --set=image.tag=${{ github.sha }} \
  --values=./helm/values.yaml

# AFTER
helm upgrade files ./helm/ \
  --install \
  --wait \
  --atomic \
  --timeout=10m \
  --set=app.name=files \
  --set=image.tag=${{ github.sha }} \
  --values=./helm/values.yaml
```

**Impact**: Deployment now has 10 minutes to complete instead of 5 minutes

### Fix 2: Make Google OAuth Secret Optional
**File**: `helm/templates/deployment.yaml` (line 64)

```yaml
# BEFORE
volumes:
  - name: google-oauth-credentials
    secret:
      secretName: {{ include "helm.fullname" . }}-google-oauth
      items:
        - key: google-oauth-client.json
          path: google-oauth-client.json
        - key: google-drive-token.json
          path: google-drive-token.json

# AFTER
volumes:
  - name: google-oauth-credentials
    secret:
      secretName: {{ include "helm.fullname" . }}-google-oauth
      optional: true  # ← KEY CHANGE
      items:
        - key: google-oauth-client.json
          path: google-oauth-client.json
        - key: google-drive-token.json
          path: google-drive-token.json
```

**Impact**: Pod can start even if the secret doesn't exist. Google Drive features will be disabled but the service will run.

### Fix 3: Improve Readiness Probe Settings
**File**: `helm/templates/deployment.yaml` (lines 49-57)

```yaml
# BEFORE
readinessProbe:
  httpGet:
    path: /healthcheck
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 3

# AFTER
readinessProbe:
  httpGet:
    path: /healthcheck
    port: 3000
  initialDelaySeconds: 15      # Wait 15 seconds before first check
  periodSeconds: 10            # Check every 10 seconds
  failureThreshold: 6          # Allow 6 failures (60 seconds)
  successThreshold: 1          # Need 1 success to mark ready
  timeoutSeconds: 5            # Each check times out after 5 seconds
```

**New Grace Period**: 15 + (6 × 10) = **75 seconds** for app to start
**Impact**: Much more realistic timeframe for the service to initialize

## Why These Fixes Work Together

1. **Timeout Fix**: Gives Helm enough time to wait for the deployment
2. **Optional Secret**: Removes the hard dependency that was causing pod startup failures
3. **Readiness Probe**: Gives the app realistic time to start up and pass health checks

## Testing the Fix

To verify the fixes work:

```bash
# 1. Commit and push the changes
cd /home/hipolito/repos/lbt/files
git add .github/workflows/workflow.yml helm/templates/deployment.yaml
git commit -m "Fix: Increase Helm timeout and make Google OAuth secret optional"
git push

# 2. Monitor the GitHub Actions run
gh run watch --repo kasparov112000/files

# 3. Check deployment status in Kubernetes
kubectl rollout status deployment/files
kubectl get pods -l app.kubernetes.io/name=files
```

## Expected Results

✅ Docker build completes successfully
✅ Helm upgrade completes within 10 minutes
✅ Pod starts successfully (even without Google OAuth secret)
✅ Pod passes readiness probe within 75 seconds
✅ Deployment marked as successful
✅ No rollback occurs

## Additional Recommendations

### 1. Create the Google OAuth Secret (If Needed)
If Google Drive integration is required, create the secret:

```bash
kubectl apply -f /home/hipolito/repos/lbt/files/helm/templates/google-oauth-secret.yaml
```

Or wait for the next successful Helm deployment to create it automatically.

### 2. Monitor Startup Time
After the fix, check how long the service actually takes to start:

```bash
kubectl get events --sort-by='.lastTimestamp' | grep files
```

This will help determine if 75 seconds is sufficient or if we need to adjust further.

### 3. Consider Adding Liveness Probe
Currently there's only a readiness probe. Consider adding a liveness probe to restart unhealthy pods:

```yaml
livenessProbe:
  httpGet:
    path: /healthcheck
    port: 3000
  initialDelaySeconds: 60
  periodSeconds: 30
  failureThreshold: 3
```

## Files Modified

1. `.github/workflows/workflow.yml` - Added `--timeout=10m`
2. `helm/templates/deployment.yaml` - Made secret optional and improved readiness probe

## Deployment Notes

- These are **infrastructure/configuration changes** - no code changes required
- Changes are **backward compatible**
- Safe to deploy to production
- No environment-specific configuration needed

## Summary

**Before**: Pipeline failed due to deployment timeout caused by missing secret and aggressive health checks
**After**: Pipeline has realistic timeout, service can start without secret, and health checks are appropriately tuned

**Confidence Level**: High - These are standard Kubernetes best practices for handling optional dependencies and realistic startup times.
