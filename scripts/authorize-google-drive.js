#!/usr/bin/env node

/**
 * Google Drive OAuth Authorization Script
 *
 * This script helps you authorize the application to access your personal Google Drive
 * and obtain a refresh token that can be used for file uploads.
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('open');
const fs = require('fs');
const path = require('path');

// Load service account credentials
const CREDENTIALS_PATH = path.join(__dirname, '../config/google-credentials.json');
const TOKEN_PATH = path.join(__dirname, '../config/google-drive-token.json');

// OAuth2 configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

async function authorize() {
  try {
    // Check if we already have a token
    if (fs.existsSync(TOKEN_PATH)) {
      console.log('✓ Token file already exists at:', TOKEN_PATH);
      console.log('✓ Delete it if you want to re-authorize');
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
      console.log('\n✓ Refresh token:', token.refresh_token ? 'PRESENT' : 'MISSING');
      return;
    }

    // Load client credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

    // For service accounts, we need to create an OAuth2 client instead
    // We'll use the project's client ID and secret from the service account
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  Google Drive OAuth Authorization');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('⚠️  IMPORTANT: Service accounts cannot use OAuth2 flow directly.');
    console.log('    You need to create an OAuth2 Client ID in Google Cloud Console.\n');

    console.log('Please follow these steps:\n');
    console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
    console.log('2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"');
    console.log('3. Choose "Desktop app" as the application type');
    console.log('4. Name it "Files Service Desktop Client"');
    console.log('5. Click "CREATE"');
    console.log('6. Download the JSON file');
    console.log('7. Save it as: config/google-oauth-client.json\n');

    console.log('After creating the OAuth client, run this script again.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

authorize();
