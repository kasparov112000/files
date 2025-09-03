import { DbMicroServiceBase, HttpException } from 'hipolito-framework';
import { ApiResponse } from 'hipolito-models';
import { FileMetaData,FileType } from '../models';

import { AzureStorageProvider } from '../providers';
import { DbFileService } from './db-file.service';
import { AzureStorageConfig } from '../../config/azure-storage.config';
import { isNullOrUndefined } from 'util';
import { FileDownloadResponse } from '@azure/storage-file/typings/src/generated/src/models';
import {AzureStorageResponse} from '../../app/providers/azure-storage/azure-storage-response.model';
import { Readable } from 'stream';
const { google } = require("googleapis");
const path = require("path");
const fs = require('fs');

export class FileService extends DbMicroServiceBase {
    private readonly azureStorageProvider: AzureStorageProvider;
    CREDENTIALS_PATH: any;
    SCOPES: string[];

    // eslint-disable-line
    constructor(readonly dbService: DbFileService, readonly azureStorageConfig: AzureStorageConfig) {
        super(dbService);
        this.azureStorageProvider = new AzureStorageProvider(azureStorageConfig);
        // Use environment variable or fall back to a secure location
        this.CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                               process.env.GOOGLE_CREDENTIALS_PATH || 
                               path.join(__dirname, '../../config/google-credentials.json');
        this.SCOPES = ['https://www.googleapis.com/auth/drive'];
        
        // Warn if credentials file doesn't exist
        if (!fs.existsSync(this.CREDENTIALS_PATH)) {
            console.warn('Google credentials file not found at:', this.CREDENTIALS_PATH);
            console.warn('Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CREDENTIALS_PATH environment variable');
        }
    }

 

    async authenticate() {
      const auth = new google.auth.GoogleAuth({
        keyFile: this.CREDENTIALS_PATH,
        scopes: this.SCOPES,
      });
      return await auth.getClient();
    }
  
    async listFiles(auth) {
      const drive = google.drive({ version: 'v3', auth });
      try {
        const res = await drive.files.list({
          pageSize: 10,
          fields: 'files(id, name)',
        });
        const files = res.data.files;
        if (files.length === 0) {
          console.log('No files found.');
          return [];
        } else {
          console.log('Files:');
          files.forEach((file) => {
            console.log(`${file.name} (${file.id})`);
          });
          return files;
        }
      } catch (err) {
        console.error('Error listing files:', err.message);
        throw err;
      }
    }

