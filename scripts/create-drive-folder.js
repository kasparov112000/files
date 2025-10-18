#!/usr/bin/env node

/**
 * Create a folder in Google Drive using OAuth credentials
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Paths
const OAUTH_CLIENT_PATH = path.join(__dirname, '../config/google-oauth-client.json');
const TOKEN_PATH = path.join(__dirname, '../config/google-drive-token.json');

async function createFolder(folderName) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Create Google Drive Folder');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Load OAuth credentials
    if (!fs.existsSync(OAUTH_CLIENT_PATH)) {
      console.error('✗ OAuth client credentials not found at:', OAUTH_CLIENT_PATH);
      process.exit(1);
    }
    if (!fs.existsSync(TOKEN_PATH)) {
      console.error('✗ OAuth token not found at:', TOKEN_PATH);
      console.error('  Run: node scripts/authorize-oauth.js\n');
      process.exit(1);
    }

    const credentials = JSON.parse(fs.readFileSync(OAUTH_CLIENT_PATH, 'utf8'));
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    const { client_id, client_secret, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    console.log('✓ OAuth credentials loaded');

    // Create Drive API client
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    // Check if folder already exists
    console.log(`\nSearching for existing folder: "${folderName}"...`);
    const searchResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, webViewLink)',
      spaces: 'drive'
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      const existingFolder = searchResponse.data.files[0];
      console.log('✓ Folder already exists!');
      console.log('  Name:', existingFolder.name);
      console.log('  ID:', existingFolder.id);
      console.log('  URL:', existingFolder.webViewLink);
      console.log('\nFolder ID:', existingFolder.id);
      return existingFolder.id;
    }

    // Create the folder
    console.log(`Creating folder: "${folderName}"...`);
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id, name, webViewLink'
    });

    console.log('\n✓ Folder created successfully!');
    console.log('  Name:', response.data.name);
    console.log('  ID:', response.data.id);
    console.log('  URL:', response.data.webViewLink);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  Add this to your .env file:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`GOOGLE_DRIVE_FOLDER_ID=${response.data.id}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    return response.data.id;

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Get folder name from command line or use default
const folderName = process.argv[2] || 'lbt-uploads';
createFolder(folderName);
