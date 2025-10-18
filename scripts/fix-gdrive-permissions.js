#!/usr/bin/env node

/**
 * Script to make existing Google Drive files publicly accessible
 *
 * Usage:
 *   node scripts/fix-gdrive-permissions.js FILE_ID1 FILE_ID2 ...
 *
 * Example:
 *   node scripts/fix-gdrive-permissions.js 1yMGBQ8g06j_Rp9ma9i7uLAPdjZeqE3YG
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function authenticate() {
  const USE_OAUTH = process.env.USE_GOOGLE_DRIVE_OAUTH === 'true';
  const SCOPES = ['https://www.googleapis.com/auth/drive'];

  if (USE_OAUTH) {
    // Use OAuth credentials
    const projectRoot = process.cwd();
    const OAUTH_CLIENT_PATH = path.join(projectRoot, 'config/google-oauth-client.json');
    const TOKEN_PATH = path.join(projectRoot, 'config/google-drive-token.json');

    if (!fs.existsSync(OAUTH_CLIENT_PATH)) {
      throw new Error('OAuth client credentials not found. Run: node scripts/authorize-oauth.js');
    }
    if (!fs.existsSync(TOKEN_PATH)) {
      throw new Error('OAuth token not found. Run: node scripts/authorize-oauth.js');
    }

    const credentials = JSON.parse(fs.readFileSync(OAUTH_CLIENT_PATH, 'utf8'));
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    const { client_id, client_secret, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    oAuth2Client.setCredentials(token);
    console.log('✓ Using OAuth credentials for Google Drive');

    return oAuth2Client;
  } else {
    // Use service account
    const CREDENTIALS_PATH = path.join(__dirname, '../config/google-credentials.json');
    const USER_EMAIL = process.env.GOOGLE_DRIVE_USER_EMAIL;

    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Service account credentials not found at: ${CREDENTIALS_PATH}`);
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: SCOPES,
      clientOptions: USER_EMAIL ? { subject: USER_EMAIL } : {}
    });

    const client = await auth.getClient();

    if (USER_EMAIL && client.subject !== USER_EMAIL) {
      console.log(`Setting subject to: ${USER_EMAIL}`);
      client.subject = USER_EMAIL;
    }

    console.log('✓ Using service account credentials for Google Drive');
    return client;
  }
}

async function makeFilePublic(drive, fileId) {
  try {
    // Check current permissions
    const permissions = await drive.permissions.list({
      fileId: fileId,
      fields: 'permissions(id, type, role)',
    });

    const hasPublicPermission = permissions.data.permissions?.some(
      p => p.type === 'anyone' && p.role === 'reader'
    );

    if (hasPublicPermission) {
      console.log(`✓ File ${fileId} is already publicly accessible`);
      return { fileId, status: 'already_public' };
    }

    // Add public read permission
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log(`✓ File ${fileId} is now publicly accessible`);
    console.log(`  URL: https://lh3.googleusercontent.com/d/${fileId}=s400`);
    return { fileId, status: 'made_public' };
  } catch (error) {
    console.error(`✗ Failed to update permissions for file ${fileId}:`, error.message);
    return { fileId, status: 'failed', error: error.message };
  }
}

async function main() {
  const fileIds = process.argv.slice(2);

  if (fileIds.length === 0) {
    console.error('Error: No file IDs provided');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/fix-gdrive-permissions.js FILE_ID1 FILE_ID2 ...');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/fix-gdrive-permissions.js 1yMGBQ8g06j_Rp9ma9i7uLAPdjZeqE3YG');
    process.exit(1);
  }

  try {
    console.log('Authenticating with Google Drive...');
    const auth = await authenticate();
    const drive = google.drive({ version: 'v3', auth });

    console.log('');
    console.log(`Processing ${fileIds.length} file(s)...`);
    console.log('');

    const results = [];
    for (const fileId of fileIds) {
      const result = await makeFilePublic(drive, fileId);
      results.push(result);
    }

    console.log('');
    console.log('Summary:');
    console.log('--------');
    const madePublic = results.filter(r => r.status === 'made_public').length;
    const alreadyPublic = results.filter(r => r.status === 'already_public').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`Made public:      ${madePublic}`);
    console.log(`Already public:   ${alreadyPublic}`);
    console.log(`Failed:           ${failed}`);

    if (failed > 0) {
      console.log('');
      console.log('Failed files:');
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`  ${r.fileId}: ${r.error}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