    async uploadFileToDrive(fileObject) {
        // Use the class-level credentials path
        const CREDENTIALS_PATH = this.CREDENTIALS_PATH;
        // Scopes for the Google Drive API
        const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
    
        // Authenticate with Google
        async function authenticate() {
          const auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: SCOPES,
          });
          return await auth.getClient();
        }
    
        const auth = await authenticate();
        const drive = google.drive({ version: 'v3', auth });
    
        const fileMetadata = {
          name: fileObject.originalname,
        };
    
        // Convert Buffer to Readable Stream
        const bufferStream = new Readable();
        bufferStream.push(fileObject.buffer);
        bufferStream.push(null);
    
        const media = {
          mimeType: fileObject.mimetype,
          body: bufferStream, // Use the readable stream here
        };
    
        try {
          const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
          });
          return response.data.id;
        } catch (error) {
          throw new Error(`Error uploading file: ${error.message}`);
        }
      }
  
    async findFileIdByName(auth, fileName) {
      const drive = google.drive({ version: 'v3', auth });
      try {
        const res = await drive.files.list({
          q: `name='${fileName}' and trashed=false`,
          fields: 'files(id, name)',
          spaces: 'drive',
        });
        const files = res.data.files;
        if (files.length === 0) {
          throw new Error(`No file found with the name: ${fileName}`);
        }
        return files[0].id;
      } catch (err) {
        console.error('Error finding file:', err.message);
        throw err;
      }
    }
  
    async downloadFileById(auth, fileId, destPath) {
      const drive = google.drive({ version: 'v3', auth });
      const dest = fs.createWriteStream(destPath);
      try {
        const res = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'stream' }
        );
        await new Promise((resolve, reject) => {
          res.data
            .on('end', () => {
              console.log('File downloaded successfully.');
              resolve(true);
            })
            .on('error', (err) => {
              console.error('Error downloading file:', err.message);
              reject(err);
            })
            .pipe(dest);
        });
      } catch (err) {
        console.error('Error downloading file:', err.message);
        throw err;
      }
    }
  
    async downloadToGdrive(fileName, res) {
      try {
        const auth = await this.authenticate();
  
        if (!fileName) {
          return res.status(400).send('Missing fileName in request body.');
        }
  
        const fileId = await this.findFileIdByName(auth, fileName);
        await this.streamFileById(auth, fileId, fileName, res);
      } catch (error) {
        console.error('Error:', error.message);
        if (!res.headersSent) {
          res.status(500).send(`An error occurred: ${error.message}`);
        }
      }  
    }

    async streamFileById(auth, fileId, fileName, res) {
        const drive = google.drive({ version: 'v3', auth });
        try {
          const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
          );
      
          // Set appropriate headers
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Type', 'application/octet-stream');
      
          // Pipe the stream
          response.data
            .on('end', () => {
              console.log('File streamed successfully.');
            })
            .on('error', (err) => {
              console.error('Error streaming file:', err.message);
              if (!res.headersSent) {
                res.status(500).send('Error streaming file.');
              }
            })
            .pipe(res);
        } catch (err) {
          console.error('Error streaming file:', err.message);
          if (!res.headersSent) {
            res.status(500).send(`Error: ${err.message}`);
          }
        }
      }

    public addNewFile(req, res): Promise<ApiResponse<FileMetaData>> {
        let fileMetadata = req.body;

        if(fileMetadata.fileExtension){
            fileMetadata.fileType = this.getFileType(fileMetadata.fileExtension);
        }

        req.body = fileMetadata;
        return this.post(req, res);
    }

    public async deleteFile(req, res) {
        try {
    
            //EDG: Ok we are not actually going to delete yet.  The following code is wired up and works BUT
            //we don't want users accidentally deleting files or attachments.  We will just disassociate them
            //from the entity they are tied to.
            /*
            
            const fileMetaData = await this.findById(req.params.id);

            if(!fileMetaData){
                throw new Error('File does not exist');
            }
            
            let response = await this.dbService.delete<FileMetaData>(req);
            
            await this.azureStorageProvider.delete(this.getStorageFileName(fileMetaData));

            if (!response) {
                throw new Error('Unknown error deleting File.');
            }
            
            return this.handleResponse(response, res);
            */

            return this.handleResponse('file deleted', res);
      
          } catch (error) {
            return this.handleErrorResponse(error, res);
          }
    }

    public async upload(req, res): Promise<any> {
        const azureStorageResponse = await this.azureStorageProvider.upload(req.files);
        this.handleResponse(azureStorageResponse, res);
    }

    public async download(fileId:string, res): Promise<any> {
        const fileMetaData = await this.findById(fileId);

        if (isNullOrUndefined(fileMetaData)) {
            throw new HttpException(
                404,
                `The file requested with the ID of "${fileId}" was not found in the database.`,
            );
        }

        let storageFileName = fileMetaData._id;

        if(fileMetaData.fileExtension){
            storageFileName = `${storageFileName}.${fileMetaData.fileExtension}`;
        }

        const fileStream = await this.getFileDownload(storageFileName);
        res.attachment(fileMetaData.fileName);
        //EDG: Will go back to try to implement a file progress bar
        // const totalContentLength = fileStream._response.headers.get('content-length');
        // if(totalContentLength){
        //     res.setHeader('Content-Length',totalContentLength);
        // }
        fileStream.readableStreamBody.pipe(res);
    }

    private async getFileDownload(storageFileName: string): Promise<FileDownloadResponse> {
        return await this.azureStorageProvider.download(storageFileName);
    }

    private async findById(id: string): Promise<FileMetaData> {
        return await this.dbService.findById(id);
    }

    private getFileType(fileExtension: string){
        let compareFileExtension = fileExtension.toLowerCase();

        switch(compareFileExtension){
            case 'doc':
            case 'docx':
                return FileType.word;
            case 'pdf':
                return FileType.pdf;
            default:
                return FileType.notApplicable;
        }

    }

    private getStorageFileName(fileMetaData: FileMetaData){
        let fileName = fileMetaData._id;
        if(fileMetaData.fileExtension){
            fileName = `${fileName}.${fileMetaData.fileExtension}`;
        }

        return fileName;
    }
}
