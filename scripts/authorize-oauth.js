#!/usr/bin/env node

/**
 * Google Drive OAuth Authorization Script
 *
 * This script helps you authorize the application to access your Google Drive
 * and obtain a refresh token for file uploads.
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Paths
const OAUTH_CLIENT_PATH = path.join(__dirname, '../config/google-oauth-client.json');
const TOKEN_PATH = path.join(__dirname, '../config/google-drive-token.json');

// Scopes
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Port for local server
const PORT = 3000;

async function authorize() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Google Drive OAuth Authorization');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check if token already exists
  if (fs.existsSync(TOKEN_PATH)) {
    console.log('✓ Token file already exists at:', TOKEN_PATH);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    console.log('✓ Refresh token:', token.refresh_token ? 'PRESENT' : 'MISSING');
    console.log('\nTo re-authorize, delete the token file and run this script again.\n');
    return;
  }

  // Load OAuth client credentials
  if (!fs.existsSync(OAUTH_CLIENT_PATH)) {
    console.error('✗ OAuth client credentials not found at:', OAUTH_CLIENT_PATH);
    console.error('\nPlease create the OAuth client first. See GOOGLE_DRIVE_PERSONAL_ACCOUNT_SETUP.md\n');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(OAUTH_CLIENT_PATH));
  const { client_id, client_secret, redirect_uris } = credentials.installed;

  // Create OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Generate auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('Opening authorization URL in your browser...\n');
  console.log('If the browser does not open automatically, visit this URL:\n');
  console.log(authUrl, '\n');

  // Start local server to receive the callback
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.indexOf('/oauth2callback') > -1) {
        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = qs.get('code');

        if (!code) {
          res.end('Error: No authorization code received');
          return;
        }

        console.log('\n✓ Authorization code received');
        res.end('Authorization successful! You can close this window and return to the terminal.');

        // Exchange code for tokens
        const { tokens } = await oAuth2Client.getToken(code);

        // Save tokens to file
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log('✓ Tokens saved to:', TOKEN_PATH);
        console.log('✓ Refresh token:', tokens.refresh_token ? 'PRESENT' : 'MISSING');

        if (!tokens.refresh_token) {
          console.log('\n⚠️  WARNING: No refresh token received!');
          console.log('   This might be because you already authorized this app before.');
          console.log('   To fix this:');
          console.log('   1. Go to: https://myaccount.google.com/permissions');
          console.log('   2. Remove "LBT Files Service"');
          console.log('   3. Delete', TOKEN_PATH);
          console.log('   4. Run this script again\n');
        } else {
          console.log('\n═══════════════════════════════════════════════════════════════');
          console.log('  ✓ Authorization Complete!');
          console.log('═══════════════════════════════════════════════════════════════\n');
          console.log('Next steps:');
          console.log('1. Update .env file with: USE_GOOGLE_DRIVE_OAUTH=true');
          console.log('2. Restart the files service');
          console.log('3. Test file upload\n');
        }

        server.close();
        process.exit(0);
      }
    } catch (error) {
      console.error('Error during authorization:', error.message);
      res.end('Authorization failed: ' + error.message);
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log('Local server started on port', PORT);
    console.log('Waiting for authorization...\n');
    console.log('Please open the authorization URL in your browser (see above)');
  });
}

authorize().catch(console.error);
